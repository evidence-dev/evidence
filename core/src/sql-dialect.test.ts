import { describe, it, expect } from 'vitest';
import {
	ClickHouseDialect,
	SnowflakeDialect,
	BigQueryDialect,
	FabricDialect,
	DatabricksDialect,
	PostgresDialect,
	CubeDialect,
	MotherDuckDialect,
	defaultDialect
} from './sql-dialect';
import type { SqlDialect } from './sql-dialect';

describe('PostgresDialect', () => {
	const dialect = new PostgresDialect();

	it('has name "postgres" and implements SqlDialect', () => {
		expect(dialect.name).toBe('postgres');
		const d: SqlDialect = dialect;
		expect(d).toBeDefined();
	});

	it('truncates dates with a quoted unit first', () => {
		expect(dialect.dateGrain('month', 'order_date', 'sunday')).toBe(
			"DATE_TRUNC('month', order_date)"
		);
		expect(dialect.dateGrain('day of week', 'order_date', 'sunday')).toBe(
			'EXTRACT(DOW FROM order_date)'
		);
	});

	it('honors first-day-of-week for week truncation (Postgres DATE_TRUNC is Monday-only)', () => {
		expect(dialect.dateGrain('week', 'order_date', 'monday')).toBe(
			"DATE_TRUNC('week', order_date)"
		);
		// Sunday-start: shift +1 day, truncate (Monday), shift back -1 day → Sunday.
		expect(dialect.dateGrain('week', 'order_date', 'sunday')).toBe(
			"(DATE_TRUNC('week', order_date + INTERVAL '1 day') - INTERVAL '1 day')"
		);
	});

	it('adds/subtracts via INTERVAL arithmetic and expresses quarters in months', () => {
		expect(dialect.dateAdd('day', 7, 'created_at')).toBe("created_at + (7 * INTERVAL '1 day')");
		expect(dialect.dateSub('day', 7, 'created_at')).toBe("created_at + (-7 * INTERVAL '1 day')");
		expect(dialect.dateAdd('quarter', 2, 'created_at')).toBe(
			"created_at + (2 * INTERVAL '3 months')"
		);
	});

	it('groups by explicit expressions (no GROUP BY ALL) and dedupes', () => {
		expect(dialect.groupByAll(['a', 'b', 'a'])).toBe('GROUP BY a, b');
		expect(dialect.groupByAll([])).toBe('');
	});

	it('uses MAX for anyValue (works on Redshift/Cube too)', () => {
		expect(dialect.anyValue('col')).toBe('MAX(col)');
	});

	it('quotes identifiers with double quotes and uses CASE for iff', () => {
		expect(dialect.quoteAlias('order date')).toBe('"order date"');
		expect(dialect.iff('x > 0', 'a', 'b')).toBe('CASE WHEN x > 0 THEN a ELSE b END');
	});

	it('uses IS NOT DISTINCT FROM for null-safe equality and ILIKE for case-insensitive match', () => {
		expect(dialect.nullSafeEqual('a', 'b')).toBe('a IS NOT DISTINCT FROM b');
		expect(dialect.caseInsensitiveLike('name', '%foo%')).toBe("name ILIKE '%foo%'");
	});

	it('supports FILTER and is not strict about derived tables', () => {
		expect(dialect.supportsFilterClause).toBe(true);
		expect(dialect.strictDerivedTables).toBe(false);
	});
});

describe('CubeDialect', () => {
	const dialect = new CubeDialect();

	it('has name "cube" and extends the Postgres dialect', () => {
		expect(dialect.name).toBe('cube');
		expect(dialect).toBeInstanceOf(PostgresDialect);
	});

	it('truncates weeks without INTERVAL arithmetic, ignoring first-day-of-week', () => {
		// Cube rejects an INTERVAL inside a function argument, so the inherited Postgres
		// Sunday-start week expression is unrunnable — weeks are ISO/Monday-start here.
		for (const firstDay of ['sunday', 'monday'] as const) {
			expect(dialect.dateGrain('week', 'order_date', firstDay)).toBe(
				"DATE_TRUNC('week', order_date)"
			);
		}
	});

	it('emits no INTERVAL for any grain', () => {
		const grains = [
			'day',
			'week',
			'month',
			'quarter',
			'year',
			'hour',
			'day of week',
			'day of month',
			'day of year',
			'week of year',
			'month of year',
			'quarter of year'
		];
		for (const grain of grains) {
			expect(dialect.dateGrain(grain, 'order_date', 'sunday')).not.toContain('INTERVAL');
		}
	});

	it('keeps the Postgres spelling for non-week grains', () => {
		expect(dialect.dateGrain('month', 'order_date', 'sunday')).toBe(
			"DATE_TRUNC('month', order_date)"
		);
		expect(dialect.dateGrain('quarter of year', 'order_date', 'sunday')).toBe(
			'EXTRACT(QUARTER FROM order_date)'
		);
	});

	it('builds the short date label from TO_CHAR patterns Cube actually renders', () => {
		const sql = dialect.shortDateLabel('order_date');
		// `FM` and `YY` are not implemented by Cube — they'd render as literal text.
		expect(sql).not.toContain('FM');
		expect(sql).not.toContain("'YY'");
		expect(sql).toBe(
			`(TO_CHAR(order_date, 'Mon') || ' ' || TO_CHAR(order_date, 'DD') || '/' || RIGHT(TO_CHAR(order_date, 'YYYY'), 2))`
		);
	});

	it('casts date literals to TIMESTAMP (Cube TO_CHAR rejects a DATE argument)', () => {
		expect(dialect.dateLiteral('2025-01-31')).toBe("CAST('2025-01-31' AS TIMESTAMP)");
	});

	it('lowercases both sides for case-insensitive match (Cube has no ILIKE)', () => {
		expect(dialect.caseInsensitiveLike('name', '%foo%')).toBe("LOWER(name) LIKE LOWER('%foo%')");
	});

	it('expands null-safe equality (Cube has no IS NOT DISTINCT FROM)', () => {
		expect(dialect.nullSafeEqual('a', 'b')).toBe('((a IS NULL AND b IS NULL) OR a = b)');
		expect(dialect.nullSafeEqual('a', 'b')).not.toContain('IS NOT DISTINCT FROM');
	});

	it('builds sparklines with STRING_AGG, not the inherited JSON_AGG (Cube has no JSON aggregates)', () => {
		const sql = dialect.groupArray('date', 'value');
		expect(sql).not.toContain('JSON_AGG');
		expect(sql).toContain('STRING_AGG(');
		expect(sql).toContain('ORDER BY date');
		// x is JSON-string-encoded by hand: backslash escaped first (innermost), then
		// the quote and control chars (via CHR to keep the SQL clean ASCII), so any
		// label stays valid JSON.
		expect(sql).toContain(`REPLACE(CAST(date AS TEXT), '\\', '\\\\')`);
		expect(sql).toContain(`'"', '\\"'`);
		expect(sql).toContain(`CHR(10), '\\n'`);
		expect(sql).toContain(`CHR(13), '\\r'`);
		expect(sql).toContain(`CHR(9), '\\t'`);
	});

	it('narrows the validator to Cube-documented aggregates', () => {
		// Documented by Cube's SQL API reference.
		expect(dialect.aggregationFunctions.has('COUNT')).toBe(true);
		expect(dialect.aggregationFunctions.has('STRING_AGG')).toBe(true);
		expect(dialect.aggregationFunctions.has('PERCENTILE_CONT')).toBe(true);
		expect(dialect.aggregationFunctions.has('MEASURE')).toBe(true);
		expect(dialect.aggregationFunctions.has('XIRR')).toBe(true);
		// Postgres has these; Cube does not — must not be a false green.
		expect(dialect.aggregationFunctions.has('JSON_AGG')).toBe(false);
		expect(dialect.aggregationFunctions.has('ARRAY_AGG')).toBe(false);
		expect(dialect.aggregationFunctions.has('BOOL_OR')).toBe(false);
	});

	it('narrows non-aggregate functions to what a live Cube actually accepts', () => {
		expect(dialect.nonAggregationFunctions.has('TO_CHAR')).toBe(true);
		// CHR is emitted by groupArray above, so the validator has to know it.
		expect(dialect.nonAggregationFunctions.has('CHR')).toBe(true);
		// Undocumented by Cube but verified working.
		expect(dialect.nonAggregationFunctions.has('DATE_PART')).toBe(true);
		expect(dialect.nonAggregationFunctions.has('CURRENT_DATE')).toBe(true);
		// Documented by Cube but rejected by it — a false green if listed.
		expect(dialect.nonAggregationFunctions.has('DATE_ADD')).toBe(false);
		expect(dialect.nonAggregationFunctions.has('STARTS_WITH')).toBe(false);
		expect(dialect.nonAggregationFunctions.has('DATEDIFF')).toBe(false);
		// Postgres-only helpers Cube does not document.
		expect(dialect.nonAggregationFunctions.has('SPLIT_PART')).toBe(false);
		expect(dialect.nonAggregationFunctions.has('JSON_BUILD_ARRAY')).toBe(false);
	});

	it('refuses subtotals and period comparisons', () => {
		expect(dialect.supportsGroupingSets).toBe(false);
		expect(dialect.supportsDateOffsetMath).toBe(false);
		// Contrast with its Postgres parent, which supports both.
		const postgres = new PostgresDialect();
		expect(postgres.supportsGroupingSets).toBe(true);
		expect(postgres.supportsDateOffsetMath).toBe(true);
	});

	it('keeps FILTER (WHERE …), which Cube supports even on MEASURE()', () => {
		// Undocumented but verified: flipping this would route Cube to the
		// agg(CASE WHEN …) rewrite, which Cube rejects.
		expect(dialect.supportsFilterClause).toBe(true);
	});
});

