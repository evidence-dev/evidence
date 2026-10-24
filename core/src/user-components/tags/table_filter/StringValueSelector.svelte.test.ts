// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import StringValueSelector from './StringValueSelector.svelte';
import type { FilterState } from './types';

HTMLElement.prototype.scrollIntoView = vi.fn();
// jsdom has no Web Animations API, which the loading skeleton's `fade` transition uses
Element.prototype.animate = vi.fn(() => {
	const animation = { cancel: vi.fn(), finished: Promise.resolve(), onfinish: null };
	queueMicrotask(() => (animation.onfinish as (() => void) | null)?.());
	return animation as unknown as Animation;
});
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
};

const rows = vi.hoisted(() => ({
	current: [] as { value: string; count: number }[]
}));

vi.mock('../../../page-filters-context', () => ({
	getPageFiltersContext: () => undefined
}));

vi.mock('../../../QueryService.context', async () => {
	const { defaultDialect } = await import('../../../sql-dialect');
	const query = vi.fn(async () => ({ rows: rows.current, columns: [], error: null }));
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
});

async function settle() {
	for (let i = 0; i < 3; i++) {
		flushSync();
		await tick();
		await new Promise((resolve) => setTimeout(resolve, 350));
	}
	flushSync();
}

function button(text: string): HTMLButtonElement | undefined {
	return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
		(candidate) => candidate.textContent?.trim() === text
	);
}

