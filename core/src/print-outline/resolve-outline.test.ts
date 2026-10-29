import { describe, it, expect } from 'vitest';
import Markdoc, { type RenderableTreeNode } from '@markdoc/markdoc';
import { Filters } from '../Filters.svelte';
import { InlineQueries } from '../user-components/common/inline-queries';
import { ToggleFilter } from '../user-components/tags/toggle/ToggleFilter.svelte';
import { defaultDialect } from '../sql-dialect';
import type { Connection } from '../connection/types';
import { resolveOutline, type OutlineDeps, type OutlineMode } from './resolve-outline';
import { headingSectionKey } from './section-key';

const tag = (
	name: string,
	attributes: Record<string, unknown>,
	children: RenderableTreeNode[] = []
) => new Markdoc.Tag(name, attributes, children);

let headingCounter = 0;
const h = (level: 1 | 2 | 3, ...children: RenderableTreeNode[]) =>
	tag(`h${level}`, { 'data-heading-id': `h${++headingCounter}` }, children);
const v = (expression: string) => tag('ReactiveVariable', { expression });
const p = (text: string) => tag('p', {}, [text]);
const doc = (...children: RenderableTreeNode[]) => tag('article', {}, children);

// Returning an Error mimics the query service, which reports failures in the result.
type Handler = (sql: string) => Record<string, unknown>[] | Error;

function fakeConnection(handler: Handler): Connection & { sqls: string[] } {
	const sqls: string[] = [];
	return {
		id: 'default',
		type: 'managed',
		dialect: defaultDialect,
		sqls,
		async query(sql: string) {
			sqls.push(sql);
			const out = handler(sql);
			if (out instanceof Error) return { rows: [], columns: [], error: out.message } as never;
			return { rows: out, columns: [], error: null } as never;
		}
	};
}

function setup(handler: Handler = () => []) {
	const pageFilters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: undefined,
		dialect: () => defaultDialect
	});
	const inlineQueries = new InlineQueries({ filterContexts: [pageFilters] });
	const connection = fakeConnection(handler);
	const deps: OutlineDeps = {
		pageFilters,
		inlineQueries,
		defaultConnection: connection,
		connectionFor: () => connection
	};
	return { deps, pageFilters, connection };
}

const summarize = async (
	tree: RenderableTreeNode,
	deps: OutlineDeps,
	mode: OutlineMode = 'print'
) =>
	(await resolveOutline(tree, deps, mode)).map((s) => ({
		label: s.label,
		depth: s.ancestorIds.length
	}));

const repeat = (id: string, column: string, children: RenderableTreeNode[]) =>
	tag('repeat', { id, data: `${id}_table`, column }, children);

const valuesFor =
	(map: Record<string, unknown[]>): Handler =>
	(sql) => {
		for (const [table, values] of Object.entries(map)) {
			if (sql.includes(table)) return values.map((value) => ({ value }));
		}
		return [];
	};

