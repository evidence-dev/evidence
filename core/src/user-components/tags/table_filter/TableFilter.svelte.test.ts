// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import TableFilter from './TableFilter.svelte';
import { Filters } from '../../../Filters.svelte';
import { TableFilterFilter } from './TableFilterFilter.svelte';
import { defaultDialect } from '../../../sql-dialect';

HTMLElement.prototype.scrollIntoView = vi.fn();
const readComputedStyle = window.getComputedStyle.bind(window);

const pageFilters = vi.hoisted(() => ({ current: undefined as unknown }));

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
	const query = vi.fn().mockResolvedValue({ rows: [], columns: [], error: null });
	return {
		getQueryService: () => ({
			workspaceId: 'workspace',
			connectionType: 'managed',
			dialect: defaultDialect,
			query
		}),
		getDefaultConnection: () => ({
			id: 'default',
			type: 'managed',
			dialect: defaultDialect,
			query,
			catalog: {
				getTable: () => ({
					columns: [
						{ name: 'total_sales', type: 'Float64', jsType: 'number' },
						{ name: 'category', type: 'String', jsType: 'string' }
					]
				})
			}
		})
	};
});

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
	vi.unstubAllGlobals();
});

async function settle() {
	flushSync();
	await tick();
	flushSync();
}

function elementWithText(selector: string, text: string): HTMLElement {
	const element = Array.from(document.querySelectorAll<HTMLElement>(selector)).find((candidate) =>
		candidate.textContent?.includes(text)
	);
	if (!element) throw new Error(`Could not find ${selector} containing "${text}"`);
	return element;
}

describe('TableFilter popover', () => {
	it('closes a numeric selector without clearing its column during teardown', async () => {
		vi.stubGlobal('getComputedStyle', (element: Element) => {
			const styles = readComputedStyle(element);
			if (!(element instanceof HTMLElement) || !element.hasAttribute('data-popover-content')) {
				return styles;
			}
			return new Proxy(styles, {
				get(target, property) {
					if (property === 'animationName') {
						return element.getAttribute('data-state') === 'closed' ? 'popover-out' : 'popover-in';
					}
					return Reflect.get(target, property, target);
				}
			});
		});

		target = document.createElement('div');
		document.body.appendChild(target);
		mounted = mount(TableFilter, {
			target,
			props: {
				id: 'daily_orders_filter',
				data: 'demo.daily_orders',
				title: 'Filter',
				defaultConjunction: 'AND',
				columns: ['total_sales'],
				showClearButton: true,
				multiple: true,
				single_select: [],
				multi_select: [],
				initial_values: {},
				require_selection: []
			}
		});

		elementWithText('button', 'Filter').click();
		await settle();
		elementWithText('[data-slot="command-item"]', 'Total Sales').click();
		await settle();
		const numericInput = document.querySelector<HTMLInputElement>('input[type="number"]');
		expect(numericInput).not.toBeNull();
		numericInput?.focus();
		await new Promise((resolve) => setTimeout(resolve, 5));

		const outsideButton = document.createElement('button');
		target.appendChild(outsideButton);
		outsideButton.dispatchEvent(
			new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 100, clientY: 100 })
		);
		await new Promise((resolve) => setTimeout(resolve, 20));
		await settle();

		expect(elementWithText('button', 'Filter')).toBeTruthy();
		expect(numericInput?.isConnected).toBe(true);
		expect(numericInput?.closest('[data-popover-content]')?.getAttribute('data-state')).toBe(
			'closed'
		);

		elementWithText('button', 'Filter').click();
		await settle();
		expect(elementWithText('[data-slot="command-item"]', 'Total Sales')).toBeTruthy();
		expect(document.querySelector('input[type="number"]')).toBeNull();
	});
});

describe('TableFilter initial_values arriving after mount', () => {
	const ID = 'orders_filter';

	function attributes(initial_values?: Record<string, string | string[]>) {
		return {
			data: 'demo.daily_orders',
			title: 'Filter',
			defaultConjunction: 'AND' as const,
			columns: ['category'],
			showClearButton: true,
			multiple: true,
			single_select: [],
			multi_select: [],
			require_selection: [],
			initial_values
		};
	}

	function makeFilters() {
		const filters = new Filters({
			url: undefined,
			updateUrl: undefined,
			projectSettings: undefined,
			dialect: () => defaultDialect
		});
		pageFilters.current = filters;
		return filters;
	}

	function register(filters: Filters, initial_values?: Record<string, string | string[]>) {
		filters.create(
			{
				id: ID,
				userComponentName: 'table_filter',
				attributes: attributes(initial_values)
			} as unknown as ConstructorParameters<typeof TableFilterFilter>[0],
			TableFilterFilter
		);
	}

	function mountFilter(initial_values?: Record<string, string | string[]>) {
		target = document.createElement('div');
		document.body.appendChild(target);
		mounted = mount(TableFilter, {
			target,
			props: { id: ID, ...attributes(initial_values), initial_values: initial_values ?? {} }
		});
	}

	it('applies initial_values the filter already carries at mount', async () => {
		const filters = makeFilters();
		register(filters, { category: 'Groceries' });

		mountFilter({ category: 'Groceries' });
		await settle();

		expect(filters.get(ID)?.value).toBeDefined();
	});

	it('keeps initial_values that a later registration pass applies', async () => {
		const filters = makeFilters();
		// First pass: the partial has not resolved, so there is no default yet.
		register(filters);

		mountFilter();
		await settle();

		// Second pass: the partial resolves and addOrUpdateFilters replaces the
		// filter with one carrying the default.
		filters.remove(ID);
		register(filters, { category: 'Groceries' });
		await settle();

		expect(filters.get(ID)?.value).toBeDefined();
	});
});

