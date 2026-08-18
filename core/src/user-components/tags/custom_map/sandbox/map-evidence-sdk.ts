/**
 * The `evidence.*` SDK exposed to author code inside the `{% custom_map %}`
 * sandbox. Forked from the `{% html %}` block's SDK (the proven model) and
 * trimmed to what a map needs: pull-model data, page-filter read + write-back,
 * variables, theme, resize, and a teardown hook. Modal/navigate are omitted for
 * now (see the html block if they're needed later).
 *
 * The write-back direction (`filters.set`/`filters.create`) is the reason maps
 * use this model rather than custom_echart's push model: a map generates query
 * inputs client-side (viewport bbox, clicked feature) that must flow back into
 * page SQL for a server-side re-query. A push-model parent can't see those.
 *
 * Reactivity is explicit: the parent pushes a `state-change` when filters,
 * theme, or `variables={…}` change; `applyState` fires the author's
 * `subscribe` / `onThemeChange` / `filters.subscribe` / `onVariablesChange`
 * callbacks. The author re-queries from their callback — rows are never pushed.
 */
import type { SandboxHost } from '../../../sandbox/runtime-bootstrap';
import {
	MAP_QUERY_REQUEST,
	type InitMessage,
	type MapFiltersSnapshot,
	type MapQueryResponse,
	type MapThemeSnapshot,
	type MapVariables
} from './sandbox-protocol';

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
	get(): MapFiltersSnapshot;
	/** Set the value of a filter that ALREADY exists on the page. */
	set(id: string, value: unknown): void;
	/**
	 * Declare a NEW page filter from inside the block, seeded with `value`.
	 * Reference it from any query with `{{ id }}` (quoted) or `{{ id.literal }}`
	 * (raw). Pass `{ column }` to bind it to a column so `filters="id"` on other
	 * components auto-applies it. This is the viewport/click → server re-query path.
	 */
	create(id: string, value: unknown, options?: { column?: string }): void;
	/** Subscribe to filter changes. Returns an unsubscribe fn. */
	subscribe(cb: (filters: MapFiltersSnapshot) => void): () => void;
}

export interface EvidenceMapApi {
	/** Rows for a named query/SQL-file declared on the page. */
	query(name: string): Promise<Record<string, unknown>[]>;
	/** Values passed on the tag via `variables={…}`. Reactive via onVariablesChange. */
	readonly variables: MapVariables;
	/** Fires when any value in `evidence.variables` changes. Returns unsubscribe. */
	onVariablesChange(cb: (variables: MapVariables) => void): () => void;
	/** Resolved theme (mode + categorical palette) — pick a basemap style from `mode`. */
	readonly theme: EvidenceTheme;
	/** Fires on theme/mode change. Returns unsubscribe. Call `map.setStyle(...)` here for dark mode. */
	onThemeChange(cb: (theme: EvidenceTheme) => void): () => void;
	/** Fires on ANY state change (variables, filters, theme). Returns unsubscribe. */
	subscribe(cb: () => void): () => void;
	/** Fires when the block's size changes. Call `map.resize()` in the callback. Returns unsubscribe. */
	onResize(cb: (size: EvidenceSize) => void): () => void;
	filters: EvidenceFilters;
	/** Register cleanup (e.g. `() => map.remove()`) run before the map re-renders on an edit. */
	onTeardown(cb: () => void): void;
	/** Signal the first render is done, so PDF/PNG export captures a finished frame. */
	ready(): void;
}

export interface MapEvidenceSdk {
	evidence: EvidenceMapApi;
	applyState(next: {
		variables: MapVariables;
		theme: MapThemeSnapshot;
		filters: MapFiltersSnapshot;
	}): void;
	notifyResize(size: EvidenceSize): void;
	/** Fire author teardown callbacks (before a re-render). */
	runTeardown(): void;
	/** Drop every author-registered callback (before a re-render). */
	reset(): void;
}

