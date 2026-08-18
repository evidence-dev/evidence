/**
 * Shared ANSI-ish SQL building blocks consumed by every dialect implementation.
 *
 * Each dialect starts from these common sets (roughly the intersection of
 * functions available across the warehouses we target) and layers its own
 * warehouse-specific functions on top. If two dialects diverge on something
 * that's here, move it out of the commons rather than forking behaviour.
 */

/**
 * Type categories used by the SQL expression validator. Each dialect maps raw
 * column type strings (e.g. "Float64", "REAL", "NUMBER(38,0)") into these
 * categories via its column metadata loader, so this vocabulary is the only
 * one the validator needs to know about.
 */
export type DialectJsType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'unknown';
export type DialectFunctionTypeRule = DialectJsType | '*';

const SIMPLE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
export function isSimpleIdentifier(identifier: string): boolean {
	return SIMPLE_IDENTIFIER.test(identifier);
}

/**
 * Where the warehouse honours `\`, a trailing one would escape a doubled quote and end the
 * literal early. `\'` not `''`: BigQuery rejects `''` adjacent, Spark <= 4.0 concatenates it.
 */
export function escapeBackslashStringLiteral(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Escape a string literal's contents for dialects where backslash is an ordinary
 * character (Postgres, Fabric, DuckDB). Doubling backslashes here would corrupt the value.
 */
export function escapeAnsiStringLiteral(value: string): string {
	return value.replace(/'/g, "''");
}

/**
 * Escape a value for embedding in a single-quoted SQL string literal, using the dialect's
 * own rules. Returns the inner text only — the caller writes the surrounding quotes.
 */
export function escapeSqlValue(
	value: string,
	dialect?: Pick<SqlDialect, 'escapeStringLiteral'>
): string {
	// No dialect only happens in tests; over-escaping there beats leaving the hole open.
	return dialect ? dialect.escapeStringLiteral(value) : escapeBackslashStringLiteral(value);
}

/** For warehouses with no predicate-argument aggregates — everything but ClickHouse. */
export const NO_CONDITIONAL_AGGREGATES: ReadonlySet<string> = new Set<string>();

/** Aggregation functions assumed present in every dialect we target. */
export const COMMON_AGGREGATION_FUNCTIONS: readonly string[] = [
	'COUNT',
	'SUM',
	'AVG',
	'MIN',
	'MAX',
	'STDDEV',
	'STDDEV_POP',
	'STDDEV_SAMP',
	'VAR_POP',
	'VAR_SAMP',
	'VARIANCE',
	'COVARIANCE',
	'CORR',
	'MEDIAN'
];

/** Non-aggregation functions and keywords assumed present in every dialect. */
export const COMMON_NON_AGG_FUNCTIONS: readonly string[] = [
	// Conditional / null handling
	'CASE',
	'IF',
	'IFF',
	'IFNULL',
	'NULLIF',
	'COALESCE',
	// Type / string
	'CAST',
	'CONCAT',
	'SUBSTRING',
	'TRIM',
	'UPPER',
	'LOWER',
	'REPLACE',
	'LEFT',
	'RIGHT',
	// Numeric
	'ROUND',
	'FLOOR',
	'CEILING',
	'CEIL',
	'ABS',
	'SQRT',
	'POW',
	'POWER',
	// Date
	'EXTRACT',
	'DATE',
	'NOW',
	'CURRENT_DATE',
	'CURRENT_TIMESTAMP',
	'DATE_TRUNC',
	'DATEDIFF',
	// Time-unit literals (used by EXTRACT, DATE_TRUNC, INTERVAL, etc.)
	'YEAR',
	'QUARTER',
	'MONTH',
	'WEEK',
	'DAY',
	'HOUR',
	'MINUTE',
	'SECOND'
];

export const NUMERIC_RULE: DialectFunctionTypeRule[] = ['number'];
export const NUMERIC_OR_DATE_RULE: DialectFunctionTypeRule[] = ['number', 'date'];

export const COMMON_FUNCTION_TYPE_RULES: Record<string, ReadonlySet<DialectFunctionTypeRule>> = {
	SUM: new Set(NUMERIC_RULE),
	AVG: new Set(NUMERIC_RULE),
	MIN: new Set(NUMERIC_OR_DATE_RULE),
	MAX: new Set(NUMERIC_OR_DATE_RULE),
	COUNT: new Set(['*']),
	MEDIAN: new Set(NUMERIC_RULE),
	STDDEV: new Set(NUMERIC_RULE),
	VARIANCE: new Set(NUMERIC_RULE)
};

export interface SqlDialect {
	readonly name: string;
	dateGrain(grain: string, column: string, firstDayOfWeek: 'sunday' | 'monday'): string;
	dateAdd(unit: string, amount: number | string, column: string): string;
	dateSub(unit: string, amount: number | string, column: string): string;
	/**
	 * Emit SQL that renders a date column as a short-form label, e.g. "Jan 3/25".
	 * Used for date-range display columns in comparison queries. If you need
	 * other formats, add a new semantic helper rather than a generic dateFormat —
	 * callers should never have to know the warehouse's native format syntax.
	 */
	shortDateLabel(column: string): string;
	/** Cast an ISO date string (YYYY-MM-DD) to a DATE value. */
	dateLiteral(isoDate: string): string;
	castToString(column: string): string;
	countDistinct(column: string): string;
	limitOffset(limit: number, offset?: number): string;
	/**
	 * Trailing row-limit clause appended after any `ORDER BY`. ClickHouse,
	 * Snowflake and BigQuery emit `LIMIT n [OFFSET m]`. T-SQL dialects (Fabric)
	 * have no `LIMIT` keyword and instead emit
	 * `[ORDER BY (SELECT NULL)] OFFSET m ROWS [FETCH NEXT n ROWS ONLY]`, which is
	 * only legal alongside an `ORDER BY` — `hasOrderBy` tells the dialect whether
	 * one is already present so it can synthesise a stable no-op ordering when not.
	 */
	rowLimitClause(opts: { limit?: number; offset?: number; hasOrderBy: boolean }): string;
	/**
	 * Wrap arbitrary caller SQL with a hard row cap using the dialect's own
	 * grammar. Use this any time the row cap has to be enforced on SQL the
	 * caller wrote (AI-tool queries, ad-hoc runners) — a substring check for
	 * `LIMIT` is unsafe: it breaks on T-SQL (`SELECT TOP N`) and false-matches
	 * inside identifiers like `credit_limit`. The dialect handles both.
	 *
	 * Idempotent by construction for LIMIT-family dialects (wraps in a
	 * subquery, so a pre-existing inner limit is still clamped by the outer).
	 * Fabric detects `TOP` / `FETCH NEXT … ROWS ONLY` and no-ops rather than
	 * combining, since T-SQL rejects TOP alongside OFFSET/FETCH.
	 */
	applyRowLimit(sql: string, limit: number): string;
	/**
	 * Emit the `GROUP BY` for "group by every non-aggregate select expression".
	 * ClickHouse/Snowflake/BigQuery collapse this to `GROUP BY ALL` and ignore the
	 * argument. T-SQL has no `GROUP BY ALL` and — unlike Postgres-family SQL — does
	 * NOT support ordinal `GROUP BY 1, 2` (it would group by the integer constants),
	 * so the Fabric dialect groups by the supplied expressions directly. Pass the
	 * non-aggregate column expressions (without aliases).
	 */
	groupByAll(groupingExpressions: string[]): string;
	/**
	 * Wrap a non-aggregated expression in the dialect's "pick any row's value"
	 * aggregate, so a column can be selected alongside grouped dimensions without
	 * joining the `GROUP BY`. ClickHouse: `any(x)`. Snowflake/BigQuery:
	 * `ANY_VALUE(x)`. T-SQL (Fabric) has no such function — use `MAX(x)`, which is
	 * equivalent for the single-value-per-group helper columns this is used for.
	 */
	anyValue(expr: string): string;
	groupArray(sortKey: string, valueKey: string): string;
	formatAlias(alias: string): string;
	quoteAlias(alias: string): string;
	/** Quote `identifier` only when it can't be written bare in this dialect. */
	quoteIdentifierIfNeeded(identifier: string): string;
	/**
	 * True when `\` escapes the next character inside a quoted identifier. An untrusted
	 * name then has to double its backslashes as well as its quotes, or `"orders\" UNION
	 * …--"` closes early. Where it is false, doubling would rename a real `my\table`.
	 */
	readonly escapesBackslashInIdentifiers: boolean;
	/**
	 * Escape the contents of a single-quoted string literal. Returns the inner text only —
	 * the caller still writes the surrounding quotes.
	 */
	escapeStringLiteral(value: string): string;
	nullSafeEqual(a: string, b: string): string;
	iff(cond: string, a: string, b: string): string;
	/**
	 * Concatenate string expressions. ClickHouse/Snowflake/BigQuery use the `||`
	 * operator; T-SQL (Fabric) has no `||` string operator and uses `CONCAT(...)`.
	 */
	concat(parts: string[]): string;
	/**
	 * Emit a case-insensitive substring match. `pattern` is the already-`%`-wrapped,
	 * single-quote-escaped LIKE pattern (caller does the escaping). BigQuery has no
	 * `ILIKE`, so dialects implement this differently.
	 */
	caseInsensitiveLike(column: string, pattern: string): string;

	/**
	 * Whether unquoted identifiers are case-folded by the warehouse (Snowflake
	 * folds to uppercase, ClickHouse does not fold at all). Column metadata
	 * lookups and the SQL-expression validator use this to decide whether
	 * `value="total_sales"` should match a returned `TOTAL_SALES` column.
	 */
	readonly caseInsensitiveIdentifiers: boolean;

	/** Whether the dialect supports `agg(...) FILTER (WHERE ...)` syntax. */
	readonly supportsFilterClause: boolean;

	/**
	 * Aggregates that take their own boolean predicate as the last argument —
	 * ClickHouse's `-If` combinator (`sumIf(x, cond)`). ClickHouse implements
	 * FILTER by appending that same combinator, so filtering one is rejected as
	 * a nested identical combinator; the predicate has to be ANDed into the
	 * aggregate's own condition instead. Empty for every other warehouse, whose
	 * lookalikes (Databricks/DuckDB `count_if`) are ordinary aggregates that
	 * accept FILTER.
	 */
	readonly conditionalAggregateFunctions: ReadonlySet<string>;

	/**
	 * Whether the dialect enforces SQL-standard derived-table rules (T-SQL/Fabric):
	 * every derived table in a FROM must be aliased, GROUP BY / ORDER BY cannot
	 * reference a SELECT-list alias (must use the expression), and a derived table
	 * may not contain a bare ORDER BY (without TOP/OFFSET). ClickHouse, Snowflake,
	 * and BigQuery are lenient on all three, so this is `false` for them.
	 */
	readonly strictDerivedTables: boolean;

	/** Aggregation function names recognised by this dialect (uppercase). */
	readonly aggregationFunctions: ReadonlySet<string>;
	/** Non-aggregation function/keyword names recognised by this dialect (uppercase). */
	readonly nonAggregationFunctions: ReadonlySet<string>;
	/**
	 * Per-aggregation-function argument-type allowlist.
	 * Map key = uppercase function name. Value = set of allowed jsType categories,
	 * or `'*'` to mean "any type".
	 */
	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>>;
}

/**
 * Shared `applyRowLimit` implementation for LIMIT-family dialects (everyone
 * except Fabric). Wraps the caller SQL in a subquery so the outer LIMIT
 * always clamps, regardless of any inner limit. Idempotent by construction:
 * `SELECT * FROM (SELECT * FROM t LIMIT 10) AS q LIMIT 100` returns 10 rows.
 *
 * The `\n` before `)` isn't cosmetic — a caller SQL that ends in a `--`
 * line comment would otherwise absorb our closing paren, so the warehouse
 * receives an unclosed subquery (or, worse in some engines, silently
 * executes the inner query without our outer LIMIT).
 */
export function wrapWithLimit(sql: string, limit: number): string {
	const trimmed = sql.trim().replace(/;+$/, '');
	const alias = pickUniqueWrapName(trimmed);
	return `SELECT * FROM (${trimmed}\n) AS ${alias} LIMIT ${limit}`;
}

/**
 * Return a wrap alias / CTE name that doesn't collide with anything in the
 * caller SQL. A user query that already contains `__ev_limit_wrap` (as a
 * CTE, a column alias, or even just inside a string) would otherwise
 * produce a duplicate-CTE error on Fabric (or a duplicate-alias error
 * elsewhere) after the rewrite. Case-insensitive because Fabric folds
 * unquoted identifiers.
 */
export function pickUniqueWrapName(sql: string): string {
	const base = '__ev_limit_wrap';
	const lower = sql.toLowerCase();
	if (!lower.includes(base)) return base;
	for (let i = 1; i < 1_000_000; i++) {
		const candidate = `${base}_${i}`;
		if (!lower.includes(candidate)) return candidate;
	}
	// Unreachable in practice — a SQL string can't contain a million
	// distinct suffixed forms without being absurdly larger than our tool
	// limits allow — but throw explicitly so we fail loudly if reached.
	throw new Error('pickUniqueWrapName: could not find a non-colliding wrap name');
}

/**
 * Return `sql` with any leading whitespace and SQL comments stripped so the
 * remainder starts with the first significant token. Handles both `--` line
 * comments and `/* … *\/` block comments. Used to test whether a query "starts
 * with WITH" — a `/^\s*with/i` regex misses queries with leading comments,
 * and for Fabric that mistake sends a CTE query down the derived-table path
 * (T-SQL rejects CTEs inside derived tables).
 */
export function stripLeadingIgnorable(sql: string): string {
	let i = 0;
	while (i < sql.length) {
		const c = sql[i];
		const next = sql[i + 1];
		if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\v') {
			i++;
			continue;
		}
		if (c === '-' && next === '-') {
			const nl = sql.indexOf('\n', i + 2);
			if (nl === -1) return '';
			i = nl + 1;
			continue;
		}
		if (c === '/' && next === '*') {
			const end = sql.indexOf('*/', i + 2);
			if (end === -1) return '';
			i = end + 2;
			continue;
		}
		return sql.slice(i);
	}
	return '';
}

/**
 * Paren/string/comment-aware structural scan of a SQL string. Reports the
 * clauses that live at the outermost paren-depth (i.e. on the "tail" SELECT
 * — the one that runs after any leading CTEs), plus the byte offset where
 * that tail SELECT starts.
 *
 * A regex-only check for `\border\s+by\b`, `\btop\b`, `\bfetch\b` false-matches:
 *  - `ROW_NUMBER() OVER (ORDER BY x)` — inside a window function's parens
 *  - `WHERE x IN (SELECT … ORDER BY y OFFSET 0 …)` — inside a subquery
 *  - `WITH x AS (SELECT TOP 5 * FROM t) SELECT * FROM x` — TOP inside a CTE
 *  - `WHERE label = 'order by hand'` — inside a string literal
 *  - `-- order by later` / `/* order by *\/` — inside a comment
 * All of these are handled by the walker below via depth/quote/comment state.
 *
 * Used by Fabric's `applyRowLimit` to decide (a) whether the tail SELECT has
 * a row-limiter that lets us wrap it as a derived table / CTE body without
 * hitting T-SQL's "no bare ORDER BY without TOP/OFFSET/FETCH" rule, and
 * (b) where the tail SELECT starts, so we can extend a caller's `WITH` list
 * with our own wrapping CTE rather than nest (T-SQL forbids nested WITH).
 */
export interface TopLevelClauseScan {
	/** `ORDER BY` present at paren-depth 0 in the tail SELECT. */
	hasOrderBy: boolean;
	/** `SELECT [DISTINCT] TOP N` present at paren-depth 0 (the tail SELECT). */
	hasTop: boolean;
	/** `FETCH NEXT/FIRST n ROWS ONLY` present at paren-depth 0. */
	hasFetch: boolean;
	/**
	 * Byte offset of the tail `SELECT` keyword (the one that executes AFTER
	 * any CTE definitions), or 0 if the query is a plain SELECT with no CTE.
	 * -1 if no SELECT was found at paren-depth 0 (shouldn't happen for the
	 * SELECT-only surface `run_query` accepts).
	 */
	tailSelectStart: number;
	/**
	 * Byte offset where a T-SQL statement-suffix clause begins at paren-depth 0
	 * — either `OPTION (…)` (query hints) or `FOR JSON…` / `FOR XML…` (result
	 * formatting). These clauses are only legal on the outermost SELECT of a
	 * statement; T-SQL rejects them inside a derived table or CTE body. Wrap
	 * paths that see a non-negative value here must split at this offset and
	 * hoist the suffix onto the outer wrap SELECT rather than let it ride
	 * into the wrapping subquery/CTE. -1 if no such suffix exists.
	 */
	statementSuffixStart: number;
}

export function scanTopLevelClauses(sql: string): TopLevelClauseScan {
	let depth = 0;
	let inSingle = false;
	let inDouble = false;
	let inBracket = false;
	let inLine = false;
	let inBlock = false;
	let hasOrderBy = false;
	let hasTop = false;
	let hasFetch = false;
	let tailSelectStart = -1;
	let statementSuffixStart = -1;
	for (let i = 0; i < sql.length; i++) {
		const c = sql[i];
		const next = sql[i + 1];
		if (inLine) {
			if (c === '\n') inLine = false;
			continue;
		}
		if (inBlock) {
			if (c === '*' && next === '/') {
				inBlock = false;
				i++;
			}
			continue;
		}
		if (inSingle) {
			if (c === "'") {
				if (next === "'") i++;
				else inSingle = false;
			}
			continue;
		}
		if (inDouble) {
			if (c === '"') {
				// T-SQL escapes `"` inside a double-quoted identifier by
				// doubling it (`"foo""bar"` = identifier `foo"bar`). Skip.
				if (next === '"') i++;
				else inDouble = false;
			}
			continue;
		}
		if (inBracket) {
			if (c === ']') {
				// T-SQL escapes `]` inside a bracketed identifier by doubling
				// it (`[foo]]bar]` = identifier `foo]bar`). Skip the pair;
				// otherwise a valid identifier like `[weird]]order by]` would
				// dump `order by` back into the top-level scan.
				if (next === ']') i++;
				else inBracket = false;
			}
			continue;
		}
		if (c === '-' && next === '-') {
			inLine = true;
			i++;
			continue;
		}
		if (c === '/' && next === '*') {
			inBlock = true;
			i++;
			continue;
		}
		if (c === "'") {
			inSingle = true;
			continue;
		}
		if (c === '"') {
			inDouble = true;
			continue;
		}
		if (c === '[') {
			inBracket = true;
			continue;
		}
		if (c === '(') {
			depth++;
			continue;
		}
		if (c === ')') {
			if (depth > 0) depth--;
			continue;
		}
		if (depth !== 0) continue;
		const prev = i === 0 ? ' ' : sql[i - 1];
		if (/[A-Za-z0-9_]/.test(prev)) continue;
		const rest = sql.slice(i);
		if (!hasOrderBy && (c === 'o' || c === 'O') && /^order\s+by\b/i.test(rest)) {
			hasOrderBy = true;
			continue;
		}
		if (
			!hasFetch &&
			(c === 'f' || c === 'F') &&
			// FETCH's row count can be an integer, a T-SQL variable
			// (`@count`), or a parenthesised expression (`(SELECT 5)`) — so
			// don't require any specific shape between `FETCH NEXT/FIRST` and
			// `ROWS ONLY`. And since we're already at paren depth 0 in a
			// SELECT-only surface, `FETCH NEXT|FIRST` here is unambiguously
			// the row-limiter clause: T-SQL SELECT has no other production
			// with that prefix (cursor-`FETCH NEXT FROM cur` is a separate
			// statement class run_query rejects). No terminator scan needed.
			/^fetch\s+(?:next|first)\b/i.test(rest)
		) {
			hasFetch = true;
			continue;
		}
		if ((c === 's' || c === 'S') && /^select\b/i.test(rest)) {
			if (tailSelectStart === -1) tailSelectStart = i;
			if (!hasTop && /^select\s+(?:distinct\s+)?top\s*[\d(]/i.test(rest)) {
				hasTop = true;
			}
			continue;
		}
		// Statement-suffix clauses (`OPTION (…)`, `FOR JSON …`, `FOR XML …`)
		// are legal only on the outermost SELECT of a statement. Record the
		// earliest such match at depth 0 so wrap paths can split it off.
		if (statementSuffixStart === -1) {
			if ((c === 'o' || c === 'O') && /^option\s*\(/i.test(rest)) {
				statementSuffixStart = i;
				continue;
			}
			if ((c === 'f' || c === 'F') && /^for\s+(?:json|xml)\b/i.test(rest)) {
				statementSuffixStart = i;
				continue;
			}
		}
	}
	return { hasOrderBy, hasTop, hasFetch, tailSelectStart, statementSuffixStart };
}
