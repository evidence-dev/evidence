import {
	COMMON_AGGREGATION_FUNCTIONS,
	COMMON_FUNCTION_TYPE_RULES,
	COMMON_NON_AGG_FUNCTIONS,
	NUMERIC_RULE,
	isSimpleIdentifier,
	pickUniqueWrapName,
	scanTopLevelClauses,
	stripLeadingIgnorable,
	escapeAnsiStringLiteral,
	type DialectFunctionTypeRule,
	type SqlDialect,
	NO_CONDITIONAL_AGGREGATES
} from './common';

/**
 * Microsoft Fabric Warehouse dialect (T-SQL / SQL Server TDS protocol).
 *
 * Fabric Warehouse speaks a *subset* of T-SQL. Notable structural differences
 * from the ClickHouse-family warehouses we otherwise target (ClickHouse,
 * Snowflake, BigQuery all share `LIMIT` / `GROUP BY ALL` semantics):
 *  - No `DATE_TRUNC`; Fabric supports `DATETRUNC(datepart, date)` (SQL Server
 *    2022+ / Fabric).
 *  - No `LIMIT` keyword. Row limiting is `OFFSET m ROWS FETCH NEXT n ROWS ONLY`,
 *    which *requires* an `ORDER BY` in the same query — see `rowLimitClause`.
 *  - No `GROUP BY ALL`, and (unlike Postgres/Snowflake/BigQuery) no ordinal
 *    `GROUP BY 1, 2` — those integers are read as constant expressions. So
 *    `groupByAll` groups by the actual non-aggregate expressions.
 *  - No array type, so sparkline `groupArray` returns a JSON-array *string*
 *    (like BigQuery) that the row layer must JSON.parse back into tuples.
 *  - No `ILIKE` and no reliable `IS NOT DISTINCT FROM`; both are emulated.
 *  - Date formatting uses .NET format strings via `FORMAT(value, 'fmt')`.
 */
export class FabricDialect implements SqlDialect {
	readonly name = 'fabric';

	dateGrain(grain: string, column: string, _firstDayOfWeek: 'sunday' | 'monday'): string {
		// NOTE on week handling: T-SQL's week boundary (DATETRUNC(week, ...),
		// DATEPART(weekday, ...), DATEPART(week, ...)) is governed by the session
		// `SET DATEFIRST` setting, which we do NOT set here (default for us-english
		// logins is 7 = Sunday). We therefore ignore `firstDayOfWeek` rather than
		// emit incorrect SQL — Fabric has no per-call first-day-of-week argument the
		// way ClickHouse's toStartOfWeek(col, mode) does. Sunday-first matches the
		// product default.
		switch (grain) {
			case 'day':
				return `DATETRUNC(day, ${column})`;
			case 'week':
				return `DATETRUNC(week, ${column})`;
			case 'month':
				return `DATETRUNC(month, ${column})`;
			case 'quarter':
				return `DATETRUNC(quarter, ${column})`;
			case 'year':
				return `DATETRUNC(year, ${column})`;
			case 'hour':
				return `DATETRUNC(hour, ${column})`;
			case 'day of week':
				return `DATEPART(weekday, ${column})`;
			case 'day of month':
				return `DAY(${column})`;
			case 'day of year':
				return `DATEPART(dayofyear, ${column})`;
			case 'week of year':
				return `DATEPART(week, ${column})`;
			case 'month of year':
				return `MONTH(${column})`;
			case 'quarter of year':
				return `DATEPART(quarter, ${column})`;
			default:
				return column;
		}
	}

	dateAdd(unit: string, amount: number | string, column: string): string {
		// T-SQL DATEADD takes a bare datepart keyword (not a quoted string).
		return `DATEADD(${unit.toLowerCase()}, ${amount}, ${column})`;
	}

	dateSub(unit: string, amount: number | string, column: string): string {
		// No DATESUB in T-SQL — negate the amount and reuse DATEADD, mirroring the
		// Snowflake dialect's approach.
		const negated = typeof amount === 'number' ? -amount : `-${amount}`;
		return `DATEADD(${unit.toLowerCase()}, ${negated}, ${column})`;
	}

