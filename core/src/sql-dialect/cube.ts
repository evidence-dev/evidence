import { COMMON_FUNCTION_TYPE_RULES, NUMERIC_RULE, type DialectFunctionTypeRule } from './common';
import { PostgresDialect } from './postgres';

/**
 * Cube dialect. Cube's SQL API speaks the Postgres wire protocol but implements a
 * documented *subset* of PostgreSQL functions/operators
 * (https://docs.cube.dev/reference/core-data-apis/sql-api/reference), so this
 * subclasses PostgresDialect and narrows the validator's function sets to exactly
 * what Cube documents — otherwise the validator green-lights an expression that
 * fails at execution with "function does not exist".
 *
 * Overridden vs Postgres:
 *  - `caseInsensitiveLike` — Cube has no `ILIKE`; use `LOWER(col) LIKE LOWER(pat)`.
 *  - `nullSafeEqual` — Cube's SQL API reference documents neither `IS NOT DISTINCT
 *    FROM` nor `IS DISTINCT FROM`, so expand to a portable NULL-safe disjunction
 *    (same rewrite Fabric/BigQuery use). This matters: `nullSafeEqual` is emitted in
 *    every comparison/benchmark and sparkline dimension join.
 *  - `groupArray` (sparklines) — Cube has no JSON aggregates, so build the series
 *    string via `STRING_AGG` (which Cube documents) instead of the inherited
 *    `JSON_AGG`, which Cube would reject.
 *  - `aggregationFunctions` / `nonAggregationFunctions` — Cube's documented subset,
 *    plus Cube-specific `MEASURE` (references a model measure) and `XIRR`.
 *
 * Inherited from Postgres and PENDING live validation against a running Cube (the
 * SQL API's real surface depends on query pushdown and the database behind Cube):
 *  - Date math (`dateAdd`/`dateSub`/`dateGrain`) uses `col + INTERVAL` arithmetic.
 *    Cube documents `DATE_ADD`; the standard interval form typically works through
 *    pushdown, but confirm against a live deployment.
 */
export class CubeDialect extends PostgresDialect {
	readonly name = 'cube';

	caseInsensitiveLike(column: string, pattern: string): string {
		// Cube's SQL API documents LIKE but not ILIKE; fold both sides to lower case.
		return `LOWER(${column}) LIKE LOWER('${pattern}')`;
	}

	nullSafeEqual(a: string, b: string): string {
		// Cube's SQL API reference has no IS NOT DISTINCT FROM; expand it (as Fabric/BigQuery do).
		return `((${a} IS NULL AND ${b} IS NULL) OR ${a} = ${b})`;
	}

	groupArray(sortKey: string, valueKey: string): string {
		// Cube's SQL API has no JSON aggregates (JSON_AGG/JSON_BUILD_ARRAY), so the
		// inherited Postgres groupArray would be rejected. Build the sparkline
		// JSON-array-of-arrays as a *string* via STRING_AGG (which Cube documents),
		// for normalize-sparkline-rows to JSON.parse back into `[[x, y], ...]` — the
		// same string-wire approach the Fabric/BigQuery dialects use for warehouses
		// without a usable array type. The x value (date/label) is quoted as a JSON
		// string; the y value (numeric aggregate) is emitted bare with a JSON `null`
		// fallback. (The ORDER BY inside STRING_AGG is standard Postgres syntax —
		// confirm Cube accepts it against a live deployment.)
		// Cube has no JSON builder, so JSON-encode the x string by hand with REPLACE.
		// Escape everything that would otherwise produce invalid JSON and make
		// normalize-sparkline-rows drop the whole sparkline to null: backslash FIRST
		// (so it doesn't double-escape the sequences added below), then the double
		// quote and the control chars. Control chars are matched via CHR(...) rather
		// than literal bytes so the generated SQL (and its snapshots) stay clean ASCII
		// — a raw CR/newline in source is fragile across git autocrlf and formatters.
		const jsonStringEscapes: ReadonlyArray<readonly [find: string, replacement: string]> = [
			[`'\\'`, `'\\\\'`], // backslash        -> \\
			[`'"'`, `'\\"'`], //   double quote     -> \"
			['CHR(10)', `'\\n'`], // newline        -> \n
			['CHR(13)', `'\\r'`], // carriage return -> \r
			['CHR(9)', `'\\t'`] //   tab            -> \t
		];
		const escapedX = jsonStringEscapes.reduce(
			(expr, [find, replacement]) => `REPLACE(${expr}, ${find}, ${replacement})`,
			`CAST(${sortKey} AS TEXT)`
		);
		const tuple = `'["' || ${escapedX} || '",' || COALESCE(CAST(${valueKey} AS TEXT), 'null') || ']'`;
		return `'[' || STRING_AGG(${tuple}, ',' ORDER BY ${sortKey}) || ']'`;
	}

	readonly aggregationFunctions = new Set<string>([
		// General-purpose aggregates Cube documents.
		'COUNT',
		'SUM',
		'AVG',
		'MIN',
		'MAX',
		'STRING_AGG',
		'PERCENTILE_CONT',
		// Statistical aggregates Cube documents.
		'COVAR_POP',
		'COVAR_SAMP',
		'STDDEV_POP',
		'STDDEV_SAMP',
		'VAR_POP',
		'VAR_SAMP',
		// Cube-specific: MEASURE references a measure defined in the data model;
		// XIRR is Cube's custom financial aggregate.
		'MEASURE',
		'XIRR'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		// Conditional / null handling
		'CASE',
		'COALESCE',
		'NULLIF',
		'GREATEST',
		'LEAST',
		// Type / string
		'CAST',
		'CONCAT',
		'SUBSTRING',
		'TRIM',
		'BTRIM',
		'LTRIM',
		'RTRIM',
		'UPPER',
		'LOWER',
		'REPLACE',
		'LEFT',
		'RIGHT',
		'ASCII',
		'REPEAT',
		'STARTS_WITH',
		'POSITION',
		'CHAR_LENGTH',
		'CHARACTER_LENGTH',
		'BIT_LENGTH',
		'OCTET_LENGTH',
		'REGEXP_SUBSTR',
		'TO_CHAR',
		// Numeric
		'ABS',
		'CEIL',
		'FLOOR',
		'ROUND',
		'TRUNC',
		'SIGN',
		'SQRT',
		'EXP',
		'LN',
		'LOG',
		'LOG10',
		'POWER',
		'PI',
		'DEGREES',
		'RADIANS',
		// Trigonometric
		'ACOS',
		'ASIN',
		'ATAN',
		'ATAN2',
		'COS',
		'COT',
		'SIN',
		'TAN',
		// Date / time
		'DATE_ADD',
		'DATE_TRUNC',
		'DATEDIFF',
		'EXTRACT',
		'LOCALTIMESTAMP',
		'NOW',
		// Time-unit literals (used by EXTRACT / DATE_TRUNC / INTERVAL)
		'YEAR',
		'QUARTER',
		'MONTH',
		'WEEK',
		'DAY',
		'HOUR',
		'MINUTE',
		'SECOND'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		...COMMON_FUNCTION_TYPE_RULES,
		PERCENTILE_CONT: new Set(NUMERIC_RULE)
	};
}
