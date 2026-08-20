import {
	COMMON_AGGREGATION_FUNCTIONS,
	COMMON_FUNCTION_TYPE_RULES,
	COMMON_NON_AGG_FUNCTIONS,
	NUMERIC_RULE,
	isSimpleIdentifier,
	wrapWithLimit,
	escapeBackslashStringLiteral,
	type DialectFunctionTypeRule,
	type SqlDialect,
	NO_CONDITIONAL_AGGREGATES
} from './common';

/**
 * Databricks SQL dialect (Spark SQL / ANSI, Photon).
 *
 * Databricks shares the `LIMIT` / `GROUP BY ALL` semantics of the
 * ClickHouse-family warehouses, so structurally it is closest to Snowflake.
 * The notable differences:
 *  - **Identifier quoting uses backticks** (`` `col` ``); double quotes are
 *    string literals in ANSI mode.
 *  - No array *literal* with mixed element types, so sparkline `groupArray`
 *    builds a JSON-array-of-arrays *string* (like BigQuery / Fabric) that the
 *    row layer JSON.parses back into `[[x, y], ...]` tuples.
 *  - `date_trunc(unit, expr)` takes a quoted unit *first* (opposite of
 *    BigQuery). Week truncation is ISO (Monday-start) with no per-call
 *    first-day-of-week arg, so `firstDayOfWeek` is ignored (matches Snowflake).
 */
export class DatabricksDialect implements SqlDialect {
	readonly name = 'databricks';

