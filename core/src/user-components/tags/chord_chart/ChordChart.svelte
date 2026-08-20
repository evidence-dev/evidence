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
	import { getDefaultConnection } from '../../../QueryService.context';
	import type { SQLProps } from '../../common/sql-options';
	import { extractSQLProps } from '../../common/sql-options';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { buildChordChartSQLConfig } from './build-chord-chart-sql';
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
	const labels = $derived(props.labels);
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
	// `metric="revenue"` supplies base + aggregate SQL + format; component keeps
	// supplying source/target.
	const metricsCatalog = getMetricsCatalogContext();
	const resolvedMetric = $derived(resolveText(props.metric));
	const metricCompiled = $derived(
		resolveMetric(metricsCatalog, resolvedMetric, connection.dialect)
	);
	const resolvedTableName = $derived(metricCompiled?.base ?? resolveText(props.data));
	const resolvedSource = $derived(
		applyMetricDimension(metricCompiled, resolveColumn(props.source))
	);
	const resolvedTarget = $derived(
		applyMetricDimension(metricCompiled, resolveColumn(props.target))
	);
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
		resolveTooltipFields(resolvedTooltipFields, connection.dialect)
	);

	// Process columns using the new system (with resolved variable values)
	const sourceProcessed = $derived.by(() => {
		return processColumnExpression({ value: resolvedSource }, connection.dialect);
	});

	const targetProcessed = $derived.by(() => {
		return processColumnExpression({ value: resolvedTarget }, connection.dialect);
	});

	const valueProcessed = $derived.by(() => {
		return processColumnExpression({ value: resolvedValue ?? '' }, connection.dialect);
	});

	// Extract column aliases for use in chart rendering
	const sourceColumn = $derived(sourceProcessed.alias);
	const targetColumn = $derived(targetProcessed.alias);
	const valueColumn = $derived(valueProcessed.alias);

	const queryConfig = $derived.by(() => {
		if (hasValidationErrors) {
			return;
		}
		if (!resolvedTableName || !resolvedValue) return;

		return buildChordChartSQLConfig({
			data: resolvedTableName,
			source: resolvedSource,
			target: resolvedTarget,
			value: resolvedValue,
			filters: filterIds,
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
		return queryInfoContext?.registerQuery(componentId, 'chord_chart', query, title);
	});

	$effect(() => {
		setError(query.result?.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	// Transform data for the chord diagram. `extras` carries the raw
	// tooltip_fields values per link so the formatter can render them; nodes
	// aggregate many links and have no single source row, so they get none.
	const chordData = $derived.by(() => {
		const rawData = data as DataPoint[];

		const nodeNames = new Set<string>();
		rawData.forEach((row) => {
			nodeNames.add(String(row[sourceColumn] ?? 'null'));
			nodeNames.add(String(row[targetColumn] ?? 'null'));
		});

		const nodes = Array.from(nodeNames).map((name) => {
			const seriesColor = series_colors?.[name];
			return {
				name,
				...(seriesColor && { itemStyle: { color: seriesColor } })
			};
		});

		const tooltipFields = processedTooltip.fields;
		const links = rawData.map((row) => ({
			source: String(row[sourceColumn] ?? 'null'),
			target: String(row[targetColumn] ?? 'null'),
			value: Number(row[valueColumn]) || 0,
			extras: extractTooltipExtras(row, tooltipFields)
		}));

		return { nodes, links };
	});

	const loading: boolean = $derived(query.loading);

	// Determine if server-side sampling was applied
	const isSampled = $derived(Boolean(query.samplingForced));

	// Raises this chart's tooltip above the floating chat pane when rendered
	// inside it; '' (ECharts default) everywhere else.
	const elevatedTooltipCss = getElevatedChartTooltipCss();
	const baseOptions = $derived<EChartsOption>({
		tooltip: {
			trigger: 'item',
			// Render on <body> so the tooltip isn't clipped by the chart
			// wrapper's overflow-hidden (matches combo/horizontal_bar/candlestick).
			appendToBody: true,
			extraCssText: elevatedTooltipCss,
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
						value?: number;
						extras?: Record<string, unknown>;
					};
					value: number;
				};
				// Identify links by their source/target fields rather than a
				// truthy name — an empty-string node name would misclassify.
				const isNode = typedParams.data.source === undefined;
				const header = isNode
					? (typedParams.data.name ?? '')
					: `${typedParams.data.source} → ${typedParams.data.target}`;
				const rawValue = isNode ? Number(typedParams.value) || 0 : (typedParams.data.value ?? 0);
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
				type: 'chord',
				center: ['50%', '50%'],
				// Leave room around the circle so outside labels aren't clipped
				radius: ['58%', '68%'],
				label: {
					show: labels,
					position: 'outside',
					formatter: (params: { name?: string }) => {
						const name = params.name ?? '';
						if (name.length > 20) {
							return name.substring(0, 20) + '...';
						}
						return name;
					}
				},
				// Many nodes crowd the circle; drop labels that would collide
				// rather than overprint them (same policy sankey uses).
				labelLayout: {
					hideOverlap: true
				},
				emphasis: {
					focus: 'adjacency'
				},
				data: chordData.nodes,
				links: chordData.links
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
			class={cn('h-full w-full flex-1', !height && 'min-h-[250px]')}
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
