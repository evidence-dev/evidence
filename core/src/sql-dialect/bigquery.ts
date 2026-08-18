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

export class BigQueryDialect implements SqlDialect {
	readonly name = 'bigquery';

	dateGrain(grain: string, column: string, firstDayOfWeek: 'sunday' | 'monday'): string {
		switch (grain) {
			case 'day':
				return `DATE_TRUNC(${column}, DAY)`;
			case 'week':
				return firstDayOfWeek === 'monday'
					? `DATE_TRUNC(${column}, ISOWEEK)`
					: `DATE_TRUNC(${column}, WEEK)`;
			case 'month':
				return `DATE_TRUNC(${column}, MONTH)`;
			case 'quarter':
				return `DATE_TRUNC(${column}, QUARTER)`;
			case 'year':
				return `DATE_TRUNC(${column}, YEAR)`;
			case 'hour':
				return `DATETIME_TRUNC(${column}, HOUR)`;
			case 'day of week':
				return `EXTRACT(DAYOFWEEK FROM ${column})`;
			case 'day of month':
				return `EXTRACT(DAY FROM ${column})`;
			case 'day of year':
				return `EXTRACT(DAYOFYEAR FROM ${column})`;
			case 'week of year':
				return `EXTRACT(ISOWEEK FROM ${column})`;
			case 'month of year':
				return `EXTRACT(MONTH FROM ${column})`;
			case 'quarter of year':
				return `EXTRACT(QUARTER FROM ${column})`;
			default:
				return column;
		}
	}

	// BigQuery has separate add/sub families per type: DATE_ADD (DATE in / DATE out,
	// rejects sub-day units), DATETIME_ADD (DATETIME in / DATETIME out, accepts all
	// units), TIMESTAMP_ADD (sub-day units only). Picking the wrong family doesn't
	// just fail at the call site — the *return type* propagates: e.g. DATETIME_ADD
	// on a DATE column returns DATETIME, which then breaks `date_col >= <result>`
	// because BQ won't implicitly coerce DATE↔DATETIME for comparison.
	//
	// Heuristic: for day-or-larger units use DATE_ADD/SUB so a DATE column stays a
	// DATE; for sub-day units use DATETIME_ADD/SUB (a DATE column gets cast to
	// DATETIME, which is the only way to add hours/minutes anyway).
	private dateArithFamily(unit: string): 'DATE' | 'DATETIME' {
		const u = unit.toUpperCase();
		return u === 'HOUR' || u === 'MINUTE' || u === 'SECOND' || u === 'MILLISECOND' || u === 'MICROSECOND'
			? 'DATETIME'
			: 'DATE';
	}

	dateAdd(unit: string, amount: number | string, column: string): string {
		const family = this.dateArithFamily(unit);
		return `${family}_ADD(${column}, INTERVAL ${amount} ${unit.toUpperCase()})`;
	}

	dateSub(unit: string, amount: number | string, column: string): string {
		const family = this.dateArithFamily(unit);
		return `${family}_SUB(${column}, INTERVAL ${amount} ${unit.toUpperCase()})`;
	}

	shortDateLabel(column: string): string {
		return `FORMAT_DATE('%b %d/%y', ${column})`;
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
		// BigQuery supports GROUP BY ALL since 2023 with the same semantics as
		// ClickHouse and Snowflake — group by every non-aggregate expression in
		// the SELECT list.
		return 'GROUP BY ALL';
	}

	anyValue(expr: string): string {
		return `ANY_VALUE(${expr})`;
	}

	groupArray(sortKey: string, valueKey: string): string {
		// Wrap as a single JSON string so the BQ client gets a STRING column
		// instead of ARRAY<STRUCT> (which deserializes as `[{x_val, y_val}, ...]`
		// with wrapped dates). JSON.parse on the server yields `[[x, y], ...]`
		// — the same tuple shape ClickHouse and Snowflake already emit. BQ's
		// JSON serializer renders DATE as "YYYY-MM-DD" and TIMESTAMP as ISO-Z,
		// which matches our canonical date format too.
		return `TO_JSON_STRING(ARRAY_AGG(JSON_ARRAY(${sortKey}, ${valueKey}) ORDER BY ${sortKey}))`;
	}

