/**
 * Static detection of `evidence.filters.create(...)` calls inside an
 * {% html %} block body.
 *
 * Why this exists: filters declared by author code at runtime (e.g. via
 * `evidence.filters.create("region", null, { column: "region_code" })`)
 * don't appear in the page until the iframe mounts and runs the script.
 * That's a problem for the editor's static validators, which run BEFORE
 * the runtime — a chart referencing the filter in `filters="region"` or
 * `{{ region }}` flags as "filter does not exist" until the block boots,
 * even though it works perfectly at runtime. The AI agent treats this
 * editor flash as a real error and gets stuck in correction loops.
 *
 * The fix is to pre-register such filters during AST processing, the
 * same way builtin AST-tag filters are pre-registered. To do that
 * safely we need to find every literal `evidence.filters.create("…", …)`
 * call in the body's `<script>` content and pull out its `id` and (if
 * present) the `column` option.
 *
 * Robust > clever: parse JS with acorn rather than regex-matching. acorn
 * is small (already in our transitive deps), zero-dep, fast, and gives
 * us a real AST so we don't have to defend against comments, strings,
 * template literals, computed property access, or any of the other ways
 * a textual matcher can produce false positives. A syntax error during
 * a mid-edit aborts parsing — we catch and return [], deliberately
 * degrading to today's runtime-only behavior rather than crashing the
 * editor.
 *
 * What we deliberately do NOT support:
 *  - Dynamic ids: `evidence.filters.create(someVariable, …)` — we only
 *    capture string-literal first arguments. The runtime path handles
 *    these the same as today.
 *  - Computed `column`: `{ column: someVar }` — same.
 *  - Reassigned `evidence` references: `const ev = evidence; ev.filters.create(…)`.
 *    The match is purely on the syntactic shape `evidence.filters.create`.
 *
 * False-negative bias: missing a real call → today's flash, no
 * regression. False-positives are extremely rare with a real AST
 * (you'd have to write `evidence.filters.create("x", ...)` somewhere
 * we'd lex it as a top-level CallExpression but that would never run
 * — basically impossible without dead code), and the worst case is a
 * harmless ghost filter that gets reaped on the next AST walk.
 */

import * as acorn from 'acorn';

export interface ExtractedExternalFilter {
	id: string;
	column?: string;
}

const SCRIPT_TAG_REGEX = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Extract every literal `evidence.filters.create(<string>, …[, { column: <string> }])`
 * call in a raw JavaScript source string. This is the pure-JS entry point used
 * by consumers whose body IS JavaScript (e.g. the `{% custom_map %}` block),
 * with no `<script>` wrapper. Returns an empty array on parse failure (mid-edit
 * syntax errors are common).
 */
export function extractFilterCreatesFromJs(source: string): ExtractedExternalFilter[] {
	if (!source || !source.includes('evidence')) return [];

	let tree: acorn.Node;
	try {
		tree = acorn.parse(source, {
			ecmaVersion: 'latest',
			// Permissive parse mode — accepts both classic and module scripts,
			// allows top-level await (which the runtimes support), and avoids
			// needing the caller to know which kind they're looking at.
			sourceType: 'module',
			allowAwaitOutsideFunction: true,
			allowReturnOutsideFunction: true
		});
	} catch {
		// Mid-edit syntax errors are normal and frequent — degrade to the
		// runtime-only path rather than crashing the editor.
		return [];
	}

	const out: ExtractedExternalFilter[] = [];
	const seen = new Set<string>();
	walk(tree, (node) => {
		const found = matchFilterCreate(node);
		if (!found || seen.has(found.id)) return;
		// First-occurrence wins on duplicate ids; the runtime collision rule
		// defers to the existing filter anyway, so this just keeps it deterministic.
		seen.add(found.id);
		out.push(found);
	});
	return out;
}

/**
 * Extract every literal `evidence.filters.create(<string>, …[, { column: <string> }])`
 * call appearing inside any `<script>` block in `htmlBody` (the `{% html %}`
 * body, which is HTML+JS). Returns an empty array on parse failure.
 */
