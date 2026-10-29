import Markdoc, { type RenderableTreeNode, type Tag } from '@markdoc/markdoc';
import { Filters } from '../Filters.svelte';
import type { Connection } from '../connection/types';
import type { InlineQueries } from '../user-components/common/inline-queries';
import type { ProjectSettings } from '../user-components/interfaces/project-settings';
import { VariableProcessor } from '../filter-variables/VariableProcessor';
import { createResolvers } from '../user-components/common/use-variable-processing';
import {
	extractSQLProps,
	generateSQLQuery,
	processFilterIds,
	type SQLQueryConfig
} from '../user-components/common/sql-options';
import { processColumnExpression } from '../user-components/common/sql-expression-utils';
import {
	buildRepeatQueryConfig,
	resolveRepeatColumnExpression
} from '../user-components/tags/repeat/build-repeat-query-config';
import { RepeatFilter } from '../user-components/tags/repeat/RepeatFilter.svelte';
import { logger } from '../shims/logger';
import { headingSectionKey, type RepeatIteration } from './section-key';

export type OutlineMode = 'print' | 'screen';

export type OutlineSection = {
	/** Section key: what the PDF picker stores in `hiddenSections`; matches the heading's `data-section-key`. */
	id: string;
	/** Source heading id, shared by every repeat iteration's copy of the heading. */
	headingId: string;
	label: string;
	level: 1 | 2 | 3;
	ancestorIds: string[];
};

export type OutlineDeps = {
	pageFilters: Filters | undefined;
	inlineQueries: InlineQueries | undefined;
	/** Connection `repeat` queries run against (Repeat.svelte uses the default connection). */
	defaultConnection: Connection;
	/** Connection an `if` query with this `data` runs against. */
	connectionFor: (data: string | undefined) => Connection;
	projectSettings?: () => ProjectSettings & { computedDefaultDateRangeEnd?: string };
};

type IterationState = { chain: RepeatIteration[]; columns: Map<string, string> };

type Scope = {
	iteration: IterationState;
	repeatFilters: Filters | undefined;
};

type OutlineEvent =
	| { type: 'heading'; headingId: string; label: string; level: number; chain: RepeatIteration[] }
	/** `closesLevel`: lowest heading level in the repeat body; open sections at or below it end here. */
	| { type: 'iterationStart'; closesLevel: number }
	/** A heading that renders no row (skipped content) but still ends sections, as in the PDF. */
	| { type: 'boundary'; level: number }
	| { type: 'iterationEnd' };

const HEADING_TAG = /^h[1-3]$/;

function isHeading(node: RenderableTreeNode): boolean {
	return (
		Markdoc.Tag.isTag(node) &&
		HEADING_TAG.test(node.name) &&
		typeof node.attributes['data-heading-id'] === 'string'
	);
}

// The PDF hides sections statically from the markup, so a heading it can't tell is skipped
// (hidden in print, an unchosen branch, a modal) still ends the sections around it.
function boundaries(nodes: RenderableTreeNode[]): OutlineEvent[] {
	const events: OutlineEvent[] = [];
	const visit = (n: RenderableTreeNode) => {
		if (!Markdoc.Tag.isTag(n)) return;
		if (isHeading(n)) events.push({ type: 'boundary', level: parseInt(n.name[1], 10) });
		n.children.forEach(visit);
	};
	nodes.forEach(visit);
	return events;
}

function minHeadingLevel(nodes: RenderableTreeNode[]): number {
	let min = Infinity;
	const visit = (n: RenderableTreeNode) => {
		if (!Markdoc.Tag.isTag(n)) return;
		if (isHeading(n)) min = Math.min(min, parseInt(n.name[1], 10));
		n.children.forEach(visit);
	};
	nodes.forEach(visit);
	return min;
}

export async function resolveOutline(
	tree: RenderableTreeNode,
	deps: OutlineDeps,
	mode: OutlineMode
): Promise<OutlineSection[]> {
	const root: Scope = { iteration: { chain: [], columns: new Map() }, repeatFilters: undefined };
	const events = await walk(tree, root, deps, mode);
	return buildSections(events);
}

function filterContextsOf(scope: Scope, deps: OutlineDeps): Filters[] {
	return [scope.repeatFilters, deps.pageFilters].filter((f): f is Filters => f !== undefined);
}

function resolversFor(scope: Scope, deps: OutlineDeps) {
	const contexts = filterContextsOf(scope, deps);
	const processor =
		contexts.length > 0 && deps.inlineQueries
			? new VariableProcessor(contexts, deps.inlineQueries)
			: null;
	return { processor, ...createResolvers(processor) };
}