describe('ClickHouseDialect', () => {
	const dialect = new ClickHouseDialect();

	it('has name "clickhouse"', () => {
		expect(dialect.name).toBe('clickhouse');
	});

	it('implements SqlDialect', () => {
		const d: SqlDialect = dialect;
		expect(d).toBeDefined();
	});

	describe('dateGrain', () => {
		it('maps day grain', () => {
			expect(dialect.dateGrain('day', 'created_at', 'sunday')).toBe('toStartOfDay(created_at)');
			expect(dialect.dateGrain('day', 'created_at', 'monday')).toBe('toStartOfDay(created_at)');
		});

		it('maps week grain with sunday first day', () => {
			expect(dialect.dateGrain('week', 'created_at', 'sunday')).toBe(
				'toStartOfWeek(created_at, 0)'
			);
		});

		it('maps week grain with monday first day', () => {
			expect(dialect.dateGrain('week', 'created_at', 'monday')).toBe(
				'toStartOfWeek(created_at, 5)'
			);
		});

		it('maps month grain', () => {
			expect(dialect.dateGrain('month', 'order_date', 'sunday')).toBe('toStartOfMonth(order_date)');
		});

		it('maps quarter grain', () => {
			expect(dialect.dateGrain('quarter', 'order_date', 'sunday')).toBe(
				'toStartOfQuarter(order_date)'
			);
		});

		it('maps year grain', () => {
			expect(dialect.dateGrain('year', 'order_date', 'sunday')).toBe('toStartOfYear(order_date)');
		});

		it('maps hour grain', () => {
			expect(dialect.dateGrain('hour', 'ts', 'sunday')).toBe('toStartOfHour(ts)');
		});

		it('maps day of week with sunday first day', () => {
			expect(dialect.dateGrain('day of week', 'created_at', 'sunday')).toBe(
				'toDayOfWeek(created_at, 3)'
			);
		});

		it('maps day of week with monday first day', () => {
			expect(dialect.dateGrain('day of week', 'created_at', 'monday')).toBe(
				'toDayOfWeek(created_at, 0)'
			);
		});

		it('maps day of month', () => {
			expect(dialect.dateGrain('day of month', 'created_at', 'sunday')).toBe(
				'toDayOfMonth(created_at)'
			);
		});

		it('maps day of year', () => {
			expect(dialect.dateGrain('day of year', 'created_at', 'sunday')).toBe(
				'toDayOfYear(created_at)'
			);
		});

		it('maps week of year with sunday first day', () => {
			expect(dialect.dateGrain('week of year', 'created_at', 'sunday')).toBe(
				'toWeek(created_at, 0)'
			);
		});

		it('maps week of year with monday first day', () => {
			expect(dialect.dateGrain('week of year', 'created_at', 'monday')).toBe(
				'toWeek(created_at, 5)'
			);
		});

		it('maps month of year', () => {
			expect(dialect.dateGrain('month of year', 'created_at', 'sunday')).toBe(
				'toMonth(created_at)'
			);
		});

		it('maps quarter of year', () => {
			expect(dialect.dateGrain('quarter of year', 'created_at', 'sunday')).toBe(
				'toQuarter(created_at)'
			);
		});

		it('returns column unchanged for unknown grain', () => {
			expect(dialect.dateGrain('century', 'created_at', 'sunday')).toBe('created_at');
		});
	});

	describe('dateAdd', () => {
		it('generates date_add with numeric amount', () => {
			expect(dialect.dateAdd('day', 7, 'created_at')).toBe('date_add(day, 7, created_at)');
		});

		it('generates date_add with string amount', () => {
			expect(dialect.dateAdd('month', 'n', 'order_date')).toBe('date_add(month, n, order_date)');
		});
	});

	describe('dateSub', () => {
		it('generates date_sub with numeric amount', () => {
			expect(dialect.dateSub('day', 30, 'created_at')).toBe('date_sub(day, 30, created_at)');
		});

		it('generates date_sub with string amount', () => {
			expect(dialect.dateSub('year', 'offset', 'ts')).toBe('date_sub(year, offset, ts)');
		});
	});

	describe('shortDateLabel', () => {
		it('emits ClickHouse formatDateTime with the short-date pattern', () => {
			expect(dialect.shortDateLabel('created_at')).toBe("formatDateTime(created_at, '%b %e/%y')");
		});
	});

	describe('castToString', () => {
		it('generates CAST with Nullable(String)', () => {
			expect(dialect.castToString('amount')).toBe('CAST(amount AS Nullable(String))');
		});
	});

	describe('countDistinct', () => {
		it('generates uniq()', () => {
			expect(dialect.countDistinct('user_id')).toBe('uniq(user_id)');
		});
	});

	describe('limitOffset', () => {
		it('generates LIMIT without offset', () => {
			expect(dialect.limitOffset(10)).toBe('LIMIT 10');
		});

		it('generates LIMIT with OFFSET', () => {
			expect(dialect.limitOffset(10, 20)).toBe('LIMIT 10 OFFSET 20');
		});

		it('omits OFFSET when it is 0', () => {
			expect(dialect.limitOffset(10, 0)).toBe('LIMIT 10');
		});
	});

	describe('groupByAll', () => {
		it('returns GROUP BY ALL regardless of grouping expressions', () => {
			expect(dialect.groupByAll(['a', 'b', 'c'])).toBe('GROUP BY ALL');
			expect(dialect.groupByAll(['a'])).toBe('GROUP BY ALL');
			expect(dialect.groupByAll([])).toBe('GROUP BY ALL');
		});
	});

	describe('rowLimitClause', () => {
		it('emits LIMIT only when no offset', () => {
			expect(dialect.rowLimitClause({ limit: 10, hasOrderBy: false })).toBe('LIMIT 10');
		});
		it('emits LIMIT and OFFSET', () => {
			expect(dialect.rowLimitClause({ limit: 10, offset: 20, hasOrderBy: true })).toBe(
				'LIMIT 10 OFFSET 20'
			);
		});
		it('emits empty string with no limit or offset', () => {
			expect(dialect.rowLimitClause({ hasOrderBy: false })).toBe('');
		});
	});

	describe('groupArray', () => {
		it('generates arraySort with groupArray', () => {
			expect(dialect.groupArray('date', 'value')).toBe(
				'arraySort(x -> x.1, groupArray((date, value)))'
			);
		});
	});
});

