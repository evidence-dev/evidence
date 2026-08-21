import { getDateRangeShorthand } from './date-options';
import { getDateGrainSql } from './date-options';
import { isTemporalDateGrain } from './date-options';
import { processDateRange } from './date-options';
import type { DateRangeObject } from './date-options';
import { generateComparisonId } from './build-comparisons';
import { generateSparklineId } from './build-sparklines';
import formatTitle from '../formatTitle';
import type { SqlDialect } from '../../sql-dialect';
import { defaultDialect } from '../../sql-dialect';

/**
 * Check if a column string already has an alias
 */
export function hasAlias(column: string): boolean {
	if (!column || typeof column !== 'string') {
		return false;
	}

	// Check for alias pattern outside of parentheses (reusing logic from sql-options.ts)
	let simplified = '';
	let parenLevel = 0;

	for (let i = 0; i < column.length; i++) {
		const char = column[i];
		if (char === '(') {
			parenLevel++;
			simplified += char;
		} else if (char === ')') {
			parenLevel--;
			simplified += char;
		} else if (parenLevel === 0) {
			simplified += char;
		} else {
			simplified += ' ';
		}
	}

	return /\s+as\s+/i.test(simplified);
}

/**
 * Extract the base expression (everything before "AS")
 */
export function extractBaseExpression(column: string): string {
	if (!hasAlias(column)) {
		return column;
	}

	// Find "AS" outside of parentheses
	let simplified = '';
	let parenLevel = 0;

	for (let i = 0; i < column.length; i++) {
		const char = column[i];
		if (char === '(') {
			parenLevel++;
			simplified += char;
		} else if (char === ')') {
			parenLevel--;
			simplified += char;
		} else if (parenLevel === 0) {
			simplified += char;
		} else {
			simplified += ' ';
		}
	}

	const asIndex = simplified.toLowerCase().indexOf(' as ');
	if (asIndex > 0) {
		return column.substring(0, asIndex).trim();
	}

	return column;
}

/**
 * Generate structured alias from base value and optional date range
 */
export function generateStructuredAlias(baseValue: string, dateRange?: string): string {
	// Start with a cleaned version of the base value
	let alias = baseValue
		?.toLowerCase() // Convert to lowercase for consistent naming
		.replace(/[()]/g, '_') // Replace parentheses with underscores
		.replace(/[^a-zA-Z0-9_]/g, '_') // Replace other special chars with underscores
		.replace(/_+/g, '_') // Collapse multiple underscores
		.replace(/^_|_$/g, ''); // Remove leading/trailing underscores

	// Add date range shorthand if present
	if (dateRange && dateRange !== 'all time' && alias) {
		alias += '__' + getDateRangeShorthand(dateRange);
	}

	return alias;
}

/**
 * Detect if a SQL expression contains aggregation functions.
 *
 * Pass `dialect` whenever you have one — the dialect's `aggregationFunctions`
 * set is the source of truth (e.g. BigQuery's `COUNTIF`, `LOGICAL_AND`,
 * `APPROX_QUANTILES` are unknown to other dialects). Validators that run
 * without a dialect context fall back to a permissive union list.
 */
export function hasAgg(sqlExpression: string, dialect?: SqlDialect): boolean {
	if (!sqlExpression || typeof sqlExpression !== 'string') {
		return false;
	}

	// Remove any alias part (everything after " AS ")
	const expressionWithoutAlias = sqlExpression.split(/\s+as\s+/i)[0].trim();

	const aggFunctions = dialect ? Array.from(dialect.aggregationFunctions) : FALLBACK_AGG_FUNCTIONS;

	// Match function_name immediately followed by `(`. Function names contain
	// underscores, so use [A-Z_]+ rather than \\b which won't match `_(`.
	const aggPattern = new RegExp(`(?:^|[^A-Za-z0-9_])(${aggFunctions.join('|')})\\s*\\(`, 'i');

	return aggPattern.test(expressionWithoutAlias);
}

