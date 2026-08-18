import type { HtmlVariables } from './html-protocol';

/**
 * DORMANT — not wired into the runtime. Built, tested, and deliberately
 * shelved pre-GA in favor of explicit `variables=` only (one mechanism, one
 * mental model; see the html schema transform comment). If GA feedback shows
 * authors genuinely miss `{{ $name }}` in markup, re-enable by re-adding the
 * runBody hook in runtime-entry.ts — the interim validators keep shipped
 * bodies token-free, so turning this on later is a pure addition.
 */

/**
 * `{{ $name }}` substitution in the mounted body's TEXT nodes — the piece
 * that makes `<h1>{{ $title }}</h1>` "just work" the way it does everywhere
 * else in Evidence.
 *
 * Deliberately DOM-level, not source-level: values are assigned via
 * `Text.data`, which cannot create markup, so a value of `<script>…` renders
 * as those literal characters — injection-safe by mechanism, with no
 * context-sensitive escaping to get wrong. The body source itself stays
 * byte-faithful (author frameworks and JS survive untouched).
 *
 * Scope, and why:
 *  - Only `{{ $name }}` tokens (dollar-prefixed, double-brace) — Vue and
 *    Handlebars text bindings are unprefixed, JS template literals are
 *    single-brace, so author syntax can't collide.
 *  - Only names present in `evidence.variables` — an unknown `{{ $x }}`
 *    stays literal instead of vanishing.
 *  - SCRIPT / STYLE / TEMPLATE contents are never touched: script text is
 *    author code (read `evidence.variables.name` there), and template
 *    fragments belong to the author's own templating.
 *  - Nodes are scanned once per injection and remembered with their original
 *    template text, so variable changes re-substitute in place (reactive)
 *    without re-injecting the body.
 */

const TOKEN = /\{\{\s*\$([A-Za-z_]\w*)\s*\}\}/g;
const SKIP_PARENTS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE']);

export type VariableSubstitution = {
	/** Number of text nodes that contained at least one token at scan time. */
	trackedCount: number;
	/** Re-substitute all tracked nodes with new values (prunes removed nodes). */
	apply(variables: HtmlVariables): void;
};

export function createVariableSubstitution(
	root: ParentNode & Node,
	initialVariables: HtmlVariables
): VariableSubstitution {
	let tracked: { node: Text; template: string }[] = [];

	const doc = root.ownerDocument ?? document;
	const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	for (let current = walker.nextNode(); current; current = walker.nextNode()) {
		const text = current as Text;
		const parent = text.parentElement;
		if (parent && SKIP_PARENTS.has(parent.tagName)) continue;
		TOKEN.lastIndex = 0;
		if (TOKEN.test(text.data)) tracked.push({ node: text, template: text.data });
	}

	const substitution: VariableSubstitution = {
		get trackedCount() {
			return tracked.length;
		},
		apply(variables: HtmlVariables) {
			tracked = tracked.filter(({ node }) => node.isConnected);
			for (const { node, template } of tracked) {
				node.data = template.replace(TOKEN, (match, name: string) =>
					name in variables ? String(variables[name] ?? '') : match
				);
			}
		}
	};
	substitution.apply(initialVariables);
	return substitution;
}
