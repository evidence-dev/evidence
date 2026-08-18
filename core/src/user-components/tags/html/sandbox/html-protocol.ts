/**
 * Wire protocol for the `{% html %}` sandbox — the consumer-specific pieces the
 * shared sandbox infra (protocol-base, runtime-bootstrap, SandboxFrame) leaves
 * to each tag: the message-source discriminator, the protocol version, and the
 * init / state-change payload shapes.
 *
 * Data model is PULL, not push: the parent does NOT ship query rows in `init`.
 * Author code asks for a named query's rows on demand via `evidence.query(name)`,
 * which rides the shared correlated request/response channel (kind = `query`).
 * The parent resolves the name against the page's inline queries + SQL files
 * (filters already interpolated) and runs it through the QueryService. This lets
 * one block consume many named queries without exploding the iframe count.
 */
import type { SandboxMode } from '../../../sandbox/protocol-base';

/** Discriminator so a sibling echart sandbox's messages don't cross wires. */
export const HTML_SANDBOX_MESSAGE_SOURCE = 'evidence-html-sandbox';

/**
 * Bump on ANY wire-format change (init/state-change shape, request kinds). A
 * mismatch makes both sides drop messages until they agree — surfaces a stale
 * cached runtime bundle instead of silently misbehaving.
 */
export const HTML_SANDBOX_PROTOCOL_VERSION = 9;

/**
 * Safe target for `evidence.navigate`: an INTERNAL, absolute app path only.
 * A leading single `/` (rejects `//host` protocol-relative), no backslash
 * (some browsers fold `\` to `/`), and no control chars. This guarantees a
 * same-origin path — it can't be an external URL, a `javascript:`/`data:`
 * scheme (those have no leading `/`), or a protocol-relative host. The parent
 * then routes it through the existing internal-link transform, so a block can
 * only navigate within the app, never off-origin.
 */
export function isSafeInternalPath(path: unknown): path is string {
	if (typeof path !== 'string') return false;
	if (path.length < 1 || path[0] !== '/' || path[1] === '/') return false;
	for (let i = 0; i < path.length; i++) {
		const code = path.charCodeAt(i);
		if (code <= 0x20 || code === 0x5c) return false; // control char / space / backslash
	}
	return true;
}

/**
 * Dimension mode. `autosize` (no `height=`): body height tracks content and
 * the parent grows the iframe via reported height. `fixed` (`height=N`):
 * body fills the iframe so a `height:100%` author element fills the pinned
 * box (canvas/ECharts/Chart.js).
 *
 * The runtime applies one of these as a class on `<body>` (`evidence-html-autosize`
 * / `evidence-html-fixed`) to activate the matching CSS rules baked into
 * `srcdoc`. Carried in `init` for first paint and in `state-change` so a
 * user-edited `height=` attribute updates the mode without forcing an iframe
 * reload — see the srcdoc invariance contract in `sandbox/srcdoc.ts`.
 */
export type HtmlMode = 'autosize' | 'fixed';

/**
 * Minimum rendered height (px) when the author doesn't set `height=`. The block
 * autosizes to its content height (and the width fills the page), so this is
 * only a floor for the brief pre-render moment and for near-empty bodies — it
 * keeps a loading/empty block visible and selectable rather than collapsing to
 * 0px. Any real content taller than this drives the height. Authors that need a
 * fixed box (or a `height:100%` element to fill it) set `height=`.
 */
export const DEFAULT_HTML_MIN_HEIGHT = 40;

/**
 * Author-supplied values from the tag's `variables={…}` attribute, exposed to
 * author code as `evidence.variables`. Primitive-only by design — postMessage
 * serializes the snapshot to the iframe, so values must structured-clone, and
 * the SDK's diff/comparison is shallow.
 */
export type HtmlVariables = Record<string, string | number | boolean | null | undefined>;

/** Theme info exposed to author code as `evidence.theme`. */
export interface HtmlThemeSnapshot {
	mode: SandboxMode;
	/** Categorical color palette (the resolved theme's default series colors). */
	palette: string[];
	/**
	 * Resolved page/card background color. A `sandbox="allow-scripts"` iframe
	 * (no `allow-same-origin`) does NOT composite transparently in Chromium — it
	 * paints white regardless of the document's CSS — so the runtime paints the
	 * body this color to match the host instead of flashing white (loud in dark
	 * mode). Card-aware so a block inside a card matches the card's bg.
	 */
	background: string;
	/**
	 * Resolved foreground (body text) color for the surface this block sits on.
	 * The runtime mirrors this onto the `--evidence-foreground` CSS var so the
	 * baked base stylesheet renders readable text against `background` in either
	 * mode — without it, plain author markup falls back to UA black and vanishes
	 * on a dark themed surface. Card-aware, same as `background`.
	 */
	foreground: string;
	/** Muted/secondary text color (`--evidence-muted-foreground`): captions, table headers. */
	mutedForeground: string;
	/** Border/divider color (`--evidence-border`): the base stylesheet's tables, rules, cards. */
	border: string;
}