describe('SnowflakeDialect', () => {
	const dialect = new SnowflakeDialect();

	it('has name "snowflake"', () => {
		expect(dialect.name).toBe('snowflake');
	});

	it('implements SqlDialect', () => {
		const d: SqlDialect = dialect;
		expect(d).toBeDefined();
	});

	describe('dateGrain', () => {
		it('maps day grain', () => {
			expect(dialect.dateGrain('day', 'created_at', 'sunday')).toBe(
				"DATE_TRUNC('DAY', created_at)"
			);
			expect(dialect.dateGrain('day', 'created_at', 'monday')).toBe(
				"DATE_TRUNC('DAY', created_at)"
			);
		});

		it('maps week grain (ignores firstDayOfWeek)', () => {
			expect(dialect.dateGrain('week', 'created_at', 'sunday')).toBe(
				"DATE_TRUNC('WEEK', created_at)"
			);
			expect(dialect.dateGrain('week', 'created_at', 'monday')).toBe(
				"DATE_TRUNC('WEEK', created_at)"
			);
		});

		it('maps month grain', () => {
			expect(dialect.dateGrain('month', 'order_date', 'sunday')).toBe(
				"DATE_TRUNC('MONTH', order_date)"
			);
		});

		it('maps quarter grain', () => {
			expect(dialect.dateGrain('quarter', 'order_date', 'sunday')).toBe(
				"DATE_TRUNC('QUARTER', order_date)"
			);
		});

		it('maps year grain', () => {
			expect(dialect.dateGrain('year', 'order_date', 'sunday')).toBe(
				"DATE_TRUNC('YEAR', order_date)"
			);
		});

		it('maps hour grain', () => {
			expect(dialect.dateGrain('hour', 'ts', 'sunday')).toBe("DATE_TRUNC('HOUR', ts)");
		});

		it('maps day of week (ignores firstDayOfWeek)', () => {
			expect(dialect.dateGrain('day of week', 'created_at', 'sunday')).toBe(
				'DAYOFWEEK(created_at)'
			);
			expect(dialect.dateGrain('day of week', 'created_at', 'monday')).toBe(
				'DAYOFWEEK(created_at)'
			);
		});

		it('maps day of month', () => {
			expect(dialect.dateGrain('day of month', 'created_at', 'sunday')).toBe(
				'DAYOFMONTH(created_at)'
			);
		});

		it('maps day of year', () => {
			expect(dialect.dateGrain('day of year', 'created_at', 'sunday')).toBe(
				'DAYOFYEAR(created_at)'
			);
		});

		it('maps week of year', () => {
			expect(dialect.dateGrain('week of year', 'created_at', 'sunday')).toBe(
				'WEEKOFYEAR(created_at)'
			);
		});

		it('maps month of year', () => {
			expect(dialect.dateGrain('month of year', 'created_at', 'sunday')).toBe('MONTH(created_at)');
		});

		it('maps quarter of year', () => {
			expect(dialect.dateGrain('quarter of year', 'created_at', 'sunday')).toBe(
				'QUARTER(created_at)'
			);
		});

		it('returns column unchanged for unknown grain', () => {
			expect(dialect.dateGrain('century', 'created_at', 'sunday')).toBe('created_at');
		});
	});

	describe('dateAdd', () => {
		it('generates DATEADD with numeric amount', () => {
			expect(dialect.dateAdd('day', 7, 'created_at')).toBe("DATEADD('DAY', 7, created_at)");
		});

		it('generates DATEADD with string amount', () => {
			expect(dialect.dateAdd('month', 'n', 'order_date')).toBe("DATEADD('MONTH', n, order_date)");
		});

		it('uppercases the unit', () => {
			expect(dialect.dateAdd('year', 1, 'ts')).toBe("DATEADD('YEAR', 1, ts)");
		});
	});

	describe('dateSub', () => {
		it('generates DATEADD with negated numeric amount', () => {
			expect(dialect.dateSub('day', 30, 'created_at')).toBe("DATEADD('DAY', -30, created_at)");
		});

		it('generates DATEADD with negated string amount', () => {
			expect(dialect.dateSub('year', 'offset', 'ts')).toBe("DATEADD('YEAR', -offset, ts)");
		});

		it('negates zero numeric amount', () => {
			expect(dialect.dateSub('month', 0, 'ts')).toBe("DATEADD('MONTH', 0, ts)");
		});
	});

	describe('shortDateLabel', () => {
		it('emits Snowflake TO_CHAR with the native short-date pattern', () => {
			expect(dialect.shortDateLabel('created_at')).toBe("TO_CHAR(created_at, 'MON DD/YY')");
		});
	});

	describe('castToString', () => {
		it('generates CAST AS VARCHAR', () => {
			expect(dialect.castToString('amount')).toBe('CAST(amount AS VARCHAR)');
		});
	});

	describe('countDistinct', () => {
		it('generates COUNT(DISTINCT ...)', () => {
			expect(dialect.countDistinct('user_id')).toBe('COUNT(DISTINCT user_id)');
		});
	});

	describe('limitOffset', () => {
		it('generates LIMIT without offset', () => {
			expect(dialect.limitOffset(10)).toBe('LIMIT 10');
		});

		it('generates LIMIT with OFFSET', () => {
			expect(dialect.limitOffset(10, 20)).toBe('LIMIT 10 OFFSET 20');
		});

		it('omits OFFSET when it is 0', () => {
			expect(dialect.limitOffset(10, 0)).toBe('LIMIT 10');
		});
	});

	describe('groupByAll', () => {
		it('uses GROUP BY ALL to mirror ClickHouse semantics', () => {
			expect(dialect.groupByAll(['a', 'b', 'c'])).toBe('GROUP BY ALL');
			expect(dialect.groupByAll(['a'])).toBe('GROUP BY ALL');
			expect(dialect.groupByAll([])).toBe('GROUP BY ALL');
		});
	});

	describe('rowLimitClause', () => {
		it('emits LIMIT only when no offset', () => {
			expect(dialect.rowLimitClause({ limit: 10, hasOrderBy: false })).toBe('LIMIT 10');
		});
		it('emits LIMIT and OFFSET', () => {
			expect(dialect.rowLimitClause({ limit: 10, offset: 20, hasOrderBy: true })).toBe(
				'LIMIT 10 OFFSET 20'
			);
		});
	});

	describe('groupArray', () => {
		it('generates ARRAY_AGG with ARRAY_CONSTRUCT for tuple compatibility', () => {
			expect(dialect.groupArray('date', 'value')).toBe(
				'ARRAY_AGG(ARRAY_CONSTRUCT(date, value)) WITHIN GROUP (ORDER BY date)'
			);
		});
	});
});

describe('BigQueryDialect', () => {
	const dialect = new BigQueryDialect();

	it('has name "bigquery"', () => {
		expect(dialect.name).toBe('bigquery');
	});

	it('implements SqlDialect', () => {
		const d: SqlDialect = dialect;
		expect(d).toBeDefined();
	});

	it('declares case-sensitive identifiers', () => {
		expect(dialect.caseInsensitiveIdentifiers).toBe(false);
	});

	describe('dateGrain', () => {
		it('maps day grain', () => {
			expect(dialect.dateGrain('day', 'created_at', 'sunday')).toBe('DATE_TRUNC(created_at, DAY)');
		});

		it('maps week grain to WEEK on sunday-first', () => {
			expect(dialect.dateGrain('week', 'created_at', 'sunday')).toBe(
				'DATE_TRUNC(created_at, WEEK)'
			);
		});

		it('maps week grain to ISOWEEK on monday-first', () => {
			expect(dialect.dateGrain('week', 'created_at', 'monday')).toBe(
				'DATE_TRUNC(created_at, ISOWEEK)'
			);
		});

		it('maps month/quarter/year grains', () => {
			expect(dialect.dateGrain('month', 'd', 'sunday')).toBe('DATE_TRUNC(d, MONTH)');
			expect(dialect.dateGrain('quarter', 'd', 'sunday')).toBe('DATE_TRUNC(d, QUARTER)');
			expect(dialect.dateGrain('year', 'd', 'sunday')).toBe('DATE_TRUNC(d, YEAR)');
		});

		it('maps hour grain via DATETIME_TRUNC (DATE has no hour)', () => {
			expect(dialect.dateGrain('hour', 'ts', 'sunday')).toBe('DATETIME_TRUNC(ts, HOUR)');
		});

		it('maps EXTRACT-based grains', () => {
			expect(dialect.dateGrain('day of week', 'd', 'sunday')).toBe('EXTRACT(DAYOFWEEK FROM d)');
			expect(dialect.dateGrain('day of month', 'd', 'sunday')).toBe('EXTRACT(DAY FROM d)');
			expect(dialect.dateGrain('day of year', 'd', 'sunday')).toBe('EXTRACT(DAYOFYEAR FROM d)');
			expect(dialect.dateGrain('week of year', 'd', 'sunday')).toBe('EXTRACT(ISOWEEK FROM d)');
			expect(dialect.dateGrain('month of year', 'd', 'sunday')).toBe('EXTRACT(MONTH FROM d)');
			expect(dialect.dateGrain('quarter of year', 'd', 'sunday')).toBe('EXTRACT(QUARTER FROM d)');
		});

		it('returns column unchanged for unknown grain', () => {
			expect(dialect.dateGrain('century', 'd', 'sunday')).toBe('d');
		});
	});

	describe('dateAdd / dateSub', () => {
		it('emits DATE_ADD for day-or-larger units (preserves DATE return type)', () => {
			expect(dialect.dateAdd('day', 7, 'd')).toBe('DATE_ADD(d, INTERVAL 7 DAY)');
			expect(dialect.dateAdd('month', 'n', 'd')).toBe('DATE_ADD(d, INTERVAL n MONTH)');
			expect(dialect.dateAdd('year', 1, 'd')).toBe('DATE_ADD(d, INTERVAL 1 YEAR)');
		});

		it('emits DATE_SUB for day-or-larger units (no negation)', () => {
			expect(dialect.dateSub('day', 30, 'd')).toBe('DATE_SUB(d, INTERVAL 30 DAY)');
			expect(dialect.dateSub('year', 'n', 'd')).toBe('DATE_SUB(d, INTERVAL n YEAR)');
		});

		it('emits DATETIME_ADD/SUB for sub-day units (DATE has no hour component)', () => {
			expect(dialect.dateAdd('hour', 1, 'ts')).toBe('DATETIME_ADD(ts, INTERVAL 1 HOUR)');
			expect(dialect.dateSub('minute', 5, 'ts')).toBe('DATETIME_SUB(ts, INTERVAL 5 MINUTE)');
		});
	});

	describe('shortDateLabel', () => {
		it('emits FORMAT_DATE with the BQ short pattern', () => {
			expect(dialect.shortDateLabel('d')).toBe("FORMAT_DATE('%b %d/%y', d)");
		});
	});

	describe('dateLiteral', () => {
		it('emits a typed DATE literal', () => {
			expect(dialect.dateLiteral('2025-01-31')).toBe("DATE '2025-01-31'");
		});
	});

	describe('castToString', () => {
		it('casts to STRING (BQ has no VARCHAR)', () => {
			expect(dialect.castToString('amount')).toBe('CAST(amount AS STRING)');
		});
	});

	describe('countDistinct', () => {
		it('uses COUNT(DISTINCT ...)', () => {
			expect(dialect.countDistinct('user_id')).toBe('COUNT(DISTINCT user_id)');
		});
	});

	describe('limitOffset', () => {
		it('generates LIMIT without offset', () => {
			expect(dialect.limitOffset(10)).toBe('LIMIT 10');
		});
		it('generates LIMIT with OFFSET', () => {
			expect(dialect.limitOffset(10, 20)).toBe('LIMIT 10 OFFSET 20');
		});
		it('omits OFFSET when it is 0', () => {
			expect(dialect.limitOffset(10, 0)).toBe('LIMIT 10');
		});
	});

	describe('groupByAll', () => {
		it('uses GROUP BY ALL', () => {
			expect(dialect.groupByAll(['a', 'b', 'c'])).toBe('GROUP BY ALL');
			expect(dialect.groupByAll([])).toBe('GROUP BY ALL');
		});
	});

	describe('rowLimitClause', () => {
		it('emits LIMIT only when no offset', () => {
			expect(dialect.rowLimitClause({ limit: 10, hasOrderBy: false })).toBe('LIMIT 10');
		});
		it('emits LIMIT and OFFSET', () => {
			expect(dialect.rowLimitClause({ limit: 10, offset: 20, hasOrderBy: true })).toBe(
				'LIMIT 10 OFFSET 20'
			);
		});
	});

	describe('groupArray', () => {
		it('wraps ARRAY_AGG(JSON_ARRAY) in TO_JSON_STRING for tuple-shape compatibility', () => {
			expect(dialect.groupArray('date', 'value')).toBe(
				'TO_JSON_STRING(ARRAY_AGG(JSON_ARRAY(date, value) ORDER BY date))'
			);
		});
	});

	describe('formatAlias', () => {
		it('lowercases the alias', () => {
			expect(dialect.formatAlias('CREATED_AT__MONTH')).toBe('created_at__month');
		});
	});

	describe('nullSafeEqual', () => {
		it('expands to a NULL-safe disjunction (no IS NOT DISTINCT FROM in BQ)', () => {
			expect(dialect.nullSafeEqual('a', 'b')).toBe('((a IS NULL AND b IS NULL) OR a = b)');
		});
	});

	describe('iff', () => {
		it('emits IF(...)', () => {
			expect(dialect.iff('x > 0', 'a', 'b')).toBe('IF(x > 0, a, b)');
		});
	});

	describe('function lookups', () => {
		it('inherits common aggregations and adds BQ-specific ones', () => {
			expect(dialect.aggregationFunctions.has('SUM')).toBe(true);
			expect(dialect.aggregationFunctions.has('APPROX_COUNT_DISTINCT')).toBe(true);
			expect(dialect.aggregationFunctions.has('COUNTIF')).toBe(true);
		});
		it('inherits common non-aggs and adds BQ-specific ones', () => {
			expect(dialect.nonAggregationFunctions.has('CAST')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('DATETIME_ADD')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('SAFE_CAST')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('REGEXP_CONTAINS')).toBe(true);
		});
	});
});

