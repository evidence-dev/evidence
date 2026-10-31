import {
	COMMON_AGGREGATION_FUNCTIONS,
	COMMON_FUNCTION_TYPE_RULES,
	COMMON_NON_AGG_FUNCTIONS,
	NUMERIC_RULE,
	escapeRedshiftStringLiteral,
	type DialectFunctionTypeRule
} from './common';
import { PostgresDialect } from './postgres';

/**
 * Amazon Redshift dialect. Redshift forked from PostgreSQL 8.0.2 and speaks the
 * Postgres wire protocol, so this subclasses PostgresDialect and overrides only
 * where Redshift diverged (or never caught up):
 *  - **No JSON/array aggregates** (`JSON_AGG`, `JSON_BUILD_ARRAY`, `ARRAY_AGG`) —
 *    sparklines are built as a JSON string via `LISTAGG`, like Cube does with
 *    `STRING_AGG`.
 *  - **No `IS [NOT] DISTINCT FROM`** — expanded to a portable NULL-safe disjunction.
 *  - **No aggregate `FILTER (WHERE …)`** — conditional aggregates go through CASE.
 *  - **`TEXT` is `VARCHAR(256)`** — a bare TEXT cast silently truncates long
 *    values, so string casts target `VARCHAR(MAX)`.
 *  - **Date math is `DATEADD`**, not `n * INTERVAL '1 unit'` (Redshift's interval
 *    arithmetic is limited and `quarter` is a first-class DATEADD part).
 *  - **Backslash escapes in ordinary string literals** (PG 8.0 semantics; there is
 *    no `standard_conforming_strings`), so literals double backslashes.
 *  - Identifiers fold to lowercase — even quoted ones, unless the cluster enables
 *    `enable_case_sensitive_identifier` — so aliases are lowercased (inherited).
 */
export class RedshiftDialect extends PostgresDialect {
	readonly name = 'redshift';

	dateGrain(grain: string, column: string, firstDayOfWeek: 'sunday' | 'monday'): string {
		if (grain === 'week' && firstDayOfWeek === 'sunday') {
			// DATE_TRUNC('week') is ISO/Monday-start. Shift forward a day, truncate,
			// shift back — via DATEADD rather than the inherited INTERVAL arithmetic.
			return `DATEADD(day, -1, DATE_TRUNC('week', DATEADD(day, 1, ${column})))`;
		}
		return super.dateGrain(grain, column, firstDayOfWeek);
	}

	dateAdd(unit: string, amount: number | string, column: string): string {
		return `DATEADD(${unit.toLowerCase()}, ${amount}, ${column})`;
	}

	dateSub(unit: string, amount: number | string, column: string): string {
		const negated = typeof amount === 'number' ? -amount : `-(${amount})`;
		return `DATEADD(${unit.toLowerCase()}, ${negated}, ${column})`;
	}

	castToString(column: string): string {
		// Not TEXT: Redshift maps TEXT to VARCHAR(256) and truncates silently.
		return `CAST(${column} AS VARCHAR(MAX))`;
	}

	nullSafeEqual(a: string, b: string): string {
		return `((${a} IS NULL AND ${b} IS NULL) OR ${a} = ${b})`;
	}

	groupArray(sortKey: string, valueKey: string): string {
		// No JSON aggregates in Redshift: JSON-escape x by hand (backslash first), with
		// every SQL-literal backslash doubled since Redshift literals treat `\` as an escape.
		const jsonStringEscapes: ReadonlyArray<readonly [find: string, replacement: string]> = [
			[`'\\\\'`, `'\\\\\\\\'`],
			[`'"'`, `'\\\\"'`],
			['CHR(10)', `'\\\\n'`],
			['CHR(13)', `'\\\\r'`],
			['CHR(9)', `'\\\\t'`]
		];
		const escapedX = jsonStringEscapes.reduce(
			(expr, [find, replacement]) => `REPLACE(${expr}, ${find}, ${replacement})`,
			this.castToString(sortKey)
		);
		const tuple = `'["' || ${escapedX} || '",' || COALESCE(${this.castToString(valueKey)}, 'null') || ']'`;
		return `'[' || LISTAGG(${tuple}, ',') WITHIN GROUP (ORDER BY ${sortKey}) || ']'`;
	}

