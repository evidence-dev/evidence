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
 * Generic Postgres dialect (ANSI SQL, PostgreSQL flavour).
 *
 * This is the base for every Postgres-wire warehouse — generic Postgres, Amazon
 * RDS / Aurora, Supabase, Neon, Timescale — and the parent for the Redshift and
 * Cube dialects, which subclass it to override only their quirks. Notable
 * differences from the ClickHouse-family warehouses:
 *  - **Identifier quoting uses double quotes** (`"col"`); backticks are invalid.
 *  - No `GROUP BY ALL` — group by the actual non-aggregate expressions (like
 *    Fabric). Postgres *does* accept SELECT-list aliases in GROUP BY/ORDER BY, so
 *    `strictDerivedTables` stays false.
 *  - No `ANY_VALUE` on older/derived engines (Redshift, Cube) — use `MAX`, which
 *    is the safe common denominator for the single-value-per-group helpers.
 *  - Date math is INTERVAL arithmetic (`col + n * INTERVAL '1 day'`); there is no
 *    `quarter` interval unit, so quarters are expressed in months.
 */
export class PostgresDialect implements SqlDialect {
	readonly name: string = 'postgres';

	dateGrain(grain: string, column: string, firstDayOfWeek: 'sunday' | 'monday'): string {
		switch (grain) {
			case 'day':
				return `DATE_TRUNC('day', ${column})`;
			case 'week':
				// Postgres DATE_TRUNC('week') is ISO (Monday-start). For a Sunday-start
				// week (the product default) shift the input forward a day, truncate,
				// then shift back — so the bucket boundary lands on Sunday.
				return firstDayOfWeek === 'monday'
					? `DATE_TRUNC('week', ${column})`
					: `(DATE_TRUNC('week', ${column} + INTERVAL '1 day') - INTERVAL '1 day')`;
			case 'month':
				return `DATE_TRUNC('month', ${column})`;
			case 'quarter':
				return `DATE_TRUNC('quarter', ${column})`;
			case 'year':
				return `DATE_TRUNC('year', ${column})`;
			case 'hour':
				return `DATE_TRUNC('hour', ${column})`;
			case 'day of week':
				return `EXTRACT(DOW FROM ${column})`;
			case 'day of month':
				return `EXTRACT(DAY FROM ${column})`;
			case 'day of year':
				return `EXTRACT(DOY FROM ${column})`;
			case 'week of year':
				return `EXTRACT(WEEK FROM ${column})`;
			case 'month of year':
				return `EXTRACT(MONTH FROM ${column})`;
			case 'quarter of year':
				return `EXTRACT(QUARTER FROM ${column})`;
			default:
				return column;
		}
	}

	protected intervalExpr(unit: string, amount: number | string): string {
		const u = unit.toLowerCase();
		// Postgres INTERVAL has no 'quarter' unit — express it as months.
		if (u === 'quarter') return `(${amount} * INTERVAL '3 months')`;
		return `(${amount} * INTERVAL '1 ${u}')`;
	}

	dateAdd(unit: string, amount: number | string, column: string): string {
		return `${column} + ${this.intervalExpr(unit, amount)}`;
	}

	dateSub(unit: string, amount: number | string, column: string): string {
		const negated = typeof amount === 'number' ? -amount : `-(${amount})`;
		return `${column} + ${this.intervalExpr(unit, negated)}`;
	}

	shortDateLabel(column: string): string {
		// to_char pattern letters: "Mon" = abbreviated month, "FMDD" = day with no
		// leading zero, "YY" = 2-digit year — the "Jan 3/25" shape the other
		// dialects produce.
		return `TO_CHAR(${column}, 'Mon FMDD/YY')`;
	}

	dateLiteral(isoDate: string): string {
		return `DATE '${isoDate}'`;
	}

