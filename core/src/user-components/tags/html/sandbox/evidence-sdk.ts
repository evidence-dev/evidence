/**
 * The `evidence.*` SDK exposed to author code inside the `{% html %}` sandbox.
 *
 * Everything lives under a single `evidence` namespace. That's deliberate: bare
 * globals (`query`, `rows`, `data`) would collide with the author's own locals
 * — the canonical footgun. One namespace, no collisions.
 *
 * Data access is PULL: `evidence.query(name)` asks the parent for a named
 * query's rows over the correlated RPC channel. There is no ad-hoc SQL surface
 * (`query.run` was deliberately dropped) — `name` only resolves against queries
 * already declared on the page, so author code can't reach arbitrary data.
 *
 * Reactivity is explicit: the parent pushes a `state-change` whenever filters,
 * theme, or `variables={…}` values change; the runtime calls `applyState`,
 * which fires the author's `subscribe` / `onThemeChange` / `filters.subscribe`
 * / `onVariablesChange` callbacks. The author re-queries from their callback
 * — the parent never re-pushes rows.
 */
import type { SandboxHost } from '../../../sandbox/runtime-bootstrap';
import {
	HTML_QUERY_REQUEST,
	isSafeInternalPath,
	type HtmlFiltersSnapshot,
	type HtmlInitMessage,
	type HtmlQueryResponse,
	type HtmlThemeSnapshot,
	type HtmlVariables
} from './html-protocol';

export interface EvidenceTheme {
	mode: 'light' | 'dark';
	palette: string[];
}

/** Content-box size of the block, in CSS pixels. */
export interface EvidenceSize {
	width: number;
	height: number;
}

export interface EvidenceFilters {
	/** Current filter id → value map (a copy; mutating it does nothing). */
	get(): HtmlFiltersSnapshot;
	/**
	 * Set the value of a filter that ALREADY exists on the page (declared by an
	 * input component, or previously created with `create`). To make a brand-new
	 * filter the block owns — e.g. for a hand-rolled dropdown — call `create`.
	 */
	set(id: string, value: unknown): void;
	/**
	 * Declare a NEW page filter from inside the block, seeded with `value`.
	 * Reference it from any query with `{{ id }}` / `{{ id.selected }}` (quoted)
	 * or `{{ id.literal }}` (raw). The filter lives as long as the block is on
	 * the page; update it later with `set`. If a filter with this id already
	 * exists, `create` defers to it (no-op) — use `set` to change the value.
	 *
	 * Pass `{ column }` to bind the filter to a column so it behaves like a
	 * builtin input: a chart's `filters="id"` prop will auto-apply it, and
	 * `{{ id.filter }}` resolves to a `column = value` predicate. Omit it for a
	 * loose value you reference yourself in a query's `where`.
	 */
	create(id: string, value: unknown, options?: { column?: string }): void;
	/** Subscribe to filter changes. Returns an unsubscribe fn. */
	subscribe(cb: (filters: HtmlFiltersSnapshot) => void): () => void;
}

export interface EvidenceModal {
	/**
	 * Open a full-page modal OVER the report. The PARENT renders the dialog
	 * chrome (backdrop dim, viewport centering, scroll-lock) and mounts `html`
	 * inside it in a NESTED sandbox — a second, isolated `{% html %}` frame with
	 * the same CSP and the same `evidence.*` API — so modal content can be
	 * anything a block can be (styled markup, a chart, its own `evidence.query`).
	 * It is NOT injected into the page; it runs sandboxed, same as your block.
	 * `title` shows as plain text in the dialog header. The modal autosizes to
	 * its content. Close it with the dialog's × / Esc, or `evidence.modal.close()`.
	 */
	open(options: { title?: string; html: string }): void;
	/** Close the modal this block opened. */
	close(): void;
}

export interface EvidenceApi {
	/** Rows for a named query/SQL-file declared on the page. */
	query(name: string): Promise<Record<string, unknown>[]>;
	/**
	 * Values passed on the tag via `{% html variables={ name=$name, … } %}`.
	 * Frontmatter, repeat-scope, filter-bound, and literal expressions all
	 * resolve here. Reactive — `onVariablesChange` fires when any value
	 * changes; `evidence.subscribe` also fires.
	 */
	readonly variables: HtmlVariables;
	/** Fires when any value in `evidence.variables` changes. Returns unsubscribe. */
	onVariablesChange(cb: (variables: HtmlVariables) => void): () => void;
	/** Resolved theme (mode + categorical palette). */
	readonly theme: EvidenceTheme;
	/** Fires on theme/mode change. Returns an unsubscribe fn. */
	onThemeChange(cb: (theme: EvidenceTheme) => void): () => void;
	/** Fires on ANY state change (variables, filters, or theme). Returns unsubscribe. */
	subscribe(cb: () => void): () => void;
	/**
	 * Fires when the block's container WIDTH changes (window/sidebar resize,
	 * layout reflow). Returns an unsubscribe fn. Use it to make charts
	 * responsive: redraw or call the library's resize method from the callback
	 * (e.g. `chart.resize()`, or recompute D3 scales from the new width). SVGs
	 * can often stay responsive with `viewBox` + `width:100%` and skip this.
	 */
	onResize(cb: (size: EvidenceSize) => void): () => void;
	filters: EvidenceFilters;
	/** Open/close a full-page modal the parent renders over the report. */
	modal: EvidenceModal;
	/**
	 * Navigate the app to another page (a drill-through). `path` is an INTERNAL
	 * app path — `/<project>/<page>`, the same form as a markdown link — which
	 * the parent routes through the app router. External URLs, schemes, and
	 * protocol-relative hosts are rejected: same-origin navigation only.
	 */
	navigate(path: string): void;
	/**
	 * Signal that the block has finished its first render. Gates PDF/PNG
	 * capture: a block that contains a `<script>` does NOT auto-complete (its
	 * async draw may still be running), so call this once the first paint is
	 * done or export may capture a blank frame. A safety timeout releases the
	 * frame if you never call it.
	 */
	ready(): void;
}