describe('TableFilter URL persistence', () => {
	const ID = 'orders_filter';

	function attributes(
		initial_values: Record<string, string | string[]>,
		overrides: Record<string, unknown> = {}
	) {
		return {
			data: 'demo.daily_orders',
			title: 'Filter',
			defaultConjunction: 'AND' as const,
			columns: ['category', 'region'],
			showClearButton: true,
			multiple: true,
			single_select: [],
			multi_select: [],
			require_selection: [],
			initial_values,
			...overrides
		};
	}

	function mountWithUrl(
		initial_values: Record<string, string | string[]>,
		{
			startUrl = 'https://example.com/report',
			overrides = {}
		}: { startUrl?: string; overrides?: Record<string, unknown> } = {}
	) {
		let url = new URL(startUrl);
		const updateUrl = vi.fn((next: URL) => {
			url = new URL(next);
		});
		const filters = new Filters({
			url: () => url,
			updateUrl,
			projectSettings: undefined,
			dialect: () => defaultDialect
		});
		pageFilters.current = filters;
		filters.create(
			{
				id: ID,
				userComponentName: 'table_filter',
				attributes: attributes(initial_values, overrides)
			} as unknown as ConstructorParameters<typeof TableFilterFilter>[0],
			TableFilterFilter
		);

		target = document.createElement('div');
		document.body.appendChild(target);
		mounted = mount(TableFilter, {
			target,
			props: { id: ID, ...attributes(initial_values, overrides) }
		});

		return { filters, updateUrl, getUrl: () => url };
	}

	function urlWith(state: unknown) {
		return `https://example.com/report?${ID}=${encodeURIComponent(JSON.stringify(state))}`;
	}

	const regionIn = (values: string[]) => ({
		active: true,
		filters: [
			{ columnId: 'region', conditions: [{ type: 'string', operator: 'in', value: values }] }
		],
		conjunction: 'AND'
	});

	async function settleWithQueries() {
		await settle();
		await new Promise((resolve) => setTimeout(resolve, 20));
		await settle();
	}

	it('keeps initial_values out of the URL but persists a user edit', async () => {
		const { filters, updateUrl, getUrl } = mountWithUrl({
			category: 'Groceries',
			region: 'West'
		});
		await settle();
		await new Promise((resolve) => setTimeout(resolve, 20));
		await settle();

		// The default is applied to the filter's state...
		expect((filters.get(ID)?.value as { filters: unknown[] }).filters).toHaveLength(2);
		// ...but never written to the URL, so it can't be carried to other pages.
		expect(updateUrl).not.toHaveBeenCalled();
		expect(getUrl().searchParams.has(ID)).toBe(false);

		// A user removing one chip is a real choice and must persist.
		const removeChip = document.querySelector('button > svg.lucide-x')?.closest('button');
		expect(removeChip).toBeTruthy();
		removeChip!.click();
		await settle();

		expect(updateUrl).toHaveBeenCalled();
		const persisted = getUrl().searchParams.get(ID);
		expect(persisted).toBeTruthy();
		expect(JSON.parse(persisted!).filters).toHaveLength(1);
	});

	it('persists an operator toggle, which edits the shared filter state in place', async () => {
		const { updateUrl, getUrl } = mountWithUrl({ region: 'West' });
		await settleWithQueries();
		expect(updateUrl).not.toHaveBeenCalled();

		const operatorButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
			(button) => button.textContent?.trim() === 'is'
		);
		expect(operatorButton).toBeTruthy();
		operatorButton!.click();
		await settleWithQueries();

		expect(updateUrl).toHaveBeenCalled();
		const persisted = JSON.parse(getUrl().searchParams.get(ID)!);
		expect(persisted.filters[0].conditions[0].operator).toBe('not_in');
	});

	it('writes a URL value back once a single_select column has constrained it', async () => {
		const { filters, updateUrl, getUrl } = mountWithUrl(
			{},
			{ startUrl: urlWith(regionIn(['East', 'West'])), overrides: { single_select: ['region'] } }
		);
		await settleWithQueries();

		const value = filters.get(ID)?.value as ReturnType<typeof regionIn>;
		expect(value.filters[0].conditions[0].value).toEqual(['East']);
		expect(updateUrl).toHaveBeenCalled();
		const persisted = JSON.parse(getUrl().searchParams.get(ID)!);
		expect(persisted.filters[0].conditions[0].value).toEqual(['East']);
	});

	it('loads a tf URL param and round-trips its value (one benign canonicalizing write)', async () => {
		const original = regionIn(['East', 'West']);
		const { filters, updateUrl, getUrl } = mountWithUrl({}, { startUrl: urlWith(original) });
		await settleWithQueries();

		// The value loads intact...
		const value = filters.get(ID)?.value as ReturnType<typeof regionIn>;
		expect(value.filters[0].conditions[0].value).toEqual(['East', 'West']);
		// ...and the one write on load is content-identical (deserialize returns keys in a
		// different order than the component rebuilds them, so serialize differs as a string
		// while decoding to the same state). replaceState to an equal value is harmless.
		expect(updateUrl).toHaveBeenCalledTimes(1);
		expect(JSON.parse(getUrl().searchParams.get(ID)!)).toEqual(original);
	});

	it('keeps a constrained initial_values default out of the URL', async () => {
		const { filters, updateUrl, getUrl } = mountWithUrl(
			{ region: ['East', 'West'] },
			{ overrides: { single_select: ['region'] } }
		);
		await settleWithQueries();

		const value = filters.get(ID)?.value as ReturnType<typeof regionIn>;
		expect(value.filters[0].conditions[0].value).toEqual(['East']);
		expect(updateUrl).not.toHaveBeenCalled();
		expect(getUrl().searchParams.has(ID)).toBe(false);
	});
});
