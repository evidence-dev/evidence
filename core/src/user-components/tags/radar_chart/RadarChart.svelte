<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import ECharts from '../echarts/ECharts.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import SamplingIndicator from '../../common/SamplingIndicator.svelte';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import type { ECharts as EChartsInstance } from 'echarts';
	import CustomLegend from '../echarts/CustomLegend.svelte';
	import { cn } from '../../../shadcn/utils';
	import { getQueryService } from '../../../QueryService.context';
	import type { SQLProps } from '../../common/sql-options';
	import { extractSQLProps } from '../../common/sql-options';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { buildRadarChartSQLConfig } from './build-radar-chart-sql';
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
	import { getElevatedChartTooltipCss } from '../../common/chart-tooltip-elevation';
	import { resolveMetric, applyMetricDimension } from '../../../metrics/resolve-metric';
	import { getMetricsCatalogContext } from '../../../metrics/metrics-catalog';
	import { escapeHtml } from '../../common/tooltip-fields';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	type Props = UserComponentProps<typeof schema> & SQLProps;

	const props: Props = $props();
	const height = $derived(props.height);
	const series = $derived(props.series);
	const value_fmt = $derived(props.value_fmt);
	const filterIds = $derived(props.filters);
	// Legend defaults to true when series is provided, false otherwise
	const legend = $derived(props.legend ?? (series ? true : false));
	const legend_location = $derived(props.legend_location ?? 'top');
	const shape = $derived(props.shape);
	const fill = $derived(props.fill);
	const show_values = $derived(props.show_values);
	const chart_options = $derived(props.chart_options);
	const color_palette = $derived(chart_options?.color_palette);
	const series_colors = $derived(chart_options?.series_colors);

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
	// keeps supplying category/series.
	const metricsCatalog = getMetricsCatalogContext();
	const resolvedMetric = $derived(resolveText(props.metric));
	const metricCompiled = $derived(
		resolveMetric(metricsCatalog, resolvedMetric, queryService.dialect)
	);
	const resolvedTableName = $derived(metricCompiled?.base ?? resolveText(props.data));
	const resolvedCategory = $derived(applyMetricDimension(metricCompiled, resolveColumn(props.category)));
	const resolvedSeries = $derived(applyMetricDimension(metricCompiled, resolveColumn(props.series)));
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

	// Process columns using the new system (with resolved variable values)
	const categoryProcessed = $derived.by(() => {
		return processColumnExpression({ value: resolvedCategory }, queryService.dialect);
	});

	const seriesProcessed = $derived.by(() => {
		if (!resolvedSeries) return null;
		return processColumnExpression({ value: resolvedSeries }, queryService.dialect);
	});

	const valueProcessed = $derived.by(() => {
		return processColumnExpression({ value: resolvedValue ?? '' }, queryService.dialect);
	});

	// Extract column aliases for use in chart rendering
	const categoryColumn = $derived(categoryProcessed.alias);
	const seriesColumn = $derived(seriesProcessed?.alias ?? null);
	const valueColumn = $derived(valueProcessed.alias);

	const queryConfig = $derived.by(() => {
		if (hasValidationErrors) {
			return;
		}
		if (!resolvedTableName || !resolvedValue) return;

		return buildRadarChartSQLConfig({
			data: resolvedTableName,
			category: resolvedCategory,
			value: resolvedValue,
			series: resolvedSeries,
			filters: filterIds,
			where,
			date_range: resolvedDateRange,
			having,
			qualify,
			order,
			limit,
			dialect: queryService.dialect
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
		return queryInfoContext?.registerQuery(componentId, 'radar_chart', query, title);
	});

	$effect(() => {
		setError(query.result?.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	// Transform rows into one axis per category and one polygon per series
	const transformedData = $derived.by(() => {
		const rawData = data as DataPoint[];

		const categories = [...new Set(rawData.map((row) => String(row[categoryColumn] ?? 'null')))];

		const valuesFor = (rows: DataPoint[]) =>
			categories.map((category) => {
				const row = rows.find((r) => String(r[categoryColumn] ?? 'null') === category);
				return row ? Number(row[valueColumn]) || 0 : 0;
			});

		if (!seriesColumn) {
			return {
				categories,
				series: [{ name: valueProcessed.displayAlias, values: valuesFor(rawData) }]
			};
		}

		const seriesNames = [...new Set(rawData.map((row) => String(row[seriesColumn] ?? 'null')))];
		return {
			categories,
			series: seriesNames.map((seriesName) => ({
				name: seriesName,
				values: valuesFor(rawData.filter((r) => String(r[seriesColumn] ?? 'null') === seriesName))
			}))
		};
	});

	// All axes share one max so polygon shapes stay comparable. Round up to
	// a clean step so the grid rings land on round numbers.
	const indicatorMax = $derived.by(() => {
		if (props.max !== undefined) return props.max;
		const values = transformedData.series.flatMap((s) => s.values);
		const maxValue = Math.max(0, ...values);
		if (maxValue <= 0) return 1;
		const step = 10 ** Math.floor(Math.log10(maxValue)) / 10;
		return Math.ceil(maxValue / step) * step;
	});

	const loading: boolean = $derived(query.loading);

	// Determine if server-side sampling was applied
	const isSampled = $derived(Boolean(query.samplingForced));

	// Raises this chart's tooltip above the floating chat pane when rendered
	// inside it; '' (ECharts default) everywhere else.
	const elevatedTooltipCss = getElevatedChartTooltipCss();
	const baseOptions = $derived<EChartsOption>({
		radar: {
			indicator: transformedData.categories.map((name) => ({
				name,
				max: indicatorMax
			})),
			shape: shape as 'polygon' | 'circle',
			center: ['50%', '52%'],
			// Leave room around the grid so axis names aren't clipped
			radius: '62%',
			axisName: {
				fontSize: transformedData.categories.length > 10 ? 10 : 12,
				formatter: (value?: string) => {
					if (value && value.length > 20) {
						return value.substring(0, 20) + '...';
					}
					return value ?? '';
				}
			}
		},
		color: color_palette,
		legend: {
			show: false,
			// Enable legend data so selection state can be managed
			data: transformedData.series.map((s) => s.name)
		},
		tooltip: {
			trigger: 'item',
			// Render on <body> so the tooltip isn't clipped by the chart
			// wrapper's overflow-hidden (matches combo/horizontal_bar/candlestick).
			appendToBody: true,
			extraCssText: elevatedTooltipCss,
			// Same layout combo_chart uses: bold header (series name) +
			// 2-col grid with one row per radar axis.
			formatter(params) {
				const param = Array.isArray(params) ? params[0] : params;
				const values = Array.isArray(param.value) ? (param.value as number[]) : [];
				const rows = transformedData.categories.map((category, i) => {
					const rawValue = Number(values[i]) || 0;
					const formattedValue = formatValue(rawValue, effectiveValueFmt, rawValue.toString());
					return `<span>${escapeHtml(category)}</span><span class="text-right">${escapeHtml(formattedValue)}</span>`;
				});
				return `
					<div class="flex flex-col">
						<span class="font-semibold">${escapeHtml(param.name)}</span>
						<div class="grid grid-cols-[auto_auto] gap-x-4">
							${rows.join('')}
						</div>
					</div>
				`;
			}
		},
		series: [
			{
				type: 'radar',
				emphasis: {
					focus: 'self'
				},
				label: {
					show: show_values,
					formatter: (params) => {
						const rawValue = Number(params.value) || 0;
						return formatValue(rawValue, effectiveValueFmt, rawValue.toString());
					}
				},
				labelLayout: {
					hideOverlap: true
				},
				data: transformedData.series.map((seriesItem) => {
					const seriesColor = series_colors?.[seriesItem.name];
					return {
						name: seriesItem.name,
						value: seriesItem.values,
						symbolSize: 4,
						...(fill && { areaStyle: { opacity: 0.2 } }),
						...(seriesColor && {
							itemStyle: { color: seriesColor },
							lineStyle: { color: seriesColor }
						})
					};
				})
			}
		],
		animation: true,
		animationDuration: 800,
		animationEasing: 'cubicInOut'
	});

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
			<CustomLegend chartInstance={chart} legendMode="datapoints" />
		{/if}

		<ECharts
			bind:chart
			class={cn('h-full w-full flex-1', !height && 'min-h-[215px]')}
			options={stableOptions}
			group={props.connect_group}
		/>

		{#if chart && legend && legend_location === 'bottom'}
			<CustomLegend chartInstance={chart} legendMode="datapoints" />
		{/if}

		<div class="absolute top-2 right-2">
			<LoaderCircle
				class="text-muted-foreground animate-spin [animation-duration:1s] {loading
					? 'opacity-100'
					: 'opacity-0'} h-4 w-4 transition-opacity duration-500"
			/>
		</div>

		<SamplingIndicator {isSampled} dataLength={data.length} totalCount={query.count} />
	</div>
</div>