	dateGrain(grain: string, column: string, _firstDayOfWeek: 'sunday' | 'monday'): string {
		switch (grain) {
			case 'day':
				return `DATE_TRUNC('DAY', ${column})`;
			case 'week':
				return `DATE_TRUNC('WEEK', ${column})`;
			case 'month':
				return `DATE_TRUNC('MONTH', ${column})`;
			case 'quarter':
				return `DATE_TRUNC('QUARTER', ${column})`;
			case 'year':
				return `DATE_TRUNC('YEAR', ${column})`;
			case 'hour':
				return `DATE_TRUNC('HOUR', ${column})`;
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
		// Databricks DATEADD takes a bare datepart keyword (not a quoted string).
		return `DATEADD(${unit.toUpperCase()}, ${amount}, ${column})`;
	}

	dateSub(unit: string, amount: number | string, column: string): string {
		// No DATESUB — negate the amount and reuse DATEADD (as Snowflake/Fabric do).
		const negated = typeof amount === 'number' ? -amount : `-${amount}`;
		return `DATEADD(${unit.toUpperCase()}, ${negated}, ${column})`;
	}

	shortDateLabel(column: string): string {
		// Spark date_format uses Java pattern letters. "MMM d/yy" → "Jan 3/25".
		return `DATE_FORMAT(${column}, 'MMM d/yy')`;
	}

	dateLiteral(isoDate: string): string {
		return `DATE '${isoDate}'`;
	}

	castToString(column: string): string {
		return `CAST(${column} AS STRING)`;
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
		// Databricks supports GROUP BY ALL — group by every non-aggregate
		// expression in the SELECT list (same semantics as ClickHouse/Snowflake).
		return 'GROUP BY ALL';
	}

	anyValue(expr: string): string {
		return `ANY_VALUE(${expr})`;
	}

	groupArray(sortKey: string, valueKey: string): string {
		// Databricks has no array literal that mixes a date/label `x` with a
		// numeric `y`, so build a JSON-array-of-arrays *string* per group — the
		// same wire shape the BigQuery and Fabric dialects emit — for the row
		// layer to JSON.parse into `[[x, y], ...]` tuples (see
		// normalize-sparkline-rows). Collect the (x, y) pairs into structs, sort
		// by x, then render each as `["x", y]` with a JSON `null` fallback for a
		// missing aggregate. The x value is quoted as a JSON string to match
		// BigQuery's rendering (sparkline x-axes are dates/categories).
		const element = `CONCAT('["', CAST(x.k AS STRING), '",', COALESCE(CAST(x.y AS STRING), 'null'), ']')`;
		return `CONCAT('[', ARRAY_JOIN(TRANSFORM(SORT_ARRAY(COLLECT_LIST(STRUCT(${sortKey} AS k, ${valueKey} AS y))), x -> ${element}), ','), ']')`;
	}

	formatAlias(alias: string): string {
		// Spark identifiers are case-insensitive but case-preserving. Lowercase to
		// match the ClickHouse/BigQuery convention and metadata lookups.
		return alias.toLowerCase();
	}

	quoteAlias(alias: string): string {
		// Spark uses backticks for identifier quoting; "..." is a string literal.
		// Backticked identifiers cannot contain a backtick, so strip them —
		// Evidence-generated aliases never contain backticks in practice.
		return `\`${alias.replace(/`/g, '')}\``;
	}

	readonly escapesBackslashInIdentifiers = true;

	quoteIdentifierIfNeeded(identifier: string): string {
		return isSimpleIdentifier(identifier) ? identifier : this.quoteAlias(identifier);
	}

	escapeStringLiteral(value: string): string {
		return escapeBackslashStringLiteral(value);
	}

	nullSafeEqual(a: string, b: string): string {
		// Spark's null-safe equality operator.
		return `${a} <=> ${b}`;
	}

	iff(cond: string, a: string, b: string): string {
		return `IF(${cond}, ${a}, ${b})`;
	}

	concat(parts: string[]): string {
		// Databricks supports the `||` concatenation operator in ANSI mode.
		return parts.join(' || ');
	}

	caseInsensitiveLike(column: string, pattern: string): string {
		return `${column} ILIKE '${pattern}'`;
	}

	readonly caseInsensitiveIdentifiers = true;
	readonly supportsFilterClause = true;
	readonly conditionalAggregateFunctions = NO_CONDITIONAL_AGGREGATES;
	readonly strictDerivedTables = false;
	readonly supportsGroupingSets = true;
	readonly supportsDateOffsetMath = true;

	readonly aggregationFunctions = new Set<string>([
		...COMMON_AGGREGATION_FUNCTIONS,
		// Databricks / Spark SQL aggregations
		'ANY_VALUE',
		'APPROX_COUNT_DISTINCT',
		'APPROX_PERCENTILE',
		'PERCENTILE',
		'PERCENTILE_APPROX',
		'COLLECT_LIST',
		'COLLECT_SET',
		'ARRAY_AGG',
		'FIRST',
		'FIRST_VALUE',
		'LAST',
		'LAST_VALUE',
		'BOOL_AND',
		'BOOL_OR',
		'COUNT_IF',
		'MAX_BY',
		'MIN_BY',
		'KURTOSIS',
		'SKEWNESS',
		'BIT_AND',
		'BIT_OR',
		'BIT_XOR'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		...COMMON_NON_AGG_FUNCTIONS,
		// Databricks / Spark date/time functions
		'DATEADD',
		'DATE_ADD',
		'DATE_SUB',
		'DATEDIFF',
		'DATE_DIFF',
		'DATE_FORMAT',
		'DATE_TRUNC',
		'TRUNC',
		'TIMESTAMPADD',
		'TIMESTAMPDIFF',
		'DAYOFWEEK',
		'DAYOFMONTH',
		'DAYOFYEAR',
		'WEEKOFYEAR',
		'LAST_DAY',
		'MAKE_DATE',
		'MAKE_TIMESTAMP',
		'TO_DATE',
		'TO_TIMESTAMP',
		'FROM_UNIXTIME',
		'UNIX_TIMESTAMP',
		'CURRENT_TIMESTAMP',
		// String / type
		'TRY_CAST',
		'LENGTH',
		'SPLIT',
		'SPLIT_PART',
		'REGEXP_EXTRACT',
		'REGEXP_REPLACE',
		'RLIKE',
		'ILIKE',
		// Array / struct / JSON
		'ARRAY',
		'ARRAY_JOIN',
		'ARRAY_SORT',
		'SORT_ARRAY',
		'TRANSFORM',
		'ELEMENT_AT',
		'EXPLODE',
		'TO_JSON',
		'FROM_JSON',
		'GET_JSON_OBJECT',
		'NAMED_STRUCT',
		'STRUCT',
		// Conditional helpers
		'NVL',
		'NVL2'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		...COMMON_FUNCTION_TYPE_RULES,
		PERCENTILE: new Set(NUMERIC_RULE),
		PERCENTILE_APPROX: new Set(NUMERIC_RULE),
		APPROX_PERCENTILE: new Set(NUMERIC_RULE)
	};
}
