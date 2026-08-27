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
	import { getDefaultConnection } from '../../../QueryService.context';
	import type { SQLProps } from '../../common/sql-options';
	import { extractSQLProps } from '../../common/sql-options';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { buildPieChartSQLConfig } from './build-pie-chart-sql';
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
	import { getMetricsCatalogContext } from '../../../metrics/metrics-catalog';
	import { resolveMetric, applyMetricDimension } from '../../../metrics/resolve-metric';
	import { setupCrossFilter } from '../../common/cross-filter.svelte';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	type Props = UserComponentProps<typeof schema> & SQLProps;

	const props: Props = $props();
	const height = $derived(props.height);
	const filterIds = $derived(props.filters);
	const inner_radius = $derived(props.inner_radius);
	const legend = $derived(props.legend);
	const legend_location = $derived(props.legend_location ?? 'top');
	const pct = $derived(props.pct);
	const pct_fmt = $derived(props.pct_fmt);
	const chart_options = $derived(props.chart_options);
	const color_palette = $derived(chart_options?.color_palette);
	const series_colors = $derived(chart_options?.series_colors);

	const hasValidationErrors = $derived(hasBlockingErrors());

	// Extract SQL props for non-variable processing (limit doesn't support variables)
	const { limit } = $derived.by(() => extractSQLProps(props));

	const connection = getDefaultConnection();
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
	// `metric="revenue"` supplies base + aggregate SQL + format; category flows
	// through unchanged (there's no view-level default slice dimension in v1).
	const metricsCatalog = getMetricsCatalogContext();
	const resolvedMetric = $derived(resolveText(props.metric));
	const metricCompiled = $derived(
		resolveMetric(metricsCatalog, resolvedMetric, connection.dialect)
	);
	const tableName = $derived(resolveText(props.data) ?? metricCompiled?.base);
	// In metric mode, resolve dimension attrs against the view's named
	// dimensions — `category="product"` → `product_line` when the view
	// declares `dimensions: { product: product_line }`. Raw columns pass
	// through unchanged. `applyMetricDimension` is a no-op in raw mode.
	const category = $derived(applyMetricDimension(metricCompiled, resolveColumn(props.category)));
	const value = $derived(resolveColumn(props.value) ?? metricCompiled?.valueExpression ?? '');
	const value_fmt = $derived(props.value_fmt ?? metricCompiled?.columnFormats[metricCompiled.name]);
	const title = $derived(resolveText(props.title) || '');
	const subtitle = $derived(resolveText(props.subtitle) || '');
	const info = $derived(resolveText(props.info) || '');
	const info_link = $derived(resolveText(props.info_link) || '');
	const info_link_title = $derived(resolveText(props.info_link_title) || '');
	const where = $derived(resolveSql(props.where));
	const having = $derived(resolveSql(props.having));
	const order = $derived(resolveSql(props.order));
	const qualify = $derived(resolveSql(props.qualify));
	const resolvedDateRange = $derived(resolveText(props.date_range));
	const resolvedTooltipFields = $derived(
		resolveText(props.tooltip_fields) as TooltipField[] | undefined
	);
	const processedTooltip = $derived(
		resolveTooltipFields(resolvedTooltipFields, connection.dialect)
	);

	// Process columns using the new system (after variable interpolation)
	const categoryProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: category
			},
			connection.dialect
		);
	});

	const valueProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: value
			},
			connection.dialect
		);
	});

	// Extract column aliases for use in chart rendering
	const categoryColumn = $derived(categoryProcessed.alias);
	const valueColumn = $derived(valueProcessed.alias);

	const cross_filter = $derived(props.cross_filter);
	const cross_filter_column = $derived(resolveColumn(props.cross_filter_column));
	const cross_filter_multiple = $derived(props.cross_filter_multiple ?? false);

	const crossFilterHelper = $derived.by(() => {
		return setupCrossFilter({
			chart: () => chart,
			pageFilters,
			crossFilter: cross_filter,
			crossFilterColumn: cross_filter_column ?? category,
			crossFilterMultiple: cross_filter_multiple,
			id: props.id
		});
	});

	const effectiveFilterIds = $derived.by(() => {
		const fIds = filterIds ?? [];
		if (crossFilterHelper.isEnabled()) {
			const selfId = crossFilterHelper.filterId();
			if (selfId) {
				return fIds.filter((id) => id !== selfId);
			}
		}
		return fIds;
	});

	const queryConfig = $derived.by(() => {
		if (hasValidationErrors || !tableName) {
			return;
		}

		return buildPieChartSQLConfig({
			data: tableName,
			category,
			value,
			filters: effectiveFilterIds,
			where,
			date_range: resolvedDateRange,
			having,
			qualify,
			order,
			limit,
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
		return queryInfoContext?.registerQuery(componentId, 'pie_chart', query, title);
	});

	$effect(() => {
		setError(query.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	// Transform data for standard ECharts pie series. When tooltip_fields
	// is set we tuck raw extras values on each data item so the tooltip
	// formatter can read them without a second lookup.
	const pieData = $derived.by(() => {
		const fields = processedTooltip.fields;
		return (data as DataPoint[]).map((row) => {
			const name = String(row[categoryColumn] ?? 'null');
			const seriesColor = series_colors?.[name];
			const extras = extractTooltipExtras(row, fields);
			return {
				name,
				value: Number(row[valueColumn]) || 0,
				...(seriesColor && { itemStyle: { color: seriesColor } }),
				...(extras && { extras })
			};
		});
	});

	const loading: boolean = $derived(query.loading);

	// Determine if server-side sampling was applied
	const isSampled = $derived(Boolean(query.samplingForced));

	// Calculate outer radius based on longest label length when labels are shown outside
	// This prevents labels from being cut off or showing only ellipses
	const outerRadius = $derived.by(() => {
		// When legend is enabled, labels are centered so we can use max radius
		if (legend) return '70%';

		// Find the longest label, accounting for percentage text if pct is enabled
		// When pct is true, labels are two lines: name on first, percentage on second
		// We need to consider the max width of either line
		const maxLabelLength = pieData.reduce((max, item) => {
			let labelLength = item.name.length;

			if (pct) {
				// Estimate percentage label length based on format
				// pct0 = "XX%" (3-4 chars), pct1 = "XX.X%" (5-6 chars), pct2 = "XX.XX%" (6-7 chars)
				const pctLength = pct_fmt === 'pct0' ? 4 : pct_fmt === 'pct2' ? 7 : 6;
				labelLength = Math.max(labelLength, pctLength);
			}

			return Math.max(max, labelLength);
		}, 0);

		// Base radius of 70%, reduce by ~1.5% per character over 8 characters
		// Clamp between 45% and 70% to keep the chart reasonable
		const baseRadius = 70;
		const charsOverThreshold = Math.max(0, maxLabelLength - 8);
		const reduction = charsOverThreshold * 1.5;
		const calculatedRadius = Math.max(45, Math.min(70, baseRadius - reduction));

		return `${calculatedRadius}%`;
	});

	const baseOptions = $derived<EChartsOption>({
		tooltip: {
			trigger: 'item',
			// Same shape combo_chart uses: bold category header, then a
			// 2-column grid of `<span>label</span><span>value</span>` rows.
			// Extras from tooltip_fields slot straight into the same grid.
			formatter(params) {
				const param = Array.isArray(params) ? params[0] : params;
				const value = typeof param.value === 'number' ? param.value : Number(param.value) || 0;
				const formattedValue = formatValue(value, value_fmt, value.toString());
				const percentage = param.percent;
				const extras = (param.data as { extras?: Record<string, unknown> } | undefined)?.extras;
				const extraRows = renderTooltipExtras(processedTooltip.fields, extras);
				return `
					<div class="flex flex-col">
						<span class="font-semibold">${escapeHtml(param.name)}</span>
						<div class="grid grid-cols-[auto_auto] gap-x-4">
							<span>${escapeHtml(valueProcessed.displayAlias)}</span>
							<span class="text-right">${escapeHtml(formattedValue)} (${percentage}%)</span>
							${extraRows.join('')}
						</div>
					</div>
				`;
			}
		},
		color: color_palette,
		legend: {
			show: false,
			// Enable legend data so selection state can be managed
			data: pieData.map((item) => item.name)
		},
		series: [
			{
				name: categoryColumn,
				type: 'pie',
				radius: [inner_radius, outerRadius],
				center: ['50%', '50%'],
				avoidLabelOverlap: true,
				label: {
					show: !legend,
					position: !legend ? 'outside' : 'center',
					formatter: !legend
						? pct
							? (params) => {
									const percent = Array.isArray(params) ? params[0].percent : params.percent;
									const formattedPct = formatValue(percent / 100, pct_fmt, `${percent}%`);
									return `${params.name}\n${formattedPct}`;
								}
							: '{b}'
						: '',
					textBorderColor: 'transparent',
					textBorderWidth: 0,
					textShadowColor: 'transparent',
					textShadowBlur: 0
				},
				labelLayout: {
					hideOverlap: true
				},
				emphasis: {
					scaleSize: 1.5,
					label: {
						textBorderColor: 'transparent',
						textBorderWidth: 0,
						textShadowColor: 'transparent',
						textShadowBlur: 0
					}
				},
				labelLine: {
					show: !legend,
					length: 10,
					length2: 10
				},
				data: pieData
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

	// Cross-filtering click listener
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
