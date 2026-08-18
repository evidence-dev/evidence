<script lang="ts">
	import type { EChartsOption, SeriesOption } from 'echarts';
	import ECharts from '../../echarts/ECharts.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import SamplingIndicator from '../../../common/SamplingIndicator.svelte';
	import { schema } from './schema';
	import merge from 'lodash/merge';
	import type { UserComponentProps } from '../../../types';
	import ComponentTitle from '../../../common/ComponentTitle.svelte';
	import type { ECharts as EChartsInstance } from 'echarts';
	import CustomLegend from '../../echarts/CustomLegend.svelte';
	import { cn } from '../../../../shadcn/utils';
	import { getQueryService } from '../../../../QueryService.context';
	import { extractSQLProps } from '../../../common/sql-options';
	import { processColumnExpression } from '../../../common/sql-expression-utils';
	import { getRepeatContext } from '../../repeat/repeat-context';
	import { setComboChartContext } from './combo-chart-context';
	import { YAxisModel } from './YAxisModel.svelte';
	import { XAxisModel } from './XAxisModel.svelte';
	import {
		TWO_TIER_LABEL_EXTRA_GRID_BOTTOM_PX,
		DATA_ZOOM_SLIDER_EXTRA_GRID_BOTTOM_PX
	} from './constants';
	import { hasBottomSliderDataZoom, authorPinnedGridBottom } from './data-zoom-layout';
	import { SeriesModel } from './series/SeriesModel.svelte';
	import {
		shouldDisplayTooltipParam,
		tooltipFormatterArgSchema
	} from './tooltipFormatterParams.schema';
	import type { ReferenceModel } from './references/types';
	import { ReferenceLineStaticModel } from './references/reference_line/ReferenceLineStaticModel.svelte';
	import { ReferenceAreaStaticModel } from './references/reference_area/ReferenceAreaStaticModel.svelte';
	import { ReferencePointStaticModel } from './references/reference_point/ReferencePointStaticModel.svelte';
	import { getPageFiltersContext } from '../../../../page-filters-context';
	import { getInlineQueriesContext } from '../../../common/inline-queries';
	import { createResolvers } from '../../../common/use-variable-processing';
	import { VariableProcessor } from '../../../../filter-variables/VariableProcessor';
	import { getProjectSettingsContext } from '../../../../project-settings.context';
	import { getAutoRefreshContext } from '../../../../auto-refresh.context.svelte';
	import { getDefaultFormatForDateGrain, coarserGrain } from '../../../common/date-options';
	import { getElevatedChartTooltipCss } from '../../../common/chart-tooltip-elevation';
	import { logger } from '../../../../shims/logger';
	import {
		getSeriesTypeMarker,
		getRenderedSeriesColor,
		type LineStyleType,
		type SeriesColorValue
	} from '../../echarts/series-marker';
	import { formatValue } from '../../../formatValue';
	import { getComponentWrapperContext } from '../../../common/component-wrapper-context';
	import { getQueryInfoContext } from '../../../../query-info-context.svelte';
	import { downloadAsExcel, getExcelExportNames } from '../../../../shims/data-export';
	import { browser } from '../../../../shims/env';
	import { mergeSeriesData, type SeriesDataInput } from './merge-series-data';
	import { getThemeContext } from '../../../../theme/theme.context.svelte';
	import { colorPalettes as defaultColorPalettes } from '../../echarts/echarts-themes';
	import { mode } from 'mode-watcher';
	import { escapeHtml, renderTooltipExtras } from '../../../common/tooltip-fields';
	import { getMetricsCatalogContext } from '../../../../metrics/metrics-catalog';

	export type ComboChartUserProps = UserComponentProps<typeof schema>;
	export type ComboChartInternalProps = {
		transformOptions?: (
			options: EChartsOption & {
				/** Use Series.transformSeriesOptions instead */
				series?: never;
			}
		) => void;
		tagName?: string;
		size?: string;
		size_fmt?: string;
	};

	export type ComboChartProps = ComboChartUserProps & ComboChartInternalProps;

	const props: ComboChartProps = $props();
	const children = $derived(props.children);
	// Raises this chart's tooltip above the floating chat pane when rendered
	// inside it; '' (ECharts default) everywhere else.
	const elevatedTooltipCss = getElevatedChartTooltipCss();
	// Note: tableName, x, series, size are resolved via resolvers after variableProcessor is created
	const filterIds = $derived(props.filters);
	const x_sort = $derived(props.x_sort);

	const legend = $derived(props.legend ?? true);
	const legend_location = $derived(props.legend_location ?? 'top');
	const series_order = $derived(props.series_order);
	const transformOptions = $derived(props.transformOptions);
	// Note: tagName is passed from parent charts (e.g., BarChart) but query registration
	// is now handled by individual series children, so this is unused at the ComboChart level
	const _tagName = $derived(props.tagName ?? 'combo_chart');
	const height = $derived(props.height);
	let xAxisExtraHeight = $state(0);
	// Note: x_axis_options, y_axis_options, y2_axis_options will be resolved after variableProcessor is created
	const date_range = $derived(props.date_range);
	const color_palette = $derived(props.chart_options?.color_palette);
	const series_colors = $derived(props.chart_options?.series_colors);
	const zoom = $derived(props.chart_options?.zoom);
	// Default top padding provides space for data labels at top of chart
	const topPadding = $derived(props.chart_options?.top_padding ?? 5);
	const handle_missing = $derived(props.handle_missing ?? 'connect');
	const ZOOM_CLICK_THRESHOLD_PX = 5;
	const DEFAULT_CHART_MIN_HEIGHT_PX = 215;

	const toolbox = $derived.by(() => {
		if (!zoom) return undefined;

		return {
			feature: {
				dataZoom: {
					show: true,
					icon: {
						// Workaround to hide toolbox icons
						zoom: '-',
						back: '-'
					}
				}
			}
		};
	});

	// Note: Query is now handled by individual series children, not by ComboChart

	const xAxisModel = new XAxisModel(
		() => ({
			...x_axis_options,
			fmt: effectiveXFmt,
			x: xProcessed?.alias ?? x ?? '',
			date_grain,
			firstDayOfWeek: projectSettings.first_day_of_week
		}),
		() => yAxes,
		() => elevatedTooltipCss
	);

	const y1AxisModel = new YAxisModel(
		'y1',
		() => ({ ...y_axis_options, fmt: y_fmt }),
		() => xProcessed?.alias
	);

	const y2AxisModel = new YAxisModel(
		'y2',
		() => ({ ...y2_axis_options, fmt: y2_fmt }),
		() => xProcessed?.alias
	);

	const yAxes = $derived({ y1: y1AxisModel, y2: y2AxisModel } as const);

	// Two-tier month labels ("Jul" over "2019") need an extra label line in the
	// bottom gutter. grid.bottom already budgets it — but inside a fixed
	// container that budget would shave the same pixels off the PLOT. Growing
	// the container by the identical constant keeps the plot area the height
	// the user asked for; the label block absorbs the growth. Same contract as
	// xAxisExtraHeight for rotated category labels, but resolvable
	// synchronously (two-tier is known from the data, not from layout passes).
	const twoTierExtraHeight = $derived(
		xAxisModel.hasTwoTierLabels ? TWO_TIER_LABEL_EXTRA_GRID_BOTTOM_PX : 0
	);

	// A bottom slider `dataZoom` (added via raw `echarts_options`) sits in the
	// same footer as the x-axis labels. Our computed `grid.bottom` only budgets
	// labels/title, so the slider overlaps them — worst with two-tier month/year
	// labels. Reserve the slider's footprint below the labels, BUT only when the
	// author hasn't pinned `grid.bottom` themselves: a hand-tuned grid means they
	// own the layout (raw `echarts_options` is an escape hatch), so we defer.
	const hasUnbudgetedBottomSlider = $derived.by(() => {
		if (authorPinnedGridBottom(props.echarts_options)) return false;
		return hasBottomSliderDataZoom(props.echarts_options);
	});

	const sliderExtraHeight = $derived(
		hasUnbudgetedBottomSlider ? DATA_ZOOM_SLIDER_EXTRA_GRID_BOTTOM_PX : 0
	);

	const references: ReferenceModel[] = $state([]);
	const referencesSeries: SeriesOption[] = $derived(
		references.map((reference) => reference.series)
	);

	// Track series in order they're added
	let seriesInOrder: SeriesModel[] = $state([]);

	// Get context providers needed for variable interpolation and xProcessed
	const queryService = getQueryService();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const autoRefreshCtx = getAutoRefreshContext();
	const inlineQueries = getInlineQueriesContext();
	const getProjectSettings = getProjectSettingsContext();
	const projectSettings = $derived(getProjectSettings());
	const themeContext = getThemeContext();

	// Effective color palette: use custom if provided, otherwise theme default, with fallback to built-in palettes
	// This is used for gradient fills and other features that need to know the actual colors
	const effectiveColorPalette = $derived.by(() => {
		// Priority: 1) custom color_palette, 2) theme's default palette, 3) built-in fallback
		if (color_palette && color_palette.length > 0) return color_palette;
		const themePalette = themeContext.activeTheme.colorPalettes.default;
		if (themePalette && themePalette.length > 0) return themePalette;
		// Fallback to built-in palette based on current mode
		return defaultColorPalettes[mode.current ?? 'light'] ?? defaultColorPalettes.light;
	});

	// Get component wrapper context for custom export handler and component ID for query registration
	const { setCustomExportHandler, getComponentId } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	// Variable processor for interpolating variables in props
	const variableProcessor = $derived.by(() => {
		if (!inlineQueries) return null;
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	// Create resolvers (same API as Model classes)
	const { resolveText, resolveColumn, resolveSql } = $derived(createResolvers(variableProcessor));

	// Resolve axis options (nested objects)
	// Note: booleans/numbers inside are resolved as strings by resolveText,
	// the Models handle coercion via coerceBoolean/coerceNumber helpers
	const x_axis_options = $derived(resolveText(props.x_axis_options));
	const y_axis_options = $derived(resolveText(props.y_axis_options));
	const y2_axis_options = $derived(resolveText(props.y2_axis_options));

	// Resolve props with variable support
	const tableName = $derived(resolveText(props.data));
	const rawX = $derived(resolveColumn(props.x));
	// When `x=` isn't set on the parent, fall back to the first metric-driven
	// child's view time column so an all-metric combo_chart renders without the
	// author having to duplicate `x=` from the metric view. Later metric children
	// derive their own x per-series; this parent-level x is only for the axis
	// model (title, formatting, tooltip lookup).
	const inheritedX = $derived.by(() => {
		for (const series of seriesInOrder) {
			const vd = series.metricCompiled?.viewDate;
			if (vd) return vd;
		}
		return undefined;
	});
	const x = $derived(rawX ?? inheritedX);
	// When the parent doesn't set `date_grain=`, pick the COARSEST grain across
	// every metric child's view. Monthly-view + daily-view → month (author still
	// overrides via explicit `date_grain=`). Coarser wins so the child with finer
	// native data gets bucketed up at query time and both series' rows line up on
	// one axis — the alternative (picking child #1's grain arbitrarily) left
	// the sibling child with unaligned data and empty bars. Both children query
	// at the shared grain via `sharedContext.dateGrain` (see SeriesModel).
	const inheritedDateGrain = $derived.by(() => {
		let coarsest: string | undefined;
		for (const series of seriesInOrder) {
			coarsest = coarserGrain(coarsest, series.metricCompiled?.viewGrain);
		}
		return coarsest;
	});
	const series = $derived(resolveColumn(props.series));
	const _size = $derived(resolveColumn(props.size));
	const point_title = $derived(resolveColumn(props.point_title));
	const x_fmt = $derived(resolveText(props.x_fmt));
	const y_fmt = $derived(resolveText(props.y_fmt));
	const y2_fmt = $derived(resolveText(props.y2_fmt));
	const size_fmt = $derived(resolveText(props.size_fmt));

	// Extract SQL props early
	const {
		where: rawWhere,
		having,
		order,
		qualify,
		limit
	} = $derived.by(() => extractSQLProps(props));
	const where = $derived(resolveSql(rawWhere));
	const rawDateGrain = $derived(resolveText(props.date_grain));
	const date_grain = $derived(rawDateGrain ?? inheritedDateGrain);

	// Resolve date range with variable interpolation
	const resolvedDateRange = $derived.by(() => {
		if (!date_range) return undefined;
		return {
			...date_range,
			range: resolveText(date_range.range)
		};
	});

	// Local processed columns for ComboChart's own UI needs (xAxisModel, export handler).
	// Children consume raw attrs via sharedQueryContext and call buildChartSQLConfig themselves.
	const xProcessed = $derived.by(() => {
		if (!x) return null;
		return processColumnExpression(
			{
				value: x,
				dateGrain: date_grain,
				firstDayOfWeek: projectSettings.first_day_of_week
			},
			queryService.dialect
		);
	});
	const pointTitleProcessed = $derived.by(() => {
		if (!point_title) return null;
		return processColumnExpression({ value: point_title }, queryService.dialect);
	});
	const pointTitleColumn = $derived(pointTitleProcessed?.alias);
	const sizeProcessed = $derived.by(() => {
		if (!_size) return null;
		return processColumnExpression({ value: _size }, queryService.dialect);
	});
	const xColumnName = $derived(xProcessed?.alias);

	// Provides the metric catalog to child series so `{% line metric="..." /%}`
	// resolves its own base + aggregate independently of the combo_chart's `data=`.
	const metricsCatalog = getMetricsCatalogContext();

	// Raw shared context that children (SeriesModels) forward to buildChartSQLConfig
	const sharedQueryContext = $derived.by(() => {
		return {
			tableExpressionName: tableName,
			x,
			// Author's explicit `x=` on the parent (before `inheritedX` folds in
			// child #1's viewDate). Metric children need this to distinguish
			// "user overrode the axis" from "just fell back to first child's
			// time column": in the latter case a cross-base child should query
			// its OWN viewDate, not child #1's.
			explicitX: rawX,
			point_title,
			dateGrain: date_grain,
			// Same story for grain — author's explicit `date_grain=` vs the
			// inherited one from child #1's view.
			filters: filterIds,
			where,
			dateRange: resolvedDateRange,
			having,
			qualify,
			order,
			x_sort,
			limit,
			queryDeps: {
				queryService,
				filterContexts: [repeatFilters, pageFilters],
				inlineQueries,
				projectSettings: getProjectSettingsContext(),
				defaultRefreshInterval: () => autoRefreshCtx?.intervalSeconds ?? 0
			},
			refreshInterval: props.refresh_interval,
			firstDayOfWeek: projectSettings.first_day_of_week
		};
	});

	setComboChartContext({
		getSharedQueryContext: () => sharedQueryContext,
		addSeries: (propsGetter) => {
			const series = new SeriesModel(
				propsGetter,
				yAxes,
				() => sharedQueryContext,
				metricsCatalog,
				queryService.dialect,
				[repeatFilters, pageFilters],
				inlineQueries
			);
			Object.values(yAxes).forEach((axisModel) => axisModel.addSeries(series));

			seriesInOrder.push(series);

			const removeSeries = () => {
				Object.values(yAxes).forEach((axisModel) => axisModel.removeSeries(series));

				const index = seriesInOrder.indexOf(series);
				if (index > -1) seriesInOrder.splice(index, 1);
			};

			return { series, removeSeries };
		},
		addReferenceLine: (propsGetter) => {
			const referenceLine = new ReferenceLineStaticModel(propsGetter, xAxisModel, y1AxisModel);
			references.push(referenceLine);
			const removeReferenceLine = () => {
				references.splice(references.indexOf(referenceLine), 1);
			};
			return { referenceLine, removeReferenceLine };
		},
		addReferenceArea: (propsGetter) => {
			const referenceArea = new ReferenceAreaStaticModel(propsGetter);
			references.push(referenceArea);
			const removeReferenceArea = () => {
				references.splice(references.indexOf(referenceArea), 1);
			};
			return { referenceArea, removeReferenceArea };
		},
		addReferencePoint: (propsGetter) => {
			const referencePoint = new ReferencePointStaticModel(propsGetter, xAxisModel, y1AxisModel);
			references.push(referencePoint);
			const removeReferencePoint = () => {
				references.splice(references.indexOf(referencePoint), 1);
			};
			return { referencePoint, removeReferencePoint };
		}
	});

	// === VARIABLE INTERPOLATION ===
	// Interpolated props (these support variables per schema)
	// Reactivity established automatically via filter.templateValues access
	const title = $derived(resolveText(props.title) ?? '');
	const subtitle = $derived(resolveText(props.subtitle) ?? '');
	const info = $derived(resolveText(props.info) ?? '');
	const info_link = $derived(resolveText(props.info_link) ?? '');
	const info_link_title = $derived(resolveText(props.info_link_title) ?? '');
	// Apply default format for grains that are treated as category axes
	const effectiveXFmt = $derived(
		x_fmt ??
			(date_grain &&
			[
				'month of year',
				'quarter of year',
				'day of week',
				'day of month',
				'week of year',
				'day of year',
				'year'
			].includes(date_grain)
				? getDefaultFormatForDateGrain(date_grain)
				: undefined)
	);

	// Note: Query registration is now handled by individual series children
	// Each series creates its own query and registers it with queryInfoContext

	// Convert series models to the format expected by mergeSeriesData
	const seriesDataInputs = $derived<SeriesDataInput[]>(
		seriesInOrder.map((series) => ({
			rows: series.query?.result?.rows ?? [],
			columns: series.query?.result?.columns ?? [],
			yColumnName: series.yColumnName,
			yDisplayName: series.yProcessed.displayAlias,
			seriesColumnName: series.seriesColumnName,
			fmt: series.props.fmt
		}))
	);

	// Custom export handler to aggregate data from all series
	const customExportHandler = $derived.by(() => {
		if (!browser) return undefined;

		return async () => {
			const xColumn = xColumnName;
			if (!xColumn) return;

			const result = mergeSeriesData(xColumn, seriesDataInputs);
			if (!result) return;

			const exportNames = getExcelExportNames({
				title,
				fallbackFilename: 'combo_chart_data'
			});

			await downloadAsExcel({
				...exportNames,
				data: result.rows,
				columns: result.columns
			});
		};
	});

	// Register custom export handler
	$effect(() => {
		setCustomExportHandler?.(customExportHandler);
		return () => setCustomExportHandler?.(undefined);
	});

	// Create a combined query-like object for page-level export functionality
	// This consolidates data from all series so the queryInfoMap has complete data
	const combinedQueryResult = $derived.by(() => {
		const xColumn = xColumnName;
		if (!xColumn || seriesInOrder.length === 0) return null;

		return mergeSeriesData(xColumn, seriesDataInputs);
	});

	// Combine SQL from all series for display in ComponentConsole
	const combinedSql = $derived.by(() => {
		const parts = seriesInOrder.flatMap((s) =>
			s.query?.sql ? [{ sql: s.query.sql, type: s.type, label: s.yProcessed.displayAlias }] : []
		);

		if (parts.length === 0) return undefined;
		if (parts.length === 1) return parts[0].sql;

		return parts
			.map((p, i) => `-- ${p.type}: ${p.label || `series ${i + 1}`}\n${p.sql.trimEnd()};`)
			.join('\n\n');
	});

	// Register the combined query with queryInfoContext for page-level export
	$effect(() => {
		if (!queryInfoContext || !combinedQueryResult) return;

		// Create a query-like object that satisfies the QueryInfo interface
		const combinedQuery = {
			result: combinedQueryResult,
			loading: loading,
			refreshing: refreshing,
			sql: combinedSql
		} as unknown as Parameters<typeof queryInfoContext.registerQuery>[2];

		return queryInfoContext.registerQuery(componentId, _tagName, combinedQuery, title);
	});

	// TODO: Client-side sorting with x_sort array will need to be reimplemented per-series
	// For now, array-based x_sort is not supported with per-series queries

	// Check if any series is loading
	const loading: boolean = $derived(seriesInOrder.some((s) => s.query?.loading));

	// Check if any series is doing a background refresh
	const refreshing: boolean = $derived(seriesInOrder.some((s) => s.query?.refreshing));

	// Check if any series is sampled
	const isSampled = $derived(seriesInOrder.some((s) => Boolean(s.query?.samplingForced)));

	// Get x column's JavaScript type from first available series query result for gap filling
	const xColumnType = $derived.by(() => {
		if (!xColumnName) return undefined;
		for (const s of seriesInOrder) {
			const columns = s.query?.result?.columns;
			if (columns) {
				const xCol = columns.find((c) => c.name === xColumnName);
				if (xCol?.jsType) {
					return xCol.jsType as 'date' | 'number' | 'string';
				}
			}
		}
		return undefined;
	});

	const chartMarginPx = 3;
	const xAxisFontSize = 12;

	// Detect if any bar or area series is stacked
	// Stacked charts require category axis + zero-fill for proper rendering
	const hasStackedSeries = $derived(
		seriesInOrder.some((s) => s.isStacked && (s.type === 'bar' || s.type === 'line'))
	);

	// Get base axis config, then override for stacking if needed
	const xAxisOptions = $derived.by(() => {
		const baseConfig = xAxisModel.axisConfig;

		// Only force category axis for stacked charts when it's NOT a time axis
		// Time axes should remain as 'time' to preserve proper date formatting and scaling
		const isTimeAxis = baseConfig.type === 'time';
		if (!hasStackedSeries || isTimeAxis) return baseConfig;

		// For stacked charts with non-time axes, force category axis type.
		// Drop the value-axis-only pieces: boundaryGap has different types for
		// value vs category axes, and the min/max fit-to-data callbacks receive
		// category INDEXES here — the integer-snapped pad then rounds up to a
		// whole extra index, appending a phantom empty slot (with a wrapped
		// label) after the last real category. Numeric-grain category axes
		// (day of month, …) read fine horizontally, so `withAutoXAxisLabelLayout`
		// thins their labels instead of rotating them (a stacked-by-default area
		// chart on "day of month" therefore stays clean, matching its line twin).
		const { boundaryGap: _, min: _min, max: _max, ...rest } = baseConfig;
		return {
			...rest,
			type: 'category' as const
		} as typeof baseConfig;
	});

	// For stacked charts on category axes: force zero-fill for stable stacks.
	// Time axes should keep the configured behavior to avoid collapsing fine-grained timestamps.
	const effectiveHandleMissing = $derived(
		hasStackedSeries && xAxisOptions.type === 'category' ? 'zero' : handle_missing
	);
	// Only treat as category axis if it's explicitly a category axis (not time axis overridden for stacking)
	const effectiveTreatAsCategoryAxis = $derived(xAxisOptions.type === 'category');

	// For stacked charts with x_sort='asc'/'desc', sort by stack total instead of x value
	const sortByStackTotal = $derived.by(() => {
		if (!hasStackedSeries) return undefined;
		if (x_sort === 'asc' || x_sort === 'desc') {
			return x_sort;
		}
		return undefined;
	});

	const seriesComputed = $derived.by(() => {
		if (!xColumnName) {
			return { options: [...referencesSeries], modelByIndex: [] as (SeriesModel | undefined)[] };
		}

		// Track cumulative series count for color palette indexing
		// Each SeriesModel can produce multiple series configs (e.g., when using series column)
		let colorPaletteIndex = 0;

		// Parallel to the emitted ECharts series list — for each data-series
		// index, the SeriesModel that produced it. Used by the tooltip
		// formatter to look up tooltip_fields metadata for a hovered series.
		// Reference-series overlays occupy the tail and stay `undefined`.
		const modelByIndex: (SeriesModel | undefined)[] = [];

		const dataSeries = seriesInOrder.flatMap((series, _index) => {
			const configs = series.getSeriesConfig({
				xColumnName: xColumnName!,
				pointTitle: pointTitleColumn,
				seriesColors: series_colors,
				seriesOrder: series_order,
				treatAsCategoryAxis: effectiveTreatAsCategoryAxis,
				zIndex: 2 + colorPaletteIndex,
				handleMissing: effectiveHandleMissing,
				dateGrain: date_grain,
				xColumnType,
				sortByStackTotal,
				colorPalette: effectiveColorPalette,
				colorPaletteStartIndex: colorPaletteIndex
			});
			// Update index for next series based on how many configs were generated
			colorPaletteIndex += configs.length;
			for (let i = 0; i < configs.length; i++) modelByIndex.push(series);
			return configs;
		});

		// The theme's barRadius rounds every bar series; in a stack that rounds the
		// top of each segment. Keep the rounding only on the topmost segment (last
		// data series in stack order) and square off the segments beneath it.
		// Scoped to dataSeries so reference overlays never claim the top slot.
		if (themeContext.activeTheme.chart?.barRadius) {
			const lastByStack = new Map<string, SeriesOption>();
			for (const s of dataSeries) {
				if (s.type === 'bar' && typeof s.stack === 'string') lastByStack.set(s.stack, s);
			}
			for (const s of dataSeries) {
				if (s.type === 'bar' && typeof s.stack === 'string' && lastByStack.get(s.stack) !== s) {
					s.itemStyle = { ...s.itemStyle, borderRadius: [0, 0, 0, 0] };
				}
			}
		}

		// Apply chart-level echarts_series_options to every DATA series. Skip
		// references so reference_line/area/point overlays don't get clobbered
		// (preserves the guardrail OSS Evidence shipped with seriesOptions).
		const seriesOverrides = props.echarts_series_options;
		if (seriesOverrides) {
			for (const s of dataSeries) {
				merge(s, seriesOverrides);
			}
		}

		return { options: [...dataSeries, ...referencesSeries], modelByIndex };
	});

	const seriesOptions = $derived(seriesComputed.options);
	const seriesModelBySeriesIndex = $derived(seriesComputed.modelByIndex);
	const hasDataLabels = $derived(
		seriesOptions.some((series) => 'label' in series && series.label?.show)
	);

	const chartOptions = $derived<EChartsOption & { series?: never; yAxis?: never }>({
		// Prevent data labels from appearing on hover
		axisPointer: {
			triggerEmphasis: hasDataLabels ? false : undefined,
			snap: true
		},
		color: effectiveColorPalette,
		toolbox,
		grid: {
			// +8 accounts for y-axis label
			top: chartMarginPx + 8 + topPadding,
			left: chartMarginPx,
			right: chartMarginPx,
			// Reserve space for the x-axis title graphic only when it's actually visible;
			// otherwise labels-only fits in a tighter footer. Labels margin bumped to 8
			// (was 6/8) so both branches include a touch more air now that the baseline
			// reads lighter. Two-tier month labels ("Jul" over "2019") add a second
			// label line of room; the container grows by the same twoTierExtraHeight,
			// so the plot area's pixel height is unchanged.
			bottom:
				(xAxisModel.isTitleVisible
					? chartMarginPx + xAxisFontSize + 27
					: chartMarginPx + xAxisFontSize + 12) +
				twoTierExtraHeight +
				sliderExtraHeight
		},
		tooltip: {
			trigger: 'axis',
			appendToBody: true,
			extraCssText: elevatedTooltipCss,
			formatter: (arg) => {
				const { success, data: params, error } = tooltipFormatterArgSchema.safeParse(arg);
				if (!success) {
					logger.error({ arg, zodError: error }, 'Failed to parse tooltip formatter arg');
					return '';
				}

				// Filter to only the hovered series if one is being directly hovered
				const filteredParams =
					hoveredSeriesIndex !== null
						? params.filter((p) => p.seriesIndex === hoveredSeriesIndex)
						: params;

				// If no params after filtering, fall back to all params
				const preFilteredDisplayParams = filteredParams.length > 0 ? filteredParams : params;

				// Drop params whose seriesIndex no longer maps to a live series.
				// This happens transiently when the series list shrinks — e.g.
				// deleting `series="category"` collapses N series to 1 — and
				// echarts re-fires the tooltip once with a stale seriesIndex
				// before its next render. Without this filter the map below
				// dereferences `undefined.tooltip` and crashes the chart.
				const displayParams = preFilteredDisplayParams.filter(
					(p) => seriesOptions[p.seriesIndex] !== undefined && shouldDisplayTooltipParam(p)
				);

				if (displayParams.length === 0) return '';

				const rawXValue = displayParams[0].value[0];
				const formattedXValue = xAxisModel.getFullValue(rawXValue);
				const xName = xAxisModel.title;

				const items = displayParams.map((p) => {
					const rawValue = p.value[1];
					const series = seriesOptions[p.seriesIndex];
					// dataIndex, not seriesIndex: the 100%-stack formatter resolves this
					// series' raw, un-normalized value from the hovered column.
					const formattedValue = series.tooltip?.valueFormatter?.(rawValue, p.dataIndex);

					const yAxisIndex = 'yAxisIndex' in series ? series.yAxisIndex : 0;
					const axis = yAxisIndex === 1 ? y2AxisModel : y1AxisModel;

					// Don't use ECharts placeholder 'series\u0000#' name
					// eslint-disable-next-line no-control-regex
					const seriesName = /^series\u0000\d+$/.test(p.seriesName) ? axis.title : p.seriesName;

					// Extract line style type for line/area charts (solid, dashed, dotted)
					const lineStyle =
						'lineStyle' in series
							? (series.lineStyle as { type?: LineStyleType } | undefined)?.type
							: undefined;

					// Resolve the rendered color from the series config so
					// author overrides via echarts_options / echarts_series_options
					// (particularly lineStyle.color) are reflected in the tooltip
					// swatch — same treatment CustomLegend gets. ECharts' own
					// p.marker uses series.color which ignores lineStyle overrides.
					const renderedColor = getRenderedSeriesColor(
						series as {
							type?: string;
							color?: SeriesColorValue;
							lineStyle?: { color?: SeriesColorValue };
							itemStyle?: { color?: SeriesColorValue };
						},
						''
					);

					// Generate marker based on series type (line, bar, scatter, area)
					// instead of ECharts' default circle marker
					const marker = getSeriesTypeMarker(
						p.seriesType,
						p.marker,
						lineStyle,
						renderedColor || undefined
					);

					// If this series has tooltip_fields, render the extra rows for
					// this specific data item. `p.data` is the raw echarts data
					// item — when tooltip_fields is set, we emit it as
					// `{ value, extras }`; otherwise it's a bare tuple.
					const seriesModel = seriesModelBySeriesIndex[p.seriesIndex];
					const dataItem = p.data as { extras?: Record<string, unknown> } | unknown[] | undefined;
					const extras =
						dataItem && !Array.isArray(dataItem) && typeof dataItem === 'object'
							? dataItem.extras
							: undefined;
					const extrasRows = seriesModel
						? renderTooltipExtras(seriesModel.tooltipFields, extras)
						: [];

					return {
						seriesType: p.seriesType,
						marker,
						axisName: axis.title,
						seriesName,
						formattedValue,
						extrasRows
					};
				});

				let tooltipTitle: string;
				let tooltipRows: string[];

				if (items[0].seriesType === 'scatter') {
					// point_title is at index 3 in the data array: [x, y, size, pointTitle]
					const pointTitleValue = params[0].value[3] as string | number | undefined;
					// When multiple series share an axis, axisName may be undefined - fall back to seriesName
					const yLabel = items[0].axisName ?? items[0].seriesName;

					// Size value at index 2 (for bubble charts)
					const rawSizeValue = params[0].value[2];
					const sizeLabel = sizeProcessed?.displayAlias;
					const formattedSizeValue =
						rawSizeValue != null && sizeLabel
							? formatValue(rawSizeValue, size_fmt, rawSizeValue.toString())
							: undefined;

					// Only show marker + series name row when there are multiple series
					const hasMultipleSeries = seriesInOrder.length > 1 || !!series;
					const seriesRow = hasMultipleSeries
						? `
								<div class="flex flex-row items-center gap-1">
									${items[0].marker}
									<span>${escapeHtml(String(items[0].seriesName))}</span>
								</div>
								<span></span>
							`
						: '';

					const sizeRow = formattedSizeValue
						? `
								<span>${escapeHtml(String(sizeLabel))} <span class="text-[10px] opacity-50">(size)</span></span>
								<span class="text-right">${escapeHtml(formattedSizeValue)}</span>
							`
						: '';

					if (pointTitleValue) {
						tooltipTitle = `<span class="font-semibold">${escapeHtml(pointTitleValue)}</span>`;
						tooltipRows = [
							...(seriesRow ? [seriesRow] : []),
							`
								<span>${escapeHtml(xName)}</span>
								<span class="text-right">${escapeHtml(formattedXValue)}</span>
							`,
							`
								<span>${escapeHtml(String(yLabel))}</span>
								<span class="text-right">${escapeHtml(String(items[0].formattedValue))}</span>
							`,
							...(sizeRow ? [sizeRow] : []),
							...items[0].extrasRows
						];
					} else {
						if (hasMultipleSeries) {
							tooltipTitle = `
								<div class="flex flex-row items-center gap-1">
									${items[0].marker}
									<span>${escapeHtml(String(items[0].seriesName))}</span>
								</div>
							`;
						} else {
							tooltipTitle = '';
						}
						tooltipRows = [
							`
								<span>${escapeHtml(xName)}</span>
								<span class="text-right">${escapeHtml(formattedXValue)}</span>
							`,
							`
								<span>${escapeHtml(String(yLabel))}</span>
								<span class="text-right">${escapeHtml(String(items[0].formattedValue))}</span>
							`,
							...(sizeRow ? [sizeRow] : []),
							...items[0].extrasRows
						];
					}
				} else {
					// point_title is at index 3 in the data array: [x, y, size, pointTitle]
					// For bar/line/area, all displayed items share the same x; if any of them
					// carries a non-empty pointTitle, surface it as the tooltip title and
					// drop x to a row below (mirrors scatter behaviour).
					const pointTitleValue = displayParams
						.map((p) => p.value[3])
						.find((v): v is string => typeof v === 'string' && v.length > 0);

					// One series-value row per item, followed inline by that
					// series' tooltip_fields rows (each field is already two
					// grid cells, so they slot straight into the parent grid).
					const renderItemBlock = (item: (typeof items)[number]) => {
						const row = `
							<div class="flex flex-row items-center gap-1">
								${item.marker}
								<span>${escapeHtml(String(item.seriesName))}</span>
							</div>
							<span class="text-right">${escapeHtml(String(item.formattedValue))}</span>
						`;
						return [row, ...item.extrasRows];
					};

					if (pointTitleValue) {
						tooltipTitle = `<span class="font-semibold">${escapeHtml(pointTitleValue)}</span>`;
						tooltipRows = [
							`
								<span>${escapeHtml(xName)}</span>
								<span class="text-right">${escapeHtml(formattedXValue)}</span>
							`,
							...items.flatMap(renderItemBlock)
						];
					} else {
						tooltipTitle = `<span class="font-semibold">${escapeHtml(formattedXValue)}</span>`;
						tooltipRows = items.flatMap(renderItemBlock);
					}
				}

				return `
					<div class="flex flex-col">
						${tooltipTitle}
						<div class="grid grid-cols-[auto_auto] gap-x-4">
							${tooltipRows.join('')}
						</div>
					</div>
				`;
			}
		},
		legend: {
			show: false,
			orient: 'horizontal',
			top: '0%'
		},
		xAxis: xAxisOptions,
		animation: true,
		animationDuration: 800,
		animationEasing: 'cubicInOut',
		transition: ['all'],
		graphic: [xAxisModel.axisTitleGraphic]
	});

	const yAxisOptions = $derived([y1AxisModel, y2AxisModel].map((axis) => axis.axisConfig));

	// Final merge order (last wins via lodash deep merge):
	//   1. chartOptions          — Studio-computed defaults + structured props
	//   2. series/yAxis arrays   — computed per-series and per-axis
	//   3. props.echarts_options — author's raw ECharts overrides (deep-merged
	//      over everything including xAxis/yAxis/series — partial overrides
	//      win on a key-by-key basis without clobbering computed siblings)
	const options: EChartsOption = $derived.by(() => {
		transformOptions?.(chartOptions);
		return merge(
			{},
			chartOptions,
			{ series: seriesOptions, yAxis: yAxisOptions },
			props.echarts_options ?? {}
		);
	});

	const ready = $derived(!loading);
	let stableOptions: EChartsOption = $state({});
	$effect(() => {
		if (ready) {
			stableOptions = options;
		}
	});

	let chart: EChartsInstance | undefined = $state(undefined);

	// Track which series is being directly hovered for hybrid tooltip behavior
	let hoveredSeriesIndex: number | null = $state(null);
	let lastHighlightedDataIndex: number | null = $state(null);
	let mouseoutTimeout: ReturnType<typeof setTimeout> | null = null;
	const MOUSEOUT_DEBOUNCE_MS = 100;

	// Set up mouseover/mouseout handlers for series-specific tooltip
	$effect(() => {
		if (!chart) return;

		const clearHighlight = () => {
			if (hoveredSeriesIndex !== null && lastHighlightedDataIndex !== null) {
				chart?.dispatchAction({
					type: 'downplay',
					seriesIndex: hoveredSeriesIndex,
					dataIndex: lastHighlightedDataIndex
				});
			}
			hoveredSeriesIndex = null;
			lastHighlightedDataIndex = null;
		};

		const handleMouseOver = (params: { seriesIndex?: number }) => {
			// Cancel any pending mouseout
			if (mouseoutTimeout) {
				clearTimeout(mouseoutTimeout);
				mouseoutTimeout = null;
			}

			if (typeof params.seriesIndex === 'number') {
				// Clear highlight from previous series if switching to a different one
				if (
					hoveredSeriesIndex !== null &&
					hoveredSeriesIndex !== params.seriesIndex &&
					lastHighlightedDataIndex !== null
				) {
					chart?.dispatchAction({
						type: 'downplay',
						seriesIndex: hoveredSeriesIndex,
						dataIndex: lastHighlightedDataIndex
					});
					lastHighlightedDataIndex = null;
				}
				hoveredSeriesIndex = params.seriesIndex;
			}
		};

		const handleMouseOut = () => {
			// Debounce the mouseout to smooth transitions between series
			if (mouseoutTimeout) {
				clearTimeout(mouseoutTimeout);
			}
			mouseoutTimeout = setTimeout(() => {
				clearHighlight();
				mouseoutTimeout = null;
			}, MOUSEOUT_DEBOUNCE_MS);
		};

		// Highlight the nearest point when axis pointer moves while hovering a series
		const handleAxisPointerUpdate = (params: unknown) => {
			if (hoveredSeriesIndex === null) return;

			const { dataIndex } = params as { dataIndex?: number };
			if (typeof dataIndex !== 'number') return;

			// Clear previous highlight if different point
			if (lastHighlightedDataIndex !== null && lastHighlightedDataIndex !== dataIndex) {
				chart?.dispatchAction({
					type: 'downplay',
					seriesIndex: hoveredSeriesIndex,
					dataIndex: lastHighlightedDataIndex
				});
			}

			// Highlight the current point
			chart?.dispatchAction({
				type: 'highlight',
				seriesIndex: hoveredSeriesIndex,
				dataIndex: dataIndex
			});
			lastHighlightedDataIndex = dataIndex;
		};

		chart.on('mouseover', handleMouseOver);
		chart.on('mouseout', handleMouseOut);
		chart.on('updateAxisPointer', handleAxisPointerUpdate);

		return () => {
			if (mouseoutTimeout) {
				clearTimeout(mouseoutTimeout);
			}
			chart?.off('mouseover', handleMouseOver);
			chart?.off('mouseout', handleMouseOut);
			chart?.off('updateAxisPointer', handleAxisPointerUpdate);
		};
	});

	// Activate zoom mode automatically
	$effect(() => {
		if (!chart || !zoom) {
			return () => {};
		}

		const handleFinished = () => {
			if (chart) {
				chart.dispatchAction({
					type: 'takeGlobalCursor',
					key: 'dataZoomSelect',
					dataZoomSelectActive: true
				});
			}
		};

		chart.on('finished', handleFinished);
		handleFinished();

		return () => {
			chart?.off('finished', handleFinished);
		};
	});

	let mouseDownPos: { x: number; y: number } | null = $state(null);
	// True only mid drag-zoom on this chart (vs a zoom connect pushed in).
	let isZoomSource = false;
	let normalizingZoom = false;

	// connect propagates absolute dataZoom; re-emit y as a percentage so each linked chart
	// zooms to its own scale, not this one's y-range (x left absolute → same dates).
	$effect(() => {
		if (!chart || !zoom || !props.connect_group) return () => {};

		const normalizeY = () => {
			if (normalizingZoom || !isZoomSource || !chart) return;
			const zooms = (chart.getOption() as { dataZoom?: Array<Record<string, unknown>> }).dataZoom;
			if (!Array.isArray(zooms)) return;
			const batch = zooms
				.map((dz, dataZoomIndex) => ({ dz, dataZoomIndex }))
				.filter(
					({ dz }) =>
						dz.yAxisIndex != null &&
						dz.xAxisIndex == null &&
						typeof dz.start === 'number' &&
						typeof dz.end === 'number'
				)
				.map(({ dz, dataZoomIndex }) => ({
					dataZoomIndex,
					start: dz.start as number,
					end: dz.end as number,
					startValue: null,
					endValue: null
				}));
			if (!batch.length) return;
			normalizingZoom = true;
			chart.dispatchAction({ type: 'dataZoom', batch } as Parameters<
				typeof chart.dispatchAction
			>[0]);
			normalizingZoom = false;
		};

		chart.on('datazoom', normalizeY);
		return () => chart?.off('datazoom', normalizeY);
	});

	function handlePointerDown(e: MouseEvent | TouchEvent) {
		if (!zoom) return;
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		mouseDownPos = { x: clientX, y: clientY };
		isZoomSource = true;
	}

	function handlePointerUp(e: MouseEvent | TouchEvent) {
		if (!zoom || !chart || !mouseDownPos) return;
		const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
		const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

		const deltaX = Math.abs(clientX - mouseDownPos.x);
		const deltaY = Math.abs(clientY - mouseDownPos.y);

		if (deltaX < ZOOM_CLICK_THRESHOLD_PX && deltaY < ZOOM_CLICK_THRESHOLD_PX) {
			chart.dispatchAction({
				type: 'dataZoom',
				start: 0,
				end: 100
			});
		}

		mouseDownPos = null;
		// Clear after the toolbox's datazoom event (same mouseup) has fired.
		setTimeout(() => (isZoomSource = false), 0);
	}
</script>

<div
	class="flex w-full flex-col"
	class:h-full={!height}
	style:height={height
		? `${height + xAxisExtraHeight + twoTierExtraHeight + sliderExtraHeight}px`
		: undefined}
>
	{#if title || subtitle}
		<ComponentTitle {title} {subtitle} {info} {info_link} {info_link_title} />
	{/if}
	<!-- more semantically correct to use a button here?-->
	<button
		class="relative z-0 flex min-h-0 flex-1 cursor-default flex-col justify-end"
		onmousedown={zoom ? handlePointerDown : undefined}
		onmouseup={zoom ? handlePointerUp : undefined}
		ontouchstart={zoom ? handlePointerDown : undefined}
		ontouchend={zoom ? handlePointerUp : undefined}
	>
		{#if chart && legend && legend_location === 'top'}
			<CustomLegend chartInstance={chart} />
		{/if}

		<ECharts
			bind:chart
			class={cn('h-full w-full flex-1', !height && 'min-h-[215px]')}
			style={!height && xAxisExtraHeight + twoTierExtraHeight + sliderExtraHeight > 0
				? `min-height: ${DEFAULT_CHART_MIN_HEIGHT_PX + xAxisExtraHeight + twoTierExtraHeight + sliderExtraHeight}px`
				: undefined}
			options={stableOptions}
			group={props.connect_group}
			onExtraHeightChange={(extraHeight) => {
				xAxisExtraHeight = extraHeight;
			}}
		/>

		{#if chart && legend && legend_location === 'bottom'}
			<CustomLegend chartInstance={chart} />
		{/if}

		{#if loading}
			<div class="absolute top-2 right-2">
				<LoaderCircle class="text-muted-foreground h-4 w-4 animate-spin [animation-duration:1s]" />
			</div>
		{/if}

		<SamplingIndicator
			{isSampled}
			dataLength={seriesInOrder.reduce((sum, s) => sum + (s.query?.result?.rows?.length ?? 0), 0)}
			totalCount={seriesInOrder.reduce((sum, s) => sum + (s.query?.count ?? 0), 0)}
		/>
	</button>
</div>

<div class="hidden">
	{@render children?.()}
</div>
