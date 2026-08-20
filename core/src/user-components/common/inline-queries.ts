import { SvelteMap } from 'svelte/reactivity';
import { interpolateQueryStrings } from '../../interpolate-query-strings';
import type { Filters } from '../../Filters.svelte';
import { getContext, setContext } from 'svelte';
import { browser } from '../../shims/env';
// posthog is only initialized in Evidence Studio; these captures no-op in the CLI.
import posthog from 'posthog-js';
import { logger } from '../../shims/logger';
import type { SqlDialect } from '../../sql-dialect';
import { defaultDialect } from '../../sql-dialect';
import { dirOfPath, resolveProjectReference } from './resolve-reference';

export type InlineQueriesDependencies = {
	filterContexts: (Filters | undefined)[] | undefined;
};

type SerializedInlineQueries = {
	[name: string]: string;
};

export type SqlFiles = Record<string, string>;

/**
 * Options for the new project-root reference model. When `useRelativeResolution`
 * is true, sql-file references resolve "from here / from root" (see
 * `resolve-reference.ts`) against a single full-path `#sqlFiles` map keyed by
 * project-root-relative path. When false (the default), resolution is exactly
 * the legacy behavior: pages-scoped `#sqlFiles` + leading-slash `#projectSqlFiles`.
 */
export type InlineQueriesResolutionOptions = {
	/** Full project-root-relative path of the page being rendered (e.g. `pages/reports/q4`). */
	basePath?: string;
	/** Opt into the new "from here / from root" resolution model. */
	useRelativeResolution?: boolean;
};

export class InlineQueries {
	readonly #inlineQueries: SvelteMap<string, string>;
	readonly #sqlFiles: SvelteMap<string, string>;
	/** SQL files keyed by project-root-relative path (for leading-slash resolution) */
	readonly #projectSqlFiles: SvelteMap<string, string>;
	/**
	 * Reactive holder for resolution state — the current page's full path (`base`)
	 * and whether the new "from here / from root" model is active (`useRelative`).
	 * Both must be reactive so the editor can update them as the user navigates or
	 * after a migration flips the branch to the new structure, without recreating
	 * the context.
	 */
	readonly #pathState: SvelteMap<string, string>;