async function walkChildren(
	children: RenderableTreeNode[],
	scope: Scope,
	deps: OutlineDeps,
	mode: OutlineMode
): Promise<OutlineEvent[]> {
	const results = await Promise.all(children.map((c) => walk(c, scope, deps, mode)));
	return results.flat();
}

async function walk(
	node: RenderableTreeNode,
	scope: Scope,
	deps: OutlineDeps,
	mode: OutlineMode
): Promise<OutlineEvent[]> {
	if (Array.isArray(node)) return walkChildren(node, scope, deps, mode);
	if (!Markdoc.Tag.isTag(node)) return [];

	switch (node.name) {
		case 'hidden_in_print':
			return mode === 'print'
				? boundaries(node.children)
				: walkChildren(node.children, scope, deps, mode);
		case 'only_in_print':
			return mode === 'screen'
				? boundaries(node.children)
				: walkChildren(node.children, scope, deps, mode);
		case 'print_group': {
			const { resolveBoolean } = resolversFor(scope, deps);
			const attr = mode === 'print' ? node.attributes.hide : node.attributes.print_only;
			if (resolveBoolean(attr) === true) return boundaries(node.children);
			return walkChildren(node.children, scope, deps, mode);
		}
		// Modal bodies only mount while the modal is open, so they never print or scroll into view.
		case 'modal':
			return boundaries(node.children);
		case 'conditional':
			return walkConditional(node, scope, deps, mode);
		case 'repeat':
			return walkRepeat(node, scope, deps, mode);
	}

	if (isHeading(node)) {
		const level = parseInt(node.name[1], 10);
		return [
			{
				type: 'heading',
				headingId: node.attributes['data-heading-id'] as string,
				label: headingLabel(node, scope, deps),
				level,
				chain: scope.iteration.chain
			}
		];
	}

	return walkChildren(node.children, scope, deps, mode);
}

function headingLabel(node: Tag, scope: Scope, deps: OutlineDeps): string {
	const { processor } = resolversFor(scope, deps);
	const textOf = (n: RenderableTreeNode | RenderableTreeNode[]): string => {
		if (n === null || n === undefined) return '';
		if (typeof n === 'string') return n;
		if (typeof n === 'number') return String(n);
		if (Array.isArray(n)) return n.map(textOf).join('');
		if (!Markdoc.Tag.isTag(n)) return '';
		if (n.name === 'ReactiveVariable') {
			const template = `{{${n.attributes.expression}}}`;
			if (!processor) return template;
			try {
				return processor.processString(template, 'text');
			} catch {
				return template;
			}
		}
		return n.children.map(textOf).join('');
	};
	return textOf(node.children).trim().slice(0, 80) || 'Untitled section';
}

async function runQuery(
	connection: Connection,
	config: SQLQueryConfig,
	scope: Scope,
	deps: OutlineDeps
): Promise<Record<string, unknown>[]> {
	const { sql, error } = generateSQLQuery(
		config,
		filterContextsOf(scope, deps),
		deps.inlineQueries,
		undefined,
		deps.projectSettings?.().first_day_of_week,
		connection.dialect
	);
	if (error || !sql) throw new Error(error ?? 'Failed to generate SQL');
	const result = await connection.query(sql);
	// The query service reports warehouse failures in the result rather than rejecting.
	if (result.error) throw new Error(result.error);
	return result.rows as Record<string, unknown>[];
}

async function branchMatches(branch: Tag, scope: Scope, deps: OutlineDeps): Promise<boolean> {
	if (branch.name === 'else') return true;
	const attrs = branch.attributes;
	const { resolveText, resolveSql } = resolversFor(scope, deps);
	const connection = deps.connectionFor(attrs.data);
	const config: SQLQueryConfig = {
		tableExpressionName: resolveText(attrs.data),
		columns: [
			processColumnExpression(
				{ value: 'COUNT(*) as row_count', type: 'measure' },
				connection.dialect
			)
		],
		filterIds: attrs.filters,
		...extractSQLProps(attrs),
		where: resolveSql(attrs.where)
	};
	const rows = await runQuery(connection, config, scope, deps);
	const hasRows = Number(rows[0]?.row_count ?? 0) > 0;
	return attrs.condition === 'no_rows' ? !hasRows : hasRows;
}

