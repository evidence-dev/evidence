import { describe, it, expect } from 'vitest';
import { schema } from './schema';

const validate = (attributes: Record<string, unknown>) =>
	schema.validate({ attributes, location: undefined } as never, {} as never, {} as never);

describe('range_calendar filter property documentation', () => {
	it('documents dialect-aware SQL with Snowflake-compatible example values', () => {
		const properties = Object.fromEntries(
			schema.filterProperties.map((property) => [property.name, property])
		);

		expect(properties.start.description).toContain('active SQL dialect');
		expect(properties.start.description).toContain('TO_DATE(...)');
		expect(properties.end.description).toContain('active SQL dialect');
		expect(properties.start.singleValue).toBe(
			"toDate('2024-01-01') (ClickHouse) / TO_DATE('2024-01-01') (Snowflake)"
		);
		expect(properties.end.singleValue).toBe(
			"toDate('2024-12-31') (ClickHouse) / TO_DATE('2024-12-31') (Snowflake)"
		);
		expect(properties.filter.singleValue).toBe(
			"ClickHouse: event_date >= toDate('2024-01-01') AND event_date <= toDate('2024-12-31'); Snowflake: event_date >= TO_DATE('2024-01-01') AND event_date <= TO_DATE('2024-12-31')"
		);
		expect(properties.between.singleValue).toBe(
			"ClickHouse: BETWEEN toDate('2024-01-01') AND toDate('2024-12-31'); Snowflake: BETWEEN TO_DATE('2024-01-01') AND TO_DATE('2024-12-31')"
		);
	});
});

describe('range_calendar schema.validate', () => {
	it('flags a default_range typo when custom_ranges is absent', () => {
		expect(validate({ default_range: 'last 7 dayz' }).length).toBeGreaterThan(0);
	});

	it('accepts a real preset key', () => {
		expect(validate({ default_range: 'last 7 days' })).toEqual([]);
	});

	it('accepts a raw range expression (same grammar as the date_range attribute)', () => {
		expect(validate({ default_range: 'from 2022-12-01' })).toEqual([]);
		expect(validate({ default_range: '2020-01-01 to 2020-12-31' })).toEqual([]);
	});

	it('flags an impossible date literal', () => {
		expect(validate({ default_range: 'from 2022-13-99' }).length).toBeGreaterThan(0);
	});

	it('defers default_range checking to runtime when custom_ranges has valid entries', () => {
		const cr = [{ range: 'last 3 months', grain: 'month' }];
		expect(validate({ default_range: 'FY2025', custom_ranges: cr })).toEqual([]);
		// Even a preset typo is deferred (not flagged) once custom_ranges is present.
		expect(validate({ default_range: 'last 7 day', custom_ranges: cr })).toEqual([]);
	});

	it('still flags a typo when custom_ranges is an empty array (nothing generated to match)', () => {
		expect(validate({ default_range: 'last 7 dayz', custom_ranges: [] }).length).toBeGreaterThan(0);
	});

	it('reports a single error for a typo even when preset_ranges is also set', () => {
		expect(
			validate({ default_range: 'last 7 dayz', preset_ranges: ['last 30 days'] })
		).toHaveLength(1);
	});

	it('still flags a real preset that is missing from preset_ranges', () => {
		expect(
			validate({ default_range: 'year to date', preset_ranges: ['last 7 days'] }).length
		).toBeGreaterThan(0);
	});
});

describe('range_calendar schema.validate — all_time_range', () => {
	it('errors on an unrecognized value', () => {
		expect(validate({ all_time_range: 'unbouded' })[0].message).toMatch(/all_time_range/);
	});

	it('errors on a value the date_range attribute would also reject (silently-wrong footgun)', () => {
		// "2022" resolves to a bogus window at runtime; it must be denied here just like default_range denies it
		expect(validate({ all_time_range: '2022' }).length).toBeGreaterThan(0);
		// date-shaped but impossible
		expect(validate({ all_time_range: 'from 2022-13-99' }).length).toBeGreaterThan(0);
	});

	it('accepts the sentinels plus any valid range expression', () => {
		for (const v of [
			'unbounded',
			'none',
			'last 12 months',
			'from 2022-12-01',
			'2020-01-01 to 2020-12-31'
		]) {
			expect(validate({ all_time_range: v })).toEqual([]);
		}
	});

	it('reports both an all_time_range and a default_range error together', () => {
		const result = validate({ all_time_range: 'unbouded', default_range: 'last 7 dayz' });
		expect(result.filter((e) => e.level === 'error').length).toBe(2);
	});
});

