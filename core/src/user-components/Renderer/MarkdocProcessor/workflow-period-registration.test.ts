// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import Markdoc from '@markdoc/markdoc';
import { Filters } from '../../../Filters.svelte';
import { registerFiltersFromAST } from './register-filters';
import { PeriodFilter } from '../../tags/workflow_period/PeriodFilter.svelte';

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