export function extractFilterCreates(htmlBody: string): ExtractedExternalFilter[] {
	if (!htmlBody) return [];

	const out: ExtractedExternalFilter[] = [];
	const seen = new Set<string>();

	for (const match of htmlBody.matchAll(SCRIPT_TAG_REGEX)) {
		for (const found of extractFilterCreatesFromJs(match[1] ?? '')) {
			if (seen.has(found.id)) continue;
			seen.add(found.id);
			out.push(found);
		}
	}

	return out;
}

/**
 * Generic AST walker. acorn nodes don't expose a typed children list, so we
 * recurse into every property that looks like a node or an array of nodes.
 * Cheap and type-agnostic — we only care about CallExpression matches.
 */
function walk(node: unknown, visit: (node: AstNode) => void): void {
	if (!node || typeof node !== 'object') return;
	const n = node as Record<string, unknown>;
	if (typeof n.type === 'string') visit(n as unknown as AstNode);
	for (const key in n) {
		const value = n[key];
		if (Array.isArray(value)) {
			for (const item of value) walk(item, visit);
		} else if (value && typeof value === 'object') {
			walk(value, visit);
		}
	}
}

interface AstNode {
	type: string;
	[key: string]: unknown;
}

/**
 * Recognise the call shape `evidence.filters.create(<string-literal>, …)`
 * and pull out the id (and the `column` option if it's a string literal in
 * an object literal third argument).
 */
function matchFilterCreate(node: AstNode): ExtractedExternalFilter | null {
	if (node.type !== 'CallExpression') return null;
	if (!isMemberChain(node.callee, ['evidence', 'filters', 'create'])) return null;

	const args = node.arguments as AstNode[] | undefined;
	if (!args || args.length === 0) return null;

	const id = stringLiteralValue(args[0]);
	if (id === null) return null;

	let column: string | undefined;
	const opts = args[2];
	if (opts && opts.type === 'ObjectExpression') {
		const properties = opts.properties as AstNode[] | undefined;
		if (properties) {
			for (const prop of properties) {
				if (prop.type !== 'Property') continue;
				const keyName = identifierOrLiteralName(prop.key as AstNode);
				if (keyName !== 'column') continue;
				const value = stringLiteralValue(prop.value as AstNode);
				if (value !== null) column = value;
				break;
			}
		}
	}

	return column !== undefined ? { id, column } : { id };
}

/**
 * True when `node` is a member-access chain matching `chain` exactly, with
 * non-computed identifier accesses. So `evidence.filters.create` matches but
 * `evidence['filters'].create` and `myEvidence.filters.create` do not — we
 * deliberately don't follow aliases or string-keyed accesses.
 */
function isMemberChain(node: unknown, chain: string[]): boolean {
	let current = node as AstNode | null | undefined;
	for (let i = chain.length - 1; i > 0; i--) {
		if (!current || current.type !== 'MemberExpression') return false;
		if (current.computed) return false;
		const property = current.property as AstNode | undefined;
		if (!property || property.type !== 'Identifier' || property.name !== chain[i]) return false;
		current = current.object as AstNode | null | undefined;
	}
	if (!current || current.type !== 'Identifier') return false;
	return (current.name as string) === chain[0];
}

function stringLiteralValue(node: AstNode | undefined): string | null {
	if (!node) return null;
	if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
	// Untagged template literals with no interpolations behave as strings.
	if (node.type === 'TemplateLiteral') {
		const expressions = node.expressions as unknown[] | undefined;
		const quasis = node.quasis as AstNode[] | undefined;
		if (expressions?.length === 0 && quasis && quasis.length === 1) {
			const cooked = (quasis[0].value as { cooked?: string } | undefined)?.cooked;
			if (typeof cooked === 'string') return cooked;
		}
	}
	return null;
}

function identifierOrLiteralName(node: AstNode): string | null {
	if (node.type === 'Identifier') return node.name as string;
	if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
	return null;
}
