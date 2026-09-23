// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import Fixture from './input-defaults-url.fixture.svelte';
import { Filters } from '../../Filters.svelte';
import { defaultDialect } from '../../sql-dialect';
import type { FilterDeps } from '../../Filter.svelte';

/**
 * Cross-page filter carryover copies the current URL params onto the next page,
 * so a default that leaks into the URL follows the reader everywhere and
 * silently filters other pages. Every input's programmatic default (initial_value,
 * select_first, computed slider range, calendar preset, ...) must therefore be
 * applied without a URL write.
 */

HTMLElement.prototype.scrollIntoView = vi.fn();
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
};

const pageFilters = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('../../page-filters-context', () => ({
	getPageFiltersContext: () => pageFilters.current
}));

vi.mock('../../metadata/inline-query-metadata.svelte', () => ({
	getInlineQueryMetadataContext: () => ({
		getTable: () => undefined,
		loadAllDebounced: vi.fn()
	})
}));

vi.mock('../../QueryService.context', async () => {
	const { defaultDialect } = await import('../../sql-dialect');
	const query = vi.fn().mockImplementation(async (sql: string) => {
		if (sql.includes('min_value')) {
			return {
				rows: [{ min_value: 10, max_value: 50 }],
				columns: [
					{ name: 'min_value', type: 'Float64', jsType: 'number' },
					{ name: 'max_value', type: 'Float64', jsType: 'number' }
				],
				error: null
			};
		}
		return {
			rows: [{ value: 'alpha' }, { value: 'beta' }, { value: 'gamma' }],
			columns: [{ name: 'value', type: 'String', jsType: 'string' }],
			error: null
		};
	});
	const connection = {
		id: 'default',
		type: 'managed',
		dialect: defaultDialect,
		query,
		catalog: {
			getTable: () => ({
				columns: [
					{ name: 'total', type: 'Float64', jsType: 'number' },
					{ name: 'category', type: 'String', jsType: 'string' }
				]
			})
		}
	};
	return {
		getQueryService: () => ({
			workspaceId: 'workspace',
			connectionType: 'managed',
			dialect: defaultDialect,
			query
		}),
		getDefaultConnection: () => connection
	};
});

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

// Query results arrive after the 500ms debounce, so data-driven defaults need the wait.
const QUERY_SETTLE_MS = 900;

async function settle(ms = 0) {
	flushSync();
	await tick();
	flushSync();
	if (ms > 0) {
		await new Promise((resolve) => setTimeout(resolve, ms));
		flushSync();
		await tick();
		flushSync();
	}
}

async function mountInput(name: string, props: Record<string, unknown>) {
	let url = new URL('https://example.com/report');
	const updateUrl = vi.fn((next: URL) => {
		url = new URL(next);
	});
	const deps: FilterDeps = {
		url: () => url,
		updateUrl,
		projectSettings: undefined,
		dialect: () => defaultDialect
	};
	const filters = new Filters(deps);
	pageFilters.current = filters;

	const { getUserComponent } = await import('../..');
	const userComponent = getUserComponent(name);
	if (!userComponent.Filter || !userComponent.Component) {
		throw new Error(`${name} is not an input component`);
	}
	filters.create(
		{ id: props.id as string, userComponentName: name, attributes: props },
		userComponent.Filter
	);

	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(Fixture, { target, props: { component: userComponent.Component, props } });

	return { filter: filters.get(props.id as string)!, updateUrl, getUrl: () => url };
}

type Case = {
	name: string;
	component: string;
	props: Record<string, unknown>;
	expected: unknown;
	settleMs?: number;
};

