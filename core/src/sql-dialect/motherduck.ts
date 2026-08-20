import {
	COMMON_AGGREGATION_FUNCTIONS,
	COMMON_FUNCTION_TYPE_RULES,
	COMMON_NON_AGG_FUNCTIONS,
	NUMERIC_RULE,
	isSimpleIdentifier,
	wrapWithLimit,
	escapeAnsiStringLiteral,
	type DialectFunctionTypeRule,
	type SqlDialect,
	NO_CONDITIONAL_AGGREGATES
} from './common';

/**
 * MotherDuck (cloud DuckDB) dialect.
 *
 * DuckDB's SQL is the closest of the native warehouses to the ClickHouse /
 * Snowflake family — it has `LIMIT`/`OFFSET`, `GROUP BY ALL`, `ILIKE`, the `||`
 * concat operator, `IS NOT DISTINCT FROM`, and `DATE_TRUNC`. So this mirrors
 * the Snowflake dialect closely, with a few DuckDB-specific spellings:
 *  - Date arithmetic uses the `to_<unit>s(n)` interval helpers (`col + to_days(7)`)
 *    rather than a `DATEADD(unit, n, col)` call.
 *  - `groupArray` builds a JSON-array *string* (like BigQuery/Fabric), NOT a
 *    native list. DuckDB lists are homogeneous, so `[date_col, numeric_agg]`
 *    would fail to find a common element type; emitting JSON sidesteps that and
 *    the row layer JSON.parses it back into `[[x, y], ...]` tuples via
 *    normalizeSparklineRows.
 *  - `iff` is expanded to `CASE WHEN` (portable, no reliance on a scalar IF).
 */
export class MotherDuckDialect implements SqlDialect {
	readonly name = 'motherduck';

	dateGrain(grain: string, column: string, _firstDayOfWeek: 'sunday' | 'monday'): string {
		// NOTE on week handling: DuckDB's `date_trunc('week', ...)` and the
		// week-of-year/day-of-week functions are ISO (Monday-first) and take no
		// first-day-of-week argument (unlike ClickHouse's toStartOfWeek(col, mode)).
		// We ignore `firstDayOfWeek` rather than emit incorrect SQL — same choice as
		// the Snowflake and Fabric dialects.
		switch (grain) {
			case 'day':
				return `DATE_TRUNC('day', ${column})`;
			case 'week':
				return `DATE_TRUNC('week', ${column})`;
			case 'month':
				return `DATE_TRUNC('month', ${column})`;
			case 'quarter':
				return `DATE_TRUNC('quarter', ${column})`;
			case 'year':
				return `DATE_TRUNC('year', ${column})`;
			case 'hour':
				return `DATE_TRUNC('hour', ${column})`;
			case 'day of week':
				return `DAYOFWEEK(${column})`;
			case 'day of month':
				return `DAYOFMONTH(${column})`;
			case 'day of year':
				return `DAYOFYEAR(${column})`;
			case 'week of year':
				return `WEEKOFYEAR(${column})`;
			case 'month of year':
				return `MONTH(${column})`;
			case 'quarter of year':
				return `QUARTER(${column})`;
			default:
				return column;
		}
	}

	dateAdd(unit: string, amount: number | string, column: string): string {
		// DuckDB interval helper: `col + to_days(7)`, `col + to_months(n)`, etc.
		// Covers day/week/month/quarter/year/hour/minute/second — all the grains
		// the comparison builder passes.
		return `${column} + to_${unit.toLowerCase()}s(${amount})`;
	}

	dateSub(unit: string, amount: number | string, column: string): string {
		return `${column} - to_${unit.toLowerCase()}s(${amount})`;
	}

	shortDateLabel(column: string): string {
		// DuckDB strftime. `%b` = abbreviated month (Jan), `%-d` = day-of-month with
		// no leading zero, `%y` = 2-digit year → the "Jan 3/25" shape the other
		// dialects produce.
		return `strftime(${column}, '%b %-d/%y')`;
	}

	dateLiteral(isoDate: string): string {
		return `DATE '${isoDate}'`;
	}

	castToString(column: string): string {
		return `CAST(${column} AS VARCHAR)`;
	}

	countDistinct(column: string): string {
		return `COUNT(DISTINCT ${column})`;
	}

	limitOffset(limit: number, offset?: number): string {
		if (offset !== undefined && offset !== 0) {
			return `LIMIT ${limit} OFFSET ${offset}`;
		}
		return `LIMIT ${limit}`;
	}

	applyRowLimit(sql: string, limit: number): string {
		return wrapWithLimit(sql, limit);
	}

	rowLimitClause({ limit, offset }: { limit?: number; offset?: number; hasOrderBy: boolean }): string {
		const parts: string[] = [];
		if (limit !== undefined) parts.push(`LIMIT ${limit}`);
		if (offset !== undefined) parts.push(`OFFSET ${offset}`);
		return parts.join(' ');
	}

	groupByAll(_groupingExpressions: string[]): string {
		// DuckDB supports GROUP BY ALL — group by every non-aggregate expression in
		// the SELECT list, same semantics as ClickHouse/Snowflake/BigQuery.
		return 'GROUP BY ALL';
	}