	shortDateLabel(column: string): string {
		// .NET custom format string. "MMM" = abbreviated month (Jan), "d" =
		// day-of-month with no leading zero, "yy" = 2-digit year — the "Jan 3/25"
		// shape the other dialects produce. The culture is pinned to 'en-US' so the
		// "/" renders as a literal slash (it's a culture-sensitive date separator
		// otherwise) and the month abbreviation is stable regardless of the Fabric
		// login's language setting.
		return `FORMAT(${column}, 'MMM d/yy', 'en-US')`;
	}

	dateLiteral(isoDate: string): string {
		// CAST is the most portable typed-date literal in Fabric T-SQL.
		return `CAST('${isoDate}' AS DATE)`;
	}

	castToString(column: string): string {
		// VARCHAR(MAX) avoids silent truncation at the default length.
		return `CAST(${column} AS VARCHAR(MAX))`;
	}

	countDistinct(column: string): string {
		return `COUNT(DISTINCT ${column})`;
	}

	limitOffset(limit: number, offset?: number): string {
		// Retained for interface compatibility (the query builder goes through
		// `rowLimitClause`). T-SQL has no LIMIT; OFFSET/FETCH requires an ORDER BY,
		// so we emit a synthetic `ORDER BY (SELECT NULL)` to keep the clause valid
		// standalone rather than leaving a syntax-error trap for any caller.
		const off = offset ?? 0;
		return `ORDER BY (SELECT NULL) OFFSET ${off} ROWS FETCH NEXT ${limit} ROWS ONLY`;
	}

	applyRowLimit(sql: string, limit: number): string {
		const trimmed = sql.trim().replace(/;+$/, '');
		// Strategy — always enforce `limit`, regardless of any inner cap the
		// caller wrote (an AI-authored `SELECT TOP 1_000_000 …` must still be
		// bounded). Four T-SQL rules make this non-trivial:
		//   (1) A leading CTE (`WITH …`) is not a valid derived-table body,
		//       and nested `WITH` inside a subquery/CTE body is also invalid.
		//   (2) A bare `ORDER BY` inside a derived table or CTE body requires
		//       an accompanying `TOP` / `OFFSET` / `FETCH` on the same SELECT.
		//   (3) `TOP` and `OFFSET/FETCH` cannot both appear on one SELECT.
		//   (4) Statement-suffix clauses (`OPTION (…)`, `FOR JSON …`,
		//       `FOR XML …`) are legal only on the outermost SELECT — they're
		//       rejected inside a derived table or CTE body.
		//
		// So we pick from three enforcement shapes based on the tail's
		// structural clauses (paren/string/comment-aware — see
		// `scanTopLevelClauses`), and hoist any statement suffix onto the
		// outer wrap SELECT rather than letting it ride into the wrapping
		// subquery/CTE body:
		//   - **Derived-table wrap** (non-CTE, safe body): `SELECT TOP N *
		//     FROM (body) AS __ev_limit_wrap [suffix]`. Outer TOP clamps.
		//   - **CTE stack** (CTE query, safe tail body): extend the caller's
		//     `WITH` list with our own wrap CTE — `WITH …, __ev_limit_wrap
		//     AS (tail-body) SELECT TOP N * FROM __ev_limit_wrap [suffix]`.
		//     Same clamp behaviour, sidesteps (1) by staying inside the WITH.
		//   - **Append** (tail has a bare ORDER BY with no row-limiter):
		//     `body OFFSET 0 ROWS FETCH NEXT N ROWS ONLY [suffix]`. Wrap would
		//     violate rule (2); the tail has no TOP/FETCH so rule (3) is fine.
		const startsWithCte = /^with\s+/i.test(stripLeadingIgnorable(trimmed));
		const { hasOrderBy, hasTop, hasFetch, tailSelectStart, statementSuffixStart } =
			scanTopLevelClauses(trimmed);
		const tailHasRowLimiter = hasTop || hasFetch;
		const wrapIsSafe = tailHasRowLimiter || !hasOrderBy;
		const bodyEnd = statementSuffixStart === -1 ? trimmed.length : statementSuffixStart;
		const body = trimmed.slice(0, bodyEnd).replace(/\s+$/, '');
		const suffix = statementSuffixStart === -1 ? '' : '\n' + trimmed.slice(statementSuffixStart);
		// `\n` before every wrap-close paren and every appended clause. A
		// caller SQL that ends in a `-- line comment` would otherwise absorb
		// our structural additions into the comment — the `-- ` extends to
		// end of line, so `) AS __ev_wrap` or `OFFSET 0 ROWS FETCH …` sitting
		// on that same line silently disappears and the warehouse executes
		// the unbounded original query.

		const wrapName = pickUniqueWrapName(trimmed);
		if (wrapIsSafe && !startsWithCte) {
			return `SELECT TOP ${limit} * FROM (${body}\n) AS ${wrapName}${suffix}`;
		}
		if (wrapIsSafe && startsWithCte && tailSelectStart > 0) {
			const prefix = body.slice(0, tailSelectStart).replace(/\s+$/, '');
			const tailBody = body.slice(tailSelectStart);
			return `${prefix}, ${wrapName} AS (${tailBody}\n) SELECT TOP ${limit} * FROM ${wrapName}${suffix}`;
		}
		// Append path. Reached only when the tail has a bare ORDER BY without a
		// row-limiter — so no TOP/FETCH to conflict with the appended clause,
		// and the caller's ORDER BY satisfies FETCH's ORDER-BY requirement.
		return `${body}\nOFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY${suffix}`;
	}

