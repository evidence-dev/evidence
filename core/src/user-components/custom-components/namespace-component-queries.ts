import Markdoc, { type Node, type RenderableTreeNode } from '@markdoc/markdoc';
import { tagNameForComponentPath } from './build-custom-tags';

/**
 * Scope prefix for a component's inline queries: `<tag name>:`. A component's
 * queries register under `my_widget:sales` instead of the bare `sales`, so two
 * components can each define `sales` without colliding and the page can't reach
 * a component's query by its bare name. Tag names are unique per project
 * (colliding ones are dropped from the registry), so `<tag>:` is unique for
 * every RENDERED component, and `:` can't appear in a tag or query identifier,
 * so `<tag>:<query>` is unambiguous. The name reads cleanly in errors
 * (`my_widget:sales`), which is the intended debugging surface.
 */
export function namespacePrefix(componentPath: string): string {
	return `${tagNameForComponentPath(componentPath)}:`;
}

function walk(node: Node, visit: (n: Node) => void): void {
	visit(node);
	if (node.children) {
		for (const child of node.children) walk(child, visit);
	}
}

/**
 * Rewrite a component query's `{{ other_local_query }}` references to the scoped
 * name, so query-to-query chaining WITHIN a component keeps working after the
 * definitions are renamed.
 *
 * This is exact, not a heuristic: Evidence references another query ONLY through
 * an explicit `{{ … }}` block (bare `FROM foo` is a literal table, never a query
 * ref — see docs/features/sql-files). So we rewrite the token inside a `{{ }}`
 * block, and only when it's a bare local-query name — not a filter reference
 * (`{{ f.prop }}`, has a dot), a frontmatter var (`{{ $v }}`), or a sql-file
 * path (`{{ /queries/x }}`, not a local name). A column named `month` is a bare
 * word, never `{{ month }}`, so it can't be touched.
 */
export function rewriteTemplateReferences(
	sql: string,
	rename: ReadonlyMap<string, string>
): string {
	return sql.replace(/\{\{([^{}]+)\}\}/g, (full, inner: string) => {
		const pipe = inner.indexOf('|'); // `{{ query | fallback }}`
		const token = (pipe === -1 ? inner : inner.slice(0, pipe)).trim();
		if (!token || token.startsWith('$') || token.includes('.')) return full;
		const renamed = rename.get(token);
		if (!renamed) return full;
		return full.replace(token, renamed);
	});
}

/**
 * Collect the names of the inline queries a component body DEFINES (its sql
 * fences). These are the only names any scoping pass may touch.
 */