function themesDiffer(a: MapThemeSnapshot, b: MapThemeSnapshot): boolean {
	return a.mode !== b.mode || a.palette.join(',') !== b.palette.join(',');
}

function snapshotsDiffer(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
	const ak = Object.keys(a);
	const bk = Object.keys(b);
	if (ak.length !== bk.length) return true;
	return ak.some((k) => a[k] !== b[k]);
}

const SQL_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_$]*(?:\.[A-Za-z_][A-Za-z0-9_$]*)*$/;

export function createMapEvidenceSdk(host: SandboxHost, init: InitMessage): MapEvidenceSdk {
	let variables: MapVariables = init.variables;
	let theme: MapThemeSnapshot = init.theme;
	let filters: MapFiltersSnapshot = init.filters;

	const stateSubs = new Set<() => void>();
	const themeSubs = new Set<(t: EvidenceTheme) => void>();
	const filterSubs = new Set<(f: MapFiltersSnapshot) => void>();
	const variableSubs = new Set<(v: MapVariables) => void>();
	const resizeSubs = new Set<(s: EvidenceSize) => void>();
	const teardownCbs = new Set<() => void>();

	const themeView = (): EvidenceTheme => ({ mode: theme.mode, palette: [...theme.palette] });

	const evidence: EvidenceMapApi = {
		async query(name: string): Promise<Record<string, unknown>[]> {
			if (typeof name !== 'string') {
				const got = name === null ? 'null' : typeof name;
				throw new Error(
					`evidence.query(name): \`name\` must be a string (got ${got}). Pass the query name, e.g. evidence.query("locations").`
				);
			}
			if (!name.trim()) {
				throw new Error(
					'evidence.query(name): `name` must not be empty. Pass the query name, e.g. evidence.query("locations").'
				);
			}
			const response = await host.request<MapQueryResponse>(MAP_QUERY_REQUEST, { name });
			return response?.rows ?? [];
		},
		get variables() {
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
				if (typeof id !== 'string' || !id.trim()) {
					throw new Error('evidence.filters.set(id, value): id must be a non-empty string');
				}
				host.post({ type: 'filter-set', id, value });
			},
			create: (id, value, options) => {
				if (typeof id !== 'string' || !id.trim()) {
					throw new Error('evidence.filters.create(id, value): id must be a non-empty string');
				}
				let column: string | undefined;
				if (options?.column !== undefined) {
					if (typeof options.column !== 'string' || !SQL_IDENTIFIER_PATTERN.test(options.column)) {
						throw new Error(
							`evidence.filters.create("${id}", …, { column }): column must be a bare SQL identifier, got: ${JSON.stringify(options.column)}`
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
		onTeardown(cb) {
			if (typeof cb === 'function') teardownCbs.add(cb);
		},
		ready() {
			host.post({ type: 'rendered' });
		}
	};

	function applyState(next: {
		variables: MapVariables;
		theme: MapThemeSnapshot;
		filters: MapFiltersSnapshot;
	}): void {
		const themeChanged = themesDiffer(theme, next.theme);
		const filtersChanged = snapshotsDiffer(filters, next.filters);
		const variablesChanged = snapshotsDiffer(variables, next.variables);

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
		}
		if (themeChanged || filtersChanged || variablesChanged) {
			for (const cb of stateSubs) cb();
		}
	}

	function notifyResize(size: EvidenceSize): void {
		for (const cb of resizeSubs) cb(size);
	}

	function runTeardown(): void {
		for (const cb of teardownCbs) {
			try {
				cb();
			} catch {
				/* author teardown best-effort */
			}
		}
		teardownCbs.clear();
	}

	function reset(): void {
		stateSubs.clear();
		themeSubs.clear();
		filterSubs.clear();
		variableSubs.clear();
		resizeSubs.clear();
	}

	return { evidence, applyState, notifyResize, runTeardown, reset };
}