describe('FabricDialect', () => {
	const dialect = new FabricDialect();

	it('has name "fabric"', () => {
		expect(dialect.name).toBe('fabric');
	});

	it('implements SqlDialect', () => {
		const d: SqlDialect = dialect;
		expect(d).toBeDefined();
	});

	it('declares case-insensitive identifiers', () => {
		expect(dialect.caseInsensitiveIdentifiers).toBe(true);
	});

	it('does not support FILTER clause', () => {
		expect(dialect.supportsFilterClause).toBe(false);
	});

	describe('dateGrain', () => {
		it('maps day/week/month/quarter/year/hour via DATETRUNC', () => {
			expect(dialect.dateGrain('day', 'created_at', 'sunday')).toBe('DATETRUNC(day, created_at)');
			expect(dialect.dateGrain('week', 'created_at', 'monday')).toBe('DATETRUNC(week, created_at)');
			expect(dialect.dateGrain('month', 'd', 'sunday')).toBe('DATETRUNC(month, d)');
			expect(dialect.dateGrain('quarter', 'd', 'sunday')).toBe('DATETRUNC(quarter, d)');
			expect(dialect.dateGrain('year', 'd', 'sunday')).toBe('DATETRUNC(year, d)');
			expect(dialect.dateGrain('hour', 'ts', 'sunday')).toBe('DATETRUNC(hour, ts)');
		});

		it('maps date-part extractions', () => {
			expect(dialect.dateGrain('day of week', 'd', 'sunday')).toBe('DATEPART(weekday, d)');
			expect(dialect.dateGrain('day of month', 'd', 'sunday')).toBe('DAY(d)');
			expect(dialect.dateGrain('day of year', 'd', 'sunday')).toBe('DATEPART(dayofyear, d)');
			expect(dialect.dateGrain('week of year', 'd', 'sunday')).toBe('DATEPART(week, d)');
			expect(dialect.dateGrain('month of year', 'd', 'sunday')).toBe('MONTH(d)');
			expect(dialect.dateGrain('quarter of year', 'd', 'sunday')).toBe('DATEPART(quarter, d)');
		});

		it('returns the column unchanged for unknown grain', () => {
			expect(dialect.dateGrain('century', 'd', 'sunday')).toBe('d');
		});
	});

	describe('dateAdd / dateSub', () => {
		it('emits DATEADD with a bare lowercased datepart', () => {
			expect(dialect.dateAdd('DAY', 7, 'created_at')).toBe('DATEADD(day, 7, created_at)');
			expect(dialect.dateAdd('month', 'n', 'd')).toBe('DATEADD(month, n, d)');
		});
		it('negates the amount for dateSub', () => {
			expect(dialect.dateSub('day', 30, 'created_at')).toBe('DATEADD(day, -30, created_at)');
			expect(dialect.dateSub('year', 'offset', 'ts')).toBe('DATEADD(year, -offset, ts)');
		});
	});

	describe('shortDateLabel / dateLiteral / castToString', () => {
		it('emits FORMAT with a culture-pinned .NET short-date pattern', () => {
			expect(dialect.shortDateLabel('created_at')).toBe("FORMAT(created_at, 'MMM d/yy', 'en-US')");
		});
		it('emits a CAST-based DATE literal', () => {
			expect(dialect.dateLiteral('2025-01-31')).toBe("CAST('2025-01-31' AS DATE)");
		});
		it('casts to VARCHAR(MAX)', () => {
			expect(dialect.castToString('amount')).toBe('CAST(amount AS VARCHAR(MAX))');
		});
	});

	describe('countDistinct', () => {
		it('uses COUNT(DISTINCT ...)', () => {
			expect(dialect.countDistinct('user_id')).toBe('COUNT(DISTINCT user_id)');
		});
	});

	describe('rowLimitClause', () => {
		it('synthesises ORDER BY when none present (OFFSET/FETCH requires one)', () => {
			expect(dialect.rowLimitClause({ limit: 10, hasOrderBy: false })).toBe(
				'ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY'
			);
		});
		it('omits the synthetic ORDER BY when one already exists', () => {
			expect(dialect.rowLimitClause({ limit: 10, hasOrderBy: true })).toBe(
				'OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY'
			);
		});
		it('emits OFFSET + FETCH for limit and offset', () => {
			expect(dialect.rowLimitClause({ limit: 10, offset: 20, hasOrderBy: true })).toBe(
				'OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY'
			);
		});
		it('emits OFFSET only when no limit', () => {
			expect(dialect.rowLimitClause({ offset: 5, hasOrderBy: true })).toBe('OFFSET 5 ROWS');
		});
		it('emits empty string with no limit or offset', () => {
			expect(dialect.rowLimitClause({ hasOrderBy: false })).toBe('');
		});
	});

	describe('limitOffset', () => {
		it('emits a valid standalone OFFSET/FETCH with a synthetic ORDER BY', () => {
			expect(dialect.limitOffset(10)).toBe(
				'ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY'
			);
			expect(dialect.limitOffset(10, 20)).toBe(
				'ORDER BY (SELECT NULL) OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY'
			);
		});
	});

	describe('groupByAll', () => {
		it('groups by the non-aggregate expressions (no GROUP BY ALL / no ordinal GROUP BY in T-SQL)', () => {
			expect(dialect.groupByAll(['category', 'DATETRUNC(month, created_at)'])).toBe(
				'GROUP BY category, DATETRUNC(month, created_at)'
			);
		});
		it('dedupes repeated expressions', () => {
			expect(dialect.groupByAll(['a', 'a', 'b'])).toBe('GROUP BY a, b');
		});
		it('emits no clause when there are no grouping expressions', () => {
			expect(dialect.groupByAll([])).toBe('');
		});
	});

	describe('groupArray', () => {
		it('builds a valid-JSON-array string via STRING_AGG (no array type in T-SQL)', () => {
			expect(dialect.groupArray('date', 'value')).toBe(
				"CONCAT('[', STRING_AGG(CONCAT('[\"', CAST(date AS VARCHAR(MAX)), '\",', ISNULL(CAST(value AS VARCHAR(MAX)), 'null'), ']'), ',') WITHIN GROUP (ORDER BY date), ']')"
			);
		});
	});

	describe('formatAlias / quoteAlias', () => {
		it('lowercases the alias', () => {
			expect(dialect.formatAlias('CREATED_AT__MONTH')).toBe('created_at__month');
		});
		it('double-quotes and escapes embedded quotes', () => {
			expect(dialect.quoteAlias('my col')).toBe('"my col"');
			expect(dialect.quoteAlias('a"b')).toBe('"a""b"');
		});
	});

	describe('nullSafeEqual / iff / caseInsensitiveLike', () => {
		it('expands NULL-safe equality (no IS NOT DISTINCT FROM)', () => {
			expect(dialect.nullSafeEqual('a', 'b')).toBe('((a IS NULL AND b IS NULL) OR a = b)');
		});
		it("emits IIF (two i's) not IFF", () => {
			expect(dialect.iff('x > 0', 'a', 'b')).toBe('IIF(x > 0, a, b)');
		});
		it('lowercases both sides for case-insensitive LIKE (no ILIKE)', () => {
			expect(dialect.caseInsensitiveLike('name', '%foo%')).toBe("LOWER(name) LIKE LOWER('%foo%')");
		});
		it('concatenates with CONCAT(...) (no || operator in T-SQL)', () => {
			expect(dialect.concat(['a', "' - '", 'b'])).toBe("CONCAT(a, ' - ', b)");
		});
	});

	describe('function lookups', () => {
		it('inherits common aggregations and adds Fabric-specific ones', () => {
			expect(dialect.aggregationFunctions.has('SUM')).toBe(true);
			expect(dialect.aggregationFunctions.has('STRING_AGG')).toBe(true);
			expect(dialect.aggregationFunctions.has('STDEV')).toBe(true);
		});
		it('inherits common non-aggs and adds Fabric-specific ones', () => {
			expect(dialect.nonAggregationFunctions.has('CAST')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('DATETRUNC')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('IIF')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('FORMAT')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('TRY_CONVERT')).toBe(true);
		});
	});
});

