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
	import { cn } from '../../../shadcn/utils';
	import { getQueryService } from '../../../QueryService.context';
	import type { SQLProps } from '../../common/sql-options';
	import { extractSQLProps } from '../../common/sql-options';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { buildSankeyChartSQLConfig } from './build-sankey-chart-sql';
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
	const value_fmt = $derived(props.value_fmt);
	const filterIds = $derived(props.filters);
	const node_labels = $derived(props.node_labels);
	const link_labels = $derived(props.link_labels);
	const node_align = $derived(props.node_align);
	const node_gap = $derived(props.node_gap);
	const node_width = $derived(props.node_width);
	const orient = $derived(props.orient);
	const sort = $derived(props.sort);
	const link_color = $derived(props.link_color);
	const outline_color = $derived(props.outline_color);
	const outline_width = $derived(props.outline_width);
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
	// `metric="revenue"` supplies base + aggregate SQL + format; the component
	// keeps supplying source/target.
	const metricsCatalog = getMetricsCatalogContext();
	const resolvedMetric = $derived(resolveText(props.metric));
	const metricCompiled = $derived(
		resolveMetric(metricsCatalog, resolvedMetric, queryService.dialect)
	);
	const resolvedTableName = $derived(metricCompiled?.base ?? resolveText(props.data));
	const resolvedSource = $derived(applyMetricDimension(metricCompiled, resolveColumn(props.source)));
	const resolvedTarget = $derived(applyMetricDimension(metricCompiled, resolveColumn(props.target)));
	const resolvedValue = $derived(metricCompiled?.valueExpression ?? resolveColumn(props.value));
	const resolvedPercent = $derived(resolveColumn(props.percent));
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

	// Process columns (with resolved variable values)
	const sourceProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: resolvedSource
			},
			queryService.dialect
		);
	});

	const targetProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: resolvedTarget
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

	const percentProcessed = $derived.by(() => {
		if (!resolvedPercent) return null;
		return processColumnExpression(
			{
				value: resolvedPercent
			},
			queryService.dialect
		);
	});

	// Extract column aliases for use in chart rendering
	const sourceColumn = $derived(sourceProcessed.alias);
	const targetColumn = $derived(targetProcessed.alias);
	const valueColumn = $derived(valueProcessed.alias);
	const percentColumn = $derived(percentProcessed?.alias ?? undefined);

	const queryConfig = $derived.by(() => {
		if (hasValidationErrors) {
			return;
		}
		if (!resolvedTableName || !resolvedValue) return;

		return buildSankeyChartSQLConfig({
			data: resolvedTableName,
			source: resolvedSource,
			target: resolvedTarget,
			value: resolvedValue,
			percent: resolvedPercent,
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
		return queryInfoContext?.registerQuery(componentId, 'sankey_chart', query, title);
	});

	$effect(() => {
		setError(query.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	// Transform data for Sankey diagram
	const sankeyData = $derived.by(() => {
		const rawData = data as DataPoint[];

		// Get all unique node names
		const nodeNames = new Set<string>();
		rawData.forEach((row) => {
			nodeNames.add(String(row[sourceColumn] ?? 'null'));
			nodeNames.add(String(row[targetColumn] ?? 'null'));
		});

		// Create node data with colors (you might want to add color palette logic here)
		const nodes = Array.from(nodeNames).map((name) => ({
			name,
			itemStyle: {
				borderColor: outline_color,
				borderWidth: outline_width
			}
		}));

		// Create link data. `extras` carries the raw tooltip_fields values
		// per link so the formatter can render them; nodes are aggregated
		// across many links and have no single source row, so they get no
		// extras (documented in the sankey_chart tooltip_fields example).
		const tooltipFields = processedTooltip.fields;
		const links = rawData.map((row) => ({
			source: String(row[sourceColumn] ?? 'null'),
			target: String(row[targetColumn] ?? 'null'),
			value: Number(row[valueColumn]) || 0,
			// Use provided percent if available, otherwise will be auto-calculated
			percent: percentColumn ? Number(row[percentColumn]) || 0 : undefined,
			extras: extractTooltipExtras(row, tooltipFields)
		}));

		// Auto-calculate percentages if not provided
		if (!percentColumn) {
			// Calculate total outgoing flow for each source node
			const sourceTotals: Record<string, number> = {};
			links.forEach((link) => {
				sourceTotals[link.source] = (sourceTotals[link.source] || 0) + link.value;
			});

			// Add calculated percentages (as decimal for formatValue)
			links.forEach((link) => {
				link.percent = sourceTotals[link.source] > 0 ? link.value / sourceTotals[link.source] : 0;
			});
		}

		return { nodes, links };
	});

	const loading: boolean = $derived(query.loading);

	// Determine if server-side sampling was applied
	const isSampled = $derived(Boolean(query.samplingForced));

	const baseOptions = $derived<EChartsOption>({
		tooltip: {
			trigger: 'item',
			// Same layout combo_chart uses: bold header + 2-col grid.
			// Nodes are aggregated across many links (no single source row),
			// so they render header + value only — no extras.
			// Links render header + value + any tooltip_fields extras.
			formatter(params: unknown) {
				const typedParams = params as {
					data: {
						name?: string;
						source?: string;
						target?: string;
						value: number;
						extras?: Record<string, unknown>;
					};
					value: number;
				};
				const isNode = Boolean(typedParams.data.name);
				const header = isNode
					? typedParams.data.name!
					: `${typedParams.data.source} → ${typedParams.data.target}`;
				const rawValue = isNode ? typedParams.value : typedParams.data.value;
				const formattedValue = formatValue(rawValue, effectiveValueFmt, rawValue.toString());
				const extraRows = isNode
					? []
					: renderTooltipExtras(processedTooltip.fields, typedParams.data.extras);
				return `
					<div class="flex flex-col">
						<span class="font-semibold">${escapeHtml(header)}</span>
						<div class="grid grid-cols-[auto_auto] gap-x-4">
							<span>${escapeHtml(valueProcessed.displayAlias)}</span>
							<span class="text-right">${escapeHtml(formattedValue)}</span>
							${extraRows.join('')}
						</div>
					</div>
				`;
			}
		},
		color: color_palette,
		series: [
			{
				type: 'sankey',
				layoutIterations: sort ? 32 : 0,
				left: '2%',
				top: '5%',
				width: '80%',
				bottom: '5%',
				nodeGap: node_gap,
				nodeWidth: node_width,
				nodeAlign: node_align as 'left' | 'right' | 'justify',
				orient: orient as 'horizontal' | 'vertical',
				emphasis: {
					focus: 'adjacency'
				},
				label: {
					show: ['name', 'value', 'full'].includes(node_labels || ''),
					position: orient === 'vertical' ? 'top' : 'right',
					fontSize: orient === 'vertical' ? 10.5 : 12,
					formatter: function (params: unknown) {
						const typedParams = params as { data: { name: string }; value: number };
						if (node_labels === 'name') {
							return typedParams.data.name;
						} else if (node_labels === 'value') {
							return formatValue(
								typedParams.value,
								effectiveValueFmt,
								typedParams.value.toString()
							);
						} else if (node_labels === 'full') {
							return `${typedParams.data.name} (${formatValue(typedParams.value, effectiveValueFmt, typedParams.value.toString())})`;
						}
						return '';
					}
				},
				edgeLabel: {
					show: ['value', 'percent', 'full'].includes(link_labels || ''),
					color: 'black',
					textBorderColor: 'white',
					textBorderWidth: 2,
					formatter: function (params: unknown) {
						const typedParams = params as { data: { value: number; percent?: number } };
						if (link_labels === 'value') {
							return formatValue(
								typedParams.data.value,
								effectiveValueFmt,
								typedParams.data.value.toString()
							);
						} else if (link_labels === 'percent') {
							return typedParams.data.percent !== undefined
								? formatValue(typedParams.data.percent, 'pct1', typedParams.data.percent.toString())
								: '';
						} else if (link_labels === 'full') {
							const valueStr = formatValue(
								typedParams.data.value,
								effectiveValueFmt,
								typedParams.data.value.toString()
							);
							const percentStr =
								typedParams.data.percent !== undefined
									? ` (${formatValue(typedParams.data.percent, 'pct1', typedParams.data.percent.toString())})`
									: '';
							return valueStr + percentStr;
						}
						return '';
					}
				},
				labelLayout: {
					hideOverlap: true
				},
				lineStyle: {
					color:
						link_color === 'source'
							? 'source'
							: link_color === 'target'
								? 'target'
								: link_color === 'gradient'
									? 'gradient'
									: link_color
				},
				data: sankeyData.nodes,
				links: sankeyData.links,
				animationDuration: 500
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
		<ECharts
			bind:chart
			class={cn('h-full w-full flex-1', !height && 'min-h-[215px]')}
			options={stableOptions}
			group={props.connect_group}
		/>

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
