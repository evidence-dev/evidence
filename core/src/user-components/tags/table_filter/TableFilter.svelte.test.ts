// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import TableFilter from './TableFilter.svelte';
import { Filters } from '../../../Filters.svelte';
import { TableFilterFilter } from './TableFilterFilter.svelte';
import { defaultDialect } from '../../../sql-dialect';

HTMLElement.prototype.scrollIntoView = vi.fn();
const readComputedStyle = window.getComputedStyle.bind(window);

vi.mock('../../../metadata/context', () => ({
	getMetadataContext: () => ({
		getTable: () => ({
			columns: [
				{ name: 'total_sales', type: 'Float64', jsType: 'number' },
				{ name: 'category', type: 'String', jsType: 'string' }
			]
		})
	})
}));

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
			query
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
