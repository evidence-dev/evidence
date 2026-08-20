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

export class SnowflakeDialect implements SqlDialect {
	readonly name = 'snowflake';

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
		return `DATEADD('${unit.toUpperCase()}', ${amount}, ${column})`;
	}

	dateSub(unit: string, amount: number | string, column: string): string {
		const negated = typeof amount === 'number' ? -amount : `-${amount}`;
		return `DATEADD('${unit.toUpperCase()}', ${negated}, ${column})`;
	}

	shortDateLabel(column: string): string {
		return `TO_CHAR(${column}, 'MON DD/YY')`;
	}

	dateLiteral(isoDate: string): string {
		return `TO_DATE('${isoDate}')`;
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
		// Snowflake supports GROUP BY ALL, which groups by every non-aggregate
		// expression in the SELECT list — same semantics as ClickHouse. Emitting
		// `GROUP BY 1,2,...,N` would wrongly include aggregation columns.
		return 'GROUP BY ALL';
	}

	anyValue(expr: string): string {
		return `ANY_VALUE(${expr})`;
	}

	groupArray(sortKey: string, valueKey: string): string {
		return `ARRAY_AGG(ARRAY_CONSTRUCT(${sortKey}, ${valueKey})) WITHIN GROUP (ORDER BY ${sortKey})`;
	}

	formatAlias(alias: string): string {
		return alias.toUpperCase();
	}

	quoteAlias(alias: string): string {
		return `"${alias.replace(/"/g, '""')}"`;
	}

	readonly escapesBackslashInIdentifiers = true;

	quoteIdentifierIfNeeded(identifier: string): string {
		// Unquoted Snowflake identifiers fold to uppercase.
		if (isSimpleIdentifier(identifier) && identifier === identifier.toUpperCase()) {
			return identifier;
		}
		return this.quoteAlias(identifier);
	}

	escapeStringLiteral(value: string): string {
		return escapeBackslashStringLiteral(value);
	}

	nullSafeEqual(a: string, b: string): string {
		return `${a} IS NOT DISTINCT FROM ${b}`;
	}

	caseInsensitiveLike(column: string, pattern: string): string {
		return `${column} ILIKE '${pattern}'`;
	}

	iff(cond: string, a: string, b: string): string {
		return `IFF(${cond}, ${a}, ${b})`;
	}

	concat(parts: string[]): string {
		return parts.join(' || ');
	}

	readonly caseInsensitiveIdentifiers = true;
	readonly supportsFilterClause = false;
	readonly conditionalAggregateFunctions = NO_CONDITIONAL_AGGREGATES;
	readonly strictDerivedTables = false;
	readonly supportsGroupingSets = true;
	readonly supportsDateOffsetMath = true;

	readonly aggregationFunctions = new Set<string>([
		...COMMON_AGGREGATION_FUNCTIONS,
		// Snowflake-specific aggregations
		'ANY_VALUE',
		'APPROX_COUNT_DISTINCT',
		'APPROX_PERCENTILE',
		'PERCENTILE_CONT',
		'PERCENTILE_DISC',
		'LISTAGG',
		'ARRAY_AGG',
		'OBJECT_AGG',
		'COUNT_IF',
		'SUM_IF',
		'MIN_BY',
		'MAX_BY',
		'BOOLAND_AGG',
		'BOOLOR_AGG'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		...COMMON_NON_AGG_FUNCTIONS,
		// Snowflake-flavoured date/time functions
		'DATEADD',
		'DATE_PART',
		'TO_DATE',
		'TO_TIMESTAMP',
		'TO_TIME',
		'TO_CHAR',
		'TO_NUMBER',
		'TO_VARCHAR',
		'CONVERT_TIMEZONE',
		'CURRENT_TIME',
		'LAST_DAY',
		'NEXT_DAY',
		'PREVIOUS_DAY',
		'DAYNAME',
		'DAYOFWEEK',
		'DAYOFMONTH',
		'DAYOFYEAR',
		'WEEKOFYEAR',
		'MONTHNAME',
		// String / type
		'TRY_CAST',
		'LENGTH',
		'SPLIT_PART',
		'REGEXP_LIKE',
		'REGEXP_REPLACE',
		'REGEXP_SUBSTR',
		'PARSE_JSON',
		'TO_JSON',
		// Array / variant
		'ARRAY_CONSTRUCT',
		'OBJECT_CONSTRUCT',
		'GET',
		'GET_PATH',
		'IS_NULL_VALUE',
		// Conditional helpers
		'ZEROIFNULL',
		'NULLIFZERO'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		...COMMON_FUNCTION_TYPE_RULES,
		PERCENTILE_CONT: new Set(NUMERIC_RULE),
		PERCENTILE_DISC: new Set(NUMERIC_RULE),
		APPROX_PERCENTILE: new Set(NUMERIC_RULE)
	};
}