const cases: Case[] = [
	{
		name: 'dropdown select_first (static options)',
		component: 'dropdown',
		props: { id: 'dd', options: ['a', 'b', 'c'], select_first: true },
		expected: 'a'
	},
	{
		name: 'dropdown initial_value (static options)',
		component: 'dropdown',
		props: { id: 'dd', options: ['a', 'b', 'c'], initial_value: 'b' },
		expected: 'b'
	},
	{
		name: 'dropdown select_first (query options)',
		component: 'dropdown',
		props: { id: 'dd', data: 'orders', value_column: 'category', select_first: true },
		expected: 'alpha',
		settleMs: QUERY_SETTLE_MS
	},
	{
		name: 'dropdown multiple default_top_n',
		component: 'dropdown',
		props: { id: 'dd', data: 'orders', value_column: 'category', multiple: true, default_top_n: 2 },
		expected: ['alpha', 'beta'],
		settleMs: QUERY_SETTLE_MS
	},
	{
		name: 'slider single (query range)',
		component: 'slider',
		props: { id: 'sl', data: 'orders', value_column: 'total' },
		expected: 10,
		settleMs: QUERY_SETTLE_MS
	},
	{
		name: 'slider range (query range)',
		component: 'slider',
		props: { id: 'sl', data: 'orders', value_column: 'total', range: true },
		expected: [10, 50],
		settleMs: QUERY_SETTLE_MS
	},
	{
		name: 'slider initial_value',
		component: 'slider',
		props: { id: 'sl', min: 0, max: 100, initial_value: 20 },
		expected: 20
	},
	{
		name: 'range_calendar default_range',
		component: 'range_calendar',
		props: { id: 'rc', default_range: 'last 30 days' },
		expected: { range: 'last 30 days' },
		settleMs: 150
	},
	{
		name: 'range_calendar fallback preset',
		component: 'range_calendar',
		props: { id: 'rc' },
		expected: { range: 'all time' },
		settleMs: 150
	},
	{
		name: 'toggle initial_value',
		component: 'toggle',
		props: { id: 'tg', initial_value: true },
		expected: true
	},
	{
		name: 'button_group select_first',
		component: 'button_group',
		props: { id: 'bg', data: 'orders', value_column: 'category', select_first: true },
		expected: 'alpha',
		settleMs: QUERY_SETTLE_MS
	},
	{
		name: 'input_tabs (select_first by default)',
		component: 'input_tabs',
		props: { id: 'it', data: 'orders', value_column: 'category' },
		expected: 'alpha',
		settleMs: QUERY_SETTLE_MS
	},
	{
		name: 'date_grain_selector default grain',
		component: 'date_grain_selector',
		props: { id: 'dg' },
		expected: 'day'
	},
	{
		name: 'comparison_selector default comparison',
		component: 'comparison_selector',
		props: { id: 'cs' },
		expected: 'prior year'
	},
	{
		name: 'text_input initial_value',
		component: 'text_input',
		props: { id: 'ti', initial_value: 'hello' },
		expected: 'hello'
	},
	{
		name: 'table_filter initial_values',
		component: 'table_filter',
		props: {
			id: 'tf',
			data: 'orders',
			columns: ['category'],
			initial_values: { category: 'alpha' },
			single_select: [],
			multi_select: [],
			require_selection: [],
			multiple: true,
			showClearButton: true,
			defaultConjunction: 'AND'
		},
		expected: {
			active: true,
			filters: [
				{
					columnId: 'category',
					conditions: [{ type: 'string', operator: 'in', value: ['alpha'] }]
				}
			],
			conjunction: 'AND'
		},
		settleMs: QUERY_SETTLE_MS
	}
];

describe('input defaults never write to the URL', () => {
	for (const testCase of cases) {
		it(testCase.name, async () => {
			const { filter, updateUrl, getUrl } = await mountInput(testCase.component, testCase.props);
			await settle(testCase.settleMs ?? 50);

			expect(filter.value).toEqual(testCase.expected);
			expect(updateUrl).not.toHaveBeenCalled();
			expect(getUrl().search).toBe('');
		});
	}
});

describe('user edits after a default do write to the URL', () => {
	// The chip's operator toggle mutates the filter's stored state in place, so a
	// "did the value change?" check that re-reads that state sees no difference.
	it('table_filter operator toggle (in-place edit of the default state)', async () => {
		const tableFilter = cases.find((c) => c.component === 'table_filter')!;
		const { updateUrl, getUrl } = await mountInput(tableFilter.component, tableFilter.props);
		await settle(tableFilter.settleMs);
		expect(updateUrl).not.toHaveBeenCalled();

		const operatorButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
			(button) => button.textContent?.trim() === 'is'
		);
		expect(operatorButton).toBeTruthy();
		operatorButton!.click();
		await settle(50);

		expect(updateUrl).toHaveBeenCalledTimes(1);
		const persisted = JSON.parse(getUrl().searchParams.get('tf')!);
		expect(persisted.filters[0].conditions[0].operator).toBe('not_in');
	});
});