/** Permissive union of aggregation names across the warehouses we target. */
const FALLBACK_AGG_FUNCTIONS = [
	'SUM',
	'AVG',
	'COUNT',
	'MIN',
	'MAX',
	'MEDIAN',
	'MODE',
	'STDDEV',
	'STDDEV_POP',
	'STDDEV_SAMP',
	'VARIANCE',
	'VAR_POP',
	'VAR_SAMP',
	'ARRAY_AGG',
	'ARRAY_CONCAT_AGG',
	'GROUP_CONCAT',
	'STRING_AGG',
	'FIRST',
	'LAST',
	'ANY',
	'SOME',
	'EVERY',
	'ANY_VALUE',
	// ClickHouse: value of col A at the max/min of col B — idiomatic for
	// "latest value" as an aggregate; must not false-flag as non-aggregate.
	'ARGMAX',
	'ARGMIN',
	'ANYLAST',
	'PERCENTILE',
	'PERCENTILE_CONT',
	'PERCENTILE_DISC',
	'QUANTILE',
	'QUANTILETDIGEST',
	'APPROX_QUANTILES',
	'CORR',
	'COVAR_POP',
	'COVAR_SAMP',
	'COVARIANCE',
	'SKEWSAMP',
	'ARRAYAVG',
	'ARRAYSUM',
	'ARRAYMIN',
	'ARRAYMAX',
	'ARRAYCOUNT',
	// ClickHouse -If combinators, mirroring its dialect set.
	'SUMIF',
	'AVGIF',
	'MINIF',
	'MAXIF',
	'ANYIF',
	// BigQuery-specific aggregations the validator must still recognise as aggs:
	'COUNTIF',
	'LOGICAL_AND',
	'LOGICAL_OR',
	'BIT_AND',
	'BIT_OR',
	'BIT_XOR',
	'APPROX_COUNT_DISTINCT',
	'APPROX_TOP_COUNT',
	// Cube: MEASURE() resolves a pre-defined measure and is itself the aggregate.
	'MEASURE',
	'XIRR'
];

/**
 * Push a WHERE predicate into every aggregate call in `expression`.
 *
 * Dialects with `supportsFilterClause` (ClickHouse) emit per-aggregate
 * `FILTER (WHERE …)` clauses. Others (Snowflake, BigQuery) rewrite each
 * `agg(args)` as `agg(CASE WHEN <cond> THEN args END)` since they lack
 * FILTER support. Both strategies distribute the predicate across every
 * aggregate in compound expressions like `sum(a) / nullif(sum(b), 0)`.
 */
export function applyAggregateFilter(
	expression: string,
	whereClause: string,
	dialect: SqlDialect
): string {
	const aggNames = dialect.aggregationFunctions;
	let result = '';
	let i = 0;
	let rewroteAny = false;

	while (i < expression.length) {
		const ch = expression[i];

		// Skip string literals untouched.
		if (ch === "'" || ch === '"' || ch === '`') {
			const end = findStringEnd(expression, i);
			result += expression.slice(i, end + 1);
			i = end + 1;
			continue;
		}

		// Try to match an identifier followed by '('.
		if (isIdentStart(ch)) {
			let j = i;
			while (j < expression.length && isIdentPart(expression[j])) j++;
			const name = expression.slice(i, j);
			// Skip whitespace between name and `(`.
			let k = j;
			while (k < expression.length && /\s/.test(expression[k])) k++;
			const isCall = expression[k] === '(';
			const isAgg = isCall && aggNames.has(name.toUpperCase());
			// Require not preceded by an identifier char (avoid matching the tail
			// of `my_sum(` etc.). Our loop only enters this branch on an ident-start
			// char, but the previous char in `result` could still be an ident part
			// if the expression has no whitespace — guard against that.
			const prev = i > 0 ? expression[i - 1] : '';
			const prevIsIdent = prev !== '' && isIdentPart(prev);

			if (isAgg && !prevIsIdent) {
				const end = findMatchingParen(expression, k);
				const args = expression.slice(k + 1, end);
				const foldsPredicate =
					dialect.conditionalAggregateFunctions.has(name.toUpperCase()) && args.trim() !== '';
				if (foldsPredicate) {
					// The aggregate's last argument IS its condition, so AND the predicate into
					// it — a FILTER here would be a nested identical combinator, which fails.
					const parts = splitTopLevelCommas(args);
					const last = parts.length - 1;
					parts[last] = `(${parts[last].trim()}) AND (${whereClause})`;
					result += expression.slice(i, k + 1) + parts.join(', ') + ')';
				} else if (dialect.supportsFilterClause) {
					result += expression.slice(i, end + 1) + ` FILTER (WHERE ${whereClause})`;
				} else {
					const inner = expression.slice(k + 1, end);
					const rewrittenInner = rewriteAggArgs(inner, whereClause, dialect);
					result += expression.slice(i, k + 1) + rewrittenInner + ')';
				}
				i = end + 1;
				rewroteAny = true;
				continue;
			}

			result += name;
			i = j;
			continue;
		}

		result += ch;
		i++;
	}

	if (rewroteAny) {
		return result;
	}

	// No aggregate found — wrap the whole expression. Rare in measure context
	// (measures normally aggregate) but keeps semantics defined.
	return `CASE WHEN ${whereClause} THEN ${expression} END`;
}

