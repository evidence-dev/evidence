<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import type { EChartsOption, SeriesOption } from 'echarts';
	import merge from 'lodash/merge';
	import type { ECharts as EChartsInstance } from 'echarts';
	import ECharts from '../../echarts/ECharts.svelte';
	import ComponentTitle from '../../../common/ComponentTitle.svelte';
	import CustomLegend from '../../echarts/CustomLegend.svelte';
	import SamplingIndicator from '../../../common/SamplingIndicator.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { Query } from '../../../../Query.svelte';
	import { getDefaultConnection } from '../../../../QueryService.context';
	import { getRepeatContext } from '../../repeat/repeat-context';
	import { getPageFiltersContext } from '../../../../page-filters-context';
	import { getInlineQueriesContext } from '../../../common/inline-queries';
	import { getProjectSettingsContext } from '../../../../project-settings.context';
	import { getAutoRefreshContext } from '../../../../auto-refresh.context.svelte';
	import { getComponentWrapperContext } from '../../../common/component-wrapper-context';
	import { getQueryInfoContext } from '../../../../query-info-context.svelte';
	import { extractSQLProps } from '../../../common/sql-options';
	import { processColumnExpression } from '../../../common/sql-expression-utils';
	import { buildHorizontalBarChartSQLConfig } from './build-horizontal-bar-chart-sql';
	import type { ProcessedColumnExpression } from '../../../common/sql-expression-utils';
	import { getDefaultFormatForDateGrain } from '../../../common/date-options';
	import { VariableProcessor } from '../../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../../common/use-variable-processing';
	import { formatValue } from '../../../formatValue';
	import { getMinMax } from '../../../getMinMax';
	import { cn } from '../../../../shadcn/utils';
	import { YAxisModel } from '../combo_chart/YAxisModel.svelte';
	import { XAxisModel } from '../combo_chart/XAxisModel.svelte';
	import type { XAXisOption, YAXisOption } from 'echarts/types/src/coord/cartesian/AxisModel.js';
	import { fillGaps } from '../../../common/fill-gaps';
	import { getElevatedChartTooltipCss } from '../../../common/chart-tooltip-elevation';
	import { untrack } from 'svelte';
	import { setComboChartContext } from '../combo_chart/combo-chart-context';
	import type { ReferenceModel } from '../combo_chart/references/types';
	import { ReferenceLineStaticModel } from '../combo_chart/references/reference_line/ReferenceLineStaticModel.svelte';
	import { ReferenceAreaStaticModel } from '../combo_chart/references/reference_area/ReferenceAreaStaticModel.svelte';
	import { ReferencePointStaticModel } from '../combo_chart/references/reference_point/ReferencePointStaticModel.svelte';
	import { coerceNumber } from '../../../common/process-variables';
	import { getThemeContext } from '../../../../theme/theme.context.svelte';
	import {
		resolveTooltipFields,
		extractTooltipExtras,
		escapeHtml,
		renderTooltipExtras,
		type TooltipField
	} from '../../../common/tooltip-fields';
	import { setupCrossFilter } from '../../../common/cross-filter.svelte';

	const props: UserComponentProps<typeof schema> = $props();
	const children = $derived(props.children);
	const height = $derived(props.height);
	// Raises this chart's tooltip above the floating chat pane when rendered
	// inside it; '' (ECharts default) everywhere else.
	const elevatedTooltipCss = getElevatedChartTooltipCss();

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();
	const hasValidationErrors = $derived(hasBlockingErrors());

	const connection = getDefaultConnection();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();
	const getProjectSettings = getProjectSettingsContext();
	const projectSettings = $derived(getProjectSettings());

	// Extract SQL props
	const {
		where: rawWhere,
		having,
		limit,
		order,
		qualify
	} = $derived.by(() => extractSQLProps(props));

	// Variable interpolation
	const variableProcessor = $derived.by(() => {
		if (!inlineQueries) return null;
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText, resolveColumn, resolveSql } = $derived(createResolvers(variableProcessor));

	// Resolve props with variable support
	const title = $derived(resolveText(props.title) ?? '');
	const subtitle = $derived(resolveText(props.subtitle) ?? '');
	const info = $derived(resolveText(props.info) ?? '');
	const info_link = $derived(resolveText(props.info_link) ?? '');
	const info_link_title = $derived(resolveText(props.info_link_title) ?? '');
	const where = $derived(resolveSql(rawWhere));
	const date_grain = $derived(resolveText(props.date_grain) ?? props.date_grain);
	// Process entire date_range object - recursively handles date and range properties
	const resolvedDateRange = $derived(resolveText(props.date_range));
	const resolvedTooltipFields = $derived(
		resolveText(props.tooltip_fields) as TooltipField[] | undefined
	);
	const processedTooltip = $derived(
		resolveTooltipFields(resolvedTooltipFields, connection.dialect)
	);
	// Resolve x, y, series, and x_fmt with variable support
	const resolvedX = $derived(resolveColumn(props.x));
	const resolvedY = $derived(resolveColumn(props.y));
	const resolvedSeries = $derived(resolveColumn(props.series));
	const x_fmt = $derived(resolveText(props.x_fmt));
	// Apply default format for date grains on the Y axis (category axis for horizontal bars)
	const effectiveYFmt = $derived(
		resolveText(props.y_fmt) ?? getDefaultFormatForDateGrain(date_grain)
	);

	// Chart styling options
	const legend = $derived(props.legend ?? true);
	const legend_location = $derived(props.legend_location ?? 'top');
	const color_palette = $derived(props.chart_options?.color_palette);
	const series_colors = $derived(props.chart_options?.series_colors);
	// Default top padding provides space for data labels at top of chart
	const topPadding = $derived(props.chart_options?.top_padding ?? 5);
	const bar_color = $derived(props.bar_options?.color);
	const bar_opacity = $derived(props.bar_options?.opacity);

	// The theme's `chart.barRadius` rounds bar data-ends. ECharts borderRadius is
	// fixed in screen space ([top-left, top-right, bottom-right, bottom-left], no
	// auto-rotation), so the theme's vertical `[r, r, 0, 0]` would round the top
	// edge here. Horizontal bars grow rightward, so round the right corners instead.
	const themeContext = getThemeContext();
	const barRadius = $derived(themeContext.activeTheme.chart?.barRadius);
	const barBorderRadius = $derived<[number, number, number, number] | undefined>(
		barRadius ? [0, barRadius, barRadius, 0] : undefined
	);
	const handle_missing = $derived(props.handle_missing ?? 'connect');

	// Process columns
	// Note: For horizontal bars, x is the value (horizontal), y is the category (vertical)
	const xProcessed = $derived.by(() => {
		if (!resolvedX) return null;
		return processColumnExpression({ value: resolvedX }, connection.dialect);
	});

	const yProcessed = $derived.by(() => {
		if (!resolvedY) return null;
		return processColumnExpression(
			{
				value: resolvedY,
				dateGrain: date_grain,
				firstDayOfWeek: projectSettings.first_day_of_week
			},
			connection.dialect
		);
	});

	const seriesProcessed = $derived.by(() => {
		if (!resolvedSeries) return null;
		return processColumnExpression({ value: resolvedSeries }, connection.dialect);
	});

	const xColumnName = $derived(xProcessed?.alias); // value column
	const yColumnName = $derived(yProcessed?.alias); // category column
	const seriesColumnName = $derived(seriesProcessed?.alias);
	const y_sort = $derived(props.y_sort);
	const series_order = $derived(props.series_order);

	const cross_filter = $derived(props.cross_filter);
	const cross_filter_column = $derived(resolveColumn(props.cross_filter_column));
	const cross_filter_multiple = $derived(props.cross_filter_multiple ?? false);

	const crossFilterHelper = $derived.by(() => {
		return setupCrossFilter({
			chart: () => chart,
			pageFilters,
			crossFilter: cross_filter,
			crossFilterColumn: cross_filter_column ?? resolvedY,
			crossFilterMultiple: cross_filter_multiple,
			id: props.id
		});
	});

	const effectiveFilterIds = $derived.by(() => {
		const fIds = props.filters ?? [];
		if (crossFilterHelper.isEnabled()) {
			const selfId = crossFilterHelper.filterId();
			if (selfId) {
				return fIds.filter((id) => id !== selfId);
			}
		}
		return fIds;
	});

	// Build query config
	const queryConfig = $derived.by(() => {
		if (hasValidationErrors || !resolvedX || !resolvedY) return;
		// combo_chart's `data` is optional in metric-driven combo_chart, but
		// horizontal_bar_chart still requires it (no metric mode wired here yet).
		if (!props.data) return;

		return buildHorizontalBarChartSQLConfig({
			data: props.data,
			x: resolvedX,
			y: resolvedY,
			series: resolvedSeries,
			date_grain,
			filters: effectiveFilterIds,
			where,
			date_range: resolvedDateRange,
			having,
			qualify,
			order,
			y_sort,
			limit,
			firstDayOfWeek: projectSettings.first_day_of_week,
			dialect: connection.dialect,
			tooltipFieldColumns: processedTooltip.columns
		});
	});

	const autoRefreshCtx = getAutoRefreshContext();
	const query = new Query(
		() => queryConfig,
		{
			connection,
			filterContexts: [repeatFilters, pageFilters],
			inlineQueries,
			projectSettings: getProjectSettingsContext(),
			defaultRefreshInterval: () => autoRefreshCtx?.intervalSeconds ?? 0
		},
		{ refreshInterval: () => props.refresh_interval }
	);

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'horizontal_bar_chart', query, title);
	});

	// Error getters registered by children that own queries (dynamic references)
	let childErrorGetters = $state<Array<() => string | null | undefined>>([]);

	$effect(() => {
		setError(
			query.error ?? childErrorGetters.map((getError) => getError()).find(Boolean) ?? undefined
		);
	});

	// Get y column's JavaScript type from query result for gap filling
	// (y is the category axis for horizontal bars, which is the "x" for fillGaps)
	const yColumnType = $derived.by(() => {
		if (!yColumnName || !query.result?.columns) return undefined;
		return query.result.columns.find((c) => c.name === yColumnName)?.jsType as
			| 'date'
			| 'number'
			| 'string'
			| undefined;
	});

	const rawData = $derived.by(() => {
		const rows = query.result?.rows ?? [];

		// Create shallow copy to break reactive array reference
		if (rows.length > 0) {
			return rows.slice();
		}

		return rows;
	});

	// Apply series fill if series is defined and different from y
	const filledData = $derived.by(() => {
		if (
			!resolvedSeries ||
			resolvedSeries === resolvedY ||
			!yColumnName ||
			!seriesColumnName ||
			!xColumnName
		) {
			return rawData;
		}

		// For horizontal bar charts: fill on y (category) axis with series
		return fillGaps({
			data: rawData,
			xColumn: yColumnName, // Categories (y in horizontal)
			yColumn: xColumnName, // Values (x in horizontal)
			seriesColumn: seriesColumnName,
			handleMissing: handle_missing,
			dateGrain: date_grain,
			xColumnType: yColumnType // y column type since y is the "x" for fillGaps here
		});
	});

	// Apply client-side sorting if y_sort is an array
	const data = $derived.by(() => {
		if (!Array.isArray(y_sort) || !yColumnName) {
			return filledData;
		}

		// Create a map of y values to their sort order
		const sortOrderMap = new Map<string, number>();
		y_sort.forEach((value, index) => {
			sortOrderMap.set(String(value), index);
		});

		// Sort the data based on the custom order
		return [...filledData].sort((a, b) => {
			const aValue = String(a[yColumnName]);
			const bValue = String(b[yColumnName]);

			const aOrder = sortOrderMap.get(aValue);
			const bOrder = sortOrderMap.get(bValue);

			// If both values are in the sort order, sort by their position
			if (aOrder !== undefined && bOrder !== undefined) {
				return aOrder - bOrder;
			}

			// If only a is in the sort order, it comes first
			if (aOrder !== undefined) {
				return -1;
			}

			// If only b is in the sort order, it comes first
			if (bOrder !== undefined) {
				return 1;
			}

			// If neither is in the sort order, maintain data order (stable sort)
			return 0;
		});
	});
	const loading = $derived(query.loading);
	const isSampled = $derived(Boolean(query.samplingForced));

	const chartMarginPx = 3;
	const xAxisFontSize = 12;

	// Use YAxisModel for the x-axis (value axis) to get proper formatting and spacing
	const xAxisValueModel = new YAxisModel(
		'y1',
		() => ({
			...props.x_axis_options,
			fmt: x_fmt,
			gridlines: props.x_axis_options?.gridlines ?? true,
			baseline: props.x_axis_options?.baseline ?? false,
			// This x-axis is semantically a measure axis, so keep zero-inclusion
			// as the default (the x schema no longer defaults fit_to_data).
			fit_to_data: props.x_axis_options?.fit_to_data ?? false
		}),
		() => yColumnName
	);

	// Use XAxisModel just for the axis title graphic (it expects x to be the column name for title).
	// On horizontal_bar_chart, the "x" axis is semantically the VALUE axis (units,
	// aggregation) so an auto-derived title actually adds clarity — override the
	// XAxisModel default and show the auto-derived title unless the author opts out.
	const xAxisTitleModel = new XAxisModel(
		() => ({
			...props.x_axis_options,
			show_title: props.x_axis_options?.show_title ?? true,
			fmt: x_fmt,
			x: xColumnName ?? '', // This generates the title
			date_grain: undefined,
			firstDayOfWeek: projectSettings.first_day_of_week
		}),
		() => ({ y1: xAxisValueModel, y2: xAxisValueModel })
	);

	// Use XAxisModel for the y-axis (category axis) to get proper formatting and options
	const yAxisCategoryModel = new XAxisModel(
		() => ({
			...props.y_axis_options,
			fmt: effectiveYFmt,
			x: yProcessed?.alias ?? '', // The category column
			date_grain: yProcessed?.dateGrain,
			gridlines: props.y_axis_options?.gridlines ?? false,
			baseline: props.y_axis_options?.baseline ?? true,
			firstDayOfWeek: projectSettings.first_day_of_week
		}),
		() => ({ y1: xAxisValueModel, y2: xAxisValueModel }),
		// Category labels (the long ones on a horizontal bar chart) live on this
		// axis; elevate their tooltip so it clears the floating chat pane.
		() => elevatedTooltipCss
	);

	// Reference components support - set up context for child reference components
	const references: ReferenceModel[] = $state([]);
	const referencesSeries: SeriesOption[] = $derived(
		references.map((reference) => reference.series)
	);

	setComboChartContext({
		getSharedQueryContext: () => {
			throw new Error('getSharedQueryContext is not supported in horizontal_bar_chart');
		},
		addSeries: () => {
			throw new Error('addSeries is not supported in horizontal_bar_chart');
		},
		addReferenceLine: (propsGetter) => {
			const referenceLine = new ReferenceLineStaticModel(
				propsGetter,
				yAxisCategoryModel as unknown as XAxisModel,
				xAxisValueModel as unknown as YAxisModel
			);
			references.push(referenceLine);
			return {
				referenceLine,
				removeReferenceLine: () => references.splice(references.indexOf(referenceLine), 1)
			};
		},
		addReferenceArea: (propsGetter) => {
			const referenceArea = new ReferenceAreaStaticModel(propsGetter);
			references.push(referenceArea);
			return {
				referenceArea,
				removeReferenceArea: () => references.splice(references.indexOf(referenceArea), 1)
			};
		},
		addReferencePoint: (propsGetter) => {
			const referencePoint = new ReferencePointStaticModel(
				propsGetter,
				yAxisCategoryModel as unknown as XAxisModel,
				xAxisValueModel as unknown as YAxisModel
			);
			references.push(referencePoint);
			return {
				referencePoint,
				removeReferencePoint: () => references.splice(references.indexOf(referencePoint), 1)
			};
		},
		registerChildError: (getError) => {
			childErrorGetters.push(getError);
			return () => {
				const index = childErrorGetters.indexOf(getError);
				if (index > -1) childErrorGetters.splice(index, 1);
			};
		}
	});

	// Build ECharts options for horizontal bar chart
	const options: EChartsOption = $derived.by(() => {
		if (!xColumnName || !yColumnName || !data.length) {
			return {};
		}

		// Get unique categories and series values
		const categories = Array.from(new Set(data.map((row) => String(row[yColumnName]))));

		// Get min/max for value formatting
		const minMax = getMinMax(data, xColumnName);

		// Data label configuration
		const dataLabels = props.data_labels || {};
		const hasDataLabels = Boolean(dataLabels.position);

		let seriesConfigs: SeriesOption[];

		if (seriesColumnName) {
			// Multiple series - data is already filled via fillGaps
			let seriesValues = Array.from(new Set(data.map((row) => String(row[seriesColumnName]))));

			// Sort series based on series_order if provided
			if (series_order && series_order.length > 0) {
				const orderMap = new Map(series_order.map((name, index) => [name, index]));
				seriesValues = seriesValues.sort((a, b) => {
					const aOrder = orderMap.get(a);
					const bOrder = orderMap.get(b);

					// Both in order array: sort by their position
					if (aOrder !== undefined && bOrder !== undefined) {
						return aOrder - bOrder;
					}
					// Only a is in order: a comes first
					if (aOrder !== undefined) return -1;
					// Only b is in order: b comes first
					if (bOrder !== undefined) return 1;
					// Neither in order: maintain original order
					return 0;
				});
			}

			// @ts-expect-error - ECharts type expects broader callback signature for label formatter, but we know value is number for bar charts
			seriesConfigs = seriesValues.map((seriesValue) => {
				// Check if seriesColors mapping exists for this series value
				const seriesColorValue = series_colors?.[String(seriesValue)];

				// Filter data for this series and map to category order.
				// When tooltip_fields is set we emit `{ value, extras }` per
				// bar so the tooltip formatter can look up per-point extras
				// via `params.data.extras`; otherwise stay on the bare
				// number form ECharts expects.
				const tooltipFields = processedTooltip.fields;
				const hasExtras = tooltipFields.length > 0;
				const seriesData = untrack(() =>
					categories.map((category) => {
						const row = data.find(
							(r) =>
								String(r[yColumnName]) === category && String(r[seriesColumnName]) === seriesValue
						);
						if (!row) return null;
						const v = Number(row[xColumnName]);
						if (!hasExtras) return v;
						return { value: v, extras: extractTooltipExtras(row, tooltipFields) };
					})
				);

				return {
					type: 'bar' as const,
					name: seriesValue,
					data: seriesData,
					barMaxWidth: 60,
					stack: props.stacked ? 'stack1' : undefined,
					color: seriesColorValue ?? bar_color,
					itemStyle: {
						opacity: bar_opacity,
						...(barBorderRadius ? { borderRadius: barBorderRadius } : {})
					},
					label: {
						show: hasDataLabels,
						fontSize: dataLabels.size,
						color: dataLabels.color,
						position: dataLabels.position,
						distance: dataLabels.distance,
						rotate: dataLabels.rotate,
						formatter: (params: { value?: number | null }) => {
							const value = params.value;
							return formatValue(value, dataLabels.fmt ?? x_fmt, value?.toString(), minMax);
						}
					},
					labelLayout: {
						hideOverlap: !dataLabels.show_overlap
					}
				};
			});
		} else {
			// Single series
			const tooltipFields = processedTooltip.fields;
			const hasExtras = tooltipFields.length > 0;
			seriesConfigs = [
				{
					type: 'bar' as const,
					data: data.map((row) => {
						const v = Number(row[xColumnName]);
						if (!hasExtras) return v;
						return { value: v, extras: extractTooltipExtras(row, tooltipFields) };
					}),
					barMaxWidth: 60,
					stack: props.stacked ? 'stack1' : undefined,
					color: bar_color,
					itemStyle: {
						opacity: bar_opacity,
						...(barBorderRadius ? { borderRadius: barBorderRadius } : {})
					},
					label: {
						show: hasDataLabels,
						fontSize: dataLabels.size,
						color: dataLabels.color,
						position: dataLabels.position,
						distance: dataLabels.distance,
						rotate: dataLabels.rotate,
						// @ts-expect-error - ECharts type expects broader callback signature for label formatter
						formatter: (params: { value?: number | null }) => {
							const value = params.value;
							return formatValue(value, dataLabels.fmt ?? x_fmt, value?.toString(), minMax);
						}
					},
					labelLayout: {
						hideOverlap: !dataLabels.show_overlap
					}
				}
			];
		}

		// In a stack only the rightmost (data-end) segment should keep the rounded
		// corners; square off the segments behind it.
		if (barBorderRadius && props.stacked && seriesConfigs.length > 1) {
			seriesConfigs.slice(0, -1).forEach((s) => {
				if (s.type === 'bar') s.itemStyle = { ...s.itemStyle, borderRadius: [0, 0, 0, 0] };
			});
		}

		// For horizontal bars: xAxis is value, yAxis is category
		// Build xAxis config from YAxisModel (value axis) and transform it for horizontal orientation
		// Note: YAxisModel returns { show: false } when no series are registered, so we must override it
		const { mainType: _mainType, ...yAxisConfigRest } = xAxisValueModel.axisConfig;
		const axisMin = coerceNumber(props.x_axis_options?.min);
		const axisMax = coerceNumber(props.x_axis_options?.max);
		const xAxisConfig = {
			...yAxisConfigRest,
			type: 'value' as const,
			show: true,
			// Explicit axis bounds should be hard constraints when provided.
			min: axisMin ?? undefined,
			max: axisMax ?? undefined,
			// Add label alignment and hideOverlap for value axis
			axisLabel: {
				...yAxisConfigRest.axisLabel,
				showMaxLabel: true,
				alignMaxLabel: 'right',
				alignMinLabel: 'left',
				hideOverlap: true,
				// Always provide formatter to enable auto-formatting with units (like YAxisModel does)
				formatter: (value: unknown) => formatValue(value, x_fmt, value?.toString(), minMax)
			}
			// splitLine and axisLine already have correct defaults from YAxisModel (lines 239-240)
			// and respect user-provided x_axis_options
		} as XAXisOption;

		// For horizontal bars: y should have gridlines OFF, baseline ON (opposite of vertical chart defaults)
		// Build yAxis config from XAxisModel (category axis)
		// Use inverse: true so first category appears at top (matches expected behavior for desc sorting)
		const yAxisConfig = {
			...yAxisCategoryModel.axisConfig,
			type: 'category' as const,
			data: categories,
			inverse: true,
			// Add formatter for date grain labels (day of week, month of year, etc.)
			axisLabel: {
				...yAxisCategoryModel.axisConfig.axisLabel,
				formatter: effectiveYFmt
					? (value: unknown) =>
							formatValue(
								value,
								effectiveYFmt,
								value?.toString(),
								undefined,
								query.result?.columns?.find((c) => c.name === yColumnName)?.jsType,
								projectSettings.first_day_of_week
							)
					: undefined
			}
		} as YAXisOption;

		// Apply chart-level echarts_series_options to data series only (skip
		// references — same guardrail as ComboChart).
		const seriesOverrides = props.echarts_series_options;
		if (seriesOverrides) {
			for (const s of seriesConfigs) merge(s, seriesOverrides);
		}

		const baseOptions = {
			// Prevent data labels from appearing on hover
			axisPointer: {
				triggerEmphasis: hasDataLabels ? false : undefined
			},
			color: color_palette,
			legend: {
				show: false
			},
			xAxis: xAxisConfig,
			yAxis: yAxisConfig,
			series: [...seriesConfigs, ...referencesSeries],
			grid: {
				top: chartMarginPx + 8 + topPadding,
				left: chartMarginPx,
				right: chartMarginPx,
				// Matches ComboChart: reserve space for the x-axis title graphic only when
				// it's actually visible; otherwise labels-only fits in a tighter footer.
				// Labels margin bumped to 8 (was 6/8) so both branches include a touch more
				// air now that the baseline reads lighter.
				bottom: xAxisTitleModel.isTitleVisible
					? chartMarginPx + xAxisFontSize + 27
					: chartMarginPx + xAxisFontSize + 12
			},
			graphic: [xAxisTitleModel.axisTitleGraphic], // Uses CHART_MARGIN_PX (2) from constants
			tooltip: {
				trigger: 'axis',
				appendToBody: true,
				extraCssText: elevatedTooltipCss,
				formatter: (arg: unknown) => {
					if (!Array.isArray(arg) || !arg[0]) return '';

					type TooltipParam = {
						name?: string;
						value?: number | null;
						marker?: string;
						seriesName?: string;
						// When tooltip_fields is set, data items are emitted as
						// `{ value, extras }`; ECharts hands the whole item back.
						data?: number | null | { value?: number | null; extras?: Record<string, unknown> };
					};
					const params = arg as TooltipParam[];

					const rawCategory = params[0].name || '';
					// Format category (e.g., "1" -> "Mon" for day of week)
					const category = effectiveYFmt
						? formatValue(
								rawCategory,
								effectiveYFmt,
								rawCategory,
								undefined,
								query.result?.columns?.find((c) => c.name === yColumnName)?.jsType,
								projectSettings.first_day_of_week
							)
						: rawCategory;
					const tooltipTitle = `<span class="font-semibold">${escapeHtml(category)}</span>`;
					const xAxisTitle = xAxisTitleModel.title || xProcessed?.displayAlias || '';

					const tooltipRows = params
						.filter((p) => p.value !== null && p.value !== undefined)
						.flatMap((p) => {
							const formatted = formatValue(p.value, x_fmt, p.value?.toString(), minMax);
							const extras =
								p.data && typeof p.data === 'object' && !Array.isArray(p.data)
									? p.data.extras
									: undefined;
							const extraRows = renderTooltipExtras(processedTooltip.fields, extras);
							const primaryRow = seriesColumnName
								? `
								<div class="flex flex-row items-center gap-1">
									${p.marker}
									<span>${escapeHtml(p.seriesName ?? '')}</span>
								</div>
								<span class="text-right">${escapeHtml(formatted)}</span>
							`
								: `
								<span>${escapeHtml(xAxisTitle)}</span>
								<span class="text-right">${escapeHtml(formatted)}</span>
							`;
							return [primaryRow, ...extraRows];
						});

					return `
					<div class="flex flex-col">
						${tooltipTitle}
						<div class="grid grid-cols-[auto_auto] gap-x-4">
							${tooltipRows.join('')}
						</div>
					</div>
				`;
				}
			}
		};

		// Author-supplied raw ECharts overrides deep-merged last so partial
		// overrides win on a key-by-key basis without clobbering computed siblings.
		return props.echarts_options ? merge({}, baseOptions, props.echarts_options) : baseOptions;
	});

	let chart: EChartsInstance | undefined = $state(undefined);

	// Handle cross-filtering on chart element click
	$effect(() => {
		if (!chart || !crossFilterHelper.isEnabled()) return;

		const handleCrossFilterClick = (params: any) => {
			crossFilterHelper.handleChartClick(params);
		};

		chart.on('click', handleCrossFilterClick);

		return () => {
			chart?.off('click', handleCrossFilterClick);
		};
	});
</script>

<div
	class="flex w-full flex-col"
	class:h-full={!height}
	style:height={height ? `${height}px` : undefined}
>
	{#if title || subtitle}
		<ComponentTitle {title} {subtitle} {info} {info_link} {info_link_title} />
	{/if}

	<div class="relative z-0 flex min-h-0 flex-1 flex-col justify-end">
		{#if chart && legend && legend_location === 'top'}
			<CustomLegend chartInstance={chart} />
		{/if}

		<ECharts
			bind:chart
			class={cn('h-full w-full flex-1', !height && 'min-h-[215px]')}
			{options}
			group={props.connect_group}
		/>

		{#if chart && legend && legend_location === 'bottom'}
			<CustomLegend chartInstance={chart} />
		{/if}

		{#if loading}
			<div class="absolute top-2 right-2">
				<LoaderCircle class="text-muted-foreground h-4 w-4 animate-spin [animation-duration:1s]" />
			</div>
		{/if}

		<SamplingIndicator {isSampled} dataLength={data.length} totalCount={query.count} />
	</div>
</div>

<div class="hidden">
	{@render children?.()}
</div>