/** Filter id → value snapshot, exposed via `evidence.filters.get()`. */
export type HtmlFiltersSnapshot = Record<string, unknown>;

export interface HtmlInitMessage {
	type: 'init';
	/**
	 * The author's raw HTML+JS body. The runtime injects this into the DOM and
	 * executes its scripts only AFTER `window.evidence` is fully populated, so
	 * author code never observes a half-initialized SDK.
	 */
	html: string;
	variables: HtmlVariables;
	theme: HtmlThemeSnapshot;
	filters: HtmlFiltersSnapshot;
	/** True under PDF/screenshot capture — author should call `evidence.ready()`. */
	printing: boolean;
	/** Dimension mode — controls body sizing CSS. See `HtmlMode`. */
	mode: HtmlMode;
}

/**
 * Parent → sandbox push fired whenever page state (filters, theme, or any
 * value flowing through `variables={…}`) changes. Carries fresh snapshots; the
 * runtime updates `evidence.*` and fires the author's `subscribe` /
 * `onThemeChange` / `filters.subscribe` / `onVariablesChange` callbacks. The
 * author re-queries from their callback (pull model) — the parent never
 * re-pushes rows.
 */
export interface HtmlStateChangeMessage {
	type: 'state-change';
	variables: HtmlVariables;
	theme: HtmlThemeSnapshot;
	filters: HtmlFiltersSnapshot;
	mode: HtmlMode;
}

/**
 * Parent → sandbox push fired when the author edits the tag body. The runtime
 * tears down the previous render (resets the SDK's subscriptions and clears the
 * mount) and re-injects the new HTML+JS — so live edits in the editor take
 * effect without the author having to delete and re-add the whole tag.
 */
export interface HtmlChangeMessage {
	type: 'html-change';
	html: string;
}

export type ParentToHtmlMessage = HtmlInitMessage | HtmlStateChangeMessage | HtmlChangeMessage;

/** Correlated request kind: fetch a named query's rows. Payload = `HtmlQueryRequest`. */
export const HTML_QUERY_REQUEST = 'query';

export interface HtmlQueryRequest {
	name: string;
}

/** Reply shape for a `query` request. `evidence.query` returns `rows`. */
export interface HtmlQueryResponse {
	rows: Record<string, unknown>[];
}

/**
 * Fire-and-forget sandbox → parent message: author called
 * `evidence.filters.set(id, value)` to cross-filter the page.
 */
export interface HtmlFilterSetMessage {
	type: 'filter-set';
	id: string;
	value: unknown;
}

/**
 * Fire-and-forget sandbox → parent message: author called
 * `evidence.filters.create(id, value)` to declare a NEW page filter from inside
 * the block (e.g. a hand-rolled dropdown). The parent creates an external
 * filter the block owns for its lifetime, seeded with `value`. Distinct from
 * `filter-set`, which only mutates a filter that already exists.
 */
export interface HtmlFilterCreateMessage {
	type: 'filter-create';
	id: string;
	value: unknown;
	/** Optional column binding — makes the filter auto-apply via the `filters=` prop. */
	column?: string;
}

/**
 * Fire-and-forget sandbox → parent message: author called
 * `evidence.modal.open({ title, html })`. The parent opens its OWN full-page
 * Dialog — backdrop dim, viewport centering, focus trap, scroll-lock, none of
 * which a sandboxed iframe can do to the page — and renders `html` inside it in
 * a NESTED opaque-origin sandbox (a second `{% html %}` runtime with the same
 * CSP + `evidence.*` SDK). The author's markup is never injected into the
 * trusted parent realm: doing so would be XSS into the app and defeat the
 * sandbox. `title` is parent-rendered as plain text in the dialog header.
 */
export interface HtmlModalOpenMessage {
	type: 'modal-open';
	title?: string;
	/** The modal body: HTML+JS, rendered in a nested sandbox (NOT in the parent DOM). */
	html: string;
}