	// LISTAGG errors (not truncates) past 65,535 bytes; ~40 bytes per point leaves headroom.
	readonly sparklineMaxPoints = 1000;

	readonly supportsNestedCte = false;

	readonly supportsLateralAliases = true;

	// AWS r_AVG: "BIGINT for any integer type argument".
	readonly avgTruncatesIntegers = true;

	readonly escapesBackslashInStringLiterals = true;

	stringLiteralEscapesBackslash(_prefix: string): boolean {
		// Ordinary and E'…' literals alike honour backslash escapes (PG 8.0 semantics).
		return true;
	}

	escapeStringLiteral(value: string): string {
		return escapeRedshiftStringLiteral(value);
	}

	// No `agg(...) FILTER (WHERE ...)` in Redshift; the common layer emits CASE instead.
	readonly supportsFilterClause = false;

	readonly aggregationFunctions = new Set<string>([
		// Redshift has MEDIAN but no COVARIANCE / CORR.
		...COMMON_AGGREGATION_FUNCTIONS.filter((f) => f !== 'COVARIANCE' && f !== 'CORR'),
		'LISTAGG',
		'PERCENTILE_CONT',
		'PERCENTILE_DISC',
		'ANY_VALUE',
		'BOOL_AND',
		'BOOL_OR',
		'BIT_AND',
		'BIT_OR'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		// Redshift has NVL/NVL2/DECODE instead of IF/IFF/IFNULL.
		...COMMON_NON_AGG_FUNCTIONS.filter((f) => f !== 'IF' && f !== 'IFF' && f !== 'IFNULL'),
		'NVL',
		'NVL2',
		'DECODE',
		'GREATEST',
		'LEAST',
		// Date / time
		'DATE_PART',
		'DATE_PART_YEAR',
		'DATEADD',
		'DATE_CMP',
		'ADD_MONTHS',
		'MONTHS_BETWEEN',
		'LAST_DAY',
		'NEXT_DAY',
		'TRUNC',
		'GETDATE',
		'SYSDATE',
		'CONVERT_TIMEZONE',
		'TIMEZONE',
		'TO_CHAR',
		'TO_DATE',
		'TO_TIMESTAMP',
		'TO_NUMBER',
		// String
		'SPLIT_PART',
		'REGEXP_REPLACE',
		'REGEXP_SUBSTR',
		'REGEXP_COUNT',
		'REGEXP_INSTR',
		'POSITION',
		'CHARINDEX',
		'STRPOS',
		'CHAR_LENGTH',
		'CHARACTER_LENGTH',
		'LENGTH',
		'LEN',
		'LTRIM',
		'RTRIM',
		'BTRIM',
		'LPAD',
		'RPAD',
		'INITCAP',
		'TRANSLATE',
		'REVERSE',
		'REPEAT',
		'CHR',
		'ASCII',
		// Numeric
		'MOD',
		'LOG',
		// AWS lists LOG among leader-node-only functions; DLOG10/DLOG1 are the compute-safe forms.
		'DLOG10',
		'DLOG1',
		'LN',
		'EXP',
		'SIGN',
		'CBRT',
		'RANDOM',
		// JSON / SUPER
		'JSON_EXTRACT_PATH_TEXT',
		'JSON_EXTRACT_ARRAY_ELEMENT_TEXT',
		'JSON_ARRAY_LENGTH',
		'JSON_PARSE',
		'JSON_SERIALIZE',
		'IS_VALID_JSON',
		'CAN_JSON_PARSE'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		...COMMON_FUNCTION_TYPE_RULES,
		PERCENTILE_CONT: new Set(NUMERIC_RULE),
		PERCENTILE_DISC: new Set(NUMERIC_RULE)
	};
}