function header(): string {
	return document.querySelector('.border-y')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

async function search(term: string) {
	const input = document.querySelector<HTMLInputElement>('input')!;
	input.value = term;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	await settle();
}

function mountSelector(filterState: FilterState, props: Record<string, unknown> = {}) {
	const onClose = vi.fn();
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(StringValueSelector, {
		target,
		props: {
			tableExpressionName: 'demo.programs',
			columnName: 'program',
			columnLabel: 'Program',
			onClose,
			filterState,
			...props
		}
	});
	return onClose;
}

const emptyState = (): FilterState => ({ active: false, conjunction: 'AND', filters: [] });

const dialogueRows = [
	{ value: 'Dialogue', count: 10 },
	{ value: 'Dialogue (Germany)', count: 2 },
	{ value: 'Pilots Dialogue', count: 7 }
];

describe('StringValueSelector Select All', () => {
	it('is only offered while searching', async () => {
		rows.current = dialogueRows;
		mountSelector(emptyState());
		await settle();
		expect(button('Select All')).toBeUndefined();

		await search('dialogue');
		expect(button('Select All')).toBeDefined();
	});

	it('is not offered for single-select columns', async () => {
		rows.current = dialogueRows;
		mountSelector(emptyState(), { multiple: false });
		await search('dialogue');
		expect(button('Select All')).toBeUndefined();
	});

	it('saves the search as a contains condition instead of listing every value', async () => {
		rows.current = dialogueRows;
		const filterState = emptyState();
		const onClose = mountSelector(filterState);
		await search(' dialogue ');

		button('Select All')!.click();
		await settle();
		expect(header()).toContain('All matching "dialogue"');

		button('Apply')!.click();
		expect(onClose).toHaveBeenCalled();
		expect(filterState.filters).toEqual([
			{
				columnId: 'program',
				conditions: [{ type: 'string', operator: 'contains', value: 'dialogue' }]
			}
		]);
	});

	it('reopens a contains filter as a match-all selection', async () => {
		rows.current = dialogueRows;
		const filterState: FilterState = {
			active: true,
			conjunction: 'AND',
			filters: [
				{
					columnId: 'program',
					conditions: [{ type: 'string', operator: 'contains', value: 'dialogue' }]
				}
			]
		};
		mountSelector(filterState);
		await settle();

		expect(document.querySelector<HTMLInputElement>('input')!.value).toBe('dialogue');
		expect(header()).toContain('All matching "dialogue"');
		expect(button('Select All')).toBeUndefined();
	});

	it('keeps the matches when the user deselects one of them', async () => {
		rows.current = dialogueRows;
		const filterState = emptyState();
		mountSelector(filterState);
		await search('dialogue');
		button('Select All')!.click();
		await settle();

		button('Pilots Dialogue')!.click();
		await settle();
		button('Apply')!.click();

		expect(filterState.filters[0]!.conditions[0]).toEqual({
			type: 'string',
			operator: 'in',
			value: ['Dialogue', 'Dialogue (Germany)']
		});
	});

	it('keeps a match-all selection while the user searches for something else', async () => {
		rows.current = dialogueRows;
		const filterState = emptyState();
		mountSelector(filterState);
		await search('dialogue');
		button('Select All')!.click();
		await settle();

		rows.current = [{ value: 'Coaching', count: 4 }];
		await search('coach');
		expect(header()).toContain('All matching "dialogue"');
		button('Apply')!.click();

		expect(filterState.filters[0]!.conditions[0]).toEqual({
			type: 'string',
			operator: 'contains',
			value: 'dialogue'
		});
	});

	it('keeps a reopened match-all selection when the user types before it loads', async () => {
		rows.current = dialogueRows;
		const filterState: FilterState = {
			active: true,
			conjunction: 'AND',
			filters: [
				{
					columnId: 'program',
					conditions: [{ type: 'string', operator: 'contains', value: 'dialogue' }]
				}
			]
		};
		mountSelector(filterState);
		flushSync();
		expect(header()).toContain('All matching "dialogue"');
		const input = document.querySelector<HTMLInputElement>('input')!;
		input.value = 'dialogue x';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		button('Apply')!.click();

		expect(filterState.filters[0]!.conditions[0]).toEqual({
			type: 'string',
			operator: 'contains',
			value: 'dialogue'
		});
	});

	it('checks rows the SQL wildcard search matched', async () => {
		rows.current = [{ value: 'ACB', count: 1 }];
		mountSelector(emptyState());
		await search('A_B');
		button('Select All')!.click();
		await settle();

		expect(button('ACB')!.querySelector('svg')).not.toBeNull();
	});

	it('does not shrink a match-all selection too large to load in full', async () => {
		rows.current = Array.from({ length: 10000 }, (_, i) => ({
			value: `Dialogue ${String(i).padStart(5, '0')}`,
			count: 1
		}));
		const filterState = emptyState();
		mountSelector(filterState);
		await search('dialogue');
		button('Select All')!.click();
		await settle();
		expect(document.body.textContent).toContain('Too many matches to change individually');

		button('Dialogue 00000')!.click();
		await settle();
		button('Apply')!.click();

		expect(filterState.filters[0]!.conditions[0]).toEqual({
			type: 'string',
			operator: 'contains',
			value: 'dialogue'
		});
	});

	it('falls back to a value list when an earlier pick does not match the search', async () => {
		rows.current = [{ value: 'Coaching', count: 4 }];
		const filterState = emptyState();
		mountSelector(filterState);
		await settle();
		button('Coaching')!.click();
		await settle();

		rows.current = dialogueRows;
		await search('dialogue');
		button('Select All')!.click();
		await settle();
		button('Apply')!.click();

		expect(filterState.filters[0]!.conditions[0]).toEqual({
			type: 'string',
			operator: 'in',
			value: ['Coaching', 'Dialogue', 'Dialogue (Germany)', 'Pilots Dialogue']
		});
	});

	it('falls back to a value list of eligible values when minimum_records is set', async () => {
		rows.current = dialogueRows;
		const filterState = emptyState();
		mountSelector(filterState, { minimumRecords: 5 });
		await search('dialogue');
		button('Select All')!.click();
		await settle();
		button('Apply')!.click();

		expect(filterState.filters[0]!.conditions[0]).toEqual({
			type: 'string',
			operator: 'in',
			value: ['Dialogue', 'Pilots Dialogue']
		});
	});
});
