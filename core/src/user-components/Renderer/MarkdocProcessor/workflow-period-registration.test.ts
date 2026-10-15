// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import Markdoc from '@markdoc/markdoc';
import { Filters } from '../../../Filters.svelte';
import { registerFiltersFromAST } from './register-filters';
import {
	PeriodFilter,
	getWorkflowPeriodFilter
} from '../../tags/workflow_period/PeriodFilter.svelte';

const ANCHOR = '2026-08-14';

function makeFilters() {
	return new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: { computedDefaultDateRangeEnd: ANCHOR } as never,
		dialect: undefined
	});
}

function register(markdown: string, filters = makeFilters()) {
	registerFiltersFromAST(Markdoc.parse(markdown), filters);
	return filters;
}

const periodPage = (block: string) =>
	`---\ntitle: Ops\nworkflow:\n  period:\n${block}---\n\n# Report\n`;

describe('workflow.period frontmatter registration', () => {
	it('registers a `period` filter from the frontmatter block', () => {
		const filters = register(periodPage('    grain: month\n    periods: 6\n'));
		const filter = filters.get('period');
		expect(filter).toBeInstanceOf(PeriodFilter);
		expect(filters.filterIds).toContain('period');
		expect(filter?.templateValues.key).toBe('2026-07');
	});

	it('passes the configured grain and count through', () => {
		const filters = register(periodPage('    grain: quarter\n    periods: 3\n'));
		const filter = filters.get('period') as PeriodFilter;
		expect(filter.templateValues.grain).toBe('quarter');
		expect(filter.periods).toHaveLength(3);
	});

	it('applies defaults for a bare period block', () => {
		const filters = register('---\ntitle: Ops\nworkflow:\n  period:\n---\n\n# Report\n');
		const filter = filters.get('period') as PeriodFilter;
		expect(filter).toBeInstanceOf(PeriodFilter);
		expect(filter.templateValues.grain).toBe('month');
		expect(filter.periods).toHaveLength(12);
	});

	it('registers nothing for a page with no workflow block', () => {
		expect(register('---\ntitle: Plain\n---\n\n# Report\n').filterIds).toEqual([]);
	});

	it('registers nothing for a `workflow:` block without `period`', () => {
		expect(
			register('---\ntitle: Plain\nworkflow:\n  release:\n    grain: month\n---\n').filterIds
		).toEqual([]);
	});
});

describe('workflow.period filter lifecycle', () => {
	it('reaps the filter when the frontmatter block is removed', () => {
		const filters = register(periodPage('    grain: month\n'));
		expect(filters.filterIds).toContain('period');

		register('---\ntitle: Ops\n---\n\n# Report\n', filters);
		expect(filters.filterIds).not.toContain('period');
	});

	it('keeps the selected period across re-registration', () => {
		const filters = register(periodPage('    grain: month\n'));
		const filter = filters.get('period') as PeriodFilter;
		filter.setDefault({ key: '2026-02' });

		register(periodPage('    grain: month\n'), filters);
		expect((filters.get('period') as PeriodFilter).templateValues.key).toBe('2026-02');
	});

	it('picks up a changed grain on re-registration', () => {
		const filters = register(periodPage('    grain: month\n'));
		register(periodPage('    grain: year\n'), filters);
		expect((filters.get('period') as PeriodFilter).templateValues.grain).toBe('year');
	});

	it('does not clobber an author-declared input that already uses the id `period`', () => {
		const filters = register(
			`${periodPage('    grain: month\n')}\n{% dropdown id="period" data="orders" value_column="x" /%}\n`
		);
		// The AST tag is the richer, explicitly-authored filter — it wins.
		expect(filters.get('period')).not.toBeInstanceOf(PeriodFilter);
	});

	it('survives a serialize / deserialize round-trip', () => {
		const filters = register(periodPage('    grain: quarter\n'));
		(filters.get('period') as PeriodFilter).setDefault({ key: '2025-Q1' });

		const restored = new Filters(
			{
				url: undefined,
				updateUrl: undefined,
				projectSettings: { computedDefaultDateRangeEnd: ANCHOR } as never,
				dialect: undefined
			},
			filters.toSerialized()
		);
		const filter = restored.get('period');
		expect(filter).toBeInstanceOf(PeriodFilter);
		expect(filter?.templateValues.grain).toBe('quarter');
	});
});

