// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import Fixture from '../input-defaults-url.fixture.svelte';
import { Filters } from '../../../Filters.svelte';
import { defaultDialect } from '../../../sql-dialect';
import type { FilterDeps } from '../../../Filter.svelte';
import type { UserComponentProps } from '../../types';
import Dropdown from './Dropdown.svelte';
import { DropdownFilter } from './DropdownFilter.svelte';
import type { schema } from './schema';

HTMLElement.prototype.scrollIntoView = vi.fn();
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
};

const pageFilters = vi.hoisted(() => ({ current: undefined as unknown }));
const mockQuery = vi.hoisted(() => ({
	// `delta` exists in the table but sits outside the main options query's rows (as if past its limit).
	tableValues: ['alpha', 'beta', 'gamma', 'delta'],
	optionsValues: ['alpha', 'beta', 'gamma'],
	selectedDelayMs: 1000,
	failure: undefined as 'sql' | 'thrown' | undefined
}));

vi.mock('../../../page-filters-context', () => ({
	getPageFiltersContext: () => pageFilters.current
}));

vi.mock('../../../metadata/inline-query-metadata.svelte', () => ({
	getInlineQueryMetadataContext: () => ({
		getTable: () => undefined,
		loadAllDebounced: vi.fn()
	})
}));

vi.mock('../../../QueryService.context', async () => {
	const { defaultDialect } = await import('../../../sql-dialect');
	const columns = [{ name: 'value', type: 'String', jsType: 'string' }];
	const query = vi.fn().mockImplementation(async (sql: string) => {
		const isSelectedQuery = sql.includes(' IN (');
		if (isSelectedQuery) {
			await new Promise((resolve) => setTimeout(resolve, mockQuery.selectedDelayMs));
		}
		if (mockQuery.failure === 'thrown') throw new Error('network down');
		if (mockQuery.failure === 'sql') return { rows: [], columns, error: 'syntax error' };
		const values = isSelectedQuery
			? mockQuery.tableValues.filter((v) => sql.includes(`'${v}'`))
			: mockQuery.optionsValues;
		return { rows: values.map((value) => ({ value })), columns, error: null };
	});
	const connection = {
		id: 'default',
		type: 'managed',
		dialect: defaultDialect,
		query,
		catalog: {
			getTable: () => ({ columns: [{ name: 'category', type: 'String', jsType: 'string' }] })
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

// Past the 500ms query debounce, before the delayed selected-values query returns.
const OPTIONS_LOADED_MS = 700;
const ALL_SETTLED_MS = 3000;

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

beforeEach(() => {
	vi.useFakeTimers();
	mockQuery.failure = undefined;
});

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
	vi.useRealTimers();
});

async function advance(ms: number) {
	flushSync();
	await vi.advanceTimersByTimeAsync(ms);
	flushSync();
	await tick();
	flushSync();
}

type DropdownProps = UserComponentProps<typeof schema>;

async function mountDropdown(search: string, props: Partial<DropdownProps>) {
	let url = new URL(`https://example.com/report${search}`);
	const deps: FilterDeps = {
		url: () => url,
		updateUrl: (next: URL) => {
			url = new URL(next);
		},
		projectSettings: undefined,
		dialect: () => defaultDialect
	};
	const filters = new Filters(deps);
	pageFilters.current = filters;

	const allProps: DropdownProps = {
		id: 'dd',
		data: 'orders',
		value_column: 'category',
		search: false,
		filters: [],
		select_first: false,
		multiple: false,
		clear: false,
		...props
	};
	filters.create<'dropdown', DropdownProps, typeof DropdownFilter>(
		{ id: 'dd', userComponentName: 'dropdown', attributes: allProps },
		DropdownFilter
	);

	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(Fixture, { target, props: { component: Dropdown, props: allProps } });

	return { filter: filters.get('dd')!, getUrl: () => url };
}

describe('dropdown with static options and data= options', () => {
	it('keeps a URL-hydrated query value through the options load', async () => {
		const { filter, getUrl } = await mountDropdown('?dd=beta', { options: ['all'] });

		await advance(50);
		expect(filter.value).toBe('beta');

		await advance(ALL_SETTLED_MS);
		expect(filter.value).toBe('beta');
		expect(getUrl().searchParams.get('dd')).toBe('beta');
	});

	it('keeps an initial_value that only the query provides', async () => {
		const { filter } = await mountDropdown('', { options: ['all'], initial_value: 'gamma' });

		await advance(ALL_SETTLED_MS);
		expect(filter.value).toBe('gamma');
	});

	it('keeps an out-of-limit selection until the selected-values query confirms it', async () => {
		const { filter, getUrl } = await mountDropdown('?dd=delta', { options: ['all'] });

		await advance(OPTIONS_LOADED_MS);
		expect(filter.value).toBe('delta');

		await advance(ALL_SETTLED_MS);
		expect(filter.value).toBe('delta');
		expect(getUrl().searchParams.get('dd')).toBe('delta');
	});

	it('still clears a selection that the loaded options do not contain', async () => {
		const { filter, getUrl } = await mountDropdown('?dd=zeta', { options: ['all'] });

		await advance(ALL_SETTLED_MS);
		expect(filter.value).toBe('');
		expect(getUrl().searchParams.has('dd')).toBe(false);
	});

	it('multiple: keeps query-sourced selections and drops only the stale one', async () => {
		const search = `?dd=${encodeURIComponent(JSON.stringify(['beta', 'delta', 'zeta']))}`;
		const { filter } = await mountDropdown(search, { options: ['all'], multiple: true });

		await advance(OPTIONS_LOADED_MS);
		expect(filter.value).toEqual(['beta', 'delta', 'zeta']);

		await advance(ALL_SETTLED_MS);
		expect(filter.value).toEqual(['beta', 'delta']);
	});

	it.each(['sql', 'thrown'] as const)(
		'keeps the selection when the queries fail (%s error)',
		async (failure) => {
			mockQuery.failure = failure;
			const { filter, getUrl } = await mountDropdown('?dd=beta', { options: ['all'] });

			await advance(ALL_SETTLED_MS);
			expect(filter.value).toBe('beta');
			expect(getUrl().searchParams.get('dd')).toBe('beta');
		}
	);
});