function rewriteAggArgs(args: string, whereClause: string, dialect: SqlDialect): string {
	const trimmed = args.trim();
	if (trimmed === '') {
		return args;
	}

	// `count(*)` → `count(CASE WHEN cond THEN 1 END)`.
	if (trimmed === '*') {
		return `CASE WHEN ${whereClause} THEN 1 END`;
	}

	// Preserve leading DISTINCT / ALL quantifier.
	let prefix = '';
	let body = trimmed;
	const quantifierMatch = /^(distinct|all)\s+/i.exec(body);
	if (quantifierMatch) {
		prefix = quantifierMatch[0];
		body = body.slice(prefix.length);
	}

	// Split on top-level commas (multi-arg aggregates like corr(x, y)).
	const parts = splitTopLevelCommas(body);
	const wrapped = parts.map((p) => {
		const t = p.trim();
		if (t === '') return p;
		// Recurse so nested aggregates inside an aggregate (rare) also get the
		// predicate distributed. `applyAggregateFilter` always returns a string
		// distinct from its input — either rewritten aggregates or the CASE WHEN
		// fallback — so no equality check is needed.
		return applyAggregateFilter(t, whereClause, dialect);
	});
	return `${prefix}${wrapped.join(', ')}`;
}

function splitTopLevelCommas(s: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < s.length; i++) {
		const ch = s[i];
		if (ch === "'" || ch === '"' || ch === '`') {
			i = findStringEnd(s, i);
			continue;
		}
		if (ch === '(') depth++;
		else if (ch === ')') depth--;
		else if (ch === ',' && depth === 0) {
			parts.push(s.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(s.slice(start));
	return parts;
}

function findStringEnd(s: string, start: number): number {
	const quote = s[start];
	let i = start + 1;
	while (i < s.length) {
		const ch = s[i];
		if (ch === '\\' && i + 1 < s.length) {
			i += 2;
			continue;
		}
		// Doubled-quote escape (e.g. 'it''s').
		if (ch === quote && s[i + 1] === quote) {
			i += 2;
			continue;
		}
		if (ch === quote) return i;
		i++;
	}
	return s.length - 1;
}

function findMatchingParen(s: string, openIdx: number): number {
	let depth = 0;
	for (let i = openIdx; i < s.length; i++) {
		const ch = s[i];
		if (ch === "'" || ch === '"' || ch === '`') {
			i = findStringEnd(s, i);
			continue;
		}
		if (ch === '(') depth++;
		else if (ch === ')') {
			depth--;
			if (depth === 0) return i;
		}
	}
	return s.length - 1;
}

function isIdentStart(ch: string | undefined): boolean {
	return !!ch && /[A-Za-z_]/.test(ch);
}

function isIdentPart(ch: string | undefined): boolean {
	return !!ch && /[A-Za-z0-9_]/.test(ch);
}

/**
 * Helper function to simplify a string by replacing content inside parentheses with spaces
 * while preserving the outer structure
 */
export function simplifyOutsideParentheses(str: string): string {
	let simplified = '';
	let parenLevel = 0;

	for (let i = 0; i < str.length; i++) {
		const char = str[i];
		if (char === '(') {
			parenLevel++;
			simplified += char;
		} else if (char === ')') {
			parenLevel--;
			simplified += char;
		} else if (parenLevel === 0) {
			simplified += char;
		} else {
			// Replace content inside parentheses with spaces
			simplified += ' ';
		}
	}

	return simplified;
}

/**
 * Cleans a column expression by removing existing aliases and FILTER clauses
 */
export function cleanColumnExpression(column: string): string {
	let cleanColumn = column;

	// First remove any existing alias
	if (hasAlias(cleanColumn)) {
		const simplified = simplifyOutsideParentheses(cleanColumn);
		const asIndex = simplified.toLowerCase().indexOf(' as ');
		if (asIndex > 0) {
			cleanColumn = cleanColumn.substring(0, asIndex).trim();
		}
	}

	// Then remove FILTER clause if present
	const hasFilterClause = /FILTER\s*\(/i.test(cleanColumn);
	if (hasFilterClause) {
		const filterIndex = cleanColumn.search(/\s+FILTER\s*\(/i);
		if (filterIndex !== -1) {
			cleanColumn = cleanColumn.substring(0, filterIndex).trim();
		}
	}

	return cleanColumn;
}

/**
 * Extracts the alias from a SQL column expression (everything after "AS")
 * @param column - The column string to extract alias from
 * @returns The alias if present, otherwise the original column name
 */
export function extractColumnAlias(column: string): string {
	if (!column || typeof column !== 'string') {
		return column || '';
	}
	if (!hasAlias(column)) {
		return column;
	}

	// Get the alias part by finding 'as' outside of parentheses
	const simplified = simplifyOutsideParentheses(column);

	// Find position of ' as ' (case insensitive)
	const asMatch = simplified.match(/\s+as\s+/i);
	if (!asMatch || asMatch.index === undefined) {
		return column;
	}

	// Extract from ORIGINAL string using the position found in simplified
	const afterAs = column.substring(asMatch.index + asMatch[0].length).trim();

	// Check if alias is quoted (starts with ", ', or `)
	const firstChar = afterAs[0];
	if (firstChar === '"' || firstChar === "'" || firstChar === '`') {
		// Find the matching closing quote in the original string
		const closeIndex = afterAs.indexOf(firstChar, 1);
		if (closeIndex > 0) {
			// Return the content between quotes (without the quotes)
			return afterAs.substring(1, closeIndex);
		}
	}

	// Unquoted alias - take until whitespace, comma, or parenthesis
	const unquotedMatch = afterAs.match(/^([^\s,()]+)/);
	if (unquotedMatch && unquotedMatch[1]) {
		return unquotedMatch[1];
	}

	return column;
}

/**
 * Cleans a SQL expression to create a valid identifier
 * Normalizes to lowercase and converts special characters to underscores
 */
export function cleanIdentifier(expression: string): string {
	// Remove extra whitespace and normalize to lowercase
	let cleaned = expression
		.replace(/[ \t]+/g, ' ')
		.trim()
		.toLowerCase();

	// Replace common SQL operators and punctuation with underscores
	cleaned = cleaned
		.replace(/[(),'"]/g, ' ') // Remove parentheses, quotes
		.replace(/[ \t]+/g, '_') // Replace spaces with underscores
		.replace(/[^a-zA-Z0-9_]/g, '_') // Replace other special chars with underscores
		.replace(/_+/g, '_') // Collapse multiple underscores
		.replace(/^_|_$/g, ''); // Remove leading/trailing underscores

	return cleaned || 'column'; // Fallback if something goes wrong
}

/**
 * Detect if a SQL expression is complex (requires subquery wrapping for subtotals)
 */
export function isComplexSqlExpression(expression: string): boolean {
	if (!expression) {
		return false;
	}
	return (
		expression.includes('(') ||
		expression.toLowerCase().includes('case ') ||
		expression.includes('||') ||
		expression.includes(' + ') ||
		expression.includes(' - ') ||
		expression.includes(' * ') ||
		expression.includes(' / ')
	);
}

export interface ColumnTransformationOptions {
	/** The raw user input value */
	value: string;
	/** Type of column for categorization purposes */
	type?: 'dimension' | 'measure' | 'pivot' | 'comparison' | 'col';
	/** Date grain transformation (e.g., 'month', 'day') */
	dateGrain?: string;
	/** Date range filtering for measures */
	dateRange?: DateRangeObject;
	/** Whether this is a table-level sparkline */
	isTableSparkline?: boolean;
	/** Whether this is a table-level comparison */
	isTableComparison?: boolean;
	/** Comparison type (e.g., 'prior year', 'prior period', 'target') */
	comparisonType?: string;
	/** First day of week for date grain calculations */
	firstDayOfWeek?: 'sunday' | 'monday';
	/** Anchor date for resolving date ranges (if not provided, uses placeholder) */
	anchorDate?: Date;
}

export interface ProcessedColumnExpression {
	/** Complete SQL expression with alias (for SELECT clause) */
	sqlWithAlias: string;
	/** Final alias (user-provided or generated) */
	alias: string;
	/** SQL expression without alias (for GROUP BY/GROUPING SETS) */
	sqlWithoutAlias: string;
	/** SQL expression without date filters (for comparisons that need base expression) */
	sqlWithoutDateFiltersOrAlias: string;
	/** Type of column for categorization purposes */
	type: 'dimension' | 'measure' | 'pivot' | 'comparison' | 'col';
	/** Whether this is a complex expression requiring subquery wrapping for subtotals */
	isComplexExpression: boolean;
	/** Whether this expression contains aggregation functions */
	hasAgg: boolean;
	/** Whether the date grain should be treated as temporal for comparison logic */
	isTemporalDateGrain: boolean;
	/** Whether date grain transformation was applied */
	hasDateGrain: boolean;
	/** The date grain used for transformation (if any) */
	dateGrain?: string;
	/** Whether date range transformation was applied */
	hasDateRange: boolean;
	/** Original date range for reprocessing (if any) */
	dateRange?: DateRangeObject;
	/** Whether this is a table-level comparison */
	isTableComparison: boolean;
	/** Whether this is a table-level sparkline */
	isTableSparkline: boolean;
	/** Whether the alias was explicitly provided by the user via AS clause */
	isUserProvidedAlias?: boolean;
	/** Formatted display title (preserves user-provided aliases, formats generated ones) */
	displayAlias: string;
}

/**
 * Processes a column expression through various transformations while maintaining
 * consistent alias handling. This function can be used by all component types.
 *
 * @param options - Configuration for processing the column expression
 * @returns Object containing all processed expressions and metadata
 */
export function processColumnExpression(
	options: ColumnTransformationOptions,
	dialect: SqlDialect = defaultDialect
): ProcessedColumnExpression {
	const {
		value,
		type = 'col',
		dateGrain,
		dateRange,
		isTableSparkline,
		isTableComparison,
		comparisonType,
		firstDayOfWeek = 'sunday',
		anchorDate
	} = options;

	// Guard against a nullish/empty value. This happens when an attribute fails
	// to resolve — e.g. an unquoted aggregate like `y=sum(x)` that Markdoc treats
	// as an undefined function and resolves to `undefined`. Returning safe empties
	// keeps the derivation from throwing (which would blow up the whole component
	// via the error boundary); the surfaced validation error is what the user sees.
	if (!value) {
		return {
			sqlWithAlias: '',
			alias: '',
			sqlWithoutAlias: '',
			sqlWithoutDateFiltersOrAlias: '',
			type,
			isComplexExpression: false,
			isTemporalDateGrain: false,
			hasAgg: false,
			hasDateGrain: false,
			hasDateRange: false,
			isTableComparison: !!isTableComparison,
			isTableSparkline: !!isTableSparkline,
			isUserProvidedAlias: false,
			displayAlias: ''
		};
	}

	// Step 1: Parse user input
	const baseExpression = extractBaseExpression(value);
	const userProvidedAlias = hasAlias(value) ? extractColumnAlias(value) : null;
	let alias = userProvidedAlias || generateStructuredAlias(value);

	// Step 2: Apply transformations
	let transformedExpression = baseExpression;
	let hasDateGrain = false;
	let hasDateRange = false;

	// Apply date grain transformation (for dimensions/pivots)
	if (dateGrain) {
		transformedExpression = getDateGrainSql(
			dateGrain,
			transformedExpression,
			firstDayOfWeek,
			dialect
		);
		hasDateGrain = true;

		// Update alias if user didn't provide one
		if (!userProvidedAlias) {
			alias = generateStructuredAlias(value, dateGrain);
		}
	}

	// Capture expression without date filters (for comparisons)
	const sqlWithoutDateFiltersOrAlias = transformedExpression;

	// Apply date range filtering (for measures)
	if (dateRange && dateRange.range !== 'all time') {
		hasDateRange = true;
		if (!userProvidedAlias) {
			alias = generateStructuredAlias(value, dateRange.range);
		}

		// Generate the actual FILTER clause
		if (!anchorDate) {
			throw new Error(
				`Unable to apply date range filter "${dateRange.range}". Please check your default date range end in your project settings.`
			);
		}
		if (!dateRange.date) {
			throw new Error(
				`Date range filter "${dateRange.range}" requires a date column to be specified.`
			);
		}

		const processed = processDateRange(
			dateRange.range,
			dateRange.date,
			anchorDate,
			firstDayOfWeek,
			dialect
		);
		transformedExpression = applyAggregateFilter(
			transformedExpression,
			processed.whereClause,
			dialect
		);
	}

	// Step 3: Handle special alias generation for comparisons and sparklines (after transformations)
	// Always generate unique aliases for comparisons and sparklines to prevent SQL column conflicts
	if (isTableComparison && comparisonType) {
		// Generate fragment ID for comparison using proper comparison logic
		alias = generateComparisonId(alias, comparisonType);
	} else if (isTableSparkline) {
		// Generate fragment ID for sparkline using proper sparkline logic
		alias = generateSparklineId(alias);
	}

	// Step 4: Format alias for dialect (uppercase for Snowflake, unchanged for ClickHouse)
	const displayName = alias;
	if (!userProvidedAlias) {
		alias = dialect.formatAlias(alias);
	}

	// Step 5: Assemble final SQL (quote alias via the dialect — `"..."` works
	// in CH/Snowflake but is a string literal in BigQuery, which uses backticks).
	const sqlExpression = `${transformedExpression} AS ${dialect.quoteAlias(alias)}`;

	return {
		sqlWithAlias: sqlExpression,
		alias,
		sqlWithoutAlias: transformedExpression,
		sqlWithoutDateFiltersOrAlias,
		type,
		isComplexExpression: isComplexSqlExpression(baseExpression),
		isTemporalDateGrain: isTemporalDateGrain(dateGrain),
		hasAgg: hasAgg(baseExpression, dialect),
		hasDateGrain,
		hasDateRange,
		dateRange,
		isTableComparison: !!isTableComparison,
		isTableSparkline: !!isTableSparkline,
		dateGrain: dateGrain,
		isUserProvidedAlias: !!userProvidedAlias,
		displayAlias: formatTitle(displayName, undefined, 1, undefined, !!userProvidedAlias)
	};
}

export type OrderByColumn = {
	/** The term exactly as written in ORDER BY, quoting included. */
	expression: string;
	/** The same term unquoted, for comparing against the SELECT list. */
	name: string;
	/** Where `expression` sits in the clause, so a caller can substitute it without re-serialising the rest. */
	start: number;
	end: number;
	/** SQL defaults to ascending when the term omits a direction. */
	descending: boolean;
};

/** Split an ORDER BY clause into its terms, keeping each one both quoted and bare. */
export function parseOrderByColumns(orderClause: string): OrderByColumn[] {
	if (!orderClause) return [];

	const columns: OrderByColumn[] = [];
	// A quoted identifier may hold a comma. Splitting on every one tore such a name in
	// half and pushed the tail into the SELECT list as raw SQL.
	const parts: { text: string; start: number }[] = [];
	let start = 0;
	let quote: '"' | '`' | undefined;
	for (let index = 0; index < orderClause.length; index++) {
		const char = orderClause[index];
		if (quote) {
			if (char === quote && orderClause[index + 1] === quote) index++;
			else if (char === quote) quote = undefined;
		} else if (char === '"' || char === '`') {
			quote = char;
		} else if (char === ',') {
			parts.push({ text: orderClause.slice(start, index), start });
			start = index + 1;
		}
	}
	parts.push({ text: orderClause.slice(start), start });

	for (const part of parts) {
		const trimmed = part.text.trim();
		const columnMatch = trimmed.match(/^(.+?)(?:\s+(ASC|DESC))?$/i);
		if (columnMatch) {
			const expression = columnMatch[1].trim();
			const expressionStart = part.start + (part.text.length - part.text.trimStart().length);
			columns.push({
				expression,
				name: expression.replace(/^["`]|["`]$/g, ''),
				start: expressionStart,
				end: expressionStart + expression.length,
				descending: columnMatch[2]?.toLowerCase() === 'desc'
			});
		}
	}

	return columns;
}

/**
 * True for a term the ORDER BY parser can reason about. It splits on commas it cannot see
 * inside, so anything with call syntax may be a fragment and must be left as written.
 */
export function isBareIdentifier(name: string): boolean {
	return /^[A-Za-z_]\w*$/.test(name);
}

/**
 * Points an ORDER BY term at the grouped expression when it names the source column of a
 * date-grained dimension — the raw column is never a grouping key, so warehouses reject it.
 */
export function resolveOrderByGrains(
	orderClause: string,
	configColumns: ProcessedColumnExpression[],
	dialect: SqlDialect
): string {
	let resolved = orderClause;
	// Substitute right to left so each replacement leaves the earlier offsets intact.
	for (const column of parseOrderByColumns(orderClause).reverse()) {
		if (!isBareIdentifier(column.name)) continue;
		const selectedAsIs = configColumns.some(
			(candidate) => candidate.alias === column.name || candidate.sqlWithoutAlias === column.name
		);
		if (selectedAsIs) continue;
		const grained = configColumns.find(
			(candidate) =>
				candidate.hasDateGrain &&
				!candidate.isUserProvidedAlias &&
				candidate.alias ===
					dialect.formatAlias(generateStructuredAlias(column.name, candidate.dateGrain))
		);
		if (!grained) continue;
		resolved =
			resolved.slice(0, column.start) +
			dialect.quoteAlias(grained.alias) +
			resolved.slice(column.end);
	}
	return resolved;
}

/**
 * Checks if a column is already included in the SELECT clause
 * @param columnName - The column name to check
 * @param selectParts - Array of SELECT clause parts
 * @param configColumns - Array of processed column expressions
 * @returns true if the column is already included
 */
export function isColumnInSelect(
	columnName: string,
	selectParts: string[],
	configColumns: ProcessedColumnExpression[]
): boolean {
	// Check if column is in the main config columns
	for (const col of configColumns) {
		if (col.alias === columnName || col.sqlWithoutAlias === columnName) {
			return true;
		}
	}
	const selectString = selectParts.join(', ');

	// Create a regex that matches the column name as a whole word
	// TODO: There are some edge cases that will be unreliable matching for SQL expressions, eg "sum(tx)" would match "tx". Usage like this probably unlikely
	const wordBoundaryRegex = new RegExp(
		`\\b${columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
	);
	return wordBoundaryRegex.test(selectString);
}
