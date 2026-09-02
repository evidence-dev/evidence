// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import Markdoc from '@markdoc/markdoc';
import { Filters } from '../Filters.svelte';
import { PAGE_FILTERS_CONTEXT_KEY } from '../page-filters-context';
import { registerFiltersFromAST } from '../user-components/Renderer/MarkdocProcessor/register-filters';
import { PeriodFilter } from '../user-components/tags/workflow_period/PeriodFilter.svelte';
import PeriodPicker from './PeriodPicker.svelte';

const ANCHOR = '2026-08-14';

function makeFilters(markdown: string) {
	const filters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: { computedDefaultDateRangeEnd: ANCHOR } as never,
		dialect: undefined
	});
	registerFiltersFromAST(Markdoc.parse(markdown), filters);
	return filters;
}

const PERIOD_PAGE =
	'---\ntitle: Ops\nworkflow:\n  period:\n    grain: month\n    periods: 3\n---\n\n# Report\n';
const PLAIN_PAGE = '---\ntitle: Plain\n---\n\n# Report\n';

let target: HTMLElement | undefined;
let component: Record<string, unknown> | undefined;

afterEach(() => {
	if (component) unmount(component);
	target?.remove();
	component = undefined;
	target = undefined;
});

function mountPicker(markdown: string, props: Record<string, unknown> = {}) {
	const filters = makeFilters(markdown);
	target = document.createElement('div');
	document.body.appendChild(target);
	component = mount(PeriodPicker, {
		target,
		props,
		context: new Map([[PAGE_FILTERS_CONTEXT_KEY, filters]])
	});
	return { filters, target };
}

describe('PeriodPicker', () => {
	it('renders the default period label', () => {
		const { target } = mountPicker(PERIOD_PAGE);
		expect(target.textContent).toContain('Jul 2026');
	});

	it('renders nothing when the page has no workflow.period block', () => {
		const { target } = mountPicker(PLAIN_PAGE);
		expect(target.textContent?.trim()).toBe('');
		expect(target.querySelector('button')).toBeNull();
	});

	it('steps to the previous period and updates the filter', () => {
		const { filters, target } = mountPicker(PERIOD_PAGE);
		target.querySelector<HTMLButtonElement>('[aria-label="Previous period"]')?.click();
		flushSync();

		const filter = filters.get('period') as PeriodFilter;
		expect(filter.value).toEqual({ key: '2026-06' });
		// And the label follows the selection.
		expect(target.textContent).toContain('Jun 2026');
	});

	it('disables "next" on the newest period and "previous" on the oldest', () => {
		const { filters, target } = mountPicker(PERIOD_PAGE);
		const next = () => target.querySelector<HTMLButtonElement>('[aria-label="Next period"]');
		const previous = () =>
			target.querySelector<HTMLButtonElement>('[aria-label="Previous period"]');

		// Newest complete period is selected by default.
		expect(next()?.disabled).toBe(true);
		expect(previous()?.disabled).toBe(false);

		// Only 3 periods are offered; step to the oldest.
		(filters.get('period') as PeriodFilter).value = { key: '2026-05' };
		flushSync();
		expect(previous()?.disabled).toBe(true);
		expect(next()?.disabled).toBe(false);
	});

	it('renders a static label with no controls when readonly', () => {
		const { target } = mountPicker(PERIOD_PAGE, { readonly: true });
		expect(target.textContent).toContain('Jul 2026');
		expect(target.querySelector('button')).toBeNull();
	});
});
