// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import Markdoc from '@markdoc/markdoc';
import { Filters } from '../../../Filters.svelte';
import { PAGE_FILTERS_CONTEXT_KEY } from '../../../page-filters-context';
import { registerFiltersFromAST } from '../../Renderer/MarkdocProcessor/register-filters';
import { InlineQueries } from '../../common/inline-queries';
import RangeCalendar from './RangeCalendar.svelte';
import type { RangeCalendarFilter } from './RangeCalendarFilter.svelte';

(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
};

const settings = vi.hoisted(() => ({
	current: {
		first_day_of_week: 'sunday' as 'sunday' | 'monday',
		computedDefaultDateRangeEnd: undefined as string | undefined
	}
}));

vi.mock('../../../project-settings.context', () => ({
	getProjectSettingsContext: () => () => settings.current
}));

// Lets a test supply inline queries, which the component needs to resolve `{{variables}}`.
const inlineQueries = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('../../common/inline-queries', async (importOriginal) => ({
	...(await importOriginal<typeof import('../../common/inline-queries')>()),
	getInlineQueriesContext: () => inlineQueries.current
}));

let mounted: ReturnType<typeof mount> | undefined;
let target: HTMLElement | undefined;

beforeEach(() => {
	// Only Date is faked: "today" is Monday, Nov 2 2026, so the visible months are fixed.
	vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 2, 12) });
});

afterEach(() => {
	if (mounted) unmount(mounted);
	target?.remove();
	mounted = undefined;
	target = undefined;
	inlineQueries.current = undefined;
	vi.useRealTimers();
});

async function settle() {
	flushSync();
	await tick();
	flushSync();
}

type RenderOptions = {
	firstDayOfWeek?: 'sunday' | 'monday';
	/** Attributes for the range_calendar tag (and the component's props). */
	attributes?: Record<string, string | string[]>;
	/** Markdoc for other inputs on the page. */
	page?: string;
	/** The project's "now" (`default_date_range_end`), when it isn't the clock's today. */
	anchor?: string;
};

/** Every filter on the page rendered by the latest `openCalendar`. */
let pageFilters: Filters;

/** Renders a range_calendar with id "dates", opens it, and shows the mobile calendar too. */
async function openCalendar({
	firstDayOfWeek = 'sunday',
	attributes = {},
	page = '',
	anchor
}: RenderOptions = {}) {
	settings.current = { first_day_of_week: firstDayOfWeek, computedDefaultDateRangeEnd: anchor };
	const filters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: settings.current as never,
		dialect: undefined
	});
	const attributeText = Object.entries(attributes)
		.map(([name, value]) => ` ${name}=${JSON.stringify(value)}`)
		.join('');
	registerFiltersFromAST(
		Markdoc.parse(`${page}\n{% range_calendar id="dates"${attributeText} /%}`),
		filters
	);
	if (page) inlineQueries.current = new InlineQueries({ filterContexts: [filters] });
	pageFilters = filters;
	target = document.createElement('div');
	document.body.appendChild(target);
	mounted = mount(RangeCalendar, {
		target,
		props: { id: 'dates', ...attributes } as never,
		context: new Map([[PAGE_FILTERS_CONTEXT_KEY, filters]])
	});
	// The trigger becomes interactive after a short delay that avoids hydration layout shifts.
	await vi.waitFor(() => {
		flushSync();
		if (document.querySelector('button#dates:disabled')) throw new Error('not mounted yet');
	});
	document.querySelector<HTMLButtonElement>('button#dates')?.click();
	await settle();
	// jsdom ignores the `lg:` breakpoint, so the desktop and mobile layouts both render. Switch the
	// mobile layout from its preset list to its calendar so both calendars are checked.
	buttonWithText('Custom Range').click();
	await settle();
	return filters.get('dates') as RangeCalendarFilter;
}

function buttonWithText(text: string): HTMLButtonElement {
	const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
		candidate.textContent?.includes(text)
	);
	if (!button) throw new Error(`No button containing "${text}"`);
	return button;
}

