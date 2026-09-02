// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { PeriodFilter } from './PeriodFilter.svelte';
import { SnowflakeDialect, type SqlDialect } from '../../../sql-dialect';

/** Mid-August 2026: July 2026 is the newest complete month. */
const ANCHOR = '2026-08-14';

function makeFilter(attributes: Record<string, unknown> = {}, dialect?: SqlDialect) {
	return new PeriodFilter(
		{
			id: 'period',
			userComponentName: 'workflow_period',
			attributes: { grain: 'month', periods: 12, ...attributes }
		} as never,
		{
			url: undefined,
			updateUrl: undefined,
			projectSettings: { computedDefaultDateRangeEnd: ANCHOR },
			dialect
		} as never
	);
}

describe('PeriodFilter — default selection', () => {
	it('defaults to the most recent complete period', () => {
		const filter = makeFilter();
		// No value is seeded: "unset" means "the newest complete period", so the
		// default never has to be written to the URL and SSR/client agree.
		expect(filter.value).toBeUndefined();
		expect(filter.templateValues.key).toBe('2026-07');
		expect(filter.templateValues.label).toBe('Jul 2026');
	});

	it('honours the configured grain', () => {
		expect(makeFilter({ grain: 'quarter' }).templateValues).toMatchObject({
			key: '2026-Q2',
			label: 'Q2 2026',
			grain: 'quarter'
		});
	});

	it('falls back to month when the grain is not a reporting grain', () => {
		expect(makeFilter({ grain: 'hour' }).templateValues).toMatchObject({
			key: '2026-07',
			grain: 'month'
		});
	});
});

describe('PeriodFilter — template values', () => {
	it('exposes the period boundaries and label', () => {
		const filter = makeFilter();
		expect(filter.templateValues).toEqual({
			start: "toDate('2026-07-01')",
			end: "toDate('2026-07-31')",
			start_label: 'Jul 1, 2026',
			end_label: 'Jul 31, 2026',
			between: "BETWEEN toDate('2026-07-01') AND toDate('2026-07-31')",
			filter: 'true',
			label: 'Jul 2026',
			key: '2026-07',
			grain: 'month'
		});
	});

	it('gives plain dates for prose via the _label properties', () => {
		// `.start` / `.end` are dialect SQL expressions, so writing them in prose
		// leaks `toDate(...)` onto the page. These are the text-safe pair.
		const filter = makeFilter();
		expect(filter.templateValues.start_label).not.toContain('toDate');
		expect(filter.templateValues.end_label).not.toContain('toDate');
	});

	it('keeps the _label properties dialect-independent', () => {
		const snowflake = makeFilter({}, new SnowflakeDialect());
		expect(snowflake.templateValues.start_label).toBe('Jul 1, 2026');
		expect(snowflake.templateValues.end_label).toBe('Jul 31, 2026');
	});

	it('labels boundaries for every grain', () => {
		expect(makeFilter({ grain: 'quarter' }).templateValues).toMatchObject({
			start_label: 'Apr 1, 2026',
			end_label: 'Jun 30, 2026'
		});
		expect(makeFilter({ grain: 'year' }).templateValues).toMatchObject({
			start_label: 'Jan 1, 2025',
			end_label: 'Dec 31, 2025'
		});
		expect(makeFilter({ grain: 'day' }).templateValues).toMatchObject({
			start_label: 'Aug 13, 2026',
			end_label: 'Aug 13, 2026'
		});
	});

	it('emits Snowflake date literals under the Snowflake dialect', () => {
		const filter = makeFilter({}, new SnowflakeDialect());
		expect(filter.templateValues.start).toBe("TO_DATE('2026-07-01')");
		expect(filter.templateValues.between).toBe(
			"BETWEEN TO_DATE('2026-07-01') AND TO_DATE('2026-07-31')"
		);
	});

	it('builds a self-contained predicate when value_column is set', () => {
		const filter = makeFilter({ value_column: 'order_date' });
		const expected = "order_date >= toDate('2026-07-01') AND order_date <= toDate('2026-07-31')";
		expect(filter.templateValues.filter).toBe(expected);
		expect(filter.sql).toBe(expected);
	});

	it('contributes no predicate without value_column — the column lives in the template', () => {
		const filter = makeFilter();
		expect(filter.templateValues.filter).toBe('true');
		expect(filter.sql).toBeUndefined();
		expect(filter.queryOnly).toBe(true);
	});

	it('defaults to .between in SQL and .label in text', () => {
		expect(PeriodFilter.defaultProperty).toEqual({
			sql: 'between',
			text: 'label',
			column: 'label'
		});
	});
});

describe('PeriodFilter — selection', () => {
	it('resolves a selected key to that period', () => {
		const filter = makeFilter();
		filter.setDefault({ key: '2026-03' });
		expect(filter.templateValues).toMatchObject({
			key: '2026-03',
			label: 'Mar 2026',
			between: "BETWEEN toDate('2026-03-01') AND toDate('2026-03-31')"
		});
	});

	it('resolves a period older than the offered window', () => {
		const filter = makeFilter({ periods: 3 });
		filter.setDefault({ key: '2019-11' });
		expect(filter.templateValues.label).toBe('Nov 2019');
	});

	it('falls back to the default period when the key is unparseable', () => {
		const filter = makeFilter();
		filter.setDefault({ key: 'nonsense' });
		expect(filter.templateValues.key).toBe('2026-07');
	});
});

describe('PeriodFilter — URL serialization', () => {
	it('round-trips through the URL param as a bare key', () => {
		const filter = makeFilter();
		filter.setDefault({ key: '2026-05' });
		expect(filter.serializedValue).toBe('2026-05');

		const restored = makeFilter();
		restored.applySerialized('2026-05');
		expect(restored.value).toEqual({ key: '2026-05' });
		expect(restored.templateValues.label).toBe('May 2026');
	});
});

describe('PeriodFilter — options offered to the picker', () => {
	it('lists the configured number of complete periods, newest first', () => {
		const periods = makeFilter({ periods: 3 }).periods;
		expect(periods.map((p) => p.key)).toEqual(['2026-07', '2026-06', '2026-05']);
	});

	it('defaults to 12 periods', () => {
		expect(makeFilter({ periods: undefined }).periods).toHaveLength(12);
	});
});

describe('PeriodFilter — stepping', () => {
	it('steps one period at a time within the window', () => {
		const filter = makeFilter({ periods: 3 });
		expect(filter.olderPeriod?.key).toBe('2026-06');
		// Already on the newest complete period.
		expect(filter.newerPeriod).toBeUndefined();

		filter.setDefault({ key: '2026-06' });
		expect(filter.olderPeriod?.key).toBe('2026-05');
		expect(filter.newerPeriod?.key).toBe('2026-07');
	});

	it('stops at the oldest offered period', () => {
		const filter = makeFilter({ periods: 3 });
		filter.setDefault({ key: '2026-05' });
		expect(filter.olderPeriod).toBeUndefined();
		expect(filter.newerPeriod?.key).toBe('2026-06');
	});

	it('walks a bookmarked out-of-window period back toward the window', () => {
		// Regression: an index-based lookup returned -1 here and made "older"
		// jump to the newest period.
		const filter = makeFilter({ periods: 3 });
		filter.setDefault({ key: '2019-11' });
		expect(filter.olderPeriod).toBeUndefined();
		expect(filter.newerPeriod?.key).toBe('2019-12');
	});
});
