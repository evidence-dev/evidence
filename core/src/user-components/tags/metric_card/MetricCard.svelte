<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { formatValue } from '../../formatValue';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import Info from '../info/Info.svelte';
	import DeltaDisplay from '../delta/DeltaDisplay.svelte';
	import SparklineDisplay from '../sparkline/SparklineDisplay.svelte';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { extractSQLProps, type SQLProps } from '../../common/sql-options';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { getAutoRefreshContext } from '../../../auto-refresh.context.svelte';
	import { Query } from '../../../Query.svelte';
	import { cn } from '../../../shadcn/utils';
	import { browser } from '../../../shims/env';

	type Props = UserComponentProps<typeof schema> & SQLProps;

	const props: Props = $props();

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

	const {
		where: rawWhere,
		having,
		limit,
		order,
		qualify
	} = $derived.by(() => extractSQLProps(props));

	const variableProcessor = $derived.by(() => {
		if (!inlineQueries) return null;
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText, resolveColumn, resolveSql } = $derived(createResolvers(variableProcessor));

	const title = $derived(resolveText(props.title) ?? '');
	const subtitle = $derived(resolveText(props.subtitle) ?? '');
	const info = $derived(resolveText(props.info) ?? '');
	const valueProp = $derived(resolveColumn(props.value));
	const valueFmt = $derived(resolveText(props.value_fmt));
	const comparisonProp = $derived(resolveColumn(props.comparison));
	const comparisonText = $derived(resolveText(props.comparison_text) ?? 'vs. prior');
	const comparisonFmt = $derived(resolveText(props.comparison_fmt) ?? 'pct');
	const downIsGood = $derived(props.down_is_good ?? false);
	const badge = $derived(props.badge ?? true);
	const sparklineDate = $derived(resolveColumn(props.sparkline_date));
	const sparklineVal = $derived(resolveColumn(props.sparkline_value) ?? valueProp);
	const sparklineType = $derived(
		(props.sparkline_type ?? 'line') as 'line' | 'area' | 'bar'
	);
	const sparklineColor = $derived(props.sparkline_color);
	const link = $derived(resolveText(props.link));
	const where = $derived(resolveSql(rawWhere));
	const resolvedDateRange = $derived(resolveText(props.date_range) ?? props.date_range);

	// Build query config if a data table is provided
	const queryConfig = $derived.by(() => {
		if (hasValidationErrors || !props.data) return undefined;
		return {
			table: props.data,
			filters: props.filters,
			where,
			dateRange: resolvedDateRange,
			having,
			qualify,
			order,
			limit
		};
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
		return queryInfoContext?.registerQuery(componentId, 'metric_card', query, title);
	});

	$effect(() => {
		setError(query.error ?? undefined);
	});

	const rows = $derived(query.result?.rows ?? []);
	const loading = $derived(query.loading);

	// Extract primary metric value
	const rawValue = $derived.by(() => {
		if (typeof props.value === 'number') return props.value;
		if (rows.length === 0) return null;
		const col = valueProp ?? (rows[0] ? Object.keys(rows[0])[0] : undefined);
		if (!col) return null;
		// Latest row value
		return rows[rows.length - 1]?.[col];
	});

	const displayValue = $derived(
		rawValue !== null && rawValue !== undefined
			? formatValue(rawValue, valueFmt, String(rawValue))
			: '–'
	);

	// Extract comparison delta value
	const comparisonDelta = $derived.by(() => {
		if (typeof props.comparison === 'number' && typeof rawValue === 'number') {
			if (props.comparison === 0) return 0;
			return (rawValue - props.comparison) / props.comparison;
		}
		if (comparisonProp && rows.length > 0) {
			const compVal = rows[rows.length - 1]?.[comparisonProp];
			if (typeof compVal === 'number' && typeof rawValue === 'number') {
				if (compVal === 0) return 0;
				return (rawValue - compVal) / compVal;
			}
		}
		// If 2+ rows exist and no explicit comparison prop, compare last row to previous row
		if (rows.length >= 2 && valueProp) {
			const current = Number(rows[rows.length - 1]?.[valueProp]);
			const previous = Number(rows[rows.length - 2]?.[valueProp]);
			if (!isNaN(current) && !isNaN(previous) && previous !== 0) {
				return (current - previous) / previous;
			}
		}
		return null;
	});

	// Extract sparkline series data
	const sparklineData = $derived.by(() => {
		if (!sparklineDate || rows.length === 0) return null;
		const valCol = sparklineVal ?? valueProp;
		if (!valCol) return null;

		return rows
			.map((r: any) => {
				const x = r[sparklineDate];
				const y = Number(r[valCol]);
				if (x === undefined || isNaN(y)) return null;
				return [x instanceof Date ? x : String(x), y] as [string | Date, number];
			})
			.filter((pt): pt is [string | Date, number] => pt !== null);
	});

	setupRenderReadiness('metric_card', () => !loading);

	function handleClick() {
		if (link && browser) {
			window.location.href = link;
		}
	}
</script>

<div
	role={link ? 'link' : undefined}
	tabindex={link ? 0 : undefined}
	onclick={link ? handleClick : undefined}
	onkeydown={link ? (e) => e.key === 'Enter' && handleClick() : undefined}
	class={cn(
		'relative flex flex-col justify-between rounded-xl border bg-card p-4 text-card-foreground shadow-xs transition-all select-none',
		link ? 'cursor-pointer hover:border-primary/50 hover:shadow-md' : '',
		'min-w-[180px]'
	)}
>
	<!-- Header: Title, Info, and Subtitle -->
	<div class="flex flex-col gap-0.5">
		<div class="flex items-center justify-between gap-2">
			{#if title}
				<span class="text-sm font-medium text-muted-foreground truncate">{title}</span>
			{/if}
			{#if info}
				<Info text={info} />
			{/if}
		</div>
		{#if subtitle}
			<span class="text-xs text-muted-foreground/80 truncate">{subtitle}</span>
		{/if}
	</div>

	<!-- Main KPI Value -->
	<div class="my-3 flex items-baseline gap-2">
		{#if loading}
			<LoaderCircle class="h-6 w-6 animate-spin text-muted-foreground" />
		{:else}
			<span class="text-2xl font-bold tracking-tight lg:text-3xl text-foreground font-sans">
				{displayValue}
			</span>
		{/if}
	</div>

	<!-- Footer: Delta Badge & Sparkline -->
	<div class="flex items-center justify-between gap-3 pt-1">
		<div>
			{#if comparisonDelta !== null}
				<DeltaDisplay
					value={comparisonDelta}
					fmt={comparisonFmt}
					text={comparisonText}
					chip={badge}
					{downIsGood}
					symbolPosition="left"
					className="text-xs font-semibold"
				/>
			{/if}
		</div>

		{#if sparklineData && sparklineData.length > 0}
			<div class="shrink-0">
				<SparklineDisplay
					chartData={sparklineData}
					type={sparklineType}
					color={sparklineColor}
					interactive={true}
					width={75}
					height={24}
					xEChartsType="time"
					loading={false}
				/>
			</div>
		{/if}
	</div>
</div>