describe('range_calendar schema.validate — custom_ranges entry warnings', () => {
	const warnings = (custom_ranges: unknown[]) =>
		validate({ custom_ranges }).filter((e) => e.level === 'warning');

	it('warns on a misspelled / plural grain (the silent footgun)', () => {
		expect(warnings([{ range: 'from 2022-02-01', grain: 'weeks' }])[0].message).toMatch(/grain/);
	});

	it('warns when an entry has no range', () => {
		expect(warnings([{ grain: 'year' }])[0].message).toMatch(/needs a `range`/);
	});

	it('warns on an unknown key (e.g. a `range` typo)', () => {
		expect(warnings([{ ranges: ['x'] }]).some((e) => /unknown key "ranges"/.test(e.message))).toBe(
			true
		);
	});

	it('warns on a non-string label (number, object, or array — all dropped at runtime)', () => {
		for (const label of [5, { a: 1 }, ['x']]) {
			expect(warnings([{ label, range: 'last 3 months' }])[0].message).toMatch(/`label`/);
		}
	});

	it('flags as warning (not error) so a bad entry never blanks the picker on a published page', () => {
		expect(validate({ custom_ranges: [{ grain: 'weeks', range: 'x' }] })).not.toContainEqual(
			expect.objectContaining({ level: 'error' })
		);
	});

	it('does not warn on an empty grain (the autocomplete tab stop left blank = no grain)', () => {
		expect(warnings([{ range: 'last 30 days', grain: '' }])).toEqual([]);
		expect(warnings([{ range: 'last 30 days', grain: '   ' }])).toEqual([]);
	});

	it('does not warn on valid entries — including a list of windows with a grain', () => {
		expect(
			warnings([{ label: 'FY{start:yyyy}', range: 'from 2022-02-01', grain: 'year' }])
		).toEqual([]);
		expect(warnings([{ range: ['2024-01-01 to 2024-12-31'], grain: 'quarter' }])).toEqual([]);
		expect(warnings([{ label: '2020 Season', range: '2020-07-23 to 2020-09-08' }])).toEqual([]);
	});
});

describe('range_calendar grain validation', () => {
	const ids = (errors: { id: string }[]) => errors.map((error) => error.id);

	it('accepts every grain and a variable', () => {
		for (const grain of [
			'day',
			'week',
			'month',
			'quarter',
			'year',
			'Month',
			'{{grain_selector}}'
		]) {
			expect(validate({ grain })).toEqual([]);
		}
	});

	it('rejects an unknown grain', () => {
		const errors = validate({ grain: 'monthly' });
		expect(ids(errors)).toEqual(['invalid-grain']);
		expect(errors[0].level).toBe('error');
	});

	it('warns when default_range will be widened', () => {
		const errors = validate({ grain: 'month', default_range: 'last 30 days' });
		expect(ids(errors)).toEqual(['range-wider-than-grain']);
		expect(errors[0].level).toBe('warning');
		expect(errors[0].message).toContain('whole months');
	});

	it('accepts ranges that line up', () => {
		expect(validate({ grain: 'month', default_range: 'previous 3 months' })).toEqual([]);
		expect(validate({ grain: 'month', default_range: 'year to date' })).toEqual([]);
		expect(validate({ grain: 'week', default_range: 'previous week' })).toEqual([]);
		expect(validate({ grain: 'month', all_time_range: 'unbounded' })).toEqual([]);
	});

	it('warns for all_time_range and each preset_ranges entry that will be widened', () => {
		expect(ids(validate({ grain: 'quarter', all_time_range: 'from 2022-12-01' }))).toEqual([
			'range-wider-than-grain'
		]);
		const errors = validate({
			grain: 'month',
			preset_ranges: ['last 7 days', 'previous month', 'last 3 months']
		});
		expect(errors.map((error) => error.message)).toEqual([
			expect.stringContaining('"last 7 days"'),
			expect.stringContaining('"last 3 months"')
		]);
	});

	it('warns for custom_ranges that will be widened', () => {
		expect(ids(validate({ grain: 'month', custom_ranges: [{ range: 'last 30 days' }] }))).toEqual([
			'range-wider-than-grain'
		]);
		// Weeks don't fit in months
		expect(
			ids(
				validate({ grain: 'month', custom_ranges: [{ range: 'from 2024-01-01', grain: 'week' }] })
			)
		).toEqual(['range-wider-than-grain']);
		// A fiscal year from February fits whole months but not whole quarters
		const fiscal = [{ label: 'FY{start:yyyy}', range: 'from 2022-02-01', grain: 'year' }];
		expect(validate({ grain: 'month', custom_ranges: fiscal })).toEqual([]);
		expect(ids(validate({ grain: 'quarter', custom_ranges: fiscal }))).toEqual([
			'range-wider-than-grain'
		]);
		// Relative windows slice into calendar periods, which line up
		expect(
			validate({ grain: 'month', custom_ranges: [{ range: 'last 6 months', grain: 'month' }] })
		).toEqual([]);
	});

	it('reports grain errors alongside other range errors', () => {
		expect(ids(validate({ grain: 'monthly', default_range: 'last 7 dayz' }))).toEqual([
			'invalid-grain',
			'invalid-default-range'
		]);
	});

	it('checks the deprecated defaultRange spelling and every window of a custom range', () => {
		expect(ids(validate({ grain: 'month', defaultRange: 'last 30 days' }))).toEqual([
			'range-wider-than-grain'
		]);
		const windows = ['2025-01-01 to 2025-12-31', '2026-01-15 to 2026-12-31'];
		const errors = validate({ grain: 'month', custom_ranges: [{ range: windows }] });
		expect(errors.map((error) => error.message)).toEqual([
			expect.stringContaining('"2026-01-15 to 2026-12-31"')
		]);
	});

	it('skips the widening check for a variable grain or variable range', () => {
		expect(validate({ grain: '{{g}}', default_range: 'last 30 days' })).toEqual([]);
		expect(validate({ grain: 'month', default_range: '{{other.range}}' })).toEqual([]);
	});
});
