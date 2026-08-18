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
	import { buildPolarChartSQLConfig } from './build-polar-chart-sql';
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
	import {
		resolveTooltipFields,
		extractTooltipExtras,
		escapeHtml,
		renderTooltipExtras,
		type TooltipField
	} from '../../common/tooltip-fields';
	import { resolveMetric, applyMetricDimension } from '../../../metrics/resolve-metric';
	import { getMetricsCatalogContext } from '../../../metrics/metrics-catalog';

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
	const stack = $derived(props.stack);
	const chart_options = $derived(props.chart_options);
	const color_palette = $derived(chart_options?.color_palette);

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
	// `metric="revenue"` supplies base + aggregate SQL + format; component
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
	const resolvedTooltipFields = $derived(
		resolveText(props.tooltip_fields) as TooltipField[] | undefined
	);
	const processedTooltip = $derived(
		resolveTooltipFields(resolvedTooltipFields, queryService.dialect)
	);

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

		return buildPolarChartSQLConfig({
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
		return queryInfoContext?.registerQuery(componentId, 'polar_chart', query, title);
	});

	$effect(() => {
		setError(query.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	// Transform data for polar bar chart
	// Polar bars need per-position values keyed by category (and optional
	// series). Emit `{ value, extras }` per bar so the tooltip formatter can
	// read the source row's tooltip_fields via `params.data.extras` — without
	// extras we stay on the bare `number` form ECharts expects.
	const transformedData = $derived.by(() => {
		const rawData = data as DataPoint[];
		const tooltipFields = processedTooltip.fields;
		const hasExtras = tooltipFields.length > 0;

		const categories = [...new Set(rawData.map((row) => String(row[categoryColumn] ?? 'null')))];

		const buildBar = (row: DataPoint | undefined) => {
			const v = row ? Number(row[valueColumn]) || 0 : 0;
			if (!hasExtras) return v;
			return { value: v, extras: row ? extractTooltipExtras(row, tooltipFields) : undefined };
		};

		if (!seriesColumn) {
			const seriesValues = categories.map((category) =>
				buildBar(rawData.find((r) => String(r[categoryColumn] ?? 'null') === category))
			);
			return {
				categories,
				series: [{ name: valueProcessed.displayAlias, data: seriesValues }]
			};
		}

		const seriesNames = [...new Set(rawData.map((row) => String(row[seriesColumn] ?? 'null')))];
		const seriesData = seriesNames.map((seriesName) => ({
			name: seriesName,
			data: categories.map((category) =>
				buildBar(
					rawData.find(
						(r) =>
							String(r[categoryColumn] ?? 'null') === category &&
							String(r[seriesColumn] ?? 'null') === seriesName
					)
				)
			)
		}));

		return { categories, series: seriesData };
	});

	const loading: boolean = $derived(query.loading);

	// Determine if server-side sampling was applied
	const isSampled = $derived(Boolean(query.samplingForced));

	const baseOptions = $derived<EChartsOption>({
		radiusAxis: {
			axisTick: { show: false },
			axisLabel: { show: false }
		},
		polar: {
			radius: ['5%', '80%'] // Add inner and outer radius to provide more space for labels
		},
		angleAxis: {
			type: 'category',
			data: transformedData.categories,
			axisLine: { show: false }, // optional: hides the circular axis line
			axisTick: { show: false, alignWithLabel: false },
			axisLabel: {
				show: true,
				// Automatically handle overlapping labels
				interval: 'auto',
				// Rotate labels if there are many categories
				rotate: transformedData.categories.length > 8 ? 45 : 0,
				// Allow longer labels with more generous truncation
				formatter: (value: string) => {
					if (value.length > 20) {
						return value.substring(0, 20) + '...';
					}
					return value;
				},
				// Adjust font size based on number of categories
				fontSize: transformedData.categories.length > 10 ? 10 : 12,
				// Add some margin from the chart to prevent overlap
				margin: 6
			},
			splitLine: {
				show: true, // Force this to override theme
				lineStyle: {
					color: '#999', // or any line color you want
					width: 1,
					type: 'solid'
				}
			},
			z: 100
		},
		color: color_palette,
		series: transformedData.series.map((seriesItem) => ({
			type: 'bar',
			data: seriesItem.data,
			coordinateSystem: 'polar',
			name: seriesItem.name,
			stack: stack ? 'a' : undefined,
			barCategoryGap: '0%',
			emphasis: {
				focus: 'series' as const
			}
		})),
		legend: {
			show: false,
			// Enable legend data so selection state can be managed
			data: transformedData.series.map((s) => s.name)
		},
		tooltip: {
			show: true,
			trigger: 'item',
			// Same layout combo_chart uses: bold header (series name) +
			// 2-col grid with category as the value row's label, plus any
			// tooltip_fields extras.
			formatter(params) {
				const param = Array.isArray(params) ? params[0] : params;
				const rawValue =
					typeof param.value === 'number'
						? param.value
						: (param.data as { value?: number } | undefined)?.value ?? (Number(param.value) || 0);
				const formattedValue = formatValue(rawValue, effectiveValueFmt, rawValue.toString());
				const category = transformedData.categories[param.dataIndex];
				const extras = (param.data as { extras?: Record<string, unknown> } | undefined)?.extras;
				const extraRows = renderTooltipExtras(processedTooltip.fields, extras);
				return `
					<div class="flex flex-col">
						<span class="font-semibold">${escapeHtml(String(param.seriesName))}</span>
						<div class="grid grid-cols-[auto_auto] gap-x-4">
							<span>${escapeHtml(category)}</span>
							<span class="text-right">${escapeHtml(formattedValue)}</span>
							${extraRows.join('')}
						</div>
					</div>
				`;
			}
		},
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

	// Debug: Check if chart is ready and container size
	$effect(() => {
		if (chart && ready) {
			// Try forcing a resize to fix potential layout issues
			setTimeout(() => {
				if (chart && !chart.isDisposed()) {
					chart.resize();
				}
			}, 100);
		}
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
			<CustomLegend chartInstance={chart} legendMode="series" />
		{/if}

		<ECharts
			bind:chart
			class={cn('h-full w-full flex-1', !height && 'min-h-[215px]')}
			options={stableOptions}
			group={props.connect_group}
		/>

		{#if chart && legend && legend_location === 'bottom'}
			<CustomLegend chartInstance={chart} legendMode="series" />
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
