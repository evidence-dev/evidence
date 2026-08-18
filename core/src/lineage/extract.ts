import type { Node } from '@markdoc/markdoc';

export type DataReference = {
	tableName: string;
	component: string;
	line: number;
	isDynamic: boolean;
	attributes: Record<string, unknown>;
};

export type InlineQueryDefinition = {
	name: string;
	sql: string;
	line: number;
};

export type PartialReference = {
	file: string;
	line: number;
};

export type SqlTableReference = {
	name: string;
	isTemplate: boolean;
};

const VARIABLE_SYNTAX = /\{\{[^}]+\}\}/;

/**
 * Walk a Markdoc AST node tree, yielding each node with its depth.
 */
function* walkAst(node: Node): Generator<Node> {
	yield node;
	if (node.children) {
		for (const child of node.children) {
			yield* walkAst(child);
		}
	}
}

/**
 * Extract all `data` attribute references from Markdoc tag nodes.
 * Returns component type, line number, whether the reference is dynamic,
 * and key display attributes (title, value, x, y).
 */
export function extractDataReferences(ast: Node): DataReference[] {
	const refs: DataReference[] = [];

	for (const node of walkAst(ast)) {
		if (node.type !== 'tag' || !node.tag) continue;

		const data = node.attributes?.data;
		if (!data || typeof data !== 'string') continue;

		const rawLine = node.location?.start?.line ?? node.lines?.[0] ?? 0;
		const line = rawLine + 1; // Markdoc lines are 0-indexed, editor is 1-indexed
		const isDynamic = VARIABLE_SYNTAX.test(data);

		const attrs: Record<string, unknown> = {};
		for (const key of ['title', 'value', 'x', 'y', 'series']) {
			if (node.attributes?.[key] !== undefined) {
				attrs[key] = node.attributes[key];
			}
		}

		refs.push({
			tableName: data,
			component: node.tag,
			line,
			isDynamic,
			attributes: attrs
		});
	}

	return refs;
}

/**
 * Extract named inline SQL query definitions from fenced code blocks.
 * Only top-level SQL fences with a `meta` name are included.
 */
export function extractInlineQueryDefinitions(ast: Node): InlineQueryDefinition[] {
	const defs: InlineQueryDefinition[] = [];

	for (const node of walkAst(ast)) {
		if (node.type !== 'fence') continue;
		if (node.attributes?.language !== 'sql') continue;
		if (!node.attributes?.meta) continue;

		const line = node.location?.start?.line ?? node.lines?.[0] ?? 0;

		defs.push({
			name: node.attributes.meta as string,
			sql: (node.attributes.content as string) ?? '',
			line
		});
	}

	return defs;
}

/**
 * Extract partial file references from the AST.
 */
export function extractPartialReferences(ast: Node): PartialReference[] {
	const refs: PartialReference[] = [];

	for (const node of walkAst(ast)) {
		if (node.type !== 'tag' || node.tag !== 'partial') continue;

		const file = node.attributes?.file;
		if (!file || typeof file !== 'string') continue;

		const line = node.location?.start?.line ?? node.lines?.[0] ?? 0;
		refs.push({ file, line });
	}

	return refs;
}

/**
 * Extract table references from a SQL string.
 * Handles:
 * - {{template}} references (Evidence-specific interpolation)
 * - FROM/JOIN table identifiers (excluding CTE aliases)
 */
export function extractSqlTableReferences(sql: string): SqlTableReference[] {
	const refs: SqlTableReference[] = [];
	const seen = new Set<string>();

	// 1. Extract {{template}} references. Whitespace, matching quotes and the
	// fallback pipe mirror runtime interpolation; the leading slash is preserved
	// for the resolvers. Dots are excluded because the interpolator splits on the
	// last one and resolves the head as a filter, so a dotted token is never a
	// file. Frontmatter vars (`{{$v}}`) are excluded for the same reason.
	for (const match of sql.matchAll(
		/\{\{\s*(?:(['"])([\w/-]+)\1|([\w/-]+))(?:\s*\|[^{}]*)?\s*\}\}/g
	)) {
		const name = match[2] ?? match[3];
		if (!seen.has(name)) {
			seen.add(name);
			refs.push({ name, isTemplate: true });
		}
	}

	// 2. Extract CTE names to exclude
	const cteNames = new Set<string>();
	for (const match of sql.matchAll(/\bWITH\s+(\w+)\s+AS\b/gi)) {
		cteNames.add(match[1].toLowerCase());
	}
	for (const match of sql.matchAll(/,\s*(\w+)\s+AS\s*\(/gi)) {
		cteNames.add(match[1].toLowerCase());
	}

	// 3. Extract FROM/JOIN identifiers, excluding CTE aliases
	for (const match of sql.matchAll(/(?:FROM|JOIN)\s+(\w+(?:\.\w+)*)/gi)) {
		const name = match[1];
		if (cteNames.has(name.toLowerCase())) continue;
		if (name.toLowerCase() === 'select') continue;
		if (seen.has(name)) continue;
		seen.add(name);
		refs.push({ name, isTemplate: false });
	}

	return refs;
}
