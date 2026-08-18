<script lang="ts">
	/**
	 * Parent-side wrapper for the `{% html %}` sandbox. Composes the shared
	 * SandboxFrame and owns only the html-specific glue:
	 *  - the Tier-1 CSP (allowlisted CDNs, no network egress) via `buildCsp`
	 *  - the `query` request handler (delegated to the parent's QueryService via
	 *    the `runQuery` prop, which Html.svelte wires to the page's inline queries)
	 *  - posting `state-change` when props/theme/filters change (reactivity)
	 *  - routing the sandbox's `filter-set` message back to the page filters
	 *
	 * Context wiring (QueryService, inline queries, page filters, theme) lives in
	 * Html.svelte; this component is intentionally context-free so it stays easy
	 * to test and reason about.
	 */
	import SandboxFrame from '../../../sandbox/SandboxFrame.svelte';
	import { SANDBOX_RUNTIME_PATH } from './sandbox-srcdoc';
	import { buildHtmlSandboxCsp } from './html-csp';
	import {
		HTML_SANDBOX_MESSAGE_SOURCE,
		HTML_SANDBOX_PROTOCOL_VERSION,
		HTML_QUERY_REQUEST,
		DEFAULT_HTML_MIN_HEIGHT,
		validateFilterSetMessage,
		validateFilterCreateMessage,
		validateModalOpenMessage,
		validateNavigateMessage,
		type HtmlInitMessage,
		type HtmlMode,
		type HtmlVariables,
		type HtmlThemeSnapshot,
		type HtmlFiltersSnapshot,
		type HtmlQueryResponse
	} from './html-protocol';
	import type { SandboxLogEntry } from '../../../sandbox/log-protocol';

	type Props = {
		/** The author's raw HTML+JS body. */
		html: string;
		variables: HtmlVariables;
		theme: HtmlThemeSnapshot;
		filters: HtmlFiltersSnapshot;
		printing?: boolean;
		/** Resolve a named query to its rows (parent owns QueryService access). */
		runQuery: (name: string) => Promise<HtmlQueryResponse>;
		/** Cross-filter callback for `evidence.filters.set(id, value)`. */
		onFilterSet?: (id: string, value: unknown) => void;
		/** New-filter callback for `evidence.filters.create(id, value, { column })`. */
		onFilterCreate?: (id: string, value: unknown, column?: string) => void;
		/** `evidence.modal.open(...)` — parent renders a full-page modal over the report. */
		onModalOpen?: (payload: { title?: string; html: string }) => void;
		/** `evidence.modal.close()` — close the block's modal. */
		onModalClose?: () => void;
		/** `evidence.navigate(path)` — drill through to another app page (validated internal path). */
		onNavigate?: (path: string) => void;
		height?: number;
		class?: string;
		onError?: (message: string | undefined) => void;
		onRendered?: () => void;
		onLog?: (entry: SandboxLogEntry) => void;
	};

	let {
		html,
		variables,
		theme,
		filters,
		printing = false,
		runQuery,
		onFilterSet,
		onFilterCreate,
		onModalOpen,
		onModalClose,
		onNavigate,
		height,
		class: className,
		onError,
		onRendered,
		onLog
	}: Props = $props();

	const instanceId =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `html-${Math.random().toString(36).slice(2)}`;

	const runtimeUrl = $derived(
		typeof window !== 'undefined'
			? `${window.location.origin}${SANDBOX_RUNTIME_PATH}?v=${HTML_SANDBOX_PROTOCOL_VERSION}`
			: ''
	);

	// Autosize (no `height=`): the mount area is height:auto so the block tracks
	// its content. Fixed (`height=N`): force the full-height chain so a
	// `height:100%` author element fills the pinned box (canvas/ECharts/Chart.js).
	// Carried in the channel — NOT in srcdoc — so a user editing `height=` on
	// an existing block doesn't reload the iframe. See the srcdoc invariance
	// contract in `sandbox/srcdoc.ts`.
	const mode = $derived<HtmlMode>(height === undefined ? 'autosize' : 'fixed');

	const init = $derived<HtmlInitMessage>({
		type: 'init',
		html,
		variables,
		theme,
		filters,
		printing,
		mode
	});

	// `query` is the only request the sandbox makes. Read fresh state inside the
	// handler (registered once at connect time) — runQuery closes over the
	// parent's reactive QueryService/inline-query context.
	const requestHandlers = {
		[HTML_QUERY_REQUEST]: async (payload: unknown) => {
			const name = (payload as { name?: unknown })?.name;
			if (typeof name !== 'string') throw new Error('query request missing a name');
			return runQuery(name);
		}
	};

	let postToFrame = $state<((message: Record<string, unknown>) => void) | undefined>();

	// Mirror of what the sandbox last received, so a filter change reposts only
	// state, a body edit only the html (avoids redundant churn on each).
	let sent: {
		html: string;
		variables: HtmlVariables;
		theme: HtmlThemeSnapshot;
		filters: HtmlFiltersSnapshot;
		mode: HtmlMode;
	} | null = null;

	function onConnect(post: (message: Record<string, unknown>) => void): void {
		postToFrame = post;
		// `init` (posted at handshake) already carried the current html + state,
		// so seed the mirror with them — the effect below only posts on change.
		sent = { html, variables, theme, filters, mode };
	}

	$effect(() => {
		if (!postToFrame || !sent) return;
		// A body edit re-injects (resets the DOM + SDK); state/mode changes
		// just re-seed reactive state in place. Keep them as distinct messages.
		if (html !== sent.html) {
			postToFrame({ type: 'html-change', html });
			sent.html = html;
		}
		if (
			variables !== sent.variables ||
			theme !== sent.theme ||
			filters !== sent.filters ||
			mode !== sent.mode
		) {
			postToFrame({ type: 'state-change', variables, theme, filters, mode });
			sent.variables = variables;
			sent.theme = theme;
			sent.filters = filters;
			sent.mode = mode;
		}
	});

	function handleMessage(message: { type: string } & Record<string, unknown>): void {
		// Validate before forwarding. `column` from `filter-create` ultimately
		// becomes a SQL predicate (ExternalFilter.sql interpolates it raw), so
		// a malformed column here is a real injection vector we close at the
		// boundary. `id` must be a non-empty string for both messages.
		// Unknown / malformed shapes are silently dropped — the runtime bundle
		// is the only producer; the diagnostics feed already catches author
		// mistakes via the SDK's own validation before they reach this point.
		if (message.type === 'filter-set') {
			const validated = validateFilterSetMessage(message);
			if (validated) onFilterSet?.(validated.id, validated.value);
		} else if (message.type === 'filter-create') {
			const validated = validateFilterCreateMessage(message);
			if (validated) onFilterCreate?.(validated.id, validated.value, validated.column);
		} else if (message.type === 'modal-open') {
			const validated = validateModalOpenMessage(message);
			if (validated) onModalOpen?.({ title: validated.title, html: validated.html });
		} else if (message.type === 'modal-close') {
			onModalClose?.();
		} else if (message.type === 'navigate') {
			const validated = validateNavigateMessage(message);
			if (validated) onNavigate?.(validated.path);
		}
	}

	// Static, baked into srcdoc and never changed for the iframe's lifetime —
	// dimension mode is driven at runtime by toggling these classes on `<body>`
	// from `state-change` messages (see HtmlMode). Keep this string a literal
	// constant: any reactivity here would force a full iframe reload on edit
	// (see the srcdoc invariance contract in `sandbox/srcdoc.ts`).
	//
	// The srcdoc base CSS already sets `body { height: 100%; margin: 0 }`, so
	// fixed mode needs only the mount-fill rule; autosize mode overrides body
	// height to `auto` so content drives the iframe size via reported height.
	const DIMENSION_STYLE =
		'<style>body.evidence-html-autosize{height:auto}body.evidence-html-fixed #evidence-html-root{height:100%}</style>';

	// A THEMED, LOW-SPECIFICITY baseline so plain author markup (headings,
	// paragraphs, tables, code) looks on-brand with zero styling effort — a blank
	// sandbox iframe otherwise falls back to UA defaults (Times New Roman, black
	// text, which is invisible on a dark themed surface). Design rules:
	//   - Every color/font reads a `--evidence-*` var with a static fallback. The
	//     runtime sets the color vars live from the host theme (applyThemeColors);
	//     the font/scale vars aren't forwarded yet, so their fallbacks apply until
	//     a later PR lights them up. Nothing breaks in the meantime.
	//   - Scoped to `#evidence-html-root` (the author mount) and wrapped in
	//     `:where(...)` so specificity is 0 — a bare `h1{}` in author CSS wins.
	//     It's a baseline, not a cage.
	//   - Bottom-only margins so no top margin collapses out of `<body>` and
	//     inflates the autosize height.
	//   - Responsive by default: box-sizing + fluid media so plain markup never
	//     overflows a narrow (mobile) block. The iframe fills its container, so
	//     its own viewport width IS the block width — normal `@media` queries in
	//     author CSS behave like container queries and Just Work at phone widths.
	const BASE_STYLESHEET =
		'<style>' +
		':where(*,*::before,*::after){box-sizing:border-box}' +
		":where(#evidence-html-root){font-family:var(--evidence-font-body,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif);color:var(--evidence-foreground,#1f2937);font-size:var(--evidence-font-size,14px);line-height:1.5;overflow-wrap:break-word;-webkit-font-smoothing:antialiased}" +
		':where(#evidence-html-root img,#evidence-html-root video){max-width:100%;height:auto}' +
		':where(#evidence-html-root svg){max-width:100%}' +
		':where(#evidence-html-root h1,#evidence-html-root h2,#evidence-html-root h3,#evidence-html-root h4){color:var(--evidence-foreground,#111827);font-weight:600;line-height:1.25;margin:0 0 0.5em}' +
		':where(#evidence-html-root h1){font-size:1.6em}:where(#evidence-html-root h2){font-size:1.35em}:where(#evidence-html-root h3){font-size:1.15em}:where(#evidence-html-root h4){font-size:1em}' +
		':where(#evidence-html-root p,#evidence-html-root ul,#evidence-html-root ol,#evidence-html-root blockquote,#evidence-html-root table,#evidence-html-root pre){margin:0 0 0.75em}' +
		':where(#evidence-html-root a){color:inherit;text-decoration:underline;text-underline-offset:2px}' +
		':where(#evidence-html-root small,#evidence-html-root caption,#evidence-html-root figcaption){color:var(--evidence-muted-foreground,#6b7280)}' +
		':where(#evidence-html-root hr){border:0;border-top:1px solid var(--evidence-border,#e5e7eb);margin:1em 0}' +
		':where(#evidence-html-root table){border-collapse:collapse;width:100%;font-size:0.95em}' +
		':where(#evidence-html-root th,#evidence-html-root td){text-align:left;padding:0.4em 0.6em;border-bottom:1px solid var(--evidence-border,#e5e7eb)}' +
		':where(#evidence-html-root th){color:var(--evidence-muted-foreground,#6b7280);font-weight:600}' +
		':where(#evidence-html-root code,#evidence-html-root pre){font-family:var(--evidence-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:0.9em}' +
		':where(#evidence-html-root pre){padding:0.75em;border:1px solid var(--evidence-border,#e5e7eb);border-radius:6px;overflow:auto}' +
		'</style>';

	const BODY_HTML = `${DIMENSION_STYLE}${BASE_STYLESHEET}<div id="evidence-html-root"></div>`;
</script>

<SandboxFrame
	source={HTML_SANDBOX_MESSAGE_SOURCE}
	version={HTML_SANDBOX_PROTOCOL_VERSION}
	{instanceId}
	{runtimeUrl}
	bodyHtml={BODY_HTML}
	initialBackgroundColor={theme.background}
	{init}
	taskName="html"
	title="Custom HTML block"
	{height}
	minHeight={DEFAULT_HTML_MIN_HEIGHT}
	class={className}
	{requestHandlers}
	buildCsp={buildHtmlSandboxCsp}
	{onConnect}
	{onError}
	{onRendered}
	{onLog}
	onMessage={handleMessage}
/>
