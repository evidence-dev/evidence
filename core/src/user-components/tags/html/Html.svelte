<script lang="ts">
	import { mode } from 'mode-watcher';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getRendererContext } from '../../Renderer/renderer-context';
	import {
		transformInternalLink,
		mergeCurrentSearchParams
	} from '../../common/transform-internal-link';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getThemeToken } from '../../../theme/get-theme-token';
	import { getCardContext } from '../../common/card-context.svelte';
	import { getPrintModeContext } from '../../../print-mode.context';
	import { logger } from '../../../shims/logger';
	import {
		getSandboxRuntimeErrorsContext,
		type ComponentErrorSource
	} from '../../sandbox-runtime-errors-context.svelte';
	import HtmlSandbox from './sandbox/HtmlSandbox.svelte';
	import HtmlModal from './HtmlModal.svelte';
	import { waitForInterpolatedQuery } from './wait-for-query';
	import { resolveVariables } from './resolve-variables';
	import type {
		HtmlVariables,
		HtmlThemeSnapshot,
		HtmlQueryResponse
	} from './sandbox/html-protocol';

	// `html` is the tag body's raw source, injected by the schema transform.
	type Props = UserComponentProps<typeof schema> & { html?: string };
	const props: Props = $props();

	const height = $derived(props.height);

	const { getComponentId, setError } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());

	const connection = getDefaultConnection();
	const inlineQueries = getInlineQueriesContext();
	const pageFilters = getPageFiltersContext();
	const repeatFilters = getRepeatContext()?.filters;
	// Resolves Evidence `{{ }}` interpolation (filter values, repeat scope,
	// inline-query refs) in attribute strings — reactive, so a filter change
	// recomputes and re-pushes state to the sandbox.
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});
	const { resolveText } = $derived(createResolvers(variableProcessor));
	const themeContext = getThemeContext();
	const cardContext = getCardContext();
	const printing = getPrintModeContext();
	// Optional — only set on editor surfaces. Sandbox diagnostics (console.error,
	// uncaught throws) get pushed here so the chat panel can include them in
	// debug_code requests, independent of the visual error overlay.
	const sandboxRuntimeErrors = getSandboxRuntimeErrorsContext();

	const activeMode = $derived(mode.current === 'dark' ? 'dark' : 'light');
	const useCardColors = $derived(Boolean(cardContext?.insideCard));

	const themeSnapshot = $derived<HtmlThemeSnapshot>({
		mode: activeMode,
		palette: themeContext.activeTheme.colorPalettes?.default ?? [],
		// Resolved at the same position a host-rendered chart would be, so the
		// sandboxed iframe (which can't composite transparently) matches the host.
		background: getThemeToken(themeContext.themes[activeMode], 'background', useCardColors),
		// Surface text/divider colors the runtime mirrors into CSS vars so the
		// baked base stylesheet keeps plain author markup readable against
		// `background` in either mode. Same resolution as `background`.
		foreground: getThemeToken(themeContext.themes[activeMode], 'foreground', useCardColors),
		mutedForeground: getThemeToken(
			themeContext.themes[activeMode],
			'mutedForeground',
			useCardColors
		),
		border: getThemeToken(themeContext.themes[activeMode], 'border', useCardColors)
	});

	// Values from the tag's `variables={…}` attribute, exposed to author code as
	// `evidence.variables`. Markdoc resolves `$frontmatter` refs before we see
	// them, but Evidence `{{ filter }}` interpolation is a render-time concern —
	// so run resolveText over each string value. Without this, a live filter
	// value written as `variables={ x="{{ filter.value }}" }` reaches the sandbox
	// as the literal string, never the value. Reactive: a filter change
	// recomputes this and re-pushes state. Non-serializable values are stripped
	// (postMessage structured-clones the snapshot; the diff is shallow).
	const evidenceVariables = $derived.by<HtmlVariables>(() =>
		resolveVariables((props as { variables?: unknown }).variables, resolveText)
	);

	// Snapshot of every page filter's current value, exposed as
	// `evidence.filters.get()`. Reading each `.value` subscribes this derived to
	// all filters, so any change recomputes it → a fresh object identity →
	// HtmlSandbox posts a `state-change` → the author's filter callbacks fire.
	const filtersSnapshot = $derived.by<Record<string, unknown>>(() => {
		if (!pageFilters) return {};
		const out: Record<string, unknown> = {};
		for (const id of pageFilters.filterIds) {
			out[id] = pageFilters.get(id)?.value;
		}
		return out;
	});

	// Ids of filters this block created via `evidence.filters.create`. Tracked so
	// we can tear them down when the block unmounts (they're not anchored to an
	// AST node, so nothing else reaps them). Plain Set — pure bookkeeping, no UI
	// reacts to it.
	const createdFilterIds = new Set<string>();

	// `evidence.filters.set(id, value)` — cross-filter the page from inside the
	// block. Only an EXISTING filter can be set; to make a new one the author
	// calls `evidence.filters.create` (→ onFilterCreate). A set against a name
	// that doesn't exist is an authoring mistake, so surface it to the
	// diagnostics feed (visible to the AI agent) instead of only the console.
	function onFilterSet(id: string, value: unknown): void {
		const filter = pageFilters?.get(id);
		if (!filter) {
			const message = `evidence.filters.set("${id}", …): no filter named "${id}" exists on this page. Render an input component that declares it, or call evidence.filters.create("${id}", initialValue) first.`;
			logger.warn({ id }, message);
			errorSource?.report({ level: 'warn', source: 'script', message });
			return;
		}
		// Cross-filtering is an explicit user interaction, so `filter.value =`
		// (which also writes the URL) is the correct path, not setDefault().
		(filter as { value: unknown }).value = value;
	}

	// `evidence.filters.create(id, value, { column })` — declare a NEW page
	// filter the block owns (e.g. a hand-rolled dropdown). With a column it
	// behaves like a builtin (auto-applies via the chart `filters=` prop). Defers
	// to any pre-existing filter of the same id; we only track (and later remove)
	// ids that became external, so unmount cleanup never deletes a filter another
	// component declared.
	function onFilterCreate(id: string, value: unknown, column?: string): void {
		if (!pageFilters) {
			const message = `evidence.filters.create("${id}", …): no page-filters context is available here, so the filter can't be created.`;
			logger.warn({ id }, message);
			errorSource?.report({ level: 'warn', source: 'script', message });
			return;
		}
		// Claim ownership ONLY if this call actually created the filter. If it
		// already exists, createExternal defers to it — so it belongs to whoever
		// created it first (another html block, an input component, or the AST
		// pre-reg). Claiming it here too would mean this block removes it on
		// unmount and silently yanks a filter still live in another block. Static
		// pre-regs are reaped by the AST walker; runtime-only externals we truly
		// own are reaped by our unmount cleanup below.
		const createdHere = !pageFilters.has(id);
		pageFilters.createExternal(id, value, column);
		if (createdHere && pageFilters.isExternal(id)) createdFilterIds.add(id);
	}

	// Set on unmount so a pending query wait (below) bails instead of spinning
	// for its full timeout against a block that's already gone.
	let disposed = false;

	/**
	 * Resolve a named query to rows. The name resolves against the page's inline
	 * queries + SQL files via the inline-queries context (filters already
	 * interpolated there); we wrap it in a SELECT and run it through the
	 * QueryService. No ad-hoc SQL — `name` can only reach queries declared on
	 * the page.
	 *
	 * We WAIT briefly for the named query to register rather than throwing the
	 * instant it's missing: `evidence.query` is a one-shot pull, so a transient
	 * race (a freshly-added block asking before the page registered its ```sql
	 * block) would otherwise leave the block permanently blank until re-pasted.
	 */
	async function runQuery(name: string): Promise<HtmlQueryResponse> {
		if (!inlineQueries) {
			throw new Error('No queries are available on this page.');
		}
		const subquery = await waitForInterpolatedQuery(
			() => inlineQueries.getInterpolated(name, connection.dialect),
			name,
			{ isDisposed: () => disposed }
		);
		const result = await connection.query(`SELECT * FROM ${subquery}`);
		if (result.error) throw new Error(result.error);
		return { rows: result.rows as Record<string, unknown>[] };
	}

	// Full-page modal the block opens via `evidence.modal.open()`. Rendered by
	// HtmlModal in the parent realm (so it dims the page and escapes the iframe),
	// with the modal's `html` running in its OWN nested sandbox — same isolation
	// and same evidence.* context (data/theme/filters) as this block.
	let modal = $state<{ open: boolean; title?: string; html: string }>({
		open: false,
		html: ''
	});
	function onModalOpen(payload: { title?: string; html: string }): void {
		// The click that opened this came from inside the block iframe, which now
		// holds focus. If the dialog opens with focus still on the iframe, Radix's
		// focus guard reads it as "focus outside the dialog" and dismisses on open.
		// Blur it so focus returns to the document; Radix then moves focus into the
		// dialog cleanly. Mutate (don't reassign `modal`) so `bind:open` stays bound.
		if (typeof document !== 'undefined') {
			(document.activeElement as HTMLElement | null)?.blur?.();
		}
		modal.title = payload.title;
		modal.html = payload.html;
		modal.open = true;
	}
	function onModalClose(): void {
		modal.open = false;
	}

	// `evidence.navigate(path)` — drill-through to another page. `path` is a
	// validated internal app path; route it through the SAME transform + router
	// that markdown links use, so it's context-correct (published / preview /
	// editor) and stays same-origin. Filter params are merged for continuity.
	const rendererContext = getRendererContext();
	function onNavigate(path: string): void {
		const transformed = transformInternalLink(path, rendererContext.context, page.params);
		void goto(mergeCurrentSearchParams(transformed));
	}

	let errorSource = $state<ComponentErrorSource | undefined>();
	$effect(() => {
		if (!sandboxRuntimeErrors) return;
		errorSource = sandboxRuntimeErrors.register(componentId, 'html');
		return () => {
			sandboxRuntimeErrors.unregister(componentId);
			errorSource = undefined;
		};
	});

	// Reset this component's diagnostics when the body changes, so a stale
	// failure from a version the author already edited past doesn't linger.
	$effect(() => {
		void props.html;
		errorSource?.clear();
		// A live edit re-injects the body; close any modal it had opened so a
		// stale one doesn't linger over the edited block.
		modal.open = false;
	});

	let sandboxError = $state<string | undefined>(undefined);
	$effect(() => {
		setError(sandboxError);
	});

	// Remove any filters this block created when it unmounts, and stop any
	// in-flight query wait. No reactive reads in the body, so this runs once and
	// the teardown fires only on unmount.
	$effect(() => {
		return () => {
			disposed = true;
			for (const id of createdFilterIds) {
				if (pageFilters?.isExternal(id)) pageFilters.remove(id);
			}
			createdFilterIds.clear();
		};
	});
</script>

<HtmlSandbox
	html={props.html ?? ''}
	variables={evidenceVariables}
	theme={themeSnapshot}
	filters={filtersSnapshot}
	{printing}
	{runQuery}
	{onFilterSet}
	{onFilterCreate}
	{onModalOpen}
	{onModalClose}
	{onNavigate}
	{height}
	class="h-full w-full"
	onError={(message) => (sandboxError = message)}
	onLog={(entry) => errorSource?.report(entry)}
/>

<HtmlModal
	bind:open={modal.open}
	title={modal.title}
	html={modal.html}
	variables={evidenceVariables}
	theme={themeSnapshot}
	filters={filtersSnapshot}
	{printing}
	{runQuery}
	{onFilterSet}
	{onFilterCreate}
	{onNavigate}
	onLog={(entry) => errorSource?.report(entry)}
/>