	anyValue(expr: string): string {
		// DuckDB has ANY_VALUE, same as Snowflake/BigQuery.
		return `ANY_VALUE(${expr})`;
	}

	groupArray(sortKey: string, valueKey: string): string {
		// Build a JSON-array-of-arrays *string* per group — the same wire shape as
		// the BigQuery/Fabric dialects — so the row layer (normalizeSparklineRows)
		// can JSON.parse it back into `[[x, y], ...]` tuples. We can't use a native
		// DuckDB list here: `[sortKey, valueKey]` mixes a date/label with a numeric
		// aggregate, and DuckDB lists are homogeneous (no common element type).
		// `json_array(x, y)` renders DATE/TIMESTAMP as the canonical ISO strings,
		// and `to_json(list(... ORDER BY ...))` serializes the ordered group.
		return `to_json(list(json_array(${sortKey}, ${valueKey}) ORDER BY ${sortKey}))`;
	}

	formatAlias(alias: string): string {
		// DuckDB is case-insensitive but case-preserving; lowercase to match the
		// ClickHouse/BigQuery convention and information_schema lookups.
		return alias.toLowerCase();
	}

	quoteAlias(alias: string): string {
		return `"${alias.replace(/"/g, '""')}"`;
	}

	readonly escapesBackslashInIdentifiers = false;

	quoteIdentifierIfNeeded(identifier: string): string {
		// DuckDB does not fold unquoted identifiers, so a simple identifier is safe bare.
		return isSimpleIdentifier(identifier) ? identifier : this.quoteAlias(identifier);
	}

	escapeStringLiteral(value: string): string {
		return escapeAnsiStringLiteral(value);
	}

	nullSafeEqual(a: string, b: string): string {
		return `${a} IS NOT DISTINCT FROM ${b}`;
	}

	iff(cond: string, a: string, b: string): string {
		// Portable CASE WHEN — avoids depending on a scalar IF() being available.
		return `CASE WHEN ${cond} THEN ${a} ELSE ${b} END`;
	}

	concat(parts: string[]): string {
		return parts.join(' || ');
	}

	caseInsensitiveLike(column: string, pattern: string): string {
		return `${column} ILIKE '${pattern}'`;
	}

	readonly caseInsensitiveIdentifiers = true;
	readonly supportsFilterClause = true;
	readonly conditionalAggregateFunctions = NO_CONDITIONAL_AGGREGATES;
	readonly strictDerivedTables = false;

	readonly aggregationFunctions = new Set<string>([
		...COMMON_AGGREGATION_FUNCTIONS,
		// DuckDB-specific aggregations
		'LIST',
		'ARRAY_AGG',
		'STRING_AGG',
		'ANY_VALUE',
		'APPROX_COUNT_DISTINCT',
		'QUANTILE',
		'QUANTILE_CONT',
		'QUANTILE_DISC',
		'MODE',
		'ARG_MIN',
		'ARG_MAX',
		'BOOL_AND',
		'BOOL_OR',
		'COUNT_IF',
		'FIRST',
		'LAST',
		'PRODUCT',
		'BIT_AND',
		'BIT_OR',
		'BIT_XOR',
		'KURTOSIS',
		'SKEWNESS',
		'ENTROPY',
		'HISTOGRAM'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		...COMMON_NON_AGG_FUNCTIONS,
		// DuckDB date/time functions
		'DATE_PART',
		'DATE_DIFF',
		'DATE_ADD',
		'DATE_SUB',
		'STRFTIME',
		'STRPTIME',
		'EPOCH',
		'EPOCH_MS',
		'MAKE_DATE',
		'MAKE_TIMESTAMP',
		'LAST_DAY',
		'MONTHNAME',
		'DAYNAME',
		'DAYOFWEEK',
		'DAYOFMONTH',
		'DAYOFYEAR',
		'WEEKOFYEAR',
		'ISODOW',
		// Interval helpers emitted by dateAdd/dateSub
		'TO_DAYS',
		'TO_WEEKS',
		'TO_MONTHS',
		'TO_QUARTERS',
		'TO_YEARS',
		'TO_HOURS',
		'TO_MINUTES',
		'TO_SECONDS',
		// String / type
		'TRY_CAST',
		'LEN',
		'LENGTH',
		'CONTAINS',
		'STARTS_WITH',
		'ENDS_WITH',
		'SPLIT_PART',
		'STR_SPLIT',
		'REGEXP_MATCHES',
		'REGEXP_REPLACE',
		'REGEXP_EXTRACT',
		'LPAD',
		'RPAD',
		'REVERSE',
		// List / struct / JSON
		'LIST_VALUE',
		'STRUCT_PACK',
		'JSON_ARRAY',
		'TO_JSON',
		'JSON_EXTRACT',
		'JSON_VALUE'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		...COMMON_FUNCTION_TYPE_RULES,
		QUANTILE: new Set(NUMERIC_RULE),
		QUANTILE_CONT: new Set(NUMERIC_RULE),
		QUANTILE_DISC: new Set(NUMERIC_RULE)
	};
}