describe('period_selector placing the workflow period', () => {
	const picker = '\n{% period_selector id="period" /%}\n';

	it('binds to the frontmatter period instead of declaring its own', () => {
		const filters = register(periodPage('    grain: quarter\n') + picker);
		const filter = getWorkflowPeriodFilter(filters);
		expect(filter?.grain).toBe('quarter');
		expect(filter?.attributes.placed).toBe(true);
	});

	it('leaves the top-of-page picker in place when no tag is on the page', () => {
		const filters = register(periodPage('    grain: quarter\n'));
		expect(getWorkflowPeriodFilter(filters)?.attributes.placed).toBeUndefined();
	});

	it('counts a picker placed inside a row', () => {
		const filters = register(
			`${periodPage('    grain: month\n')}\n{% row %}\n# Title\n${picker}{% /row %}\n`
		);
		expect(getWorkflowPeriodFilter(filters)?.attributes.placed).toBe(true);
	});

	it('keeps the placement across a serialize / deserialize round-trip', () => {
		const filters = register(periodPage('    grain: month\n') + picker);
		const restored = new Filters(
			{
				url: undefined,
				updateUrl: undefined,
				projectSettings: { computedDefaultDateRangeEnd: ANCHOR } as never,
				dialect: undefined
			},
			filters.toSerialized()
		);
		expect(getWorkflowPeriodFilter(restored)?.attributes.placed).toBe(true);
	});

	it('is an independent input on a page without workflow.period', () => {
		const filters = register(`# Report\n${picker}`);
		const filter = filters.get('period');
		expect(filter).toBeInstanceOf(PeriodFilter);
		expect(getWorkflowPeriodFilter(filters)).toBeUndefined();
	});

	it('hands the id to the frontmatter when workflow.period is added', () => {
		const filters = register(`# Report\n${picker}`);
		register(periodPage('    grain: year\n') + picker, filters);
		expect(getWorkflowPeriodFilter(filters)?.grain).toBe('year');
	});

	it('hands the id back to the tag when workflow.period is removed', () => {
		const filters = register(periodPage('    grain: year\n') + picker);
		register(`---\ntitle: Ops\n---\n${picker}`, filters);
		expect(filters.get('period')).toBeInstanceOf(PeriodFilter);
		expect(getWorkflowPeriodFilter(filters)).toBeUndefined();
	});

	it('keeps the selected period when workflow.period is added', () => {
		const filters = register(`# Report\n${picker}`);
		(filters.get('period') as PeriodFilter).value = { key: '2026-03' };
		register(periodPage('    grain: month\n') + picker, filters);
		expect(getWorkflowPeriodFilter(filters)?.period.key).toBe('2026-03');
	});

	it('keeps the selected period when workflow.period is removed', () => {
		const filters = register(periodPage('    grain: month\n') + picker);
		getWorkflowPeriodFilter(filters)!.value = { key: '2026-03' };
		register(`---\ntitle: Ops\n---\n${picker}`, filters);
		expect((filters.get('period') as PeriodFilter).period.key).toBe('2026-03');
	});

	it('leaves the period in the URL while the owner changes', () => {
		let url = new URL('https://example.com/report?period=2026-03');
		const filters = new Filters({
			url: () => url,
			updateUrl: (next) => (url = next),
			projectSettings: { computedDefaultDateRangeEnd: ANCHOR } as never,
			dialect: undefined
		});
		register(`# Report\n${picker}`, filters);
		register(periodPage('    grain: month\n') + picker, filters);
		expect(url.searchParams.get('period')).toBe('2026-03');
		expect(getWorkflowPeriodFilter(filters)?.period.key).toBe('2026-03');
	});

	it('keeps the default picker when the tag is inside an if block', () => {
		const filters = register(
			`${periodPage('    grain: month\n')}\n{% if $show %}\n${picker}{% /if %}\n`
		);
		expect(getWorkflowPeriodFilter(filters)?.attributes.placed).toBeUndefined();
	});

	it("keeps the default picker when the tag is a custom component's slot fallback", () => {
		const filters = makeFilters();
		const body = Markdoc.parse(`{% slot %}\n${picker}{% /slot %}\n`);
		registerFiltersFromAST(
			Markdoc.parse(
				`${periodPage('    grain: month\n')}\n{% header_bar %}Caller content{% /header_bar %}\n`
			),
			filters,
			{ 'components/header_bar': body },
			undefined,
			undefined,
			undefined,
			{
				header_bar: {
					tagName: 'header_bar',
					fullPath: 'components/header_bar',
					attributes: {},
					frontmatterErrors: []
				} as never
			}
		);
		expect(getWorkflowPeriodFilter(filters)?.attributes.placed).toBeUndefined();
	});

	it("counts a tag in a custom component's body outside any slot", () => {
		const filters = makeFilters();
		registerFiltersFromAST(
			Markdoc.parse(`${periodPage('    grain: month\n')}\n{% header_bar /%}\n`),
			filters,
			{ 'components/header_bar': Markdoc.parse(picker) },
			undefined,
			undefined,
			undefined,
			{
				header_bar: {
					tagName: 'header_bar',
					fullPath: 'components/header_bar',
					attributes: {},
					frontmatterErrors: []
				} as never
			}
		);
		expect(getWorkflowPeriodFilter(filters)?.attributes.placed).toBe(true);
	});

	it('un-places the picker when the tag is removed', () => {
		const filters = register(periodPage('    grain: month\n') + picker);
		register(periodPage('    grain: month\n'), filters);
		expect(getWorkflowPeriodFilter(filters)?.attributes.placed).toBeUndefined();
	});
});

describe('independent period_selector inputs', () => {
	it('registers each id with its own grain alongside the workflow period', () => {
		const filters = register(
			`${periodPage('    grain: month\n')}\n{% period_selector id="q" grain="quarter" /%}\n{% period_selector id="y" grain="year" periods=3 /%}\n`
		);
		expect((filters.get('q') as PeriodFilter).grain).toBe('quarter');
		expect((filters.get('y') as PeriodFilter).periods).toHaveLength(3);
		expect(getWorkflowPeriodFilter(filters)?.grain).toBe('month');
		expect(getWorkflowPeriodFilter(filters)?.attributes.placed).toBeUndefined();
	});
});

describe('independent period_selector edits', () => {
	it('becomes usable in filters=[...] when value_column is added in place', () => {
		const filters = register('{% period_selector id="q" grain="quarter" /%}');
		expect((filters.get('q') as PeriodFilter).queryOnly).toBe(true);
		register('{% period_selector id="q" grain="quarter" value_column="order_date" /%}', filters);
		expect((filters.get('q') as PeriodFilter).queryOnly).toBe(false);
		expect(filters.componentFilterIds).toContain('q');
	});
});