describe('DatabricksDialect', () => {
	const dialect = new DatabricksDialect();

	it('has name "databricks"', () => {
		expect(dialect.name).toBe('databricks');
	});

	it('implements SqlDialect', () => {
		const d: SqlDialect = dialect;
		expect(d).toBeDefined();
	});

	it('declares case-insensitive identifiers and supports FILTER clause', () => {
		expect(dialect.caseInsensitiveIdentifiers).toBe(true);
		expect(dialect.supportsFilterClause).toBe(true);
		expect(dialect.strictDerivedTables).toBe(false);
	});

	describe('dateGrain', () => {
		it('maps truncation grains via DATE_TRUNC with a quoted unit first', () => {
			expect(dialect.dateGrain('day', 'created_at', 'sunday')).toBe(
				"DATE_TRUNC('DAY', created_at)"
			);
			expect(dialect.dateGrain('week', 'created_at', 'monday')).toBe(
				"DATE_TRUNC('WEEK', created_at)"
			);
			expect(dialect.dateGrain('month', 'd', 'sunday')).toBe("DATE_TRUNC('MONTH', d)");
			expect(dialect.dateGrain('quarter', 'd', 'sunday')).toBe("DATE_TRUNC('QUARTER', d)");
			expect(dialect.dateGrain('year', 'd', 'sunday')).toBe("DATE_TRUNC('YEAR', d)");
			expect(dialect.dateGrain('hour', 'ts', 'sunday')).toBe("DATE_TRUNC('HOUR', ts)");
		});

		it('maps date-part extractions', () => {
			expect(dialect.dateGrain('day of week', 'd', 'sunday')).toBe('DAYOFWEEK(d)');
			expect(dialect.dateGrain('day of month', 'd', 'sunday')).toBe('DAYOFMONTH(d)');
			expect(dialect.dateGrain('day of year', 'd', 'sunday')).toBe('DAYOFYEAR(d)');
			expect(dialect.dateGrain('week of year', 'd', 'sunday')).toBe('WEEKOFYEAR(d)');
			expect(dialect.dateGrain('month of year', 'd', 'sunday')).toBe('MONTH(d)');
			expect(dialect.dateGrain('quarter of year', 'd', 'sunday')).toBe('QUARTER(d)');
		});

		it('returns the column unchanged for unknown grain', () => {
			expect(dialect.dateGrain('century', 'd', 'sunday')).toBe('d');
		});
	});

	describe('dateAdd / dateSub', () => {
		it('emits DATEADD with a bare uppercased datepart', () => {
			expect(dialect.dateAdd('day', 7, 'created_at')).toBe('DATEADD(DAY, 7, created_at)');
			expect(dialect.dateAdd('MONTH', 'n', 'd')).toBe('DATEADD(MONTH, n, d)');
		});
		it('negates the amount for dateSub', () => {
			expect(dialect.dateSub('day', 30, 'created_at')).toBe('DATEADD(DAY, -30, created_at)');
			expect(dialect.dateSub('year', 'offset', 'ts')).toBe('DATEADD(YEAR, -offset, ts)');
		});
	});

	describe('shortDateLabel / dateLiteral / castToString', () => {
		it('emits DATE_FORMAT with a Java short-date pattern', () => {
			expect(dialect.shortDateLabel('created_at')).toBe("DATE_FORMAT(created_at, 'MMM d/yy')");
		});
		it('emits a typed DATE literal', () => {
			expect(dialect.dateLiteral('2025-01-31')).toBe("DATE '2025-01-31'");
		});
		it('casts to STRING', () => {
			expect(dialect.castToString('amount')).toBe('CAST(amount AS STRING)');
		});
	});

	describe('rowLimitClause / limitOffset', () => {
		it('emits LIMIT / OFFSET', () => {
			expect(dialect.rowLimitClause({ limit: 10, hasOrderBy: false })).toBe('LIMIT 10');
			expect(dialect.rowLimitClause({ limit: 10, offset: 20, hasOrderBy: false })).toBe(
				'LIMIT 10 OFFSET 20'
			);
			expect(dialect.limitOffset(10)).toBe('LIMIT 10');
			expect(dialect.limitOffset(10, 20)).toBe('LIMIT 10 OFFSET 20');
		});
	});

	describe('groupByAll / anyValue', () => {
		it('uses GROUP BY ALL', () => {
			expect(dialect.groupByAll(['a', 'b'])).toBe('GROUP BY ALL');
		});
		it('uses ANY_VALUE', () => {
			expect(dialect.anyValue('name')).toBe('ANY_VALUE(name)');
		});
	});

	describe('groupArray', () => {
		it('builds a valid-JSON-array string (no mixed-type array literal in Spark)', () => {
			expect(dialect.groupArray('date', 'value')).toBe(
				"CONCAT('[', ARRAY_JOIN(TRANSFORM(SORT_ARRAY(COLLECT_LIST(STRUCT(date AS k, value AS y))), x -> CONCAT('[\"', CAST(x.k AS STRING), '\",', COALESCE(CAST(x.y AS STRING), 'null'), ']')), ','), ']')"
			);
		});
	});

	describe('formatAlias / nullSafeEqual / iff / caseInsensitiveLike / concat', () => {
		it('lowercases the alias', () => {
			expect(dialect.formatAlias('CREATED_AT__MONTH')).toBe('created_at__month');
		});
		it('uses the <=> null-safe equality operator', () => {
			expect(dialect.nullSafeEqual('a', 'b')).toBe('a <=> b');
		});
		it('emits IF(...)', () => {
			expect(dialect.iff('x > 0', 'a', 'b')).toBe('IF(x > 0, a, b)');
		});
		it('uses native ILIKE', () => {
			expect(dialect.caseInsensitiveLike('name', '%foo%')).toBe("name ILIKE '%foo%'");
		});
		it('concatenates with the || operator', () => {
			expect(dialect.concat(['a', "' - '", 'b'])).toBe("a || ' - ' || b");
		});
	});

	describe('function lookups', () => {
		it('inherits common aggregations and adds Databricks-specific ones', () => {
			expect(dialect.aggregationFunctions.has('SUM')).toBe(true);
			expect(dialect.aggregationFunctions.has('ANY_VALUE')).toBe(true);
			expect(dialect.aggregationFunctions.has('PERCENTILE_APPROX')).toBe(true);
		});
		it('inherits common non-aggs and adds Databricks-specific ones', () => {
			expect(dialect.nonAggregationFunctions.has('CAST')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('DATE_TRUNC')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('ARRAY_JOIN')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('TRANSFORM')).toBe(true);
		});
	});
});

describe('quoteIdentifierIfNeeded', () => {
	it('leaves simple identifiers bare across dialects', () => {
		for (const dialect of [
			new ClickHouseDialect(),
			new BigQueryDialect(),
			new FabricDialect(),
			new DatabricksDialect()
		]) {
			expect(dialect.quoteIdentifierIfNeeded('revenue')).toBe('revenue');
			expect(dialect.quoteIdentifierIfNeeded('order_date')).toBe('order_date');
			expect(dialect.quoteIdentifierIfNeeded('col2')).toBe('col2');
		}
	});

	it('quotes identifiers with spaces or special characters', () => {
		const ch = new ClickHouseDialect();
		expect(ch.quoteIdentifierIfNeeded('Total Sales')).toBe('"Total Sales"');
		expect(ch.quoteIdentifierIfNeeded('2023')).toBe('"2023"');
		expect(ch.quoteIdentifierIfNeeded('a"b')).toBe('"a""b"');

		const bq = new BigQueryDialect();
		expect(bq.quoteIdentifierIfNeeded('Total Sales')).toBe('`Total Sales`');

		const fab = new FabricDialect();
		expect(fab.quoteIdentifierIfNeeded('Total Sales')).toBe('"Total Sales"');

		const dbx = new DatabricksDialect();
		expect(dbx.quoteIdentifierIfNeeded('Total Sales')).toBe('`Total Sales`');
	});

	describe('SnowflakeDialect (case-folding)', () => {
		const dialect = new SnowflakeDialect();

		it('leaves all-uppercase simple identifiers bare', () => {
			expect(dialect.quoteIdentifierIfNeeded('REVENUE')).toBe('REVENUE');
			expect(dialect.quoteIdentifierIfNeeded('ORDER_DATE')).toBe('ORDER_DATE');
		});

		it('quotes mixed/lower-case identifiers so they survive folding', () => {
			expect(dialect.quoteIdentifierIfNeeded('revenue')).toBe('"revenue"');
			expect(dialect.quoteIdentifierIfNeeded('Revenue')).toBe('"Revenue"');
		});

		it('quotes identifiers with spaces', () => {
			expect(dialect.quoteIdentifierIfNeeded('Total Sales')).toBe('"Total Sales"');
		});
	});
});

