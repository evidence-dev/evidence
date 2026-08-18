<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import type { TopLevelFormatterParams } from 'echarts/types/dist/shared';
	import ECharts from '../echarts/ECharts.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import SamplingIndicator from '../../common/SamplingIndicator.svelte';
	import CustomLegend from '../echarts/CustomLegend.svelte';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import type { ECharts as EChartsInstance } from 'echarts';
	import { cn } from '../../../shadcn/utils';
	import { getQueryService } from '../../../QueryService.context';
	import type { SQLProps } from '../../common/sql-options';
	import { extractSQLProps } from '../../common/sql-options';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { buildCalendarHeatmapSQLConfig } from './build-calendar-heatmap-sql';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { Query } from '../../../Query.svelte';
	import { formatValue } from '../../formatValue';
	import type { DataPoint } from '../../types';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { getAutoRefreshContext } from '../../../auto-refresh.context.svelte';
	import { mergeEchartsOptions } from '../../common/echarts-options-attributes';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getPageSettingsContext } from '../../../page-settings.context';
	import {
		resolveTooltipFields,
		extractTooltipExtras,
		escapeHtml,
		renderTooltipExtras,
		type TooltipField
	} from '../../common/tooltip-fields';
	import { resolveDeprecatedAttribute } from '../../common/resolve-deprecated-attribute';
	import { resolveMetric } from '../../../metrics/resolve-metric';
	import { getMetricsCatalogContext } from '../../../metrics/metrics-catalog';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	// Get theme context for color scales
	const themeContext = getThemeContext();
	const pageSettings = getPageSettingsContext();

	const calendarBackgroundColor = $derived.by(() => {
		const theme = themeContext.activeTheme;
		return pageSettings().cards && theme.card ? theme.card.background : theme.background;
	});

	type Props = UserComponentProps<typeof schema> & SQLProps;

	const props: Props = $props();
	const value_fmt = $derived(props.value_fmt);
	const filterIds = $derived(props.filters ?? []);
	const legend = $derived(props.legend ?? true);
	const borders = $derived(props.borders ?? true);
	const chart_options = $derived(props.chart_options);
	// `color_palette` is the deprecated alias for `color_scale`; both feed the
	// same gradient. Resolver warns (dev only) if authors are still using the
	// old name and prefers the new one when both are set.
	const color_scale = $derived(
		resolveDeprecatedAttribute({
			preferred: chart_options?.color_scale,
			deprecated: chart_options?.color_palette,
			preferredName: 'color_scale',
			deprecatedName: 'color_palette',
			componentName: 'calendar_heatmap'
		})
	);
	const conditional_colors = $derived(chart_options?.conditional_colors);
	const color_map = $derived(chart_options?.color_map);

	// Route the inline `color_scale` through the theme helper so a single-color
	// value (e.g. `color_scale=["#f99"]`) gets [background, color] expansion —
	// reads as a gradient anchored on the surface behind the chart instead of
	// every cell rendering the same flat color. Multi-color values pass through
	// untouched.
	const effectiveColorScale = $derived(
		themeContext.getBackgroundAdjustedColorScale(pageSettings().cards, color_scale)
	);

	const hasValidationErrors = $derived(hasBlockingErrors());

	// Extract SQL props in a centralized way
	const {
		where: rawWhere,
		having,
		limit,
		order,
		qualify
	} = $derived.by(() => extractSQLProps(props));

	const queryService = getQueryService();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	// === VARIABLE INTERPOLATION ===
	// 1. Create VariableProcessor
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	// 2. Create resolvers (same API as Model classes)
	const { resolveText, resolveColumn, resolveSql } = $derived(createResolvers(variableProcessor));

	// 3. Resolve props using appropriate resolver for each type
	// `metric="revenue"` supplies base + aggregate SQL + format; the component
	// keeps supplying the date column.
	const metricsCatalog = getMetricsCatalogContext();
	const resolvedMetric = $derived(resolveText(props.metric));
	const metricCompiled = $derived(
		resolveMetric(metricsCatalog, resolvedMetric, queryService.dialect)
	);
	const resolvedTableName = $derived(metricCompiled?.base ?? resolveText(props.data));
	const resolvedDate = $derived(resolveColumn(props.date));
	const resolvedValue = $derived(metricCompiled?.valueExpression ?? resolveColumn(props.value));
	const title = $derived(resolveText(props.title) ?? '');
	const subtitle = $derived(resolveText(props.subtitle) ?? '');
	const info = $derived(resolveText(props.info) ?? '');
	const info_link = $derived(resolveText(props.info_link) ?? '');
	const info_link_title = $derived(resolveText(props.info_link_title) ?? '');
	const where = $derived(resolveSql(props.where) ?? rawWhere);
	const effectiveValueFmt = $derived(
		resolveText(props.value_fmt) ??
			value_fmt ??
			(metricCompiled ? metricCompiled.columnFormats[metricCompiled.name] : undefined) ??
			'num'
	);
	// Process entire date_range object - recursively handles date and range properties
	const resolvedDateRange = $derived(resolveText(props.date_range) ?? props.date_range);
	const resolvedTooltipFields = $derived(
		resolveText(props.tooltip_fields) as TooltipField[] | undefined
	);
	const processedTooltip = $derived(
		resolveTooltipFields(resolvedTooltipFields, queryService.dialect)
	);

	// Process columns using the new system (with resolved variable values)
	const dateProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: resolvedDate
			},
			queryService.dialect
		);
	});

	const valueProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: resolvedValue ?? ''
			},
			queryService.dialect
		);
	});

	const conditionalColorsProcessed = $derived.by(() => {
		if (!conditional_colors) return null;
		return processColumnExpression(
			{
				value: conditional_colors
			},
			queryService.dialect
		);
	});

	// Extract column aliases for use in chart rendering
	const dateColumn = $derived.by(() => dateProcessed.alias);
	const valueColumn = $derived.by(() => valueProcessed.alias);
	const colorColumn = $derived.by(() => conditionalColorsProcessed?.alias);

	// Make sure query execution is reactive to all prop changes
	const queryConfig = $derived.by(() => {
		if (hasValidationErrors) {
			return;
		}
		if (!resolvedTableName || !resolvedValue) return;

		return buildCalendarHeatmapSQLConfig({
			data: resolvedTableName,
			date: resolvedDate,
			value: resolvedValue,
			conditional_colors: conditional_colors,
			filters: filterIds,
			where,
			having,
			qualify,
			order,
			limit,
			date_range: resolvedDateRange,
			dialect: queryService.dialect,
			tooltipFieldColumns: processedTooltip.columns
		});
	});
	const autoRefreshCtx = getAutoRefreshContext();
	const query = new Query(
		() => queryConfig,
		{
			queryService,
			filterContexts: [repeatFilters, pageFilters],
			inlineQueries,
			projectSettings: getProjectSettingsContext(),
			defaultRefreshInterval: () => autoRefreshCtx?.intervalSeconds ?? 0
		},
		{ refreshInterval: () => props.refresh_interval }
	);

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'calendar_heatmap', query, title);
	});

	$effect(() => {
		setError(query.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	// Transform data for calendar heatmap
	const calendarData = $derived.by(() => {
		if (!data || data.length === 0) {
			return { data: [], minValue: 0, maxValue: 0, years: [] };
		}

		// Add year to each data point
		const updatedData = data
			.map((row: DataPoint) => {
				const dateValue = row[dateColumn];
				if (!dateValue) return null;
				return {
					...row,
					year: new Date(dateValue).getUTCFullYear()
				};
			})
			.filter((item): item is NonNullable<typeof item> => item !== null);

		// Get distinct years
		const distinctYears = [...new Set(updatedData.map((obj) => obj.year))];

		// Transform to appropriate format based on whether we have conditional colors
		const hasColors = colorColumn && data.some((row) => row[colorColumn]);

		const tooltipFields = processedTooltip.fields;
		const hasExtras = tooltipFields.length > 0;

		if (hasColors || hasExtras) {
			// Use object format with itemStyle for conditional colors and/or
			// extras for tooltip_fields. ECharts happily accepts extra keys
			// on data items and hands the whole item back on `params.data`.
			const transformedData = data
				.map((row: DataPoint) => {
					const dateStr = row[dateColumn];
					if (!dateStr) return null;
					const date = new Date(dateStr);
					if (isNaN(date.getTime())) return null;
					const val = Number(row[valueColumn]) || 0;
					const color = colorColumn && row[colorColumn] ? String(row[colorColumn]) : undefined;
					const extras = extractTooltipExtras(row, tooltipFields);
					return {
						value: [date.toISOString().split('T')[0], val] as [string, number],
						...(color ? { itemStyle: { color } } : {}),
						...(extras ? { extras } : {})
					};
				})
				.filter((item): item is NonNullable<typeof item> => item !== null)
				.sort((a, b) => a.value[0].localeCompare(b.value[0]));

			const values = transformedData.map((d) => d.value[1]);
			const minValue = values.length > 0 ? Math.min(...values) : 0;
			const maxValue = values.length > 0 ? Math.max(...values) : 100;

			return { data: transformedData, minValue, maxValue, years: distinctYears };
		} else {
			// Bare [date, value] tuple — fast path when neither conditional
			// colors nor tooltip_fields are in use.
			const transformedData = data
				.map((row: DataPoint) => {
					const dateStr = row[dateColumn];
					if (!dateStr) return null;
					const date = new Date(dateStr);
					if (isNaN(date.getTime())) return null;
					const val = Number(row[valueColumn]) || 0;
					return [date.toISOString().split('T')[0], val] as [string, number];
				})
				.filter((item): item is [string, number] => item !== null)
				.sort((a, b) => a[0].localeCompare(b[0]));

			const values = transformedData.map((d) => d[1]);
			const minValue = values.length > 0 ? Math.min(...values) : 0;
			const maxValue = values.length > 0 ? Math.max(...values) : 100;

			return { data: transformedData, minValue, maxValue, years: distinctYears };
		}
	});

	const loading: boolean = $derived(query.loading);

	// Determine if server-side sampling was applied
	const isSampled = $derived(Boolean(query.samplingForced));

	// Generate legend items from color_map when conditional colors are used
	const legendItems = $derived.by(() => {
		if (!colorColumn || !color_map || !data) return [];

		// Get unique colors from the data
		const uniqueColors = new Set<string>();
		data.forEach((row) => {
			const colorValue = row[colorColumn];
			if (colorValue) {
				uniqueColors.add(String(colorValue));
			}
		});

		// Map colors to labels using color_map (for CustomLegend format)
		return Array.from(uniqueColors)
			.map((color) => ({
				name: color_map[color] || color, // name is the display label
				color: color // color is the hex/color value
			}))
			.filter((item) => item.name); // Only include items with labels
	});

	// Calculate dynamic height
	const gridHeight = $derived(Math.max(100, calendarData.years.length * 135));
	const hasCustomLegend = $derived(legendItems.length > 0);
	// Add space for visualMap legend when not using custom legend
	const chartHeight = $derived(`${(legend && !hasCustomLegend ? 35 : 0) + gridHeight}px`);

	// Base calendar configuration
	const baseCalendarConfig = $derived({
		left: 40,
		right: 5,
		cellSize: ['auto' as const, 13],
		itemStyle: {
			color: calendarBackgroundColor,
			borderWidth: borders ? 0.5 : 0,
			// Track the themed border (what cards use) instead of the ECharts grey
			borderColor: themeContext.activeTheme.border
		},
		splitLine: {
			show: true
		},
		monthLabel: {
			show: true
		},
		dayLabel: {
			show: true
		},
		yearLabel: {
			show: true,
			fontSize: 16,
			fontWeight: 600,
			margin: 25
		}
	});

	// Generate calendar configurations for each year
	const calendarConfigs = $derived.by(() => {
		return calendarData.years.map((year, index) => ({
			...baseCalendarConfig,
			range: year.toString(),
			top: index * 135 + 25
		}));
	});

	// Generate series configurations for each year. Item shape depends on
	// whether conditional_colors OR tooltip_fields is set — the transform
	// above emits `{ value: [date, val], ... }` in that case and a bare
	// `[date, val]` tuple otherwise. Read the date defensively so either
	// shape works (also guards against transient undefined items during
	// re-renders).
	const seriesConfigs = $derived.by(() => {
		return calendarData.years.map((year, index) => ({
			type: 'heatmap' as const,
			coordinateSystem: 'calendar' as const,
			calendarIndex: index,
			data: calendarData.data.filter((item) => {
				const dateStr = Array.isArray(item)
					? item[0]
					: (item as { value?: [string, number] } | undefined)?.value?.[0];
				return typeof dateStr === 'string' && dateStr.startsWith(year.toString());
			}),
			label: {
				show: false
			}
		}));
	});

	// Mobile calendar configuration
	const mobileCalendarConfig = $derived({
		left: 40,
		right: 5,
		cellSize: ['auto' as const, 12],
		itemStyle: {
			color: calendarBackgroundColor,
			borderWidth: borders ? 0.5 : 0,
			// Track the themed border (what cards use) instead of the ECharts grey
			borderColor: themeContext.activeTheme.border
		},
		splitLine: {
			show: true
		},
		monthLabel: {
			show: true,
			fontSize: 10,
			formatter: function (param: { nameMap: string }) {
				return param.nameMap.substring(0, 1);
			}
		},
		dayLabel: {
			show: true,
			fontSize: 10,
			margin: 7
		},
		yearLabel: {
			show: true,
			fontWeight: 600,
			margin: 25,
			fontSize: 14
		}
	});

	// Enhanced chart options with Evidence styling
	const baseOptions = $derived<EChartsOption>({
		animation: false,
		grid: {
			height: gridHeight
		},
		tooltip: {
			trigger: 'item',
			showDelay: 0,
			transitionDuration: 0.2,
			confine: true,
			axisPointer: {
				type: 'shadow'
			},
			formatter: function (params: TopLevelFormatterParams) {
				const dataPoint = Array.isArray(params) ? params[0]?.data : params.data;
				if (!dataPoint) return '';

				let date: string;
				let value: number;
				let extras: Record<string, unknown> | undefined;

				if (Array.isArray(dataPoint)) {
					[date, value] = dataPoint as [string, number];
				} else if (typeof dataPoint === 'object' && 'value' in dataPoint) {
					const obj = dataPoint as { value: [string, number]; extras?: Record<string, unknown> };
					[date, value] = obj.value;
					extras = obj.extras;
				} else {
					return '';
				}

				const formattedValue = formatValue(value, effectiveValueFmt, value.toString());
				const extraRows = renderTooltipExtras(processedTooltip.fields, extras);

				// Same layout combo_chart uses: bold date header +
				// 2-col grid for the primary value row, plus any extras.
				return `
					<div class="flex flex-col">
						<span class="font-semibold">${escapeHtml(date)}</span>
						<div class="grid grid-cols-[auto_auto] gap-x-4">
							<span>${escapeHtml(valueProcessed.displayAlias)}</span>
							<span class="text-right">${escapeHtml(formattedValue)}</span>
							${extraRows.join('')}
						</div>
					</div>
				`;
			}
		},
		visualMap:
			colorColumn && data.some((row) => row[colorColumn])
				? {
						// Hide visualMap when using conditional colors
						show: false,
						min: calendarData.minValue,
						max: calendarData.maxValue
					}
				: {
						itemWidth: 10,
						show: legend,
						min: calendarData.minValue,
						max: calendarData.maxValue,
						calculable: false,
						orient: 'horizontal',
						left: 'center',
						bottom: 10,
						textStyle: {
							fontSize: 11
						},
						inRange: {
							color: effectiveColorScale
						},
						text: [
							formatValue(
								calendarData.maxValue,
								effectiveValueFmt,
								calendarData.maxValue.toString()
							),
							formatValue(
								calendarData.minValue,
								effectiveValueFmt,
								calendarData.minValue.toString()
							)
						],
						formatter: function (value: unknown) {
							const numValue = typeof value === 'number' ? value : Number(value) || 0;
							return formatValue(numValue, effectiveValueFmt, numValue.toString());
						}
					},
		calendar: calendarConfigs,
		series: seriesConfigs,
		media: [
			{
				query: { maxWidth: 400 },
				option: {
					calendar: calendarData.years.map(() => mobileCalendarConfig)
				}
			}
		]
	});

	// Stable options
	// Author escape hatches: deep-merge echarts_series_options into every
	// series entry, then echarts_options over the whole config (wins last).
	const options = $derived.by(() => mergeEchartsOptions(baseOptions, props));

	const ready = $derived(!query.loading);
	let stableOptions: EChartsOption = $state({});
	$effect(() => {
		if (ready) {
			stableOptions = options;
		}
	});

	let chart: EChartsInstance | undefined = $state(undefined);
</script>

<div class="flex h-full w-full flex-col">
	{#if title || subtitle}
		<ComponentTitle {title} {subtitle} {info} {info_link} {info_link_title} />
	{/if}

	<div class="relative z-0 flex min-h-0 flex-1 flex-col justify-end">
		<div class="w-full" style="height: {chartHeight}">
			<ECharts
				bind:chart
				class={cn('h-full w-full')}
				options={stableOptions}
				group={props.connect_group}
			/>
		</div>

		{#if hasCustomLegend}
			<CustomLegend legendMode="custom" customLegendData={legendItems} interactive={false} />
		{/if}

		<div class="absolute top-2 right-2">
			<LoaderCircle
				class="text-muted-foreground animation-duration-[1s] animate-spin {loading
					? 'opacity-100'
					: 'opacity-0'} h-4 w-4 transition-opacity duration-500"
			/>
		</div>

		<SamplingIndicator {isSampled} dataLength={data.length} totalCount={query.count} />
	</div>
</div>
