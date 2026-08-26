import type { SeriesOption } from 'echarts';
import merge from 'lodash/merge';
import type { SeriesProps } from './Series.svelte';
import { generateSeriesConfig, type SeriesConfigOptions } from './seriesConfig';
import {
	transformToPercentageStack,
	getOriginalValue,
	type PercentageSeriesOption
} from './percentageStack';
import { formatValue } from '../../../../formatValue';
import type { Column } from '../../../../interfaces/query-service';
import { getEchartsType, type EChartsAxisType } from '../../../../common/typeConversions';
import { getMinMax } from '../../../../getMinMax';
import type { YAxisModel } from '../YAxisModel.svelte';
import type { OptionName } from 'echarts/types/src/util/types.js';
import { Query } from '../../../../../Query.svelte';
import type { HandleMissing } from '../../../../common/fill-gaps';
import type { DateGrain } from '../../../../common/date-options';
import type { SharedQueryContext } from '../combo-chart-context';
import {
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../../../common/sql-expression-utils';
import type { SQLQueryConfig } from '../../../../common/sql-options';
import { VariableProcessor } from '../../../../../filter-variables/VariableProcessor';
import { createResolvers, type Resolvers } from '../../../../common/use-variable-processing';
import { buildChartSQLConfig } from '../../build-chart-sql';
import {
	resolveTooltipFields,
	type ProcessedTooltipField,
	type TooltipField
} from '../../../../common/tooltip-fields';
import {
	resolveMetric,
	applyMetricDimension,
	type ResolvedMetric
} from '../../../../../metrics/resolve-metric';
import type { MetricsCatalog } from '../../../../../metrics/metrics-catalog';
import type { SqlDialect } from '../../../../../sql-dialect';
import type { QueryDependencies } from '../../../../../Query.svelte';

export class SeriesModel {
	readonly props: SeriesProps;

	// Shared context from parent ComboChart (reactive via getter)
	readonly sharedContext: SharedQueryContext;

	// Variable processing
	readonly #variableProcessor: VariableProcessor | null;
	readonly #resolvers: Resolvers;

	// Resolved props (after variable interpolation). `resolvedY` is undefined in
	// metric mode — `metricCompiled.valueExpression` supplies the aggregate then.
	readonly resolvedY: string | undefined;
	readonly resolvedMetric: string | unknown[] | undefined;
	readonly resolvedSeries: string | undefined;
	readonly resolvedSize: string | undefined;
	readonly resolvedFmt: string | undefined;
	readonly resolvedDataLabels: SeriesProps['data_labels'];
	readonly resolvedTooltipFields: TooltipField[] | undefined;

	/**
	 * Compiled metric (base + aggregate expression + declared format), or
	 * undefined for raw-mode series. When set, `queryConfig` swaps this series'
	 * data table and `y` expression with the metric's, so cross-base metric
	 * children each run against their own base.
	 */
	readonly metricCompiled: ResolvedMetric | undefined;

	/**
	 * Processed tooltip fields ready to consume in the chart formatter. Kept
	 * separate from `queryConfig` so the tooltip formatter can look up label /
	 * fmt / colouring metadata without re-parsing the raw attribute.
	 */
	readonly tooltipFields: ProcessedTooltipField[];

	// Query is created and owned by the model
	readonly query: Query;

	// Processed column expressions
	readonly yProcessed: ProcessedColumnExpression;
	readonly seriesProcessed: ProcessedColumnExpression | null;
	readonly sizeProcessed: ProcessedColumnExpression | null;

	// Query config built from props and shared context
	readonly queryConfig: SQLQueryConfig | undefined;

	get fmt() {
		return this.resolvedFmt ?? this.axes[this.props.axis].options.fmt;
	}

	get axis() {
		return this.axes[this.props.axis];
	}

	constructor(
		readonly propsGetter: () => SeriesProps,
		readonly axes: Record<'y1' | 'y2', YAxisModel>,
		sharedContextGetter: () => SharedQueryContext,
		// Stable, non-reactive refs read OUTSIDE `sharedContext`. Anything that
		// participates in `metricCompiled`'s derivation must live here — otherwise
		// reading `.metricCompiled` from ComboChart's `inheritedX` pulls in the
		// entire reactive sharedContext, and sharedContext depends on `x`, and `x`
		// depends on `inheritedX` → cycle → stack overflow. That includes what the
		// variable processor needs (filterContexts, inlineQueries) since `metric=`
		// supports `{{ variable }}` interpolation (e.g. a dropdown of metric names).
		metricsCatalog: MetricsCatalog | undefined,
		dialect: SqlDialect,
		filterContexts: QueryDependencies['filterContexts'],
		inlineQueries: QueryDependencies['inlineQueries']
	) {
		this.props = $derived(this.propsGetter());

		// Shared context is reactive - re-derives when parent's sharedQueryContext changes
		// This ensures query rebuilds when filters, date_range, where, etc. change
		this.sharedContext = $derived(sharedContextGetter());

		// Variable processor uses the STABLE refs passed to the constructor rather
		// than `sharedContext.queryDeps` — so `metric="{{ selected }}"` interpolates
		// correctly without hooking `metricCompiled` into sharedContext (which would
		// re-introduce the inheritedX cycle described above).
		this.#variableProcessor = $derived.by(() => {
			if (!filterContexts || !inlineQueries) return null;
			const validContexts = filterContexts.filter(
				(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
			);
			if (validContexts.length === 0) return null;
			return new VariableProcessor(validContexts, inlineQueries);
		});

		// Create resolvers (same API as Model classes)
		this.#resolvers = $derived(createResolvers(this.#variableProcessor));

		// Resolve props with variable support
		this.resolvedY = $derived(this.#resolvers.resolveColumn(this.props.y));
		this.resolvedMetric = $derived(this.#resolvers.resolveText(this.props.metric));

		// When `metric="..."` is set, look it up in the catalog to get the metric's
		// own base and aggregate SQL. Overrides `sharedContext`'s data and `y` for
		// this series only, so metric-driven children can query their own base
		// independently of the combo_chart's `data=`. Reads `metricsCatalog` and
		// `dialect` from stable constructor refs — NOT via `sharedContext` — to
		// avoid a reactive cycle with ComboChart's `inheritedX` (see constructor).
		this.metricCompiled = $derived(resolveMetric(metricsCatalog, this.resolvedMetric, dialect));

		// In metric mode, `series="product"` resolves against the metric view's
		// named dimensions (`product: product_line`). Raw columns pass through.
		this.resolvedSeries = $derived(
			applyMetricDimension(this.metricCompiled, this.#resolvers.resolveColumn(this.props.series))
		);
		this.resolvedSize = $derived(this.#resolvers.resolveColumn(this.props.size));
		// In metric mode, fall back to the metric's declared `format` so an axis /
		// legend that inherits the series fmt still shows `usd` / `num0` etc.
		// without the author having to repeat it on the series child.
		this.resolvedFmt = $derived(
			this.#resolvers.resolveText(this.props.fmt) ??
				(this.metricCompiled
					? this.metricCompiled.columnFormats[this.metricCompiled.name]
					: undefined)
		);
		// Resolve nested object - resolveText handles recursive string processing
		this.resolvedDataLabels = $derived(this.#resolvers.resolveText(this.props.data_labels));
		// Tooltip fields are arrays of objects: resolve each field's string sub-props
		// (value/label/fmt) through the text resolver so filter variables work.
		this.resolvedTooltipFields = $derived(
			this.#resolvers.resolveText(this.props.tooltip_fields) as TooltipField[] | undefined
		);

		// Process tooltip field expressions once per prop change so both the
		// query builder and the tooltip formatter share the same aliases.
		const processedTooltipFields = $derived(
			resolveTooltipFields(
				this.resolvedTooltipFields,
				this.sharedContext.queryDeps.connection.dialect
			)
		);
		this.tooltipFields = $derived(processedTooltipFields.fields);

		// Alias the metric aggregate by its raw name (so `order=`/`x_sort=`/refs
		// resolve); surface the humanized label via displayAlias, which the ECharts
		// series name reads — so the legend stays pretty without renaming the column.
		this.yProcessed = $derived.by(() => {
			const dialect = this.sharedContext.queryDeps.connection.dialect;
			const metric = this.metricCompiled;
			const value = metric?.valueExpression
				? `${metric.valueExpression} AS ${dialect.quoteAlias(metric.name)}`
				: (this.resolvedY ?? '');
			const processed = processColumnExpression({ value }, dialect);
			const label = metric?.displayLabel ?? this.props.yLabel;
			return label ? { ...processed, displayAlias: label } : processed;
		});

		this.seriesProcessed = $derived.by(() => {
			if (!this.resolvedSeries) return null;
			return processColumnExpression(
				{
					value: this.resolvedSeries
				},
				this.sharedContext.queryDeps.connection.dialect
			);
		});

		this.sizeProcessed = $derived.by(() => {
			if (!this.resolvedSize) return null;
			return processColumnExpression(
				{
					value: this.resolvedSize
				},
				this.sharedContext.queryDeps.connection.dialect
			);
		});

		// Keep this mapping in sync with ChartSQLAttrs — tests don't cover it.
		this.queryConfig = $derived.by((): SQLQueryConfig | undefined => {
			// Metric mode: the metric supplies `data` (its base) and `y` (its
			// aggregate expression). Everything else — x, filters, date_range,
			// where, order — flows through the same builder as the raw path so
			// the metric composes with combo_chart's shared context identically.
			const metric = this.metricCompiled;
			if (metric?.valueExpression) {
				const dialect = this.sharedContext.queryDeps.connection.dialect;
				// Raw-name alias here too (see yProcessed) so `order=`/refs resolve.
				// x resolution:
				//  - If the AUTHOR set `x=` on combo_chart, use it (their override).
				//  - Otherwise use THIS metric's own viewDate — NOT the parent's
				//    `sharedContext.x`, which is inherited from child #1's viewDate.
				//    Falling back to that inherited value would query child #1's
				//    date column against THIS metric's base (a different table on
				//    a cross-base combo), producing a warehouse "unknown column".
				const x = this.sharedContext.explicitX ?? metric.viewDate;
				// grain: use the parent's EFFECTIVE grain (`sharedContext.dateGrain`)
				// which is either the author's explicit `date_grain=` or the coarsest
				// grain across all metric children (see ComboChart's inheritedDateGrain).
				// A shared grain means each child's SELECT buckets its own base at the
				// same resolution, so rows line up on the parent's axis. Fall back to
				// this metric's own view grain only when the parent has none (single-
				// child metric combos where the coarsest === this child's).
				const isTimeAxis = x !== undefined && x === metric.viewDate;
				const dateGrain =
					this.sharedContext.dateGrain ?? (isTimeAxis ? metric.viewGrain : undefined);
				return buildChartSQLConfig({
					data: metric.base,
					x,
					y: `${metric.valueExpression} AS ${dialect.quoteAlias(metric.name)}`,
					series: this.resolvedSeries,
					size: this.resolvedSize,
					point_title: this.sharedContext.point_title,
					date_grain: dateGrain,
					date_range: this.sharedContext.dateRange,
					where: this.sharedContext.where,
					having: this.sharedContext.having,
					qualify: this.sharedContext.qualify,
					order: this.sharedContext.order,
					x_sort: this.sharedContext.x_sort,
					limit: this.sharedContext.limit,
					filters: this.sharedContext.filters,
					firstDayOfWeek: this.sharedContext.firstDayOfWeek,
					dialect: this.sharedContext.queryDeps.connection.dialect,
					tooltipFieldColumns: processedTooltipFields.columns
				});
			}
			// `metric=` set but unresolved (bad reference) → no query. The
			// `metricExists` validator surfaces this at edit time; guarding
			// here just keeps a failing lookup from silently falling through
			// to a broken raw-path query with an empty `y`.
			if (this.resolvedMetric) return undefined;

			// Raw path needs both a data source and a y expression. Data comes
			// from the combo_chart parent — undefined only when the parent
			// itself is in "all metric children" mode, which the cross-child
			// validator flags at edit time. Belt-and-braces here so a caught
			// validation error can't silently emit a broken query.
			const data = this.sharedContext.tableExpressionName;
			if (!data || !this.resolvedY) return undefined;

			return buildChartSQLConfig({
				data,
				x: this.sharedContext.x,
				y: this.resolvedY,
				series: this.resolvedSeries,
				size: this.resolvedSize,
				point_title: this.sharedContext.point_title,
				date_grain: this.sharedContext.dateGrain,
				date_range: this.sharedContext.dateRange,
				where: this.sharedContext.where,
				having: this.sharedContext.having,
				qualify: this.sharedContext.qualify,
				order: this.sharedContext.order,
				x_sort: this.sharedContext.x_sort,
				limit: this.sharedContext.limit,
				filters: this.sharedContext.filters,
				firstDayOfWeek: this.sharedContext.firstDayOfWeek,
				dialect: this.sharedContext.queryDeps.connection.dialect,
				tooltipFieldColumns: processedTooltipFields.columns
			});
		});

		// Create Query instance - owned by the model
		// Note: queryDeps is captured once (stable for component lifetime)
		this.query = new Query(() => this.queryConfig, sharedContextGetter().queryDeps, {
			refreshInterval: () => sharedContextGetter().refreshInterval
		});
	}

	get yColumnName(): string {
		return this.yProcessed.alias;
	}

	get seriesColumnName(): string | undefined {
		return this.seriesProcessed?.alias;
	}

	get sizeColumnName(): string | undefined {
		return this.sizeProcessed?.alias;
	}

	/** Whether this series uses stacking */
	get isStacked(): boolean {
		return this.props.isStacked ?? false;
	}

	/** The chart type for this series */
	get type(): 'bar' | 'line' | 'scatter' {
		return this.props.type;
	}

	/** ECharts `series` options */
	getSeriesConfig = (options: {
		xColumnName: string;
		pointTitle?: string;
		seriesColors?: Record<string, string>;
		seriesOrder?: string[];
		treatAsCategoryAxis?: boolean;
		zIndex?: number;
		handleMissing?: HandleMissing;
		dateGrain?: DateGrain;
		xColumnType?: 'date' | 'number' | 'string';
		/** Sort by stack total for stacked charts with x_sort */
		sortByStackTotal?: 'asc' | 'desc';
		/** Color palette for the chart (used when no explicit series color is set) */
		colorPalette?: string[];
		/** Starting index for color palette assignment (based on series position in chart) */
		colorPaletteStartIndex?: number;
	}): SeriesOption[] => {
		// Get data from this series' own query
		const data = this.query?.result?.rows ?? [];
		const isPercentageStack = this.props.percentageStack ?? false;

		// Calculate min/max early so it can be used for stack total formatting
		let minMax: { min: number | null; max: number | null };
		if (this.props.getYMinMax) {
			minMax = this.props.getYMinMax(data, options.xColumnName, this.yColumnName);
		} else {
			minMax = getMinMax(data, this.yColumnName);
		}

		const seriesConfigOptions: SeriesConfigOptions = {
			data,
			type: this.props.type,
			x: options.xColumnName,
			y: this.yColumnName,
			series: this.seriesColumnName,
			size: this.sizeColumnName,
			pointTitle: options.pointTitle,
			seriesColors: options.seriesColors,
			seriesOrder: options.seriesOrder,
			treatAsCategoryAxis: options.treatAsCategoryAxis,
			handleMissing: options.handleMissing,
			dateGrain: options.dateGrain,
			xColumnType: options.xColumnType,
			stackId: this.props.stackId,
			// Sort by stack total when stacked and x_sort is asc/desc
			sortByStackTotal:
				this.props.isStacked && options.sortByStackTotal ? options.sortByStackTotal : undefined,
			tooltipFields: this.tooltipFields
		};

		const baseSeriesConfig = generateSeriesConfig(seriesConfigOptions);

		// Apply percentage transformation for 100% stacked charts
		const seriesConfig: PercentageSeriesOption[] = isPercentageStack
			? transformToPercentageStack(baseSeriesConfig)
			: baseSeriesConfig;

		// For percentage stacking, use fixed 0-1 range for formatting (SSF % format displays as 0%-100%)
		const percentageMinMax = { min: 0, max: 1 };

		return seriesConfig.map((c, seriesIndex) => {
			// Assign color from palette if no explicit color is set
			// This ensures transformSeriesOptions (e.g., for gradient areas) can access the color
			if (!c.color && options.colorPalette && options.colorPalette.length > 0) {
				const paletteIndex =
					((options.colorPaletteStartIndex ?? 0) + seriesIndex) % options.colorPalette.length;
				c.color = options.colorPalette[paletteIndex];
			}

			this.props.transformSeriesOptions?.(c);

			const allSeries = Object.values(this.axes).flatMap((axis) => axis.series);
			const totalSeries = allSeries.length;

			// Check if we have mixed series types (e.g., scatter + line/bar/area)
			// If so, use 'axis' trigger for consistency across all series
			const seriesTypes = new Set(allSeries.map((s) => s.props.type));
			const hasMixedTypes = seriesTypes.size > 1;
			const tooltipTrigger = hasMixedTypes ? 'axis' : (c.tooltip?.trigger ?? 'axis');

			let name: OptionName | undefined = this.yProcessed.displayAlias;

			if (typeof c.name !== 'undefined') {
				if (totalSeries > 1) {
					name = `${c.name} - ${name}`;
				} else {
					name = c.name;
				}
			}

			// Create tooltip valueFormatter based on whether we're doing percentage stacking
			const tooltipValueFormatter = isPercentageStack
				? (value: unknown, dataIndex: number) => {
						// Get the x-value from the data to look up the original value
						const dataArray = (c as PercentageSeriesOption).data as unknown[][];
						const xValue = dataArray?.[dataIndex]?.[0];
						const originalValue =
							typeof xValue === 'string' || typeof xValue === 'number' || xValue instanceof Date
								? getOriginalValue(c, xValue)
								: undefined;

						// Format percentage
						const percentStr = formatValue(value, '0.0%', value?.toString(), percentageMinMax);

						// Format original value if available
						if (originalValue !== undefined) {
							const originalStr = formatValue(
								originalValue,
								this.fmt,
								originalValue.toString(),
								minMax
							);
							return `${percentStr} (${originalStr})`;
						}
						return percentStr;
					}
				: (value: unknown) => formatValue(value, this.fmt, value?.toString(), minMax);

			// Create data label formatter based on percentage stacking mode
			const dataLabels = this.resolvedDataLabels;
			const hasDataLabels = Boolean(dataLabels.position);
			const labelFormatter = isPercentageStack
				? (params: { value?: unknown[] }) => {
						const value = Array.isArray(params.value) ? params.value : params.value;
						const yValue = value?.[1];
						// For percentage stacking, show percentage in labels
						return formatValue(
							yValue,
							dataLabels.fmt ?? '0%',
							yValue?.toString(),
							percentageMinMax
						);
					}
				: (params: { value?: unknown[] }) => {
						const value = Array.isArray(params.value) ? params.value : params.value;
						const yValue = value?.[1];
						return formatValue(yValue, dataLabels.fmt ?? this.fmt, yValue?.toString(), minMax);
					};

			// Line/area series default to hidden symbols via `itemStyle.opacity = 0` to reduce visual
			// noise. ECharts ties point label visibility to symbol opacity, so when data labels are
			// enabled the labels never render. When the symbols are still in their hidden default
			// state, restore opacity to 1 so labels are drawn, but force `symbolSize: 0` so the dot
			// itself stays invisible. If the user opted into visible markers (e.g. via `<line>`'s
			// `markers` option, which sets `itemStyle.opacity: 1` and a custom `symbolSize`), leave
			// those values alone — labels render naturally on top of the visible markers.
			const cWithStyle = c as {
				type?: string;
				itemStyle?: { opacity?: number } & Record<string, unknown>;
				symbolSize?: number;
			};
			const symbolsHiddenByDefault = cWithStyle.itemStyle?.opacity === 0;
			const shouldUnhideForLabels =
				hasDataLabels && cWithStyle.type === 'line' && symbolsHiddenByDefault;
			const itemStyle = shouldUnhideForLabels
				? { ...(cWithStyle.itemStyle ?? {}), opacity: 1 }
				: cWithStyle.itemStyle;
			const symbolSize = shouldUnhideForLabels ? 0 : cWithStyle.symbolSize;

			// Per-series echarts_options was applied inside the series component's
			// transformSeriesOptions BEFORE this point, so `c.label` / `c.tooltip`
			// may already contain user overrides (e.g. { label: { show: true } }).
			// If we set those same keys to concrete values here and merge them in
			// after `c`, our concrete values silently clobber the user override —
			// e.g. `label.show = hasDataLabels` (always a boolean, never undefined)
			// would overwrite the user's `label.show = true`.
			//
			// Fix: use nullish coalescing on every key so the user's override wins
			// when they set one, and Studio's data_labels-driven value only fills
			// in undefined slots. The Studio `formatter` / `valueFormatter` are
			// treated the same way — a user CAN provide an ECharts formatter
			// template string (e.g. "{c}") via echarts_options; if they do,
			// respect it. Function values still can't come through the declarative
			// path, so the fmt: format code chain remains the sensible default.
			const cLabel = (c as { label?: Record<string, unknown> }).label ?? {};
			const cTooltip = (c as { tooltip?: Record<string, unknown> }).tooltip ?? {};
			const cLabelLayout = (c as { labelLayout?: Record<string, unknown> }).labelLayout ?? {};

			return merge({}, c, <SeriesOption>{
				name,
				yAxisIndex: this.props.axis === 'y2' ? 1 : 0,
				z: options.zIndex,
				itemStyle,
				symbolSize,
				label: {
					show: cLabel.show ?? hasDataLabels,
					fontSize: cLabel.fontSize ?? dataLabels.size,
					color: cLabel.color ?? dataLabels.color,
					textBorderColor: cLabel.textBorderColor ?? dataLabels.border_color,
					textBorderWidth: cLabel.textBorderWidth ?? (dataLabels.border_color ? 2 : undefined),
					position: cLabel.position ?? dataLabels.position,
					distance: cLabel.distance ?? dataLabels.distance,
					rotate: cLabel.rotate ?? dataLabels.rotate,
					formatter: cLabel.formatter ?? labelFormatter
				},
				labelLayout: {
					hideOverlap: cLabelLayout.hideOverlap ?? !dataLabels.show_overlap
				},
				tooltip: {
					trigger: cTooltip.trigger ?? tooltipTrigger,
					valueFormatter: cTooltip.valueFormatter ?? tooltipValueFormatter
				}
			});
		});
	};

	getEChartsType = (columns: Column[]): EChartsAxisType | undefined => {
		const jsType = columns.find((c) => c.name === this.yColumnName)?.jsType;
		return getEchartsType(jsType);
	};
}