const triggerText = () => document.querySelector('button#dates')?.textContent?.trim();

/** Weekday headers of every month grid on screen: two desktop months plus the mobile month. */
function weekdayHeadersPerGrid(): string[][] {
	return Array.from(document.querySelectorAll('[data-range-calendar-grid]')).map((grid) =>
		Array.from(grid.querySelectorAll('th')).map((th) => th.textContent?.trim() ?? '')
	);
}

/** The desktop picker: the one showing two months or two panels. */
function desktopPicker(): Element {
	const pickers = Array.from(
		document.querySelectorAll('[data-period-grid], [data-grain="week"], [data-grain="day"]')
	);
	const desktop = pickers.find(
		(picker) => picker.querySelectorAll('[data-range-calendar-grid], [role="group"]').length === 2
	);
	if (!desktop) throw new Error('No desktop picker');
	return desktop;
}

/** A button in the footer under the desktop picker (Today / This …, Clear, Done). */
function desktopFooterButton(text: string): HTMLButtonElement {
	const button = Array.from(
		desktopPicker().parentElement?.querySelectorAll<HTMLButtonElement>('button') ?? []
	).find((candidate) => candidate.textContent?.trim() === text);
	if (!button) throw new Error(`No footer button "${text}"`);
	return button;
}

async function clickPeriod(iso: string) {
	const cell = desktopPicker().querySelector<HTMLButtonElement>(
		`[data-period-cell][data-value="${iso}"]`
	);
	if (!cell) throw new Error(`No period cell for ${iso}`);
	cell.click();
	await settle();
}

async function clickDay(iso: string) {
	const day = desktopPicker().querySelector<HTMLElement>(`td[data-value="${iso}"] [data-bits-day]`);
	if (!day) throw new Error(`No day cell for ${iso}`);
	day.click();
	await settle();
}

/** Labels in the desktop preset sidebar. */
const presetLabels = () =>
	Array.from(document.querySelectorAll('.w-\\[160px\\] button')).map((b) => b.textContent?.trim());