	constructor(
		private readonly deps: InlineQueriesDependencies,
		serialized?: SerializedInlineQueries,
		sqlFiles?: SqlFiles,
		projectSqlFiles?: SqlFiles,
		options?: InlineQueriesResolutionOptions
	) {
		this.#inlineQueries = new SvelteMap(Object.entries(serialized ?? {}));
		this.#sqlFiles = new SvelteMap(
			Object.entries(sqlFiles ?? {}).map(([path, content]) => [
				path,
				stripTrailingSemicolons(content)
			])
		);
		this.#projectSqlFiles = new SvelteMap(
			Object.entries(projectSqlFiles ?? {}).map(([path, content]) => [
				path,
				stripTrailingSemicolons(content)
			])
		);
		this.#pathState = new SvelteMap();
		if (options?.basePath) this.#pathState.set('base', options.basePath);
		this.#pathState.set('useRelative', options?.useRelativeResolution ? 'true' : 'false');
	}

	get #useRelativeResolution(): boolean {
		return this.#pathState.get('useRelative') === 'true';
	}

	/** Directory of the current page, used as the base for relative refs. */
	get #baseDir(): string {
		return dirOfPath(this.#pathState.get('base') ?? '');
	}

	/** Resolve a raw reference to a full project-root path (relative mode only). */
	#resolve(name: string): string {
		return resolveProjectReference(name, this.#baseDir);
	}

	/**
	 * Update the page path that relative references resolve against (used when
	 * the editor switches the open page without recreating the context).
	 */
	setBasePath(basePath: string) {
		if (this.#pathState.get('base') === basePath) return;
		this.#pathState.set('base', basePath);
	}

	/**
	 * Update whether the new "from here / from root" resolution model is active.
	 * The editor calls this reactively so a mid-session structure change (e.g. a
	 * migration on the current branch, or switching between a legacy and a
	 * new-structure branch) takes effect without recreating the context.
	 */
	setUseRelativeResolution(useRelativeResolution: boolean) {
		const next = useRelativeResolution ? 'true' : 'false';
		if (this.#pathState.get('useRelative') === next) return;
		this.#pathState.set('useRelative', next);
	}

	/**
	 * Update SQL files (used when data changes reactively).
	 *
	 * Diffs the incoming set against the current map and only writes changed
	 * entries. `SvelteMap.set()` notifies subscribers unconditionally even when
	 * the value is identical, so a naive `clear() + N×set()` causes O(N) spurious
	 * reactive invalidations on every call — which fan out across every Query
	 * derived that reads from this map and was a major contributor to a freeze
	 * on heavy editor pages.
	 */
	setSqlFiles(sqlFiles: SqlFiles) {
		const next: Record<string, string> = {};
		for (const [path, content] of Object.entries(sqlFiles)) {
			next[path] = stripTrailingSemicolons(content);
		}
		for (const key of [...this.#sqlFiles.keys()]) {
			if (!Object.prototype.hasOwnProperty.call(next, key)) this.#sqlFiles.delete(key);
		}
		for (const path of Object.keys(next)) {
			if (this.#sqlFiles.get(path) !== next[path]) {
				this.#sqlFiles.set(path, next[path]);
			}
		}
	}

	/**
	 * Update project-root SQL files (e.g., from the project-root `queries/` directory).
	 * Referenced via the leading-slash convention (e.g. `/queries/orders`).
	 *
	 * Diff-based for the same reason as `setSqlFiles`.
	 */
	setProjectSqlFiles(sqlFiles: SqlFiles) {
		const next: Record<string, string> = {};
		for (const [path, content] of Object.entries(sqlFiles)) {
			next[path] = stripTrailingSemicolons(content);
		}
		for (const key of [...this.#projectSqlFiles.keys()]) {
			if (!Object.prototype.hasOwnProperty.call(next, key)) this.#projectSqlFiles.delete(key);
		}
		for (const path of Object.keys(next)) {
			if (this.#projectSqlFiles.get(path) !== next[path]) {
				this.#projectSqlFiles.set(path, next[path]);
			}
		}
	}

	/**
	 * Update a single SQL file (used when editing a SQL file and previewing another page)
	 */
	setSqlFile(path: string, content: string) {
		const key = path.trim();
		const next = stripTrailingSemicolons(content);
		if (this.#sqlFiles.get(key) === next) return;
		this.#sqlFiles.set(key, next);
	}

	/**
	 * Check if a name refers to a SQL file (not an inline query)
	 */
	isSqlFile(name: string): boolean {
		const cleanName = name.trim();
		if (this.#useRelativeResolution) {
			return this.#sqlFiles.has(this.#resolve(cleanName));
		}
		if (cleanName.startsWith('/')) {
			return this.#projectSqlFiles.has(cleanName.slice(1));
		}
		return this.#sqlFiles.has(cleanName);
	}

	set(name: string, expression: string) {
		const cleanName = name.trim();
		const cleanExpression = stripTrailingSemicolons(expression);
		// Value-equality guard: `SvelteMap.set()` bumps its version (and
		// notifies every subscriber that reads via get/has/iter) even when the
		// value is identical. Markdoc's transform pass runs N times per page
		// load and rewrites every inline query each time; without this guard
		// each transform fans O(queries × subscribers) spurious invalidations
		// out across every reactive that reads from inline queries — enough
		// microtask traffic to visually freeze the editor preview on heavy
		// pages.
		if (this.#inlineQueries.get(cleanName) === cleanExpression) return;
		this.#inlineQueries.set(cleanName, cleanExpression);
	}

	getInterpolated(name: string, dialect: SqlDialect = defaultDialect): string | undefined {
		const cleanName = name.trim();

		// New project-root model: resolve sql-file refs "from here / from root"
		// against the single full-path map; otherwise fall through to inline queries.
		if (this.#useRelativeResolution) {
			const target = this.#resolve(cleanName);
			const sqlFileContent = this.#sqlFiles.get(target);
			if (sqlFileContent !== undefined) {
				const fileAlias = dialect.quoteAlias(`__ev_inline_${target.replace(/\//g, '_')}`);
				return `(${sqlFileContent}) ${fileAlias}`;
			}
			const inlineAlias = dialect.quoteAlias(`__ev_inline_${cleanName.replace(/\//g, '_')}`);
			return this.#interpolateInlineQuery(this.#inlineQueries.get(cleanName), name, inlineAlias);
		}

		// Subquery alias for `FROM (...) alias`. Two constraints:
		//   1) BigQuery treats `"foo"` as a string literal, so the alias must be
		//      quoted with the dialect's identifier quoting (backticks on BQ,
		//      double quotes on CH/SF).
		//   2) BigQuery resolves a bare reference to the table-alias name as the
		//      whole row STRUCT, not as a same-named column inside the subquery.
		//      e.g. `SELECT active_users FROM (... AS active_users) active_users`
		//      returns RECORD<active_users INT64> rows instead of INT64. Prefix
		//      the alias so it can't collide with any user-chosen column name.
		const aliasBase = cleanName.startsWith('/') ? cleanName.slice(1) : cleanName;
		const alias = dialect.quoteAlias(`__ev_inline_${aliasBase.replace(/\//g, '_')}`);

		// Leading-slash convention: resolve from the project root (new structure).
		if (cleanName.startsWith('/')) {
			const projectSqlContent = this.#projectSqlFiles.get(cleanName.slice(1));
			if (projectSqlContent !== undefined) {
				return `(${projectSqlContent}) ${alias}`;
			}
			// Fall through to pages-scoped lookup for backwards compat.
		}

		// Check SQL files first - they don't support variable interpolation
		const sqlFileContent = this.#sqlFiles.get(cleanName);
		if (sqlFileContent !== undefined) {
			return `(${sqlFileContent}) ${alias}`;
		}

		return this.#interpolateInlineQuery(this.#inlineQueries.get(cleanName), name, alias);
	}

	/**
	 * Wrap an inline query (with filter interpolation) into `(...) alias`.
	 * Shared by the legacy and relative-resolution paths.
	 */
	#interpolateInlineQuery(
		query: string | undefined,
		name: string,
		alias: string
	): string | undefined {
		if (query === undefined) {
			return undefined;
		}

		// Resolvability gate: a surviving `{{ $… }}` token means a value this
		// context simply doesn't have — a custom-component attribute with no
		// `preview:`/`default:` while editing the file standalone, or one the
		// call site never passed. Executing anyway sends knowingly-broken SQL
		// to the warehouse and the author gets a raw parse error
		// (`Syntax error … = ''`) with no path back to the cause. Refuse with
		// the cause and every fix instead. ($-tokens only: filter/query refs
		// have their own interpolation + error paths below.)
		//
		// SCOPED TO CUSTOM-COMPONENT QUERIES ONLY. A component's query carries
		// the `<tag>:<query>` scope marker (`:` is illegal in any other query
		// identifier), and components are new in this release, so throwing on
		// them can't regress existing content. Page and PARTIAL queries
		// legitimately carry caller-scoped `{{ $var }}` tokens — a page's own
		// frontmatter, or a partial's `variables=` passed at the call site,
		// which need NOT appear in the partial's own frontmatter — so they keep
		// the pre-existing pass-through behavior instead of a hard throw.
		// Scan with comments stripped: a $-token in `-- {{ $todo }}` doesn't
		// affect execution. String literals are NOT stripped —
		// `where cat = '{{ $category }}'` is how a string attribute reaches SQL.
		const isComponentScopedQuery = name.includes(':');
		const scannable = query.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
		const unresolved = isComponentScopedQuery
			? [...scannable.matchAll(/\{\{\s*(\$[\w.]+)[^}]*\}\}/g)].map((m) => m[1])
			: [];
		if (unresolved.length > 0) {
			const tokens = [...new Set(unresolved)].join(', ');
			throw new Error(
				`Query "${name}" was not executed: it still contains unresolved values (${tokens}). ` +
					'These resolve from context this view does not have. If this is a custom component ' +
					'edited standalone, give each attribute a `preview:` value (authoring-only fixture) or a ' +
					'`default:` in its frontmatter; if a partial, values arrive via variables= at the call ' +
					'site; if a page, define the frontmatter variable. The query will run normally wherever ' +
					'the values exist.'
			);
		}

		// If filter contexts are provided, interpolate filter values
		if (this.deps.filterContexts && this.deps.filterContexts.length > 0) {
			const validFilterContexts = this.deps.filterContexts.filter(
				(ctx): ctx is Filters => ctx !== undefined
			);

			// Track filter changes by accessing their toString() method
			// This ensures the derived value updates when filters change
			// TODO is this necessary?
			const _ = validFilterContexts.map((ctx) => ctx.toString());

			const result = interpolateQueryStrings(query, validFilterContexts, this);

			// If there are template errors, check if they're related to missing filter IDs
			// during navigation/cleanup and handle gracefully
			if (result.errors.length > 0) {
				// 'is not a filter' is the SQL-file suggester's variant of a
				// missing-filter error — same teardown race, same graceful path.
				const hasMissingFilterErrors = result.errors.some(
					(error) =>
						error.includes('Missing filter ID') ||
						error.includes('Missing filter property') ||
						error.includes('is not a filter')
				);

				if (hasMissingFilterErrors) {
					logger.warn(
						{ name },
						'Filter context unavailable during navigation, using interpolated SQL'
					);
					// Use best-effort interpolation even when filters are temporarily unavailable.
					// Returning raw template syntax ({{...}}, [[...]]) can cause SQL parse failures
					// in dependent queries and leave components in an error state until refresh.
					return `(${result.sql}) ${alias}`;
				}

				logger.error({ name, errors: result.errors }, 'Failed to interpolate inline query');
				if (browser)
					posthog.capture('InlineQueries-interpolate-failed', { name, errors: result.errors });
				throw new Error(`Template errors: ${result.errors.join(', ')}`);
			}

			return `(${result.sql}) ${alias}`;
		}

		// Fallback to original behavior if no filter contexts
		return `(${query}) ${alias}`;
	}

	getRaw(name: string): string | undefined {
		const cleanName = name.trim();

		if (this.#useRelativeResolution) {
			const sqlFileContent = this.#sqlFiles.get(this.#resolve(cleanName));
			if (sqlFileContent !== undefined) {
				return sqlFileContent;
			}
			return this.#inlineQueries.get(cleanName);
		}

		// Leading-slash convention: resolve from the project root (new structure).
		if (cleanName.startsWith('/')) {
			const projectSqlContent = this.#projectSqlFiles.get(cleanName.slice(1));
			if (projectSqlContent !== undefined) {
				return projectSqlContent;
			}
		}

		// Check SQL files first
		const sqlFileContent = this.#sqlFiles.get(cleanName);
		if (sqlFileContent !== undefined) {
			return sqlFileContent;
		}
		return this.#inlineQueries.get(cleanName);
	}

	getAllNames(): string[] {
		return [
			...Array.from(this.#inlineQueries.keys()),
			...Array.from(this.#sqlFiles.keys()),
			...Array.from(this.#projectSqlFiles.keys()).map((k) => `/${k}`)
		];
	}

	/**
	 * Names an AUTHOR may reference — excludes component-scoped queries.
	 *
	 * `:` is the reserved scope marker: a custom component's inline queries
	 * register as `<tag>:<name>` (see `namespaceComponentQueries`) and are
	 * private to that component. Author-facing surfaces (autocomplete
	 * suggestions, tableExists validation) must enumerate THIS list so a
	 * component's queries are neither offered nor accepted outside it;
	 * execution paths (`getRaw`/`getInterpolated`) intentionally keep resolving
	 * scoped names, since the component's own rewritten references use them.
	 * A validator rejects user-typed `:` in query names, so scoped names can
	 * only be system-minted.
	 */
	getPublicNames(): string[] {
		return this.getAllNames().filter((name) => !name.includes(':'));
	}

	remove(name: string) {
		const cleanName = name.trim();
		if (!this.#inlineQueries.has(cleanName)) return;
		this.#inlineQueries.delete(cleanName);
	}

	toSerialized(): SerializedInlineQueries {
		return Object.fromEntries(this.#inlineQueries.entries());
	}
}

export function stripTrailingSemicolons(sql: string): string {
	return sql.replace(/;+\s*$/, '');
}

const INLINE_QUERIES_CONTEXT_KEY = Symbol('INLINE_QUERIES_CONTEXT');

export const createInlineQueriesContext = (
	deps: InlineQueriesDependencies,
	serialized?: SerializedInlineQueries,
	sqlFiles?: SqlFiles,
	projectSqlFiles?: SqlFiles,
	options?: InlineQueriesResolutionOptions
): InlineQueries => {
	const context = new InlineQueries(deps, serialized, sqlFiles, projectSqlFiles, options);
	setContext(INLINE_QUERIES_CONTEXT_KEY, context);
	return context;
};

export const getInlineQueriesContext = (): InlineQueries | undefined => {
	return getContext<InlineQueries | undefined>(INLINE_QUERIES_CONTEXT_KEY);
};