async function walkConditional(
	node: Tag,
	scope: Scope,
	deps: OutlineDeps,
	mode: OutlineMode
): Promise<OutlineEvent[]> {
	const branches = node.children.filter(
		(c): c is Tag =>
			Markdoc.Tag.isTag(c) && (c.name === 'if' || c.name === 'else_if' || c.name === 'else')
	);
	try {
		const matches = await Promise.all(branches.map((b) => branchMatches(b, scope, deps)));
		const winner = branches[matches.indexOf(true)];
		const perBranch = await Promise.all(
			branches.map((b) =>
				b === winner ? walkChildren(b.children, scope, deps, mode) : boundaries(b.children)
			)
		);
		return perBranch.flat();
	} catch (err) {
		// An unresolvable condition must not drop sections from the picker: list every branch.
		logger.warn({ err }, '[resolveOutline] conditional query failed');
		return walkChildren(branches, scope, deps, mode);
	}
}

async function repeatValues(node: Tag, scope: Scope, deps: OutlineDeps): Promise<unknown[]> {
	const attrs = node.attributes;
	const connection = deps.defaultConnection;
	const { resolveText, resolveColumn, resolveSql } = resolversFor(scope, deps);
	const data = resolveText(attrs.data);
	const column = resolveRepeatColumnExpression(attrs.column, resolveColumn, connection.dialect);
	if (!data || !column || !attrs.id) throw new Error('repeat is missing data, column, or id');
	const config = buildRepeatQueryConfig({
		data,
		column,
		filterConditions: processFilterIds(
			attrs.filters ?? [],
			[scope.repeatFilters, deps.pageFilters],
			connection.dialect
		),
		where: resolveSql(attrs.where),
		dialect: connection.dialect
	});
	const rows = await runQuery(connection, config, scope, deps);
	return rows.map((r) => r.value);
}

function iterationScope(
	parent: Scope,
	deps: OutlineDeps,
	id: string,
	value: unknown,
	column: string
): Scope {
	const chain = [...parent.iteration.chain, { id, value }];
	const columns = new Map(parent.iteration.columns).set(id, column);
	const filters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: deps.projectSettings,
		dialect: () => deps.defaultConnection.dialect
	});
	for (const it of chain) {
		filters.create<'repeat', { value: unknown; column: string }, typeof RepeatFilter>(
			{
				id: it.id,
				userComponentName: 'repeat',
				attributes: { value: it.value, column: columns.get(it.id) ?? '' }
			},
			RepeatFilter
		);
	}
	return { iteration: { chain, columns }, repeatFilters: filters };
}

async function walkRepeat(
	node: Tag,
	scope: Scope,
	deps: OutlineDeps,
	mode: OutlineMode
): Promise<OutlineEvent[]> {
	const id = String(node.attributes.id ?? '');
	let values: unknown[];
	try {
		values = await repeatValues(node, scope, deps);
	} catch (err) {
		// Fall back to the unexpanded template so its headings still appear.
		logger.warn({ err, repeatId: id }, '[resolveOutline] repeat query failed');
		return walkChildren(node.children, scope, deps, mode);
	}

	const { resolveColumn } = resolversFor(scope, deps);
	const column = resolveRepeatColumnExpression(
		node.attributes.column,
		resolveColumn,
		deps.defaultConnection.dialect
	);
	const closesLevel = minHeadingLevel(node.children);
	if (values.length === 0) return boundaries(node.children);

	const perIteration = await Promise.all(
		values.map(async (value): Promise<OutlineEvent[]> => {
			const child = iterationScope(scope, deps, id, value, column);
			const body = await walkChildren(node.children, child, deps, mode);
			return [{ type: 'iterationStart', closesLevel }, ...body, { type: 'iterationEnd' }];
		})
	);
	return perIteration.flat();
}

type StackEntry = { id: string; level: number };

function clampLevel(level: number): 1 | 2 | 3 {
	return Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
}

function popSections(stack: StackEntry[], level: number): void {
	while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
}

function buildSections(events: OutlineEvent[]): OutlineSection[] {
	const sections: OutlineSection[] = [];
	const stack: StackEntry[] = [];
	const iterationBases: number[] = [];

	for (const event of events) {
		if (event.type === 'iterationStart') {
			// Matches stampHiddenSections: a heading inside the repeat ends any open section at or
			// below its level, so the repeat never nests under (or hides with) that section.
			popSections(stack, event.closesLevel);
			iterationBases.push(stack.length);
			continue;
		}

		if (event.type === 'boundary') {
			popSections(stack, event.level);
			continue;
		}

		if (event.type === 'iterationEnd') {
			// A repeat closes its sections: content after it never nests under the last iteration.
			stack.length = iterationBases.pop() ?? 0;
			continue;
		}

		popSections(stack, event.level);
		const id = headingSectionKey(event.headingId, event.chain);
		sections.push({
			id,
			headingId: event.headingId,
			label: event.label,
			level: clampLevel(event.level),
			ancestorIds: stack.map((s) => s.id)
		});
		stack.push({ id, level: event.level });
	}

	return sections;
}
