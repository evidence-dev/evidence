// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import Markdoc from '@markdoc/markdoc';
import { Filters } from '../../../Filters.svelte';
import { PAGE_FILTERS_CONTEXT_KEY } from '../../../page-filters-context';
import { registerFiltersFromAST } from '../../Renderer/MarkdocProcessor/register-filters';
import RangeCalendar from './RangeCalendar.svelte';

(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
};

const settings = vi.hoisted(() => ({
	current: { first_day_of_week: 'sunday' as 'sunday' | 'monday' }
}));

vi.mock('../../../project-settings.context', () => ({
	getProjectSettingsContext: () => () => settings.current
}));

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
});

async function openCalendar(firstDayOfWeek: 'sunday' | 'monday') {
	settings.current = { first_day_of_week: firstDayOfWeek };
	const filters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: settings.current as never,
		dialect: undefined
	});
	registerFiltersFromAST(Markdoc.parse('{% range_calendar id="dates" /%}'), filters);
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(RangeCalendar, {
		target,
		props: { id: 'dates' } as never,
		context: new Map([[PAGE_FILTERS_CONTEXT_KEY, filters]])
	});
	// The trigger becomes interactive after a short delay that avoids hydration layout shifts.
	await new Promise((resolve) => setTimeout(resolve, 150));
	flushSync();
	document.querySelector<HTMLButtonElement>('button#dates')?.click();
	await settle();
	// jsdom ignores the `lg:` breakpoint, so the desktop and mobile layouts both render. Switch the
	// mobile layout from its preset list to its one-month calendar so both calendars are checked.
	Array.from(document.querySelectorAll('button'))
		.find((button) => button.textContent?.includes('Custom Range'))
		?.click();
	await settle();
}

async function settle() {
	flushSync();
	await tick();
	flushSync();
}

/** Weekday headers of every month grid on screen: two desktop months plus the mobile month. */
function weekdayHeadersPerGrid(): string[][] {
	return Array.from(document.querySelectorAll('[data-range-calendar-grid]')).map((grid) =>
		Array.from(grid.querySelectorAll('th')).map((th) => th.textContent?.trim() ?? '')
	);
}

describe('range_calendar week start', () => {
	it('starts weeks on Sunday by default', async () => {
		await openCalendar('sunday');
		const sundayFirst = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
		expect(weekdayHeadersPerGrid()).toEqual([sundayFirst, sundayFirst, sundayFirst]);
	});

	it('starts weeks on Monday when first_day_of_week is monday', async () => {
		await openCalendar('monday');
		const mondayFirst = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
		expect(weekdayHeadersPerGrid()).toEqual([mondayFirst, mondayFirst, mondayFirst]);
		// Every week row begins on a Monday, not just the header.
		const firstCells = Array.from(
			document.querySelectorAll('[data-range-calendar-grid] tbody tr td:first-child[data-value]')
		);
		expect(firstCells.length).toBeGreaterThan(0);
		for (const cell of firstCells) {
			const iso = cell.getAttribute('data-value') ?? '';
			const [y, m, d] = iso.split('-').map(Number);
			expect(new Date(y, m - 1, d).getDay()).toBe(1);
		}
	});
});
