// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Markdoc from '@markdoc/markdoc';
import { Filters } from '../../../Filters.svelte';
import { PAGE_FILTERS_CONTEXT_KEY } from '../../../page-filters-context';
import { registerFiltersFromAST } from '../../Renderer/MarkdocProcessor/register-filters';
import PeriodSelectorTestHarness from './PeriodSelectorTestHarness.svelte';

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
});

function render(readonly: boolean) {
	const filters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: { computedDefaultDateRangeEnd: '2026-08-14' } as never,
		dialect: undefined
	});
	registerFiltersFromAST(Markdoc.parse('{% period_selector id="q" grain="quarter" /%}'), filters);
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(PeriodSelectorTestHarness, {
		target,
		props: { props: { id: 'q', grain: 'quarter' } as never, readonly },
		context: new Map([[PAGE_FILTERS_CONTEXT_KEY, filters]])
	});
	flushSync();
}

describe('period_selector in static renders', () => {
	it('shows a plain label when the render is read-only, e.g. a component screenshot', () => {
		render(true);
		expect(target.textContent).toContain('Q2 2026');
		expect(target.querySelector('button')).toBeNull();
	});

	it('is interactive otherwise', () => {
		render(false);
		expect(target.querySelector('[aria-label="Previous period"]')).not.toBeNull();
	});
});