describe('MotherDuckDialect', () => {
	const dialect = new MotherDuckDialect();

	it('has name "motherduck"', () => {
		expect(dialect.name).toBe('motherduck');
	});

	it('implements SqlDialect', () => {
		const d: SqlDialect = dialect;
		expect(d).toBeDefined();
	});

	it('declares case-insensitive identifiers and supports FILTER', () => {
		expect(dialect.caseInsensitiveIdentifiers).toBe(true);
		expect(dialect.supportsFilterClause).toBe(true);
		expect(dialect.strictDerivedTables).toBe(false);
	});

	describe('dateGrain', () => {
		it('maps day/week/month/quarter/year/hour via DATE_TRUNC', () => {
			expect(dialect.dateGrain('day', 'created_at', 'sunday')).toBe(
				"DATE_TRUNC('day', created_at)"
			);
			expect(dialect.dateGrain('week', 'created_at', 'monday')).toBe(
				"DATE_TRUNC('week', created_at)"
			);
			expect(dialect.dateGrain('month', 'd', 'sunday')).toBe("DATE_TRUNC('month', d)");
			expect(dialect.dateGrain('quarter', 'd', 'sunday')).toBe("DATE_TRUNC('quarter', d)");
			expect(dialect.dateGrain('year', 'd', 'sunday')).toBe("DATE_TRUNC('year', d)");
			expect(dialect.dateGrain('hour', 'ts', 'sunday')).toBe("DATE_TRUNC('hour', ts)");
		});

		it('maps date-part extractions', () => {
			expect(dialect.dateGrain('day of week', 'd', 'sunday')).toBe('DAYOFWEEK(d)');
			expect(dialect.dateGrain('day of month', 'd', 'sunday')).toBe('DAYOFMONTH(d)');
			expect(dialect.dateGrain('day of year', 'd', 'sunday')).toBe('DAYOFYEAR(d)');
			expect(dialect.dateGrain('week of year', 'd', 'sunday')).toBe('WEEKOFYEAR(d)');
			expect(dialect.dateGrain('month of year', 'd', 'sunday')).toBe('MONTH(d)');
			expect(dialect.dateGrain('quarter of year', 'd', 'sunday')).toBe('QUARTER(d)');
		});

		it('returns the column unchanged for unknown grain', () => {
			expect(dialect.dateGrain('century', 'd', 'sunday')).toBe('d');
		});
	});

	describe('dateAdd / dateSub', () => {
		it('emits the to_<unit>s interval helper', () => {
			expect(dialect.dateAdd('day', 7, 'created_at')).toBe('created_at + to_days(7)');
			expect(dialect.dateAdd('month', 'n', 'd')).toBe('d + to_months(n)');
		});
		it('subtracts the interval for dateSub', () => {
			expect(dialect.dateSub('day', 30, 'created_at')).toBe('created_at - to_days(30)');
			expect(dialect.dateSub('year', 'offset', 'ts')).toBe('ts - to_years(offset)');
		});
	});

	describe('shortDateLabel / dateLiteral / castToString', () => {
		it('emits a strftime short-date pattern', () => {
			expect(dialect.shortDateLabel('created_at')).toBe("strftime(created_at, '%b %-d/%y')");
		});
		it('emits a DATE literal', () => {
			expect(dialect.dateLiteral('2025-01-31')).toBe("DATE '2025-01-31'");
		});
		it('casts to VARCHAR', () => {
			expect(dialect.castToString('amount')).toBe('CAST(amount AS VARCHAR)');
		});
	});

	describe('rowLimitClause / limitOffset', () => {
		it('emits LIMIT and OFFSET', () => {
			expect(dialect.rowLimitClause({ limit: 10, hasOrderBy: false })).toBe('LIMIT 10');
			expect(dialect.rowLimitClause({ limit: 10, offset: 20, hasOrderBy: true })).toBe(
				'LIMIT 10 OFFSET 20'
			);
			expect(dialect.rowLimitClause({ offset: 5, hasOrderBy: false })).toBe('OFFSET 5');
			expect(dialect.rowLimitClause({ hasOrderBy: false })).toBe('');
		});
		it('limitOffset emits LIMIT [OFFSET]', () => {
			expect(dialect.limitOffset(10)).toBe('LIMIT 10');
			expect(dialect.limitOffset(10, 20)).toBe('LIMIT 10 OFFSET 20');
		});
	});

	describe('groupByAll', () => {
		it('emits GROUP BY ALL', () => {
			expect(dialect.groupByAll(['category', 'x'])).toBe('GROUP BY ALL');
		});
	});

	describe('groupArray', () => {
		it('builds an ordered JSON-array string (DuckDB lists are homogeneous)', () => {
			expect(dialect.groupArray('date', 'value')).toBe(
				'to_json(list(json_array(date, value) ORDER BY date))'
			);
		});
	});

	describe('formatAlias / quoteAlias', () => {
		it('lowercases the alias', () => {
			expect(dialect.formatAlias('CREATED_AT__MONTH')).toBe('created_at__month');
		});
		it('double-quotes and escapes embedded quotes', () => {
			expect(dialect.quoteAlias('my col')).toBe('"my col"');
			expect(dialect.quoteAlias('a"b')).toBe('"a""b"');
		});
	});

	describe('nullSafeEqual / iff / caseInsensitiveLike / concat', () => {
		it('uses IS NOT DISTINCT FROM for NULL-safe equality', () => {
			expect(dialect.nullSafeEqual('a', 'b')).toBe('a IS NOT DISTINCT FROM b');
		});
		it('expands iff to CASE WHEN', () => {
			expect(dialect.iff('x > 0', 'a', 'b')).toBe('CASE WHEN x > 0 THEN a ELSE b END');
		});
		it('uses ILIKE for case-insensitive LIKE', () => {
			expect(dialect.caseInsensitiveLike('name', '%foo%')).toBe("name ILIKE '%foo%'");
		});
		it('concatenates with the || operator', () => {
			expect(dialect.concat(['a', "' - '", 'b'])).toBe("a || ' - ' || b");
		});
	});

	describe('function lookups', () => {
		it('inherits common aggregations and adds DuckDB-specific ones', () => {
			expect(dialect.aggregationFunctions.has('SUM')).toBe(true);
			expect(dialect.aggregationFunctions.has('ARRAY_AGG')).toBe(true);
			expect(dialect.aggregationFunctions.has('QUANTILE_CONT')).toBe(true);
		});
		it('inherits common non-aggs and adds DuckDB-specific ones', () => {
			expect(dialect.nonAggregationFunctions.has('CAST')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('STRFTIME')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('TO_DAYS')).toBe(true);
			expect(dialect.nonAggregationFunctions.has('TO_JSON')).toBe(true);
		});
	});

	describe('quoteIdentifierIfNeeded', () => {
		it('leaves simple identifiers bare (DuckDB does not fold case)', () => {
			expect(dialect.quoteIdentifierIfNeeded('revenue')).toBe('revenue');
			expect(dialect.quoteIdentifierIfNeeded('Revenue')).toBe('Revenue');
		});
		it('quotes identifiers with spaces', () => {
			expect(dialect.quoteIdentifierIfNeeded('Total Sales')).toBe('"Total Sales"');
		});
	});
});

describe('defaultDialect', () => {
	it('is an instance of ClickHouseDialect', () => {
		expect(defaultDialect).toBeInstanceOf(ClickHouseDialect);
	});

	it('satisfies SqlDialect interface', () => {
		const d: SqlDialect = defaultDialect;
		expect(d.name).toBe('clickhouse');
	});
});

describe('escapeStringLiteral', () => {
	// Backslash-honouring warehouses: `\` inside a string literal starts an escape
	// sequence, so doubling the quote alone lets a trailing `\` end the literal early.
	const backslashDialects: SqlDialect[] = [
		new ClickHouseDialect(),
		new SnowflakeDialect(),
		new BigQueryDialect(),
		new DatabricksDialect()
	];
	const ansiDialects: SqlDialect[] = [
		new PostgresDialect(),
		new FabricDialect(),
		new MotherDuckDialect(),
		new CubeDialect()
	];

	// `\'` not `''`: BigQuery rejects `'O''Brien'` as unseparated adjacent literals, and
	// Spark <= 4.0 concatenates it into `OBrien` instead.
	it('escapes the quote the way each warehouse actually reads it', () => {
		for (const dialect of backslashDialects) {
			expect(dialect.escapeStringLiteral("O'Brien")).toBe("O\\'Brien");
		}
		for (const dialect of ansiDialects) {
			expect(dialect.escapeStringLiteral("O'Brien")).toBe("O''Brien");
		}
	});

	it('never emits a doubled quote on a dialect that would misread it', () => {
		for (const dialect of backslashDialects) {
			for (const raw of ["O'Brien", "it's", "''", "a'b'c", "'"]) {
				expect(dialect.escapeStringLiteral(raw)).not.toContain("''");
			}
		}
	});

	it('doubles backslashes only where the warehouse honours them', () => {
		for (const dialect of backslashDialects) {
			expect(dialect.escapeStringLiteral('C:\\tmp')).toBe('C:\\\\tmp');
		}
		for (const dialect of ansiDialects) {
			expect(dialect.escapeStringLiteral('C:\\tmp')).toBe('C:\\tmp');
		}
	});

	it('leaves the literal unterminated-proof against a trailing-backslash payload', () => {
		const payload = String.raw`x\' UNION ALL SELECT 1 --`;
		for (const dialect of backslashDialects) {
			const literal = `'${dialect.escapeStringLiteral(payload)}'`;
			expect(literal).toBe(String.raw`'x\\\' UNION ALL SELECT 1 --'`);
			expect(countLiteralBoundaries(literal)).toBe(2);
		}
	});

	it('never leaves an odd number of consecutive backslashes before a quote', () => {
		for (const dialect of backslashDialects) {
			for (const raw of ["\\'", "\\\\'", "a\\", "\\\\", "''\\", "\\'\\'"]) {
				expect(countLiteralBoundaries(`'${dialect.escapeStringLiteral(raw)}'`)).toBe(2);
			}
		}
	});
});

/**
 * Detects an early-terminated literal without a real warehouse: a safe one has exactly two
 * boundaries, its own open and close.
 */
function countLiteralBoundaries(sql: string): number {
	let boundaries = 0;
	let inLiteral = false;
	for (let i = 0; i < sql.length; i++) {
		if (sql[i] === '\\' && inLiteral) {
			i++;
			continue;
		}
		if (sql[i] !== "'") continue;
		if (inLiteral && sql[i + 1] === "'") {
			i++;
			continue;
		}
		boundaries++;
		inLiteral = !inLiteral;
	}
	return boundaries;
}