describe('range_calendar week start', () => {
	it('starts weeks on Sunday by default', async () => {
		await openCalendar({ firstDayOfWeek: 'sunday' });
		const sundayFirst = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
		expect(weekdayHeadersPerGrid()).toEqual([sundayFirst, sundayFirst, sundayFirst]);
	});

	it('starts weeks on Monday when first_day_of_week is monday', async () => {
		await openCalendar({ firstDayOfWeek: 'monday' });
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

describe('range_calendar grain="week"', () => {
	it('selects the whole week on the first click and extends it on the second', async () => {
		const filter = await openCalendar({ attributes: { grain: 'week' } });
		await clickDay('2026-11-04');
		expect(filter.value).toEqual({ range: '2026-11-01 to 2026-11-07' });
		expect(triggerText()).toBe('Week of Nov 1, 2026');

		await clickDay('2026-11-18');
		expect(filter.value).toEqual({ range: '2026-11-01 to 2026-11-21' });
		expect(triggerText()).toBe('Nov 1, 2026 – Nov 21, 2026');

		// The next click starts a new selection
		await clickDay('2026-11-10');
		expect(filter.value).toEqual({ range: '2026-11-08 to 2026-11-14' });
	});

	it('extends backwards, and a second click elsewhere in the same week keeps one week', async () => {
		const filter = await openCalendar({ attributes: { grain: 'week' } });
		await clickDay('2026-11-18');
		await clickDay('2026-11-04');
		expect(filter.value).toEqual({ range: '2026-11-01 to 2026-11-21' });

		await clickDay('2026-11-25');
		await clickDay('2026-11-25');
		expect(filter.value).toEqual({ range: '2026-11-22 to 2026-11-28' });
	});

	it('starts a fresh selection after the popover is closed with Done and reopened', async () => {
		const filter = await openCalendar({ attributes: { grain: 'week' } });
		await clickDay('2026-11-04');
		desktopFooterButton('Done').click();
		await settle();
		document.querySelector<HTMLButtonElement>('button#dates')?.click();
		await settle();
		await clickDay('2026-11-25');
		expect(filter.value).toEqual({ range: '2026-11-22 to 2026-11-28' });
	});

	it("doesn't clear the week when its first day is clicked twice", async () => {
		const filter = await openCalendar({ attributes: { grain: 'week' } });
		await clickDay('2026-11-08');
		await clickDay('2026-11-08');
		expect(filter.value).toEqual({ range: '2026-11-08 to 2026-11-14' });
		expect(triggerText()).toBe('Week of Nov 8, 2026');
	});

	it('drops a waiting first click when a preset is picked', async () => {
		const filter = await openCalendar({ attributes: { grain: 'week' } });
		await clickDay('2026-11-04');
		buttonWithText('Previous Week').click();
		await settle();
		await clickDay('2026-11-18');
		expect(filter.value).toEqual({ range: '2026-11-15 to 2026-11-21' });
	});

	it('uses Monday weeks when first_day_of_week is monday', async () => {
		const filter = await openCalendar({ firstDayOfWeek: 'monday', attributes: { grain: 'week' } });
		await clickDay('2026-11-04');
		expect(filter.value).toEqual({ range: '2026-11-02 to 2026-11-08' });
	});

	it('offers whole-week presets', async () => {
		await openCalendar({ attributes: { grain: 'week' } });
		expect(presetLabels()).toEqual([
			'This Week',
			'Previous Week',
			'Previous 4 Weeks',
			'Previous 13 Weeks',
			'Previous 52 Weeks',
			'All Time'
		]);
	});
});

describe('range_calendar grain="month"', () => {
	it('shows two years of months and selects months by clicking', async () => {
		const filter = await openCalendar({
			attributes: { grain: 'month', default_range: '2025-01-01 to 2025-01-31' }
		});
		const picker = desktopPicker();
		expect(Array.from(picker.querySelectorAll('[role="group"]')).map((g) => g.ariaLabel)).toEqual([
			'2024',
			'2025'
		]);
		expect(picker.querySelectorAll('[data-period-cell]')).toHaveLength(24);

		await clickPeriod('2025-03-01');
		expect(filter.value).toEqual({ range: '2025-03-01 to 2025-03-31' });
		expect(triggerText()).toBe('Mar 2025');

		await clickPeriod('2025-05-01');
		expect(filter.value).toEqual({ range: '2025-03-01 to 2025-05-31' });
		expect(triggerText()).toBe('Mar 2025 – May 2025');
		const selected = Array.from(picker.querySelectorAll('[data-selected]')).map((cell) =>
			cell.getAttribute('data-value')
		);
		expect(selected).toEqual(['2025-03-01', '2025-04-01', '2025-05-01']);
	});

	it('pages through years', async () => {
		await openCalendar({
			attributes: { grain: 'month', default_range: '2025-01-01 to 2025-01-31' }
		});
		const picker = desktopPicker();
		picker.querySelector<HTMLButtonElement>('[aria-label="Show earlier periods"]')?.click();
		await settle();
		expect(Array.from(picker.querySelectorAll('[role="group"]')).map((g) => g.ariaLabel)).toEqual([
			'2022',
			'2023'
		]);
	});

	it('shows a misaligned selection, e.g. from the URL, as whole months', async () => {
		await openCalendar({
			attributes: { grain: 'month', default_range: '2025-01-15 to 2025-02-10' }
		});
		expect(triggerText()).toBe('Jan 2025 – Feb 2025');
	});

	it('offers whole-month presets and keeps preset labels on the button', async () => {
		const filter = await openCalendar({ attributes: { grain: 'month' } });
		expect(presetLabels()).toEqual([
			'This Month',
			'Previous Month',
			'Previous 3 Months',
			'Previous 6 Months',
			'Previous 12 Months',
			'Year to Date',
			'All Time'
		]);
		buttonWithText('Previous 3 Months').click();
		await settle();
		expect(filter.value).toEqual({ range: 'previous 3 months' });
		expect(triggerText()).toBe('Previous 3 Months');
	});

	it('selects the current month from the button under the grid', async () => {
		const filter = await openCalendar({ attributes: { grain: 'month' } });
		// The footer button, not the sidebar preset of the same name
		const footer = Array.from(
			desktopPicker().parentElement?.querySelectorAll<HTMLButtonElement>(':scope > div > button') ??
				[]
		).find((button) => button.textContent?.trim() === 'This Month');
		expect(footer).toBeDefined();
		footer?.click();
		await settle();
		// The same as the preset, so both resolve against the same date
		expect(filter.value).toEqual({ range: 'this month' });
		expect(triggerText()).toBe('This Month');
	});

	it('shows "Year to Date" as selected even though it ends mid-month', async () => {
		const filter = await openCalendar({ attributes: { grain: 'month' } });
		buttonWithText('Year to Date').click();
		await settle();
		expect(filter.value).toEqual({ range: 'year to date' });
		expect(triggerText()).toBe('Year to Date');
		// …while the SQL covers whole months
		expect(filter.templateValues.between).toBe(
			"BETWEEN toDate('2026-01-01') AND toDate('2026-11-30')"
		);
	});

	it('starts a fresh selection after Clear', async () => {
		const filter = await openCalendar({
			attributes: { grain: 'month', default_range: '2025-01-01 to 2025-01-31' }
		});
		await clickPeriod('2025-03-01');
		desktopFooterButton('Clear').click();
		await settle();
		expect(filter.value).toEqual({ range: 'all time' });
		await clickPeriod('2025-06-01');
		expect(filter.value).toEqual({ range: '2025-06-01 to 2025-06-30' });
	});

	it('reopens the grid on a picked preset and drops a waiting first click', async () => {
		const filter = await openCalendar({
			attributes: { grain: 'month', default_range: '2025-01-01 to 2025-01-31' }
		});
		await clickPeriod('2025-03-01');
		buttonWithText('Previous Month').click();
		await settle();
		// Previous month is Oct 2026, so the grid now shows 2025–2026
		const groups = Array.from(desktopPicker().querySelectorAll('[role="group"]'));
		expect(groups.map((g) => g.ariaLabel)).toEqual(['2025', '2026']);
		await clickPeriod('2025-06-01');
		expect(filter.value).toEqual({ range: '2025-06-01 to 2025-06-30' });
	});

	it('shows the widened months for a preset that had to be widened', async () => {
		const filter = await openCalendar({
			attributes: { grain: 'month', preset_ranges: ['last 30 days', 'previous month'] }
		});
		buttonWithText('Last 30 Days').click();
		await settle();
		expect(filter.value).toEqual({ range: 'last 30 days' });
		// Oct 4 – Nov 2, widened
		expect(triggerText()).toBe('Oct 2026 – Nov 2026');
	});

	it('leaves out a hidden default preset that would be widened, and keeps one that fits', async () => {
		await openCalendar({ attributes: { grain: 'month', default_range: 'last 7 days' } });
		expect(presetLabels()).not.toContain('Last 7 Days');
		expect(triggerText()).toBe('Oct 2026 – Nov 2026');
		unmount(mounted!);
		mounted = undefined;
		target?.remove();

		await openCalendar({ attributes: { grain: 'month', default_range: 'this year' } });
		expect(presetLabels()).toContain('This Year');
		expect(triggerText()).toBe('This Year');
	});

	it("resolves presets and marks the current month from the project's now, not the clock", async () => {
		// default_date_range_end lands in March 2025 while the clock says Nov 2026
		const filter = await openCalendar({ attributes: { grain: 'month' }, anchor: '2025-03-15' });
		const current = desktopPicker().querySelectorAll('[data-current]');
		expect(Array.from(current).map((cell) => cell.getAttribute('data-value'))).toEqual([
			'2025-03-01'
		]);
		desktopFooterButton('This Month').click();
		await settle();
		expect(filter.templateValues.between).toBe(
			"BETWEEN toDate('2025-03-01') AND toDate('2025-03-31')"
		);
	});
});

describe('range_calendar grain="quarter" and grain="year"', () => {
	it('selects quarters in either direction', async () => {
		const filter = await openCalendar({
			attributes: { grain: 'quarter', default_range: '2025-01-01 to 2025-03-31' }
		});
		expect(desktopPicker().querySelectorAll('[data-period-cell]')).toHaveLength(8);
		await clickPeriod('2025-07-01');
		await clickPeriod('2024-01-01');
		expect(filter.value).toEqual({ range: '2024-01-01 to 2025-09-30' });
		expect(triggerText()).toBe('Q1 2024 – Q3 2025');
	});

	it('treats a second click on the same period as that one period', async () => {
		const filter = await openCalendar({
			attributes: { grain: 'quarter', default_range: '2025-01-01 to 2025-03-31' }
		});
		await clickPeriod('2025-04-01');
		await clickPeriod('2025-04-01');
		expect(filter.value).toEqual({ range: '2025-04-01 to 2025-06-30' });
		// …and the next click starts over
		await clickPeriod('2024-10-01');
		expect(filter.value).toEqual({ range: '2024-10-01 to 2024-12-31' });
	});

	it('selects years from 12-year pages', async () => {
		const filter = await openCalendar({
			attributes: { grain: 'year', default_range: '2025-01-01 to 2025-12-31' }
		});
		const groups = Array.from(desktopPicker().querySelectorAll('[role="group"]'));
		expect(groups.map((g) => g.ariaLabel)).toEqual(['2004 – 2015', '2016 – 2027']);
		await clickPeriod('2020-01-01');
		await clickPeriod('2022-01-01');
		expect(filter.value).toEqual({ range: '2020-01-01 to 2022-12-31' });
		expect(triggerText()).toBe('2020 – 2022');
	});
});

describe('range_calendar grain from a variable', () => {
	it('follows a date_grain_selector and snaps the SQL to its grain', async () => {
		const filter = await openCalendar({
			page: '{% date_grain_selector id="grain_selector" default_value="quarter" /%}',
			attributes: {
				grain: '{{grain_selector}}',
				value_column: 'order_date',
				default_range: '2025-05-15 to 2025-05-20'
			}
		});
		expect(filter.runtimeGrain).toBe('quarter');
		expect(filter.grain).toBe('quarter');
		expect(filter.templateValues.between).toBe(
			"BETWEEN toDate('2025-04-01') AND toDate('2025-06-30')"
		);
		expect(desktopPicker().matches('[data-period-grid][data-grain="quarter"]')).toBe(true);
		expect(triggerText()).toBe('Q2 2025');
	});

	it('re-snaps the same selection when the selector changes, without widening it further', async () => {
		const filter = await openCalendar({
			page: '{% date_grain_selector id="grain_selector" default_value="quarter" /%}',
			attributes: {
				grain: '{{grain_selector}}',
				value_column: 'order_date',
				default_range: '2025-05-15 to 2025-05-20'
			}
		});
		const selector = pageFilters.get('grain_selector')!;

		selector.value = 'month';
		await settle();
		expect(filter.runtimeGrain).toBe('month');
		expect(filter.templateValues.between).toBe(
			"BETWEEN toDate('2025-05-01') AND toDate('2025-05-31')"
		);
		expect(triggerText()).toBe('May 2025');
		expect(desktopPicker().matches('[data-period-grid][data-grain="month"]')).toBe(true);

		selector.value = 'day';
		await settle();
		expect(filter.templateValues.between).toBe(
			"BETWEEN toDate('2025-05-15') AND toDate('2025-05-20')"
		);
		expect(desktopPicker().matches('[data-grain="day"]')).toBe(true);
	});
});
