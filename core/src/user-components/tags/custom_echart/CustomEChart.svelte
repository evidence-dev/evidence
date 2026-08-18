<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import ECharts from '../echarts/ECharts.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import SamplingIndicator from '../../common/SamplingIndicator.svelte';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import { cn } from '../../../shadcn/utils';
	import { getQueryService } from '../../../QueryService.context';
	import type { SQLProps } from '../../common/sql-options';
	import { extractSQLProps } from '../../common/sql-options';
	import { buildCustomEchartSQLConfig } from './build-custom-echart-sql';
	import { buildCustomEchartOptions } from './build-custom-echart-options';
	import {
		parseCustomEchartConfig,
		type ParsedCustomEchartConfig
	} from './parse-custom-echart-config';
	import { shouldBeJsMode } from './schema';
	import { applyFormatCodes } from './apply-format-codes';
	import { interpolateJsSource } from './interpolate-js-source';
	import EChartSandbox from './sandbox/EChartSandbox.svelte';
	import {
		getSandboxRuntimeErrorsContext,
		type ComponentErrorSource
	} from '../../sandbox-runtime-errors-context.svelte';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { Query } from '../../../Query.svelte';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { getAutoRefreshContext } from '../../../auto-refresh.context.svelte';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();
	// Optional — only set on editor surfaces. When present, sandbox diagnostics
	// (console.error/warn, uncaught throws inside user code) get pushed here so
	// the chat panel can include them in debug_code requests. Visual error
	// display via setError still fires independently.
	const sandboxRuntimeErrors = getSandboxRuntimeErrorsContext();

	// `config` is the tag body's fence content, injected by the schema transform
	type Props = UserComponentProps<typeof schema> & SQLProps & { config?: string };

	const props: Props = $props();
	const height = $derived(props.height);
	const filterIds = $derived(props.filters);
	const renderer = $derived(props.renderer ?? 'canvas');

	const hasValidationErrors = $derived(hasBlockingErrors());

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

	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText, resolveSql } = $derived(createResolvers(variableProcessor));

	const resolvedTableName = $derived(resolveText(props.data));

	// `shouldBeJsMode` is the single source of truth for routing — same call
	// the validator uses, so edit-time errors and runtime branching can't drift.
	// Auto-detects from the body: bodies that parse as JSON5 take the
	// host-rendered path; anything that fails JSON5 syntax but validates as
	// JS routes to the sandboxed iframe.
	const isJs = $derived(shouldBeJsMode(props.config));
	// In JS mode the body is code, not JSON — skip the declarative parse (the
	// sandbox evaluates it and reports its own errors).
	const parsedConfig = $derived<ParsedCustomEchartConfig>(
		isJs ? { config: {} } : parseCustomEchartConfig(props.config)
	);
	// Recursively interpolates {{ }} variables in any string value inside the
	// config, then turns "fmt:<code>" formatter strings into real functions
	const resolvedConfig = $derived(
		applyFormatCodes(parsedConfig.config ? resolveText(parsedConfig.config) : {})
	);
	// JS-mode body: interpolate {{ }} over the raw source as injection-safe JS
	// literals (a filter value can't break out into code).
	const jsSource = $derived(
		isJs ? interpolateJsSource(props.config ?? '', (token) => resolveText(token) ?? '') : ''
	);

	// Register this component with the page-level error-aggregation context
	// on mount; unregister on unmount. The source IS the component's local
	// error log — there is no cross-cutting buffer to coordinate with.
	// register/unregister are pure writes (SvelteMap.set/.delete) so no
	// caller-side untrack needed — they don't subscribe this effect to the
	// context's source map.
	let errorSource = $state<ComponentErrorSource | undefined>();
	$effect(() => {
		if (!sandboxRuntimeErrors) return;
		errorSource = sandboxRuntimeErrors.register(componentId, 'custom_echart');
		return () => {
			sandboxRuntimeErrors.unregister(componentId);
			errorSource = undefined;
		};
	});

	// When the JS body changes, reset this component's entries so the agent's
	// next debug_code call doesn't reason against stale failures from a
	// version the author has already moved past. JSON5 bodies skipped — they
	// have no sandbox runtime and can't produce these entries. clear() reads
	// entries.length internally; ComponentErrorSource untracks that read so
	// the effect doesn't subscribe to entries (would clear on every push).
	$effect(() => {
		if (!isJs) return;
		void jsSource;
		errorSource?.clear();
	});
	let sandboxError = $state<string | undefined>(undefined);
	const title = $derived(resolveText(props.title) ?? '');
	const subtitle = $derived(resolveText(props.subtitle) ?? '');
	const info = $derived(resolveText(props.info) ?? '');
	const info_link = $derived(resolveText(props.info_link) ?? '');
	const info_link_title = $derived(resolveText(props.info_link_title) ?? '');
	const where = $derived(resolveSql(props.where) ?? rawWhere);
	const resolvedDateRange = $derived(resolveText(props.date_range) ?? props.date_range);

	const queryConfig = $derived.by(() => {
		if (hasValidationErrors) {
			return;
		}

		return buildCustomEchartSQLConfig({
			data: resolvedTableName,
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
		return queryInfoContext?.registerQuery(componentId, 'custom_echart', query, title);
	});

	$effect(() => {
		const configError = isJs ? sandboxError : parsedConfig.error;
		setError(configError ?? query.error ?? undefined);
	});

	const rows = $derived(query.result?.rows ?? []);
	const columns = $derived(query.result?.columns ?? []);
	const columnNames = $derived(columns.map((column) => column.name));

	const loading: boolean = $derived(query.loading);
	const isSampled = $derived(Boolean(query.samplingForced));

	const options = $derived<EChartsOption>(
		buildCustomEchartOptions(resolvedConfig, rows, columnNames)
	);

	const ready = $derived(!query.loading);
	let stableOptions: EChartsOption = $state({});
	$effect(() => {
		if (ready) {
			stableOptions = options;
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
		{#if isJs}
			<EChartSandbox
				class={cn('h-full w-full flex-1')}
				userCode={jsSource}
				{rows}
				{columns}
				{renderer}
				{height}
				onError={(message) => (sandboxError = message)}
				onLog={(entry) => errorSource?.report(entry)}
			/>
		{:else}
			<ECharts
				class={cn('h-full w-full flex-1', !height && 'min-h-[215px]')}
				options={stableOptions}
				group={props.connect_group}
				{renderer}
			/>
		{/if}

		<div class="absolute top-2 right-2">
			<LoaderCircle
				class="text-muted-foreground animate-spin [animation-duration:1s] {loading
					? 'opacity-100'
					: 'opacity-0'} h-4 w-4 transition-opacity duration-500"
			/>
		</div>

		<SamplingIndicator {isSampled} dataLength={rows.length} totalCount={query.count} />
	</div>
</div>