	castToString(column: string): string {
		return `CAST(${column} AS TEXT)`;
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

	rowLimitClause({
		limit,
		offset
	}: {
		limit?: number;
		offset?: number;
		hasOrderBy: boolean;
	}): string {
		const parts: string[] = [];
		if (limit !== undefined) parts.push(`LIMIT ${limit}`);
		if (offset !== undefined) parts.push(`OFFSET ${offset}`);
		return parts.join(' ');
	}

	groupByAll(groupingExpressions: string[]): string {
		// Postgres has no `GROUP BY ALL`. Group by the actual non-aggregate
		// expressions. Dedupe so repeated dimensions don't produce a redundant list.
		const unique = [...new Set(groupingExpressions.filter((e) => e && e.trim().length > 0))];
		if (unique.length === 0) return '';
		return `GROUP BY ${unique.join(', ')}`;
	}

	anyValue(expr: string): string {
		// Postgres gained ANY_VALUE only in v16, and Redshift/Cube lack it entirely.
		// MAX picks a single deterministic value per group — what these
		// single-value-per-group helper columns need — and works everywhere.
		return `MAX(${expr})`;
	}

	groupArray(sortKey: string, valueKey: string): string {
		// Build a JSON-array-of-arrays *string* per group — the same wire shape the
		// BigQuery/Fabric dialects emit — for the row layer to JSON.parse back into
		// `[[x, y], ...]` tuples (see normalize-sparkline-rows). The x value is cast
		// to text so it renders as a JSON string (sparkline x-axes are
		// dates/categories); the whole aggregate is cast to text so the driver hands
		// back a string rather than a parsed json value.
		return `(JSON_AGG(JSON_BUILD_ARRAY(${sortKey}::text, ${valueKey}) ORDER BY ${sortKey}))::text`;
	}

	formatAlias(alias: string): string {
		// Postgres folds unquoted identifiers to lowercase; lowercase aliases to
		// match returned column names and metadata lookups.
		return alias.toLowerCase();
	}

	quoteAlias(alias: string): string {
		// Double-quote identifier quoting; escape embedded quotes by doubling.
		return `"${alias.replace(/"/g, '""')}"`;
	}

	readonly escapesBackslashInIdentifiers = false;

	quoteIdentifierIfNeeded(identifier: string): string {
		return isSimpleIdentifier(identifier) ? identifier : this.quoteAlias(identifier);
	}

	escapeStringLiteral(value: string): string {
		return escapeAnsiStringLiteral(value);
	}

	nullSafeEqual(a: string, b: string): string {
		return `${a} IS NOT DISTINCT FROM ${b}`;
	}

	iff(cond: string, a: string, b: string): string {
		// Postgres has no IIF/IF expression — use CASE.
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
		// Postgres has no MEDIAN() or COVARIANCE() (use percentile_cont / covar_pop|samp),
		// so drop them from the commons — otherwise the validator green-lights SQL that
		// fails at execution with "function does not exist".
		...COMMON_AGGREGATION_FUNCTIONS.filter((f) => f !== 'MEDIAN' && f !== 'COVARIANCE'),
		// Postgres aggregations
		'STRING_AGG',
		'ARRAY_AGG',
		'JSON_AGG',
		'JSONB_AGG',
		'JSON_OBJECT_AGG',
		'JSONB_OBJECT_AGG',
		'BOOL_AND',
		'BOOL_OR',
		'EVERY',
		'BIT_AND',
		'BIT_OR',
		'PERCENTILE_CONT',
		'PERCENTILE_DISC',
		'MODE'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		...COMMON_NON_AGG_FUNCTIONS,
		// Postgres date/time functions
		'DATE_PART',
		'DATE_TRUNC',
		'TO_CHAR',
		'TO_DATE',
		'TO_TIMESTAMP',
		'MAKE_DATE',
		'MAKE_TIMESTAMP',
		'AGE',
		'JUSTIFY_INTERVAL',
		// String / type
		'SPLIT_PART',
		'REGEXP_REPLACE',
		'REGEXP_MATCH',
		'REGEXP_MATCHES',
		'POSITION',
		'CHAR_LENGTH',
		'CHARACTER_LENGTH',
		'LENGTH',
		'LTRIM',
		'RTRIM',
		'LPAD',
		'RPAD',
		'INITCAP',
		'STRPOS',
		'TRANSLATE',
		// Conditional helpers
		'GREATEST',
		'LEAST',
		// JSON
		'JSON_BUILD_OBJECT',
		'JSONB_BUILD_OBJECT',
		'JSON_BUILD_ARRAY',
		'JSONB_BUILD_ARRAY',
		'JSON_EXTRACT_PATH',
		'JSONB_EXTRACT_PATH'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		...COMMON_FUNCTION_TYPE_RULES,
		PERCENTILE_CONT: new Set(NUMERIC_RULE),
		PERCENTILE_DISC: new Set(NUMERIC_RULE)
	};
}