// Regression tests for the substring-check row-limit bug this method replaces
// (see run_query in viewer-tools.ts). Two known failure modes we must NOT
// reintroduce: (1) stapling `LIMIT n` onto T-SQL, which is a syntax error in
// Fabric; (2) treating a `credit_limit` column reference as "query already has
// a LIMIT" and applying no cap at all.
describe('applyRowLimit', () => {
	// applyRowLimit sprinkles `\n` before wrap-close parens and appended
	// clauses so a trailing `--` line comment in the caller SQL can't swallow
	// our structural additions. Tests care about SQL structure, not that
	// defensive whitespace — collapse runs of whitespace and drop whitespace
	// adjacent to structural punctuation (`(`, `)`, `,`) before comparing so
	// expected strings stay readable.
	const norm = (s: string) =>
		s.replace(/\s+/g, ' ').replace(/\s*([(),])\s*/g, '$1').trim();
	const eq = (actual: string, expected: string) =>
		expect(norm(actual)).toBe(norm(expected));

	const limitFamily: Array<[string, SqlDialect]> = [
		['ClickHouse', new ClickHouseDialect()],
		['Snowflake', new SnowflakeDialect()],
		['BigQuery', new BigQueryDialect()],
		['Postgres', new PostgresDialect()],
		['Cube', new CubeDialect()],
		['Databricks', new DatabricksDialect()],
		['MotherDuck', new MotherDuckDialect()]
	];

	describe.each(limitFamily)('%s', (_name, dialect) => {
		it('wraps an unlimited query with LIMIT', () => {
			eq(
				dialect.applyRowLimit('SELECT * FROM t', 100),
				'SELECT * FROM (SELECT * FROM t) AS __ev_limit_wrap LIMIT 100'
			);
		});

		it('applies a cap even when the SQL references a column named credit_limit', () => {
			// The old substring `.includes('limit')` heuristic returned early
			// here and left the query uncapped.
			const wrapped = dialect.applyRowLimit('SELECT credit_limit FROM accounts', 100);
			expect(wrapped).toMatch(/LIMIT 100\s*$/);
			expect(wrapped).toContain('credit_limit');
		});

		it('is idempotent when the inner query already has a LIMIT (outer clamps)', () => {
			// Wrapping is safe: `SELECT * FROM (... LIMIT 10) LIMIT 100` returns
			// at most 10 rows — inner limit wins because it runs first.
			eq(
				dialect.applyRowLimit('SELECT * FROM t LIMIT 10', 100),
				'SELECT * FROM (SELECT * FROM t LIMIT 10) AS __ev_limit_wrap LIMIT 100'
			);
		});

		it('strips a trailing semicolon before wrapping', () => {
			eq(
				dialect.applyRowLimit('SELECT * FROM t;', 5),
				'SELECT * FROM (SELECT * FROM t) AS __ev_limit_wrap LIMIT 5'
			);
		});

		it("closes the wrap on a new line so a trailing '--' comment can't swallow structure", () => {
			// A caller ending with `-- comment` would otherwise absorb our
			// closing `)` into the comment (which extends to end of line),
			// producing malformed SQL. `\n` before `)` prevents this.
			const result = dialect.applyRowLimit('SELECT * FROM t -- trailing note', 100);
			expect(result).toMatch(/-- trailing note\s*\n\s*\)/);
			eq(
				result,
				'SELECT * FROM (SELECT * FROM t -- trailing note) AS __ev_limit_wrap LIMIT 100'
			);
		});

		it('picks a non-colliding wrap alias when the caller already uses `__ev_limit_wrap`', () => {
			// Duplicate table alias in the same SELECT is an error on every
			// LIMIT-family dialect; the wrap name must not clash with anything
			// the caller wrote.
			const sql = 'SELECT x AS __ev_limit_wrap FROM t';
			const result = dialect.applyRowLimit(sql, 100);
			expect(result).toMatch(/AS __ev_limit_wrap_\d+ LIMIT 100$/);
		});
	});

	describe('Fabric', () => {
		const dialect = new FabricDialect();

		it('never emits the LIMIT keyword (T-SQL has no such clause)', () => {
			for (const sql of [
				'SELECT * FROM t',
				'SELECT TOP 5 * FROM t',
				'SELECT * FROM t ORDER BY x',
				'SELECT * FROM t ORDER BY x OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY',
				'WITH x AS (SELECT * FROM t) SELECT * FROM x',
				'SELECT credit_limit FROM accounts'
			]) {
				expect(dialect.applyRowLimit(sql, 100)).not.toMatch(/\bLIMIT\b/i);
			}
		});

		it('wraps a simple SELECT with SELECT TOP N', () => {
			eq(
				dialect.applyRowLimit('SELECT * FROM t', 100),
				'SELECT TOP 100 * FROM (SELECT * FROM t) AS __ev_limit_wrap'
			);
		});

		it('enforces the requested cap even when the SQL has a larger existing TOP', () => {
			// Regression: previously we returned the caller's SQL unchanged when
			// it already had `TOP`, letting an AI-written `SELECT TOP 1000000 …`
			// bypass the tool's 1000-row ceiling. Now the outer TOP clamps.
			eq(
				dialect.applyRowLimit('SELECT TOP 1000000 * FROM t', 100),
				'SELECT TOP 100 * FROM (SELECT TOP 1000000 * FROM t) AS __ev_limit_wrap'
			);
		});

		it('enforces the requested cap even when the SQL has a larger existing FETCH', () => {
			eq(
				dialect.applyRowLimit(
					'SELECT * FROM t ORDER BY x OFFSET 0 ROWS FETCH NEXT 1000000 ROWS ONLY',
					100
				),
				'SELECT TOP 100 * FROM (SELECT * FROM t ORDER BY x OFFSET 0 ROWS FETCH NEXT 1000000 ROWS ONLY) AS __ev_limit_wrap'
			);
		});

		it('applies a cap when the SQL references a column named credit_limit', () => {
			eq(
				dialect.applyRowLimit('SELECT credit_limit FROM accounts', 100),
				'SELECT TOP 100 * FROM (SELECT credit_limit FROM accounts) AS __ev_limit_wrap'
			);
		});

		it('falls back to append when the SQL has a top-level ORDER BY (wrap would be invalid)', () => {
			// T-SQL forbids `ORDER BY` inside a derived table without an
			// accompanying row-limiter, so we can't wrap. Append instead.
			eq(
				dialect.applyRowLimit('SELECT * FROM t ORDER BY x', 100),
				'SELECT * FROM t ORDER BY x OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY'
			);
		});

		it('extends the CTE list rather than nest WITH (T-SQL forbids nested WITH in a subquery)', () => {
			// CTE + safe tail body → stack a wrap CTE onto the caller's WITH
			// list. Nested WITH inside a subquery/CTE body is a T-SQL error,
			// so we can't use derived-table wrapping here.
			eq(
				dialect.applyRowLimit('WITH x AS (SELECT * FROM t) SELECT * FROM x', 100),
				'WITH x AS (SELECT * FROM t), __ev_limit_wrap AS (SELECT * FROM x) SELECT TOP 100 * FROM __ev_limit_wrap'
			);
		});

		it('enforces the cap for CTE queries with an oversized tail TOP (Greptile regression)', () => {
			// Was previously returned unchanged, letting `run_query` execute an
			// oversized warehouse read on Fabric CTE queries.
			eq(
				dialect.applyRowLimit(
					'WITH x AS (SELECT * FROM t) SELECT TOP 1000000 * FROM x',
					100
				),
				'WITH x AS (SELECT * FROM t), __ev_limit_wrap AS (SELECT TOP 1000000 * FROM x) SELECT TOP 100 * FROM __ev_limit_wrap'
			);
		});

		it('handles a CTE whose tail SELECT has an ORDER BY (append fallback)', () => {
			// Wrap would violate T-SQL "no bare ORDER BY inside CTE body".
			eq(
				dialect.applyRowLimit(
					'WITH x AS (SELECT * FROM t) SELECT * FROM x ORDER BY y',
					100
				),
				'WITH x AS (SELECT * FROM t) SELECT * FROM x ORDER BY y OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY'
			);
		});

		it('ignores TOP inside a CTE body when planning the tail wrap', () => {
			// The tail SELECT has no TOP; only the CTE body does. The scanner
			// tracks paren depth, so the CTE-body TOP doesn't drag us into the
			// "tail-has-row-limiter" branch.
			eq(
				dialect.applyRowLimit(
					'WITH x AS (SELECT TOP 5 * FROM t) SELECT * FROM x',
					100
				),
				'WITH x AS (SELECT TOP 5 * FROM t), __ev_limit_wrap AS (SELECT * FROM x) SELECT TOP 100 * FROM __ev_limit_wrap'
			);
		});

		it('wraps when ORDER BY appears only inside a window function (not top-level)', () => {
			// Regression: the naive `\border\s+by\b/i` regex matched here and
			// caused us to skip synthesising an outer ORDER BY, producing SQL
			// Fabric would reject. Paren-aware scanning fixes it — this SQL has
			// no top-level ORDER BY, so wrapping is legal and preferred.
			const sql = 'SELECT ROW_NUMBER() OVER (ORDER BY x) AS rn, * FROM t';
			eq(dialect.applyRowLimit(sql, 100), `SELECT TOP 100 * FROM (${sql}) AS __ev_limit_wrap`);
		});

		it('wraps when ORDER BY appears only inside a subquery', () => {
			const sql =
				'SELECT * FROM t WHERE x IN (SELECT x FROM u ORDER BY y OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY)';
			eq(dialect.applyRowLimit(sql, 100), `SELECT TOP 100 * FROM (${sql}) AS __ev_limit_wrap`);
		});

		it('ignores ORDER BY inside a string literal', () => {
			const sql = "SELECT * FROM t WHERE label = 'order by hand'";
			eq(dialect.applyRowLimit(sql, 100), `SELECT TOP 100 * FROM (${sql}) AS __ev_limit_wrap`);
		});

		it('ignores ORDER BY inside a line comment', () => {
			const sql = 'SELECT * FROM t -- order by later\n';
			const result = dialect.applyRowLimit(sql, 100);
			expect(result).toMatch(/^SELECT TOP 100 \* FROM \(/);
			expect(result).not.toMatch(/ORDER BY \(SELECT NULL\)/);
		});

		it('strips a trailing semicolon before wrapping', () => {
			eq(
				dialect.applyRowLimit('SELECT * FROM t;', 5),
				'SELECT TOP 5 * FROM (SELECT * FROM t) AS __ev_limit_wrap'
			);
		});

		it('hoists a trailing OPTION (…) query hint onto the outer wrap SELECT', () => {
			// T-SQL rejects OPTION inside a derived table. Splitting it off
			// preserves the hint on the outer statement (its natural scope).
			eq(
				dialect.applyRowLimit('SELECT * FROM t OPTION (RECOMPILE)', 100),
				'SELECT TOP 100 * FROM (SELECT * FROM t) AS __ev_limit_wrap OPTION (RECOMPILE)'
			);
		});

		it('hoists OPTION off the tail of a CTE stack (Greptile regression)', () => {
			// T-SQL rejects OPTION inside a CTE body. Splitting keeps the
			// stacked CTE valid and preserves the hint on the outer SELECT.
			eq(
				dialect.applyRowLimit(
					'WITH x AS (SELECT * FROM t) SELECT * FROM x OPTION (RECOMPILE)',
					100
				),
				'WITH x AS (SELECT * FROM t), __ev_limit_wrap AS (SELECT * FROM x) SELECT TOP 100 * FROM __ev_limit_wrap OPTION (RECOMPILE)'
			);
		});

		it('hoists FOR JSON off the tail of a derived-table wrap', () => {
			eq(
				dialect.applyRowLimit('SELECT * FROM t FOR JSON PATH', 100),
				'SELECT TOP 100 * FROM (SELECT * FROM t) AS __ev_limit_wrap FOR JSON PATH'
			);
		});

		it('places OPTION after the appended OFFSET/FETCH when wrapping is unsafe', () => {
			// Bare outer ORDER BY forces the append path. OPTION still has to
			// end the statement, not sit between clauses.
			eq(
				dialect.applyRowLimit('SELECT * FROM t ORDER BY x OPTION (RECOMPILE)', 100),
				'SELECT * FROM t ORDER BY x OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY OPTION (RECOMPILE)'
			);
		});

		it('ignores OPTION-looking text inside a string literal', () => {
			// Paren/quote-aware scanner should not treat `'option(x)'` as a
			// statement suffix — otherwise we would split the query mid-literal.
			const sql = "SELECT * FROM t WHERE label = 'option(x)'";
			eq(dialect.applyRowLimit(sql, 100), `SELECT TOP 100 * FROM (${sql}) AS __ev_limit_wrap`);
		});

		it("wraps and closes on a new line so trailing '--' can't swallow the close paren (Greptile regression)", () => {
			// Caller ends with a line comment — appended `)` or clauses on the
			// same line would be commented out. `\n` before each addition
			// prevents this, so the warehouse sees valid, bounded SQL.
			const result = dialect.applyRowLimit('SELECT * FROM t -- trailing', 100);
			expect(result).toMatch(/-- trailing\s*\n\s*\)/);
			eq(
				result,
				'SELECT TOP 100 * FROM (SELECT * FROM t -- trailing) AS __ev_limit_wrap'
			);
		});

		it("append path also breaks the line so a trailing '--' can't swallow OFFSET/FETCH", () => {
			const result = dialect.applyRowLimit('SELECT * FROM t ORDER BY x -- note', 100);
			expect(result).toMatch(/-- note\s*\n\s*OFFSET/);
			eq(
				result,
				'SELECT * FROM t ORDER BY x -- note OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY'
			);
		});

		it('recognises CTE queries that begin with a line comment (Greptile regression)', () => {
			// `/^\s*with/i` only skipped whitespace, so leading `--` comments
			// would send a CTE query down the derived-table wrap path — invalid
			// T-SQL. `stripLeadingIgnorable` also skips comments.
			const sql = '-- semantic probe\nWITH x AS (SELECT * FROM t) SELECT * FROM x';
			eq(
				dialect.applyRowLimit(sql, 100),
				'-- semantic probe\nWITH x AS (SELECT * FROM t), __ev_limit_wrap AS (SELECT * FROM x) SELECT TOP 100 * FROM __ev_limit_wrap'
			);
		});

		it('recognises CTE queries that begin with a block comment', () => {
			const sql = '/* probe */ WITH x AS (SELECT * FROM t) SELECT * FROM x';
			eq(
				dialect.applyRowLimit(sql, 100),
				'/* probe */ WITH x AS (SELECT * FROM t), __ev_limit_wrap AS (SELECT * FROM x) SELECT TOP 100 * FROM __ev_limit_wrap'
			);
		});

		it('handles escaped `]]` inside a bracketed identifier (Greptile regression)', () => {
			// `[weird]]order by]` is a single valid T-SQL identifier equal to
			// `weird]order by`. A scanner that treated the first `]` as the
			// close would then read the trailing `order by` as a top-level
			// ORDER BY and skip synthesising one — invalid FETCH.
			const sql = 'SELECT [weird]]order by] FROM t';
			eq(
				dialect.applyRowLimit(sql, 100),
				`SELECT TOP 100 * FROM (${sql}) AS __ev_limit_wrap`
			);
		});

		it('handles escaped `""` inside a double-quoted identifier', () => {
			const sql = 'SELECT "weird""order by" FROM t';
			eq(
				dialect.applyRowLimit(sql, 100),
				`SELECT TOP 100 * FROM (${sql}) AS __ev_limit_wrap`
			);
		});

		it('picks a non-colliding wrap CTE name when the caller uses `__ev_limit_wrap` (Greptile regression)', () => {
			// Caller already has a CTE called `__ev_limit_wrap`. A naive rewrite
			// would emit a duplicate CTE name and Fabric would reject the whole
			// query. Pick `__ev_limit_wrap_1` (or higher) instead.
			const sql = 'WITH __ev_limit_wrap AS (SELECT * FROM t) SELECT * FROM __ev_limit_wrap';
			const result = dialect.applyRowLimit(sql, 100);
			expect(result).not.toMatch(/__ev_limit_wrap AS \(SELECT \* FROM __ev_limit_wrap\)/);
			// The wrap CTE must use a numeric-suffixed name; the caller's CTE
			// stays intact.
			expect(result).toMatch(/__ev_limit_wrap_\d+ AS \(/);
			expect(result).toMatch(/SELECT TOP 100 \* FROM __ev_limit_wrap_\d+/);
		});

		it('picks a non-colliding alias when the caller uses `__ev_limit_wrap` as a column alias', () => {
			// Non-CTE derived-table wrap needs the same collision protection.
			const sql = 'SELECT x AS __ev_limit_wrap FROM t';
			const result = dialect.applyRowLimit(sql, 100);
			expect(result).toMatch(/AS __ev_limit_wrap_\d+$/);
		});

		it('detects FETCH NEXT @variable ROWS ONLY as an existing cap (Greptile regression)', () => {
			// The old `\d+` matcher missed T-SQL variables. Missing the
			// existing FETCH would drop us to the append path and emit a
			// second `OFFSET/FETCH` on the same SELECT — a syntax error.
			// The wrap path is what's expected here — outer TOP still clamps.
			const sql =
				'SELECT * FROM t ORDER BY x OFFSET 0 ROWS FETCH NEXT @count ROWS ONLY';
			eq(
				dialect.applyRowLimit(sql, 100),
				`SELECT TOP 100 * FROM (${sql}) AS __ev_limit_wrap`
			);
		});

		it('detects FETCH NEXT (SELECT n) ROWS ONLY as an existing cap', () => {
			// Parenthesised expression count — depth tracker enters/exits
			// the inner paren, and the relaxed matcher still recognises the
			// FETCH clause.
			const sql =
				'SELECT * FROM t ORDER BY x OFFSET 0 ROWS FETCH NEXT (SELECT 5) ROWS ONLY';
			eq(
				dialect.applyRowLimit(sql, 100),
				`SELECT TOP 100 * FROM (${sql}) AS __ev_limit_wrap`
			);
		});

		it('detects FETCH with an arbitrarily long count expression (Greptile regression)', () => {
			// A prior bounded matcher (`[\s\S]{1,200}?`) would miss FETCH
			// clauses whose row-count expression exceeded 200 chars,
			// dropping us to the append path and emitting a duplicate
			// OFFSET/FETCH. The bound is gone — FETCH detection now only
			// checks the `FETCH NEXT|FIRST` prefix at depth 0.
			const longExpr =
				'(CAST(' + '1+'.repeat(200) + '1 AS INT))';
			const sql = `SELECT * FROM t ORDER BY x OFFSET 0 ROWS FETCH NEXT ${longExpr} ROWS ONLY`;
			eq(
				dialect.applyRowLimit(sql, 100),
				`SELECT TOP 100 * FROM (${sql}) AS __ev_limit_wrap`
			);
		});
	});
});