describe('resolveOutline', () => {
	it('lists print-only repeated sections and drops hidden-in-print ones', async () => {
		const { deps } = setup(valuesFor({ region_table: ['East', 'West'] }));
		const tree = doc(
			tag('hidden_in_print', {}, [h(1, 'Screen summary'), h(2, 'Screen detail')]),
			tag('only_in_print', {}, [
				h(1, 'Regional breakdown'),
				repeat('region', 'region', [h(2, 'Region ', v('region')), p('chart'), h(3, 'Notes')])
			])
		);

		expect(await summarize(tree, deps)).toEqual([
			{ label: 'Regional breakdown', depth: 0 },
			{ label: 'Region East', depth: 1 },
			{ label: 'Notes', depth: 2 },
			{ label: 'Region West', depth: 1 },
			{ label: 'Notes', depth: 2 }
		]);
	});

	it('inverts print visibility in screen mode', async () => {
		const { deps } = setup(valuesFor({ region_table: ['East'] }));
		const tree = doc(
			tag('hidden_in_print', {}, [h(1, 'Screen summary')]),
			tag('only_in_print', {}, [h(1, 'Print appendix')])
		);
		expect((await summarize(tree, deps, 'screen')).map((s) => s.label)).toEqual(['Screen summary']);
	});

	it('gives each repeat value its own key for every heading', async () => {
		const { deps } = setup(valuesFor({ region_table: ['East', 'West'] }));
		const outer = h(2, v('region'));
		const inner = h(3, 'Notes');
		const tree = doc(repeat('region', 'region', [outer, inner]));
		const ids = (await resolveOutline(tree, deps, 'print')).map((s) => s.id);
		const key = (heading: typeof outer, value: string) =>
			headingSectionKey(heading.attributes['data-heading-id'] as string, [{ id: 'region', value }]);

		expect(ids).toEqual([
			key(outer, 'East'),
			key(inner, 'East'),
			key(outer, 'West'),
			key(inner, 'West')
		]);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('lists only headings, so text before a repeat heading adds no row', async () => {
		const { deps } = setup(valuesFor({ region_table: ['East'] }));
		const tree = doc(h(1, 'Top'), repeat('region', 'region', [p('chart'), h(2, 'Detail')]));
		expect(await summarize(tree, deps)).toEqual([
			{ label: 'Top', depth: 0 },
			{ label: 'Detail', depth: 1 }
		]);
	});

	it('keeps headings inside a repeat at their markup level', async () => {
		const { deps } = setup(valuesFor({ region_table: ['East'] }));
		const tree = doc(repeat('region', 'region', [h(2, 'First'), h(2, 'Second')]));
		expect(await summarize(tree, deps)).toEqual([
			{ label: 'First', depth: 0 },
			{ label: 'Second', depth: 0 }
		]);
	});

	it('closes iteration sections at the end of the repeat', async () => {
		const { deps } = setup(valuesFor({ region_table: ['East'] }));
		const tree = doc(h(1, 'Top'), repeat('region', 'region', [h(2, v('region'))]), h(3, 'After'));
		expect(await summarize(tree, deps)).toEqual([
			{ label: 'Top', depth: 0 },
			{ label: 'East', depth: 1 },
			{ label: 'After', depth: 1 }
		]);
	});

	it('expands nested repeats with each inner query filtered by the outer value', async () => {
		const { deps, connection } = setup((sql) => {
			if (sql.includes('region_table')) return [{ value: 'East' }, { value: 'West' }];
			if (sql.includes('product_table')) {
				return sql.includes("'East'") ? [{ value: 'Shoes' }] : [{ value: 'Hats' }];
			}
			return [];
		});
		const tree = doc(
			repeat('region', 'region', [
				h(2, v('region')),
				tag(
					'repeat',
					{ id: 'product', data: 'product_table', column: 'product', filters: ['region'] },
					[h(3, v('region'), ' / ', v('product'))]
				)
			])
		);
		expect(await summarize(tree, deps)).toEqual([
			{ label: 'East', depth: 0 },
			{ label: 'East / Shoes', depth: 1 },
			{ label: 'West', depth: 0 },
			{ label: 'West / Hats', depth: 1 }
		]);
		expect(connection.sqls.filter((s) => s.includes('product_table'))).toHaveLength(2);
	});

	it('follows only the if/else branch that would render', async () => {
		const { deps } = setup((sql) =>
			sql.includes('empty_table') ? [{ row_count: 0 }] : [{ row_count: 3 }]
		);
		const conditional = (data: string) =>
			tag('conditional', {}, [
				tag('if', { data }, [h(2, `${data} has rows`)]),
				tag('else', {}, [h(2, `${data} is empty`)])
			]);
		const tree = doc(conditional('empty_table'), conditional('full_table'));
		expect((await summarize(tree, deps)).map((s) => s.label)).toEqual([
			'empty_table is empty',
			'full_table has rows'
		]);
	});

	it('honours condition="no_rows"', async () => {
		const { deps } = setup(() => [{ row_count: 0 }]);
		const tree = doc(
			tag('conditional', {}, [
				tag('if', { data: 't', condition: 'no_rows' }, [h(2, 'Nothing here')])
			])
		);
		expect((await summarize(tree, deps)).map((s) => s.label)).toEqual(['Nothing here']);
	});

	it('resolves print_group hide from a filter variable', async () => {
		const { deps, pageFilters } = setup();
		pageFilters.create(
			{ id: 'hide_details', userComponentName: 'toggle', attributes: { initial_value: true } },
			ToggleFilter as never
		);
		const tree = doc(
			h(1, 'Kept'),
			tag('print_group', { hide: '{{hide_details}}' }, [h(2, 'Details')])
		);
		const labels = (await summarize(tree, deps)).map((s) => s.label);
		expect(labels).toContain('Kept');
		expect(labels).not.toContain('Details');
	});

	it('falls back to the template when a repeat query fails', async () => {
		const { deps } = setup(() => {
			throw new Error('warehouse down');
		});
		const tree = doc(repeat('region', 'region', [h(2, 'Region')]));
		expect(await summarize(tree, deps)).toEqual([{ label: 'Region', depth: 0 }]);
	});

	it('treats a query result carrying an error as a failure', async () => {
		const { deps } = setup(() => new Error('warehouse down'));
		const tree = doc(
			repeat('region', 'region', [h(2, 'Region')]),
			tag('conditional', {}, [tag('if', { data: 't' }, [h(2, 'A')]), tag('else', {}, [h(2, 'B')])])
		);
		expect((await summarize(tree, deps)).map((s) => s.label)).toEqual(['Region', 'A', 'B']);
	});

	it('ends an open section at a repeat containing a heading at its level', async () => {
		const { deps } = setup(valuesFor({ region_table: ['East'] }));
		const tree = doc(
			h(1, 'Top'),
			repeat('region', 'region', [h(1, v('region'))]),
			h(2, 'Intro'),
			repeat('region', 'region', [p('chart'), h(1, 'Deep')])
		);
		expect(await summarize(tree, deps)).toEqual([
			{ label: 'Top', depth: 0 },
			{ label: 'East', depth: 0 },
			{ label: 'Intro', depth: 0 },
			{ label: 'Deep', depth: 0 }
		]);
	});

	it('lets a skipped heading end the sections around it, as the PDF does', async () => {
		const { deps } = setup((sql) => (sql.includes('row_count') ? [{ row_count: 1 }] : []));
		const tree = doc(
			h(1, 'A'),
			tag('hidden_in_print', {}, [h(1, 'Screen')]),
			h(2, 'B'),
			h(1, 'C'),
			tag('conditional', {}, [
				tag('if', { data: 't' }, [h(2, 'Shown')]),
				tag('else', {}, [h(1, 'Not shown')])
			]),
			h(2, 'D'),
			h(1, 'E'),
			tag('modal', {}, [h(1, 'In modal')]),
			h(2, 'F'),
			h(1, 'G'),
			repeat('empty', 'x', [h(1, 'Never repeated')]),
			h(2, 'H')
		);
		expect(await summarize(tree, deps)).toEqual([
			{ label: 'A', depth: 0 },
			{ label: 'B', depth: 0 },
			{ label: 'C', depth: 0 },
			{ label: 'Shown', depth: 1 },
			{ label: 'D', depth: 0 },
			{ label: 'E', depth: 0 },
			{ label: 'F', depth: 0 },
			{ label: 'G', depth: 0 },
			{ label: 'H', depth: 0 }
		]);
	});

	it('lists every branch when a condition cannot be evaluated', async () => {
		const { deps } = setup(() => {
			throw new Error('warehouse down');
		});
		const tree = doc(
			tag('conditional', {}, [tag('if', { data: 't' }, [h(2, 'A')]), tag('else', {}, [h(2, 'B')])])
		);
		expect((await summarize(tree, deps)).map((s) => s.label)).toEqual(['A', 'B']);
	});

	it('skips modal bodies', async () => {
		const { deps } = setup();
		const tree = doc(h(1, 'Top'), tag('modal', {}, [h(2, 'Inside modal')]));
		expect((await summarize(tree, deps)).map((s) => s.label)).toEqual(['Top']);
	});
});
