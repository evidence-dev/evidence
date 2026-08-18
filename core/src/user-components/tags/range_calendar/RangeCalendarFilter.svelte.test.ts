// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { RangeCalendarFilter, type RangeCalendarValue } from './RangeCalendarFilter.svelte';
import { SnowflakeDialect, type SqlDialect } from '../../../sql-dialect';

function makeFilter(attributes: Record<string, unknown> = {}, dialect?: SqlDialect) {
	return new RangeCalendarFilter(
		{ id: 'date_filter', userComponentName: 'range_calendar', attributes } as never,
		{
			url: undefined,
			updateUrl: undefined,
			projectSettings: undefined,
			dialect
		}
	);
}

const CLOSED_RANGE: RangeCalendarValue = { range: '2020-01-01 to 2020-01-31' };

describe('RangeCalendarFilter.filter / .sql (self-contained predicate)', () => {
	it('emits a column predicate when value_column is set and a range is selected', () => {
		const filter = makeFilter({ value_column: 'event_date' });
		filter.setDefault(CLOSED_RANGE);

		const expected = "event_date >= toDate('2020-01-01') AND event_date <= toDate('2020-01-31')";
		expect(filter.templateValues.filter).toBe(expected);
		// Same predicate flows to `filters=[...]` via .sql
		expect(filter.sql).toBe(expected);
	});

	it('collapses .filter to `true` and .sql to undefined when value is unset', () => {
		const filter = makeFilter({ value_column: 'event_date' });
		// No default_range passed → value is undefined (the `!this.value` guard path)
		expect(filter.templateValues.filter).toBe('true');
		expect(filter.sql).toBeUndefined();
	});

	it('keeps .filter `true` / .sql undefined for an explicit "all time" value', () => {
		// default_range="all time" gives value = { range: 'all time' }, exercising the else-branch /
		// non-short-circuited sql path that processes the range rather than hitting the `!this.value` guard.
		const filter = makeFilter({ value_column: 'event_date', default_range: 'all time' });
		expect(filter.value).toEqual({ range: 'all time' });
		// Self-contained forms stay a true no-op (keeps NULL rows) even though .between drops them
		expect(filter.templateValues.filter).toBe('true');
		expect(filter.sql).toBeUndefined();
	});

	it('is a no-op (`true`, undefined) when value_column is absent — column lives in the user template', () => {
		const filter = makeFilter();
		filter.setDefault(CLOSED_RANGE);
		// No column to build a predicate from, so .filter is a valid no-op and .sql contributes nothing
		expect(filter.templateValues.filter).toBe('true');
		expect(filter.sql).toBeUndefined();
	});

	it('is queryOnly only without value_column — so filters=[...] is allowed exactly when .sql works', () => {
		// Gates the authoring validator (filterExists) + editor autocomplete to match the runtime capability
		expect(makeFilter().queryOnly).toBe(true);
		expect(makeFilter({ value_column: 'event_date' }).queryOnly).toBe(false);
	});
});

describe('RangeCalendarFilter.between (all-time behavior)', () => {
	it('emits a BETWEEN fragment when a range is selected', () => {
		const filter = makeFilter();
		filter.setDefault(CLOSED_RANGE);
		expect(filter.templateValues.between).toBe(
			"BETWEEN toDate('2020-01-01') AND toDate('2020-01-31')"
		);
	});

	it('emits Snowflake date literals for every SQL template property', () => {
		const filter = makeFilter({ value_column: 'event_date' }, new SnowflakeDialect());
		filter.setDefault(CLOSED_RANGE);

		expect(filter.templateValues).toMatchObject({
			start: "TO_DATE('2020-01-01')",
			end: "TO_DATE('2020-01-31')",
			between: "BETWEEN TO_DATE('2020-01-01') AND TO_DATE('2020-01-31')",
			filter: "event_date >= TO_DATE('2020-01-01') AND event_date <= TO_DATE('2020-01-31')"
		});
		expect(filter.sql).toBe(
			"event_date >= TO_DATE('2020-01-01') AND event_date <= TO_DATE('2020-01-31')"
		);
	});

	it('emits `IS NOT NULL` for all-time by default (unbounded) so raw `where date {{..between}}` works', () => {
		// Unset value (no default_range) → all time
		expect(makeFilter().templateValues.between).toBe('IS NOT NULL');
		// Explicit all-time value → same
		expect(makeFilter({ default_range: 'all time' }).templateValues.between).toBe('IS NOT NULL');
	});

	it('restores the legacy empty string for all-time with all_time_range="none"', () => {
		expect(makeFilter({ all_time_range: 'none' }).templateValues.between).toBe('');
		expect(
			makeFilter({ all_time_range: 'none', default_range: 'all time' }).templateValues.between
		).toBe('');
	});

	it('keeps .start / .end empty for all-time when unbounded/none', () => {
		for (const attrs of [{}, { all_time_range: 'none' }, { all_time_range: 'unbounded' }]) {
			const tv = makeFilter(attrs).templateValues;
			expect(tv.start).toBe('');
			expect(tv.end).toBe('');
		}
	});
});

describe('RangeCalendarFilter (bounded all_time_range)', () => {
	it('resolves "all time" to a bounded range everywhere (open-ended expression)', () => {
		// Unset value → all time → resolves to the configured range
		const filter = makeFilter({ value_column: 'event_date', all_time_range: 'from 2022-12-01' });
		const tv = filter.templateValues;
		expect(tv.between).toBe(">= toDate('2022-12-01')");
		expect(tv.start).toBe("toDate('2022-12-01')");
		expect(tv.end).toBe('');
		expect(tv.range).toBe('from 2022-12-01');
		// filters=[...] applies the same bounded predicate — the author can delete their `| fallback`
		expect(filter.sql).toBe("event_date >= toDate('2022-12-01')");
	});

	it('applies to the explicit "all time" value too (closed range)', () => {
		const filter = makeFilter({
			value_column: 'event_date',
			all_time_range: '2020-01-01 to 2020-12-31',
			default_range: 'all time'
		});
		expect(filter.templateValues.between).toBe(
			"BETWEEN toDate('2020-01-01') AND toDate('2020-12-31')"
		);
		expect(filter.sql).toBe(
			"event_date >= toDate('2020-01-01') AND event_date <= toDate('2020-12-31')"
		);
	});

	it('a real selection still overrides all_time_range', () => {
		const filter = makeFilter({ value_column: 'event_date', all_time_range: 'from 2022-12-01' });
		filter.setDefault(CLOSED_RANGE);
		expect(filter.templateValues.between).toBe(
			"BETWEEN toDate('2020-01-01') AND toDate('2020-01-31')"
		);
	});
});
