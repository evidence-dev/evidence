<script lang="ts">
	import { onDestroy } from 'svelte';
	import { mode } from 'mode-watcher';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { getQueryService } from '../../../QueryService.context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getThemeToken } from '../../../theme/get-theme-token';
	import { getCardContext } from '../../common/card-context.svelte';
	import { getPrintModeContext } from '../../../print-mode.context';
	import { PUBLIC_MAPBOX_TOKEN } from '../../../shims/public-env';
	import { resolveMapProvider, type MapProvider } from './resolve-map-provider';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import CustomMapSandbox from './sandbox/CustomMapSandbox.svelte';
	import type {
		MapQueryResponse,
		MapVariables,
		MapThemeSnapshot,
		MapFiltersSnapshot
	} from './sandbox/sandbox-protocol';
	import {
		getSandboxRuntimeErrorsContext,
		type ComponentErrorSource
	} from '../../sandbox-runtime-errors-context.svelte';

	// `code` is the tag body's JS source, injected by the schema transform.
	type Props = UserComponentProps<typeof schema> & { code?: string };
	const props: Props = $props();

	const { getComponentId, setError } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryService = getQueryService();
	const inlineQueries = getInlineQueriesContext();
	const pageFilters = getPageFiltersContext();
	const themeContext = getThemeContext();
	const cardContext = getCardContext();
	const printing = getPrintModeContext();
	const sandboxRuntimeErrors = getSandboxRuntimeErrorsContext();
	const repeatFilters = getRepeatContext()?.filters;

	// Resolves Evidence `{{ }}` interpolation (filter values, inline-query refs)
	// in attribute strings — reactive, so a filter change recomputes and re-pushes
	// state to the sandbox. This is how a live filter value reaches the map.
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});
	const { resolveText } = $derived(createResolvers(variableProcessor));

	// Maps have no intrinsic content height, so custom_map is always fixed-height.
	const height = $derived(props.height ?? 400);
	const userCode = $derived(props.code ?? '');
	const title = $derived(resolveText(props.title) ?? '');
	const subtitle = $derived(resolveText(props.subtitle) ?? '');

	const resolved = $derived(
		resolveMapProvider({
			userToken: props.token,
			evidenceToken: PUBLIC_MAPBOX_TOKEN,
			forceProvider: (props.provider as MapProvider | undefined) ?? null
		})
	);

	const activeMode = $derived(mode.current === 'dark' ? 'dark' : 'light');
	const useCardColors = $derived(Boolean(cardContext?.insideCard));
	const themeSnapshot = $derived<MapThemeSnapshot>({
		mode: activeMode,
		palette: themeContext.activeTheme.colorPalettes?.default ?? [],
		// Resolved surface colors → --evidence-* CSS vars in the sandbox, so
		// author panels/legends match the host theme instead of rendering
		// transparent (an opaque iframe has no host CSS vars otherwise).
		background: getThemeToken(themeContext.themes[activeMode], 'background', useCardColors),
		foreground: getThemeToken(themeContext.themes[activeMode], 'foreground', useCardColors),
		mutedForeground: getThemeToken(
			themeContext.themes[activeMode],
			'mutedForeground',
			useCardColors
		),
		border: getThemeToken(themeContext.themes[activeMode], 'border', useCardColors)
	});

	// Values from the tag's `variables={…}`. Markdoc resolves `$frontmatter`
	// refs before we see them, but Evidence `{{ filter }}` interpolation is a
	// render-time concern — so run resolveText over each string value. Without
	// this, `variables={ category="{{ category_filter.value }}" }` reaches the
	// map as the literal string, never the filter's value. Non-serializable
	// values are stripped (postMessage structured-clones the snapshot).
	const evidenceVariables = $derived.by<MapVariables>(() => {
		const raw = (props as { variables?: unknown }).variables;
		if (!raw || typeof raw !== 'object') return {};
		const out: MapVariables = {};
		for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
			if (typeof value === 'function') continue;
			if (value !== null && typeof value === 'object') continue;
			out[key] =
				typeof value === 'string'
					? ((resolveText(value) ?? value) as MapVariables[string])
					: (value as MapVariables[string]);
		}
		return out;
	});

	// Snapshot of every page filter's value. Reading each `.value` subscribes this
	// derived to all filters, so a change → fresh identity → state-change posted →
	// the author's filter callbacks fire.
	const filtersSnapshot = $derived.by<MapFiltersSnapshot>(() => {
		if (!pageFilters) return {};
		const out: MapFiltersSnapshot = {};
		for (const id of pageFilters.filterIds) {
			out[id] = pageFilters.get(id)?.value;
		}
		return out;
	});

	// Filters this block created via evidence.filters.create — torn down on unmount.
	const createdFilterIds = new Set<string>();

	function onFilterSet(id: string, value: unknown): void {
		const filter = pageFilters?.get(id);
		if (!filter) {
			errorSource?.report({
				level: 'warn',
				source: 'script',
				message: `evidence.filters.set("${id}", …): no filter named "${id}" exists on this page. Call evidence.filters.create("${id}", initialValue) first.`
			});
			return;
		}
		(filter as { value: unknown }).value = value;
	}

	function onFilterCreate(id: string, value: unknown, column?: string): void {
		if (!pageFilters) {
			errorSource?.report({
				level: 'warn',
				source: 'script',
				message: `evidence.filters.create("${id}", …): no page-filters context is available here.`
			});
			return;
		}
		const createdHere = !pageFilters.has(id);
		pageFilters.createExternal(id, value, column);
		if (createdHere && pageFilters.isExternal(id)) createdFilterIds.add(id);
	}

	let disposed = false;
	onDestroy(() => {
		disposed = true;
		for (const id of createdFilterIds) {
			if (pageFilters?.isExternal(id)) pageFilters.remove(id);
		}
		createdFilterIds.clear();
	});

	async function runQuery(name: string): Promise<MapQueryResponse> {
		if (!inlineQueries) throw new Error('No queries are available on this page.');
		// A named query can register a tick after mount; poll briefly.
		let subquery: string | undefined;
		for (let i = 0; i < 40 && !disposed; i++) {
			subquery = inlineQueries.getInterpolated(name, queryService.dialect) ?? undefined;
			if (subquery) break;
			await new Promise((r) => setTimeout(r, 50));
		}
		if (!subquery) throw new Error(`Query "${name}" was not found on this page.`);
		const result = await queryService.query(`SELECT * FROM ${subquery}`);
		if (result.error) throw new Error(result.error);
		return { rows: result.rows as Record<string, unknown>[] };
	}

	let errorSource = $state<ComponentErrorSource | undefined>();
	$effect(() => {
		if (!sandboxRuntimeErrors) return;
		errorSource = sandboxRuntimeErrors.register(componentId, 'custom_map');
		return () => {
			sandboxRuntimeErrors.unregister(componentId);
			errorSource = undefined;
		};
	});
	$effect(() => {
		void userCode;
		errorSource?.clear();
	});

	let sandboxError = $state<string | undefined>(undefined);
	$effect(() => {
		setError(sandboxError);
	});
</script>

<div class="flex w-full flex-col" style:height={`${height}px`}>
	{#if title || subtitle}
		<ComponentTitle {title} {subtitle} />
	{/if}
	<div class="relative z-0 flex min-h-0 flex-1 flex-col">
		<CustomMapSandbox
			class="h-full w-full flex-1"
			{userCode}
			provider={resolved.provider}
			token={resolved.token}
			variables={evidenceVariables}
			theme={themeSnapshot}
			filters={filtersSnapshot}
			{printing}
			{height}
			{runQuery}
			{onFilterSet}
			{onFilterCreate}
			onError={(message) => (sandboxError = message)}
			onLog={(entry) => errorSource?.report(entry)}
		/>
	</div>
</div>