export function collectLocalQueryNames(body: Node): Set<string> {
	const names = new Set<string>();
	walk(body, (n) => {
		if (n.type === 'fence' && typeof n.attributes?.meta === 'string') {
			const name = n.attributes.meta.trim();
			if (name) names.add(name);
		}
	});
	return names;
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rewrite `evidence.query("<local name>")` string-literal calls in a
 * component's RAW SOURCE to the scoped name. Needed because an `{% html %}`
 * block's body reaches the sandbox as a byte-faithful slice of the source
 * text (not via the AST), so AST-level renaming can't reach it — and the
 * sandbox resolves `evidence.query(name)` against the page-wide store, where
 * the component's query only exists under its scoped name. Without this, an
 * html block inside a component can never reach the component's own query:
 * the lookup polls to timeout and dies as an opaque sandbox "Script error."
 * (battle-test finding).
 *
 * Exactly-delimited like every other rewritten form: a literal
 * `evidence.query(` call with a quoted name that matches a LOCAL query.
 * Dynamic names (`evidence.query(someVar)`) can't be statically scoped and
 * fail visibly at runtime with the query-not-found message.
 */
export function rewriteEvidenceQueryCalls(
	source: string,
	rename: ReadonlyMap<string, string>
): string {
	let out = source;
	for (const [from, to] of rename) {
		out = out.replace(
			new RegExp(`(evidence\\.query\\(\\s*)(['"\`])${escapeRegExp(from)}\\2`, 'g'),
			`$1$2${to}$2`
		);
	}
	return out;
}

/**
 * Build the local-name → scoped-name map for a component body. Shared by the
 * AST pass below and the source-level `rewriteEvidenceQueryCalls` pre-pass.
 */
export function buildQueryRenameMap(
	localNames: ReadonlySet<string>,
	componentPath: string
): Map<string, string> {
	const prefix = namespacePrefix(componentPath);
	const rename = new Map<string, string>();
	for (const name of localNames) rename.set(name, prefix + name);
	return rename;
}

/**
 * Encapsulate a custom component's inline queries so they don't leak onto the
 * page. A `` ```sql my_query `` fence defined in a component body would
 * otherwise register in the page-wide inline-query store under its bare name —
 * visible to (and collidable with) every other component and the page itself.
 *
 * Every reference form in Evidence is explicitly delimited, so scoping is exact
 * (no fuzzy text matching, no way to corrupt a column/table that merely shares
 * a query's spelling):
 *   - the sql fence's `meta` (its name) is renamed to `<tag>:<name>`
 *   - a `{{ local_query }}` reference inside a sibling query's SQL is rewritten
 *   - a tag attribute whose value is a local query name is rewritten ONLY when
 *     the tag's schema marks that attribute as a query reference
 *     (`suggestionType: 'table'`, e.g. `data=`). Column/text attributes (`x`,
 *     `y`, `align`, `title`) are never touched.
 *   - `evidence.query("local_query")` literals in `{% html %}` bodies are
 *     rewritten at the SOURCE level by the caller (see
 *     `rewriteEvidenceQueryCalls` — html bodies bypass the AST).
 *
 * `isQueryRefAttribute(tag, attr)` is supplied by the caller (which holds the
 * built-in + custom tag registry). When omitted, tag attributes are NOT
 * rewritten — the caller always passes it on the render path.
 *
 * Only names DEFINED in this body are touched — a component referencing a real
 * page/project query or a warehouse table by name is left alone. No-op when the
 * body defines no queries.
 *
 * Runs at parse time on the body that gets inlined at the call site, so the
 * renamed fences flow through transform → `registerInlineQueriesFromTree` under
 * their scoped names, and the component's own references resolve to them.
 */
export function namespaceComponentQueries(
	body: Node,
	componentPath: string,
	isQueryRefAttribute?: (tagName: string, attrName: string) => boolean
): Node {
	const localNames = collectLocalQueryNames(body);
	if (localNames.size === 0) return body;

	const rename = buildQueryRenameMap(localNames, componentPath);

	walk(body, (n) => {
		if (n.type === 'fence' && typeof n.attributes?.meta === 'string') {
			const renamed = rename.get(n.attributes.meta.trim());
			if (renamed) n.attributes.meta = renamed;
			if (typeof n.attributes.content === 'string') {
				n.attributes.content = rewriteTemplateReferences(n.attributes.content, rename);
			}
			return;
		}
		if (n.type === 'tag' && n.tag && n.attributes && isQueryRefAttribute) {
			for (const [key, value] of Object.entries(n.attributes)) {
				if (typeof value === 'string' && isQueryRefAttribute(n.tag, key)) {
					const renamed = rename.get(value.trim());
					if (renamed) n.attributes[key] = renamed;
				}
			}
		}
	});

	return body;
}

/**
 * Does any of the component's OWN sql fences reference a `{{ $… }}` variable?
 * When true, the generated SQL depends on call-site attribute values, so two
 * instances of the component on one page can produce DIFFERENT queries — the
 * definition-level scoped name (`tag:query`) is no longer unique and each
 * instance needs its own name (see `applyInstanceScopeToRenderable`). When
 * false, every instance generates identical SQL and sharing one registered
 * query is both correct and desirable (dedupe), so the clean name is kept.
 *
 * Memoised on the body Node: transform() runs once per instance per render,
 * but the answer is a property of the (parsed-once) body.
 */
const bodyUsesDollarVarsCache = new WeakMap<Node, boolean>();

export function componentQueriesUseDollarVariables(body: Node): boolean {
	const cached = bodyUsesDollarVarsCache.get(body);
	if (cached !== undefined) return cached;
	let uses = false;
	walk(body, (n) => {
		if (
			n.type === 'fence' &&
			typeof n.attributes?.content === 'string' &&
			/\{\{\s*\$/.test(n.attributes.content)
		) {
			uses = true;
		}
	});
	bodyUsesDollarVarsCache.set(body, uses);
	return uses;
}

/**
 * Deterministic short key for one component INSTANCE, derived from its
 * call-site attribute values. Two instances with identical attributes get the
 * same key (and so share one registered query); differing attributes get
 * different keys. Pure function of its input — SSR and client renders of the
 * same page agree, and re-renders don't churn query names unless an attribute
 * actually changed. FNV-1a over a key-sorted JSON encoding.
 */
export function instanceKeyForCallSite(callSite: Record<string, unknown>): string {
	const stable = JSON.stringify(
		Object.entries(callSite).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
	);
	let hash = 0x811c9dc5;
	for (let i = 0; i < stable.length; i++) {
		hash ^= stable.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash.toString(16).padStart(8, '0').slice(0, 6);
}

function walkRenderable(
	output: RenderableTreeNode | RenderableTreeNode[],
	visit: (tag: import('@markdoc/markdoc').Tag) => void
): void {
	if (Array.isArray(output)) {
		for (const child of output) walkRenderable(child, visit);
		return;
	}
	if (!Markdoc.Tag.isTag(output)) return;
	visit(output);
	for (const child of output.children ?? []) walkRenderable(child, visit);
}

/**
 * Rename a component instance's queries from the definition-scoped
 * `tag:query` to the instance-scoped `tag@<key>:query` across its TRANSFORMED
 * output. Runs inside the component tag's transform(), after the body is
 * inlined with this instance's attribute values — the parse-time rename can't
 * do this because the body AST is parsed once and shared by every instance.
 *
 * Rewrites the same explicitly-delimited forms as the parse-time pass:
 *   - fence `meta` and any attribute whose value IS a scoped name (exact
 *     match; scoped names contain `:` + the tag name, which no column/title
 *     value can collide with — `:` is reserved in user query names)
 *   - `{{ tag:query }}` tokens inside fence SQL (query chaining)
 *   - `evidence.query("tag:query")` literals in `{% html %}` bodies
 *
 * Only names carrying THIS component's `tag:` prefix are touched — nested
 * components' queries were already instance-scoped by their own transform
 * (children transform before this runs) under their own prefix.
 */
export function applyInstanceScopeToRenderable(
	output: RenderableTreeNode | RenderableTreeNode[],
	componentPath: string,
	instanceKey: string
): void {
	const tagName = tagNameForComponentPath(componentPath);
	const prefix = `${tagName}:`;
	const instancePrefix = `${tagName}@${instanceKey}:`;

	const rename = new Map<string, string>();
	walkRenderable(output, (tag) => {
		const meta = tag.attributes?.meta;
		if (tag.name === 'fence' && typeof meta === 'string' && meta.startsWith(prefix)) {
			rename.set(meta, instancePrefix + meta.slice(prefix.length));
		}
	});
	if (rename.size === 0) return;

	walkRenderable(output, (tag) => {
		if (!tag.attributes) return;
		for (const [key, value] of Object.entries(tag.attributes)) {
			if (typeof value !== 'string') continue;
			const exact = rename.get(value);
			if (exact) {
				tag.attributes[key] = exact;
				continue;
			}
			if (key === 'content') {
				const rewritten = rewriteTemplateReferences(value, rename);
				if (rewritten !== value) tag.attributes[key] = rewritten;
			} else if (key === 'html') {
				const rewritten = rewriteEvidenceQueryCalls(value, rename);
				if (rewritten !== value) tag.attributes[key] = rewritten;
			}
		}
	});
}