	rowLimitClause({
		limit,
		offset,
		hasOrderBy
	}: {
		limit?: number;
		offset?: number;
		hasOrderBy: boolean;
	}): string {
		if (limit === undefined && offset === undefined) return '';
		// OFFSET/FETCH is only legal with an ORDER BY. Synthesise a stable no-op
		// ordering when the query doesn't already have one. `(SELECT NULL)` is the
		// canonical T-SQL idiom for "don't actually order, I just need paging".
		const orderBy = hasOrderBy ? '' : 'ORDER BY (SELECT NULL) ';
		const off = offset ?? 0;
		let clause = `OFFSET ${off} ROWS`;
		if (limit !== undefined) clause += ` FETCH NEXT ${limit} ROWS ONLY`;
		return `${orderBy}${clause}`;
	}

	groupByAll(groupingExpressions: string[]): string {
		// Fabric T-SQL has no `GROUP BY ALL`, and ordinal `GROUP BY 1, 2` does NOT
		// reference select positions in T-SQL (they are read as integer constants).
		// Group by the actual non-aggregate expressions instead. Dedupe so repeated
		// dimensions don't produce a redundant (and in some engines illegal) list.
		const unique = [...new Set(groupingExpressions.filter((e) => e && e.trim().length > 0))];
		if (unique.length === 0) return '';
		return `GROUP BY ${unique.join(', ')}`;
	}

	anyValue(expr: string): string {
		// T-SQL has no ANY_VALUE; MAX picks a single deterministic value per group,
		// which is what these single-value-per-group helper columns need.
		return `MAX(${expr})`;
	}

	groupArray(sortKey: string, valueKey: string): string {
		// Fabric has no array type. Build a JSON-array-of-arrays *string* per group
		// — the same wire shape as the BigQuery dialect — so the row layer can
		// JSON.parse it back into `[[x, y], ...]` tuples (see
		// normalize-sparkline-rows). The x value (a date or label) is quoted as a
		// JSON string to match BigQuery's JSON_ARRAY rendering (sparkline x-axes are
		// dates/categories), and the y value (an aggregate, always numeric) is
		// emitted bare with an explicit JSON `null` fallback. Each element is cast
		// to VARCHAR(MAX) so STRING_AGG doesn't hit the implicit VARCHAR(8000) cap.
		const tuple = `CONCAT('["', CAST(${sortKey} AS VARCHAR(MAX)), '",', ISNULL(CAST(${valueKey} AS VARCHAR(MAX)), 'null'), ']')`;
		return `CONCAT('[', STRING_AGG(${tuple}, ',') WITHIN GROUP (ORDER BY ${sortKey}), ']')`;
	}

