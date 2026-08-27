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
	import { buildTreemapSQLConfig } from './build-treemap-sql';
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
	import { setupCrossFilter } from '../../common/cross-filter.svelte';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	type Props = UserComponentProps<typeof schema> & SQLProps;

	const props: Props = $props();
	const height = $derived(props.height);
	const value_fmt = $derived(props.value_fmt);
	const filterIds = $derived(props.filters);
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
	// `metric="revenue"` supplies base + aggregate SQL + format; the component
	// keeps supplying category/group. `resolveMetric` returns undefined for the
	// raw path so the fallbacks preserve existing behaviour.
	const metricsCatalog = getMetricsCatalogContext();
	const resolvedMetric = $derived(resolveText(props.metric));
	const metricCompiled = $derived(
		resolveMetric(metricsCatalog, resolvedMetric, connection.dialect)
	);
	const resolvedTableName = $derived(metricCompiled?.base ?? resolveText(props.data));
	const resolvedCategory = $derived(
		applyMetricDimension(metricCompiled, resolveColumn(props.category))
	);
	const resolvedGroup = $derived(applyMetricDimension(metricCompiled, resolveColumn(props.group)));
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
	const categoryProcessed = $derived.by(() => {
		return processColumnExpression({ value: resolvedCategory }, connection.dialect);
	});

	const groupProcessed = $derived.by(() => {
		if (!resolvedGroup) return null;
		return processColumnExpression({ value: resolvedGroup }, connection.dialect);
	});

	const valueProcessed = $derived.by(() => {
		return processColumnExpression({ value: resolvedValue ?? '' }, connection.dialect);
	});

	// Extract column aliases for use in chart rendering
	const categoryColumn = $derived(categoryProcessed.alias);
	const groupColumn = $derived(groupProcessed?.alias ?? null);
	const valueColumn = $derived(valueProcessed.alias);

	const cross_filter = $derived(props.cross_filter);
	const cross_filter_column = $derived(resolveColumn(props.cross_filter_column));
	const cross_filter_multiple = $derived(props.cross_filter_multiple ?? false);

	const crossFilterHelper = $derived.by(() => {
		return setupCrossFilter({
			chart: () => chart,
			pageFilters,
			crossFilter: cross_filter,
			crossFilterColumn: cross_filter_column ?? resolvedCategory,
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
		if (hasValidationErrors) {
			return;
		}
		// Metric mode makes `data`/`value` optional in the schema — guard so we
		// never build a query with missing pieces. Validation surfaces the fix.
		if (!resolvedTableName || !resolvedValue) return;

		return buildTreemapSQLConfig({
			data: resolvedTableName,
			category: resolvedCategory,
			value: resolvedValue,
			group: resolvedGroup,
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
		return queryInfoContext?.registerQuery(componentId, 'treemap', query, title);
	});

	$effect(() => {
		setError(query.result?.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	// Transform rows into treemap nodes. Leaves carry `extras` (raw
	// tooltip_fields values) so the tooltip formatter can read them; group
	// nodes aggregate many rows and get none.
	const treemapData = $derived.by(() => {
		const rawData = data as DataPoint[];
		const tooltipFields = processedTooltip.fields;

		const buildLeaf = (row: DataPoint) => {
			const name = String(row[categoryColumn] ?? 'null');
			const seriesColor = series_colors?.[name];
			const extras = extractTooltipExtras(row, tooltipFields);
			return {
				name,
				value: Number(row[valueColumn]) || 0,
				...(seriesColor && { itemStyle: { color: seriesColor } }),
				...(extras && { extras })
			};
		};

		if (!groupColumn) {
			return rawData.map(buildLeaf);
		}

		const groups = new Map<string, ReturnType<typeof buildLeaf>[]>();
		rawData.forEach((row) => {
			const groupName = String(row[groupColumn] ?? 'null');
			const children = groups.get(groupName) ?? [];
			children.push(buildLeaf(row));
			groups.set(groupName, children);
		});

		return Array.from(groups, ([name, children]) => {
			const seriesColor = series_colors?.[name];
			return {
				name,
				children,
				...(seriesColor && { itemStyle: { color: seriesColor } })
			};
		});
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
			// Group nodes show their summed value; leaves also show any
			// tooltip_fields extras.
			formatter(params) {
				const param = Array.isArray(params) ? params[0] : params;
				const rawValue = typeof param.value === 'number' ? param.value : Number(param.value) || 0;
				const formattedValue = formatValue(rawValue, effectiveValueFmt, rawValue.toString());
				const extras = (param.data as { extras?: Record<string, unknown> } | undefined)?.extras;
				const extraRows = renderTooltipExtras(processedTooltip.fields, extras);
				return `
					<div class="flex flex-col">
						<span class="font-semibold">${escapeHtml(param.name)}</span>
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
				type: 'treemap',
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				// A treemap is a static overview in a report: no zoom-on-click
				// or breadcrumb navigation, which read as broken interactions
				// inside a scrollable page.
				roam: false,
				nodeClick: false,
				breadcrumb: { show: false },
				label: {
					show: true,
					formatter: (params) => {
						if (!show_values) return params.name;
						const rawValue =
							typeof params.value === 'number' ? params.value : Number(params.value) || 0;
						return `${params.name}\n${formatValue(rawValue, effectiveValueFmt, rawValue.toString())}`;
					}
				},
				// When grouped, show the group name in a band above its children
				...(groupColumn && {
					upperLabel: {
						show: true,
						height: 22
					}
				}),
				itemStyle: {
					gapWidth: 2,
					borderWidth: groupColumn ? 2 : 0,
					borderColorSaturation: 0.5
				},
				emphasis: {
					focus: 'descendant'
				},
				data: treemapData
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