/** Sandbox → parent: author called `evidence.modal.close()`. Has no payload. */
export interface HtmlModalCloseMessage {
	type: 'modal-close';
}

/**
 * Fire-and-forget sandbox → parent message: author called
 * `evidence.navigate(path)` to drill through to another page. `path` is an
 * internal app path (see isSafeInternalPath); the parent routes it through the
 * same internal-link transform + router that markdown links use, so it's
 * scoped to the app and off-origin targets are impossible.
 */
export interface HtmlNavigateMessage {
	type: 'navigate';
	path: string;
}

// ---- Inbound validators ----
//
// The iframe → parent channel is a transferred MessagePort and the SDK that
// produces these messages is our own code, so they should always be
// well-formed. We still validate at the boundary because the column from
// `filter-create` flows into a SQL predicate (built by ExternalFilter.sql)
// and a malformed value would either generate broken SQL or — in a
// hypothetical future where the runtime bundle is compromised — let author
// code inject SQL via what looks like a column name. Pinning column to a
// strict identifier pattern closes that door regardless.

/**
 * SQL identifier whitelist used to validate the `column` option on
 * `filter-create`. Matches `column`, `schema.table.column`, and the
 * underscore/dollar-sign variants real databases allow. Quoted identifiers
 * (`"My Column"`) deliberately fail — Evidence's builtin filters all bind
 * to bare identifiers, and accepting quoted ones would mean re-implementing
 * per-dialect quoting rules in the validator.
 */
const SQL_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_$]*(?:\.[A-Za-z_][A-Za-z0-9_$]*)*$/;

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}

/**
 * Narrow an unknown message to a HtmlFilterSetMessage. Returns null on any
 * shape failure (wrong type, non-string or empty id) so the caller can drop
 * the message and surface a diagnostic. `value` is intentionally `unknown` —
 * filter values are author-controlled and pass through to filter.value as-is;
 * SQL escaping happens inside the filter class.
 */
export function validateFilterSetMessage(message: unknown): HtmlFilterSetMessage | null {
	if (!message || typeof message !== 'object') return null;
	const m = message as Record<string, unknown>;
	if (m.type !== 'filter-set') return null;
	if (!isNonEmptyString(m.id)) return null;
	return { type: 'filter-set', id: m.id, value: m.value };
}

/**
 * Narrow an unknown message to a HtmlFilterCreateMessage. `column` MUST be
 * either omitted or a bare SQL identifier — anything else is rejected.
 * `value` is intentionally unknown, same reasoning as `filter-set`.
 */
export function validateFilterCreateMessage(message: unknown): HtmlFilterCreateMessage | null {
	if (!message || typeof message !== 'object') return null;
	const m = message as Record<string, unknown>;
	if (m.type !== 'filter-create') return null;
	if (!isNonEmptyString(m.id)) return null;
	let column: string | undefined;
	if (m.column !== undefined) {
		if (typeof m.column !== 'string' || !SQL_IDENTIFIER_PATTERN.test(m.column)) {
			return null;
		}
		column = m.column;
	}
	return column !== undefined
		? { type: 'filter-create', id: m.id, value: m.value, column }
		: { type: 'filter-create', id: m.id, value: m.value };
}

/**
 * Narrow an unknown message to a HtmlModalOpenMessage. `content` must be a
 * non-empty string; `title` is kept only if it's a non-empty string. Both are
 * rendered as PLAIN TEXT by the parent, so this only guards the shape — no
 * escaping is needed (a text node can't inject).
 */
export function validateModalOpenMessage(message: unknown): HtmlModalOpenMessage | null {
	if (!message || typeof message !== 'object') return null;
	const m = message as Record<string, unknown>;
	if (m.type !== 'modal-open') return null;
	if (!isNonEmptyString(m.html)) return null;
	return isNonEmptyString(m.title)
		? { type: 'modal-open', title: m.title, html: m.html }
		: { type: 'modal-open', html: m.html };
}

/**
 * Narrow an unknown message to a HtmlNavigateMessage. `path` MUST be a safe
 * internal app path (isSafeInternalPath) — anything that could resolve
 * off-origin (external URL, scheme, protocol-relative `//host`) is rejected
 * here, at the boundary, before the parent hands it to the router.
 */
export function validateNavigateMessage(message: unknown): HtmlNavigateMessage | null {
	if (!message || typeof message !== 'object') return null;
	const m = message as Record<string, unknown>;
	if (m.type !== 'navigate') return null;
	if (!isSafeInternalPath(m.path)) return null;
	return { type: 'navigate', path: m.path };
}