	formatAlias(alias: string): string {
		return alias.toLowerCase();
	}

	quoteAlias(alias: string): string {
		// BQ uses backticks for identifier quoting; "..." is a string literal.
		// Backticked identifiers cannot contain backticks (no escape mechanism),
		// so we strip them — Evidence-generated aliases never contain backticks
		// in practice.
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
		// BigQuery has no IS NOT DISTINCT FROM operator.
		return `((${a} IS NULL AND ${b} IS NULL) OR ${a} = ${b})`;
	}

	iff(cond: string, a: string, b: string): string {
		return `IF(${cond}, ${a}, ${b})`;
	}

	concat(parts: string[]): string {
		// BigQuery supports the `||` concatenation operator (GoogleSQL).
		return parts.join(' || ');
	}

	caseInsensitiveLike(column: string, pattern: string): string {
		// BigQuery has no ILIKE. Lowercase both sides for a case-insensitive match.
		return `LOWER(${column}) LIKE LOWER('${pattern}')`;
	}

	readonly caseInsensitiveIdentifiers = false;
	readonly supportsFilterClause = false;
	readonly conditionalAggregateFunctions = NO_CONDITIONAL_AGGREGATES;
	readonly strictDerivedTables = false;

	readonly aggregationFunctions = new Set<string>([
		...COMMON_AGGREGATION_FUNCTIONS,
		'APPROX_COUNT_DISTINCT',
		'APPROX_QUANTILES',
		'APPROX_TOP_COUNT',
		'STRING_AGG',
		'ARRAY_AGG',
		'ARRAY_CONCAT_AGG',
		'ANY_VALUE',
		'LOGICAL_AND',
		'LOGICAL_OR',
		'COUNTIF',
		'BIT_AND',
		'BIT_OR',
		'BIT_XOR',
		'PERCENTILE_CONT',
		'PERCENTILE_DISC'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		...COMMON_NON_AGG_FUNCTIONS,
		// BigQuery date/time families
		'DATE_ADD',
		'DATE_SUB',
		'DATE_DIFF',
		'DATETIME_ADD',
		'DATETIME_SUB',
		'DATETIME_DIFF',
		'DATETIME_TRUNC',
		'TIMESTAMP_ADD',
		'TIMESTAMP_SUB',
		'TIMESTAMP_DIFF',
		'TIMESTAMP_TRUNC',
		'CURRENT_DATETIME',
		'CURRENT_TIME',
		'LAST_DAY',
		'FORMAT_DATE',
		'FORMAT_DATETIME',
		'FORMAT_TIMESTAMP',
		'PARSE_DATE',
		'PARSE_DATETIME',
		'PARSE_TIMESTAMP',
		'DAYOFWEEK',
		'DAYOFYEAR',
		'ISOWEEK',
		// Type / string
		'SAFE_CAST',
		'LENGTH',
		'STARTS_WITH',
		'ENDS_WITH',
		'CONTAINS_SUBSTR',
		'REGEXP_CONTAINS',
		'REGEXP_EXTRACT',
		'REGEXP_REPLACE',
		// JSON
		'JSON_EXTRACT',
		'JSON_EXTRACT_SCALAR',
		'JSON_VALUE',
		'JSON_QUERY',
		'TO_JSON_STRING',
		'PARSE_JSON',
		// Array / struct
		'ARRAY_LENGTH',
		'UNNEST',
		'GENERATE_DATE_ARRAY',
		'GENERATE_ARRAY',
		'STRUCT'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		...COMMON_FUNCTION_TYPE_RULES,
		PERCENTILE_CONT: new Set(NUMERIC_RULE),
		PERCENTILE_DISC: new Set(NUMERIC_RULE),
		APPROX_QUANTILES: new Set(NUMERIC_RULE)
	};
}
