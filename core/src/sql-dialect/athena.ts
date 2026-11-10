import {
	COMMON_AGGREGATION_FUNCTIONS,
	COMMON_FUNCTION_TYPE_RULES,
	COMMON_NON_AGG_FUNCTIONS,
	NUMERIC_RULE,
	type DialectFunctionTypeRule
} from './common';
import { PostgresDialect } from './postgres';

// Athena engine v3 (Trino).
export class AthenaDialect extends PostgresDialect {
	readonly name = 'athena';

	dateGrain(grain: string, column: string, firstDayOfWeek: 'sunday' | 'monday'): string {
		switch (grain) {
			case 'week':
				return firstDayOfWeek === 'monday'
					? `date_trunc('week', ${column})`
					: `date_add('day', -1, date_trunc('week', date_add('day', 1, ${column})))`;
			case 'day of week':
				// ISO Monday=1; Sunday-start projects expect Sunday=1, like BigQuery.
				return firstDayOfWeek === 'monday'
					? `day_of_week(${column})`
					: `(day_of_week(${column}) % 7 + 1)`;
			case 'day of month':
				return `day_of_month(${column})`;
			case 'day of year':
				return `day_of_year(${column})`;
			case 'week of year':
				return `week_of_year(${column})`;
			case 'month of year':
				return `month(${column})`;
			case 'quarter of year':
				return `quarter(${column})`;
			default:
				return super.dateGrain(grain, column, firstDayOfWeek);
		}
	}

	dateAdd(unit: string, amount: number | string, column: string): string {
		return `date_add('${unit.toLowerCase()}', ${amount}, ${column})`;
	}

	dateSub(unit: string, amount: number | string, column: string): string {
		const negated = typeof amount === 'number' ? -amount : `-(${amount})`;
		return `date_add('${unit.toLowerCase()}', ${negated}, ${column})`;
	}

	shortDateLabel(column: string): string {
		// %b = abbreviated month, %e = day without padding, %y = 2-digit year → "Jan 3/25".
		return `date_format(${column}, '%b %e/%y')`;
	}

	castToString(column: string): string {
		return `CAST(${column} AS VARCHAR)`;
	}

	limitOffset(limit: number, offset?: number): string {
		if (offset !== undefined && offset !== 0) {
			return `OFFSET ${offset} LIMIT ${limit}`;
		}
		return `LIMIT ${limit}`;
	}

	rowLimitClause({
		limit,
		offset
	}: {
		limit?: number;
		offset?: number;
		hasOrderBy: boolean;
	}): string {
		const parts: string[] = [];
		if (offset !== undefined) parts.push(`OFFSET ${offset}`);
		if (limit !== undefined) parts.push(`LIMIT ${limit}`);
		return parts.join(' ');
	}

	anyValue(expr: string): string {
		return `arbitrary(${expr})`;
	}

	groupArray(sortKey: string, valueKey: string): string {
		// GetQueryResults renders arrays as `[a, b]` text, not JSON, so emit JSON for normalize-sparkline-rows.
		const pair = `ARRAY[CAST(CAST(${sortKey} AS VARCHAR) AS JSON), CAST(${valueKey} AS JSON)]`;
		return `json_format(CAST(array_agg(${pair} ORDER BY ${sortKey}) AS JSON))`;
	}

	readonly supportsGroupByAlias = false;

	readonly dollarQuoting = 'none' as const;

	stringLiteralEscapesBackslash(_prefix: string): boolean {
		return false;
	}

	iff(cond: string, a: string, b: string): string {
		return `IF(${cond}, ${a}, ${b})`;
	}

	caseInsensitiveLike(column: string, pattern: string): string {
		// No ILIKE in Trino, and LOWER rejects non-varchar arguments.
		return `LOWER(CAST(${column} AS VARCHAR)) LIKE LOWER('${pattern}')`;
	}

	readonly aggregationFunctions = new Set<string>([
		// Trino has no MEDIAN; COVARIANCE is spelled covar_pop / covar_samp.
		...COMMON_AGGREGATION_FUNCTIONS.filter((f) => f !== 'MEDIAN' && f !== 'COVARIANCE'),
		'APPROX_DISTINCT',
		'APPROX_PERCENTILE',
		'APPROX_MOST_FREQUENT',
		'ARBITRARY',
		'ANY_VALUE',
		'ARRAY_AGG',
		'BOOL_AND',
		'BOOL_OR',
		'EVERY',
		'BITWISE_AND_AGG',
		'BITWISE_OR_AGG',
		'COUNT_IF',
		'COVAR_POP',
		'COVAR_SAMP',
		'GEOMETRIC_MEAN',
		'HISTOGRAM',
		'LISTAGG',
		'MAP_AGG',
		'MAX_BY',
		'MIN_BY',
		'MULTIMAP_AGG',
		'REGR_INTERCEPT',
		'REGR_SLOPE',
		'KURTOSIS',
		'SKEWNESS'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		// Trino has IF but not IFF / IFNULL.
		...COMMON_NON_AGG_FUNCTIONS.filter((f) => f !== 'IFF' && f !== 'IFNULL'),
		'TRY',
		'TRY_CAST',
		'GREATEST',
		'LEAST',
		// Date / time
		'DATE_ADD',
		'DATE_DIFF',
		'DATE_FORMAT',
		'DATE_PARSE',
		'FORMAT_DATETIME',
		'PARSE_DATETIME',
		'FROM_ISO8601_DATE',
		'FROM_ISO8601_TIMESTAMP',
		'TO_ISO8601',
		'FROM_UNIXTIME',
		'TO_UNIXTIME',
		'AT_TIMEZONE',
		'WITH_TIMEZONE',
		'CURRENT_TIME',
		'LOCALTIMESTAMP',
		'LAST_DAY_OF_MONTH',
		'DAY_OF_WEEK',
		'DAY_OF_MONTH',
		'DAY_OF_YEAR',
		'WEEK_OF_YEAR',
		'YEAR_OF_WEEK',
		'DOW',
		'DOY',
		'TIMESTAMP',
		'INTERVAL',
		// String
		'SPLIT',
		'SPLIT_PART',
		'STRPOS',
		'POSITION',
		'LENGTH',
		'LTRIM',
		'RTRIM',
		'LPAD',
		'RPAD',
		'REVERSE',
		'TRANSLATE',
		'REGEXP_LIKE',
		'REGEXP_EXTRACT',
		'REGEXP_REPLACE',
		'FORMAT',
		'STARTS_WITH',
		// Numeric
		'MOD',
		'LN',
		'LOG10',
		'LOG2',
		'EXP',
		'SIGN',
		'TRUNCATE',
		'RANDOM',
		// JSON / arrays
		'JSON_EXTRACT',
		'JSON_EXTRACT_SCALAR',
		'JSON_FORMAT',
		'JSON_PARSE',
		'CARDINALITY',
		'ELEMENT_AT',
		'CONTAINS'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		...COMMON_FUNCTION_TYPE_RULES,
		APPROX_PERCENTILE: new Set(NUMERIC_RULE),
		APPROX_DISTINCT: new Set(['*'])
	};
}