	formatAlias(alias: string): string {
		// T-SQL identifiers are case-insensitive. Lowercase to match the
		// ClickHouse/BigQuery convention and INFORMATION_SCHEMA lookups, rather than
		// Snowflake's uppercase folding.
		return alias.toLowerCase();
	}

	quoteAlias(alias: string): string {
		// Double-quote identifier quoting is ANSI and valid in Fabric when
		// QUOTED_IDENTIFIER is ON (the default). Escape embedded quotes by doubling.
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
		// Fabric T-SQL does not reliably support `IS NOT DISTINCT FROM`, so expand
		// to an explicit NULL-safe disjunction (same as BigQuery).
		return `((${a} IS NULL AND ${b} IS NULL) OR ${a} = ${b})`;
	}

	iff(cond: string, a: string, b: string): string {
		// T-SQL's conditional expression is IIF (two i's), not IFF.
		return `IIF(${cond}, ${a}, ${b})`;
	}

	concat(parts: string[]): string {
		// T-SQL has no `||` string operator — use CONCAT (which also null-coalesces
		// each argument to an empty string, matching the lenient `||` behaviour).
		return `CONCAT(${parts.join(', ')})`;
	}

	caseInsensitiveLike(column: string, pattern: string): string {
		// No ILIKE in T-SQL. Lowercase both sides for a collation-independent
		// case-insensitive match.
		return `LOWER(${column}) LIKE LOWER('${pattern}')`;
	}

	readonly caseInsensitiveIdentifiers = true;
	readonly supportsFilterClause = false;
	readonly conditionalAggregateFunctions = NO_CONDITIONAL_AGGREGATES;
	readonly strictDerivedTables = true;
	readonly supportsGroupingSets = true;
	readonly supportsDateOffsetMath = true;

	readonly aggregationFunctions = new Set<string>([
		...COMMON_AGGREGATION_FUNCTIONS,
		// Fabric / T-SQL-specific aggregations
		'STRING_AGG',
		'APPROX_COUNT_DISTINCT',
		'STDEV',
		'STDEVP',
		'VAR',
		'VARP',
		'CHECKSUM_AGG',
		'GROUPING'
	]);

	readonly nonAggregationFunctions = new Set<string>([
		...COMMON_NON_AGG_FUNCTIONS,
		// Fabric / T-SQL date/time functions
		'DATEADD',
		'DATEDIFF',
		'DATEPART',
		'DATENAME',
		'DATETRUNC',
		'DAY',
		'GETDATE',
		'GETUTCDATE',
		'SYSDATETIME',
		'EOMONTH',
		'DATEFROMPARTS',
		'DATETIMEFROMPARTS',
		'FORMAT',
		'CONVERT',
		// String / type
		'TRY_CAST',
		'TRY_CONVERT',
		'LEN',
		'CHARINDEX',
		'PATINDEX',
		'STUFF',
		'STR',
		'STRING_SPLIT',
		'ISNULL',
		// Conditional helpers
		'IIF',
		'CHOOSE',
		// JSON
		'JSON_VALUE',
		'JSON_QUERY',
		'ISJSON'
	]);

	readonly functionTypeRules: Readonly<Record<string, ReadonlySet<DialectFunctionTypeRule>>> = {
		...COMMON_FUNCTION_TYPE_RULES,
		STDEV: new Set(NUMERIC_RULE),
		STDEVP: new Set(NUMERIC_RULE),
		VAR: new Set(NUMERIC_RULE),
		VARP: new Set(NUMERIC_RULE)
	};
}