export interface EvidenceSdk {
	evidence: EvidenceApi;
	/** Called by the runtime when the parent pushes fresh state. */
	applyState(next: {
		variables: HtmlVariables;
		theme: HtmlThemeSnapshot;
		filters: HtmlFiltersSnapshot;
	}): void;
	/** Called by the runtime when the sandbox content box changes size. */
	notifyResize(size: EvidenceSize): void;
	/**
	 * Drop every author-registered callback. Called by the runtime before a
	 * re-injection (live body edit) so subscriptions from the previous render —
	 * whose DOM is about to be wiped — don't pile up or fire against stale state.
	 */
	reset(): void;
}

function themesDiffer(a: HtmlThemeSnapshot, b: HtmlThemeSnapshot): boolean {
	return a.mode !== b.mode || a.palette.join(',') !== b.palette.join(',');
}

function snapshotsDiffer(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
	const ak = Object.keys(a);
	const bk = Object.keys(b);
	if (ak.length !== bk.length) return true;
	return ak.some((k) => a[k] !== b[k]);
}

export function createEvidenceSdk(host: SandboxHost, init: HtmlInitMessage): EvidenceSdk {
	let variables: HtmlVariables = init.variables;
	let theme: HtmlThemeSnapshot = init.theme;
	let filters: HtmlFiltersSnapshot = init.filters;

	const stateSubs = new Set<() => void>();
	// One-time teaching warning: a variables change arriving with NO listener
	// usually means the author copied values into constants at load time.
	let warnedUnobservedVariables = false;
	const themeSubs = new Set<(t: EvidenceTheme) => void>();
	const filterSubs = new Set<(f: HtmlFiltersSnapshot) => void>();
	const variableSubs = new Set<(v: HtmlVariables) => void>();
	const resizeSubs = new Set<(s: EvidenceSize) => void>();

	const themeView = (): EvidenceTheme => ({ mode: theme.mode, palette: [...theme.palette] });

	const evidence: EvidenceApi = {
		async query(name: string): Promise<Record<string, unknown>[]> {
			// Separate messages for the two failure shapes so the diagnostics
			// feed tells the AI agent / author what they actually did wrong:
			// `query(undefined)` (a typo or an unresolved variable) reads very
			// differently from `query("")` (an explicit empty string), even
			// though both used to share one "must be a non-empty string"
			// message and look identical in the error overlay.
			if (typeof name !== 'string') {
				const got = name === null ? 'null' : typeof name;
				throw new Error(
					`evidence.query(name): \`name\` must be a string (got ${got}). Pass the query name, e.g. evidence.query("orders").`
				);
			}
			if (!name.trim()) {
				throw new Error(
					'evidence.query(name): `name` must not be empty. Pass the query name, e.g. evidence.query("orders").'
				);
			}
			const response = await host.request<HtmlQueryResponse>(HTML_QUERY_REQUEST, { name });
			return response?.rows ?? [];
		},
		get variables() {
			// Shallow copy so author mutation can't corrupt SDK state (matches
			// filters.get() / theme).
			return { ...variables };
		},
		onVariablesChange(cb) {
			variableSubs.add(cb);
			return () => variableSubs.delete(cb);
		},
		get theme() {
			return themeView();
		},
		onThemeChange(cb) {
			themeSubs.add(cb);
			return () => themeSubs.delete(cb);
		},
		subscribe(cb) {
			stateSubs.add(cb);
			return () => stateSubs.delete(cb);
		},
		onResize(cb) {
			resizeSubs.add(cb);
			return () => resizeSubs.delete(cb);
		},
		filters: {
			get: () => ({ ...filters }),
			set: (id, value) => {
				// Validate eagerly (mirrors query) — author code is plain JS, so
				// a non-string id would otherwise post a malformed filter-set
				// message the parent has to defensively discard.
				if (typeof id !== 'string' || !id.trim()) {
					throw new Error('evidence.filters.set(id, value): id must be a non-empty string');
				}
				host.post({ type: 'filter-set', id, value });
			},
			create: (id, value, options) => {
				if (typeof id !== 'string' || !id.trim()) {
					throw new Error('evidence.filters.create(id, value): id must be a non-empty string');
				}
				// `column`, when present, flows into a SQL predicate built by the
				// parent's ExternalFilter — so we constrain it to a bare SQL
				// identifier here. Throwing at the call site gives the author
				// (or the AI agent generating the code) a real error to read,
				// rather than a silently-dropped filter-create message and a
				// puzzle to debug. The parent re-validates at the message
				// boundary as defense in depth.
				let column: string | undefined;
				if (options?.column !== undefined) {
					if (
						typeof options.column !== 'string' ||
						!/^[A-Za-z_][A-Za-z0-9_$]*(?:\.[A-Za-z_][A-Za-z0-9_$]*)*$/.test(options.column)
					) {
						throw new Error(
							`evidence.filters.create("${id}", …, { column }): column must be a bare SQL identifier (letters, digits, underscores, and dots), got: ${JSON.stringify(options.column)}`
						);
					}
					column = options.column;
				}
				host.post({
					type: 'filter-create',
					id,
					value,
					...(column !== undefined ? { column } : {})
				});
			},
			subscribe(cb) {
				filterSubs.add(cb);
				return () => filterSubs.delete(cb);
			}
		},
		modal: {
			open: (options) => {
				// Validate eagerly (mirrors filters.set) so the author/agent gets a
				// real error rather than a silently-dropped message.
				const html = options?.html;
				if (typeof html !== 'string' || !html.trim()) {
					throw new Error(
						'evidence.modal.open({ html }): html must be a non-empty string (rendered in a nested sandbox).'
					);
				}
				const title = typeof options?.title === 'string' ? options.title : undefined;
				host.post({ type: 'modal-open', html, ...(title !== undefined ? { title } : {}) });
			},
			close: () => {
				host.post({ type: 'modal-close' });
			}
		},
		navigate: (path) => {
			// Validate eagerly so the author/agent gets a real error, not a
			// silently-dropped message. The parent re-validates at the boundary.
			if (!isSafeInternalPath(path)) {
				throw new Error(
					`evidence.navigate(path): path must be an internal app path beginning with "/" (e.g. "/my-project/reports/detail") — no external URLs, schemes, or "//". Got: ${JSON.stringify(path)}`
				);
			}
			host.post({ type: 'navigate', path });
		},
		ready() {
			host.post({ type: 'rendered' });
		}
	};

	function applyState(next: {
		variables: HtmlVariables;
		theme: HtmlThemeSnapshot;
		filters: HtmlFiltersSnapshot;
	}): void {
		const themeChanged = themesDiffer(theme, next.theme);
		const filtersChanged = snapshotsDiffer(filters, next.filters);
		const variablesChanged = snapshotsDiffer(variables, next.variables);

		const prevVariables = variables;
		variables = next.variables;
		theme = next.theme;
		filters = next.filters;

		if (themeChanged) {
			const view = themeView();
			for (const cb of themeSubs) cb(view);
		}
		if (filtersChanged) {
			const view = { ...filters };
			for (const cb of filterSubs) cb(view);
		}
		if (variablesChanged) {
			const view = { ...variables };
			for (const cb of variableSubs) cb(view);
			// The #1 reactivity trap: `const speed = evidence.variables.speed` at
			// load, then wonder why an attribute/filter change does nothing. The
			// change DID arrive — nobody was listening. console.warn is forwarded
			// to the diagnostics feed, so both authors and the AI agent see it.
			if (!warnedUnobservedVariables && variableSubs.size === 0 && stateSubs.size === 0) {
				warnedUnobservedVariables = true;
				const changedKeys = Object.keys({ ...prevVariables, ...view }).filter(
					(k) => prevVariables[k] !== view[k]
				);
				console.warn(
					`evidence.variables changed (${changedKeys.join(', ')}) but this block has no listener. ` +
						'Values copied into constants at load time (e.g. `const speed = evidence.variables.speed`) do NOT update. ' +
						'Either re-read evidence.variables inside your render/animation loop (it is always current), ' +
						'or register evidence.onVariablesChange((vars) => { /* re-render */ }). ' +
						'Ignore this if you already read evidence.variables live on each frame.'
				);
			}
		}
		// `subscribe` fires on ANY change so authors can use one callback — but
		// only when SOMETHING actually changed. A parent reconnect re-sends the
		// init payload verbatim; without this guard every reconnect would spur a
		// spurious re-render even though nothing moved.
		if (themeChanged || filtersChanged || variablesChanged) {
			for (const cb of stateSubs) cb();
		}
	}

	function notifyResize(size: EvidenceSize): void {
		for (const cb of resizeSubs) cb(size);
	}

	function reset(): void {
		stateSubs.clear();
		themeSubs.clear();
		filterSubs.clear();
		variableSubs.clear();
		resizeSubs.clear();
	}

	return { evidence, applyState, notifyResize, reset };
}
