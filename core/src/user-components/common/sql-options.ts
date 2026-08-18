import type { UserComponentAttribute } from '../types';
import type { Filters } from '../../Filters.svelte';
import type { SqlDialect } from '../../sql-dialect';
import { defaultDialect, isSimpleIdentifier } from '../../sql-dialect';
import { processDateRange } from './date-options';
import type { DateRangeObject } from './date-options';
import {
	type ProcessedColumnExpression,
	parseOrderByColumns,
	resolveOrderByGrains,
	isBareIdentifier,
	isColumnInSelect,
	hasAgg
} from './sql-expression-utils';

/**
 * Normalizes whitespace in SQL strings while preserving spaces inside string literals.
 * Collapses multiple consecutive spaces/tabs to a single space, but only outside of
 * single-quoted SQL strings (handling escaped quotes like '').
 */
export function normalizeWhitespace(sql: string): string {
	const result: string[] = [];
	let i = 0;
	let lastEnd = 0;

	while (i < sql.length) {
		if (sql[i] === "'") {
			// Normalize whitespace in the part before the string literal
			const beforeLiteral = sql.slice(lastEnd, i);
			result.push(beforeLiteral.replace(/[ \t]+/g, ' '));

			// Find the end of the string literal, handling escaped quotes ('')
			let j = i + 1;
			while (j < sql.length) {
				if (sql[j] === "'") {
					// Check if it's an escaped quote ('')
					if (j + 1 < sql.length && sql[j + 1] === "'") {
						j += 2; // Skip both quotes
					} else {
						break; // End of string literal
					}
				} else {
					j++;
				}
			}

			// Include the closing quote
			const stringLiteral = sql.slice(i, j + 1);
			result.push(stringLiteral);
			lastEnd = j + 1;
			i = j + 1;
		} else {
			i++;
		}
	}

	// Normalize whitespace in any remaining part after the last string literal
	if (lastEnd < sql.length) {
		const remaining = sql.slice(lastEnd);
		result.push(remaining.replace(/[ \t]+/g, ' '));
	}

	return result.join('');
}

/**
 * Common SQL-related prop types that can be used in component props interfaces
 */
export interface SQLProps {
	where?: string;
	having?: string;
	limit?: number;
	order?: string;
	qualify?: string;
}

/**
 * Shared attrs surface for `build-*-sql.ts` builders. Components extend this
 * with their own column fields (x, y, category, value, etc.) rather than
 * re-declaring the universal fields.
 */
export interface BaseSQLAttrs extends SQLProps {
	data: string;
	date_range?: DateRangeObject;
	filters?: unknown[];
	/** From projectSettings at runtime. Feeds toStartOfWeek mode + date_range WHERE. */
	firstDayOfWeek?: 'sunday' | 'monday';
	/** Anchor used for relative date_range resolution. */
	anchorDate?: Date;
}

/**
 * Helper function to extract SQL props from a props object
 */
export function extractSQLProps<T extends SQLProps>(props: T) {
	return {
		where: props.where,
		having: props.having,
		limit: props.limit,
		order: props.order,
		qualify: props.qualify
	};
}

/**
 * Configuration options for generating a SQL query
 */
export interface ColumnsWithDimensionsAndMeasures {
	dimensions?: string[];
	measures?: string[];
	comparisons?: string[];
	cols?: string[];
	pivots?: string[];
	[key: string]: string | string[] | undefined;
}

export interface SQLQueryConfig {
	// Required parameters
	tableExpressionName: string;
	columns: ProcessedColumns;
	// Optional parameters
	// Opt-in for the few components that build their own FROM subquery (Table's
	// subtotal / row_conditional_colors wrappers). Everything else gets the name
	// quoted, so a variable-supplied `data` can never widen the FROM clause.
	tableExpressionIsSql?: boolean;
	filterSql?: string;
	filterIds?: unknown[];
	where?: string;
	date_range?: DateRangeObject;
	having?: string;
	order?: string;
	limit?: number;
	offset?: number;
	page_size?: number;
	subtotals?: boolean;
	qualify?: string;
	search?: {
		term: string;
		columns?: string[];
	};
	comparisons?: ComparisonQueryConfig[]; // Will be handled by buildComparisons
	sparklines?: SparklineQueryConfig[]; // Will be handled by buildSparklines
	hasDimensions?: boolean;
	hasPivots?: boolean;
	hasMeasures?: boolean;
	shouldAddDistinct?: boolean;
	/** Skip GROUP BY entirely — for row-lookup queries that must preserve source row order. */
	skipGroupBy?: boolean;
	groupingSets?: string;
	subtotalHelperColumns?: string;
	// Date dimension info for comparisons
	dateDimensionExpression?: string;
	dateDimensionGrain?: string;
}

import { buildComparisons, type ComparisonQueryConfig } from './build-comparisons';
import {
	buildSparklines,
	type SparklineQueryConfig,
	type SparklineContext
} from './build-sparklines';
import type { InlineQueries } from './inline-queries';

// Re-export sparkline types and functions for components
export type { SparklineQueryConfig, Sparkline, SparklineColumnProps } from './build-sparklines';
export { generateSparklineId, buildSparklineQueryConfig } from './build-sparklines';

function buildFragmentQuery(
	mainQuerySql: string,
	fragments: Fragment[],
	mainQueryColumns?: ProcessedColumnExpression[],
	hasSubtotals?: boolean,
	inlineColumns?: string[],
	dialect: SqlDialect = defaultDialect
): string {
	const q = (alias: string) => dialect.quoteAlias(alias);
	if (fragments.length === 0) {
		return mainQuerySql;
	}

	// 1. Extract CTEs from all fragments
	const ctes = fragments
		.map((fragment) => {
			return `${fragment.alias} AS (${fragment.cteSql})`;
		})
		.join(',\n');

	// 2. Collect all JOINs from fragments
	const joins = fragments.map((fragment) => fragment.joinSql).join('\n');

	// 3. Collect all calculation columns from fragments
	const allCalculationColumns: string[] = [];
	fragments.forEach((fragment) => {
		if (fragment.calculationColumns) {
			allCalculationColumns.push(...fragment.calculationColumns);
		}
	});

	// 4. Build the final query structure
	let selectClause: string;

	// When there are multiple fragments, explicitly list main query columns to avoid "main_query." prefixes
	if (fragments.length > 1 && mainQueryColumns && mainQueryColumns.length > 0) {
		const mainQueryParts: string[] = [];

		// Add regular columns
		const regularColumns = mainQueryColumns
			.map((col) => `main_query.${col.alias} as ${col.alias}`)
			.join(', ');
		mainQueryParts.push(regularColumns);

		// Add subtotal helper columns if they exist (by their known aliases)
		if (hasSubtotals) {
			const helperColumnAliases: string[] = [];

			// Add grouping columns for each dimension/pivot
			mainQueryColumns.forEach((col) => {
				if (col.type === 'dimension' || col.type === 'pivot') {
					helperColumnAliases.push(q(`__ev_grouping_${col.alias}`));
				}
			});

			// Add the standard subtotal helper columns
			helperColumnAliases.push(q('__ev_subtotal_level'));
			helperColumnAliases.push(q('__ev_render_type'));

			const helperColumnSelects = helperColumnAliases
				.map((alias) => `main_query.${alias} as ${alias}`)
				.join(', ');

			if (helperColumnSelects) {
				mainQueryParts.push(helperColumnSelects);
			}
		}

		// Add inline columns if they exist
		if (inlineColumns && inlineColumns.length > 0) {
			const inlineColumnSelects = inlineColumns
				.map((col) => {
					// For inline columns, we need to extract their aliases and prefix them.
					// The alias may be quoted with " (CH/SF) or ` (BQ); accept either or none.
					const asMatch = col.match(/^(.+)\s+as\s+(?:"([^"]+)"|`([^`]+)`|([A-Za-z_][\w]*))$/i);
					if (asMatch) {
						const alias = asMatch[2] ?? asMatch[3] ?? asMatch[4];
						const quoted = q(alias);
						return `main_query.${quoted} as ${quoted}`;
					}
					return `main_query.${col}`;
				})
				.join(', ');
			mainQueryParts.push(inlineColumnSelects);
		}

		const mainQuerySelect = mainQueryParts.join(', ');

		selectClause =
			allCalculationColumns.length > 0
				? `${mainQuerySelect}, ${allCalculationColumns.join(', ')}`
				: mainQuerySelect;
	} else {
		// Single fragment or no column info - use the existing shortcut
		selectClause =
			allCalculationColumns.length > 0
				? `main_query.*, ${allCalculationColumns.join(', ')}`
				: 'main_query.*';
	}

	return normalizeWhitespace(
		`
WITH main_query AS (${mainQuerySql}),
${ctes}
SELECT ${selectClause}
FROM main_query
${joins}
	`.trim()
	);
}

/**
 * Result of generateSQLQuery, including the SQL and any validation errors
 */
export interface SQLQueryResult {
	sql: string;
	error?: string;
}

/**
 * Interface for extending the base query with additional functionality
 */
export interface QueryExtension {
	inlineColumns: string[];
	fragments: Fragment[];
}

/**
 * Interface for SQL fragments that need to be joined as CTEs
 */
export interface Fragment {
	cteSql: string;
	joinSql: string;
	calculationColumns: string[];
	alias: string;
}

/**
 * Structured result from processing columns
 */
export type ProcessedColumns = ProcessedColumnExpression[];

export function quoteUntrustedIdentifier(
	identifier: string,
	dialect: SqlDialect = defaultDialect
): string {
	if (isSimpleIdentifier(identifier)) return identifier;
	const escaped = dialect.escapesBackslashInIdentifiers
		? identifier.replaceAll('\\', '\\\\')
		: identifier;
	return dialect.quoteIdentifierIfNeeded(escaped);
}

function isQuotedIdentifier(identifier: string, dialect: SqlDialect): boolean {
	const quote = identifier[0];
	if (quote !== '"' && quote !== '`') return false;
	const backslashEscapes = dialect.escapesBackslashInIdentifiers;
	for (let index = 1; index < identifier.length; index++) {
		const char = identifier[index];
		if ((backslashEscapes && char === '\\') || (char === quote && identifier[index + 1] === quote))
			index++;
		else if (char === quote) return index === identifier.length - 1;
	}
	return false;
}

export function quoteUntrustedIdentifierPath(
	name: string,
	dialect: SqlDialect = defaultDialect
): string {
	const identifiers: string[] = [];
	let start = 0;
	let quote: '"' | '`' | undefined;
	const backslashEscapes = dialect.escapesBackslashInIdentifiers;
	for (let index = 0; index < name.length; index++) {
		const char = name[index];
		if (quote) {
			if ((backslashEscapes && char === '\\') || (char === quote && name[index + 1] === quote))
				index++;
			else if (char === quote) quote = undefined;
		} else if (char === '"' || char === '`') {
			quote = char;
		} else if (char === '.') {
			identifiers.push(name.slice(start, index));
			start = index + 1;
		}
	}
	identifiers.push(name.slice(start));

	return identifiers
		.map((part) => {
			// Padding around a segment was ignorable while the name went in bare, so a
			// variable holding ` demo.orders ` still has to resolve. Inner spaces stay.
			const identifier = part.trim();
			if (isQuotedIdentifier(identifier, dialect)) return identifier;
			return quoteUntrustedIdentifier(identifier, dialect);
		})
		.join('.');
}

export function resolveTableExpressionName(
	name: string,
	inlineQueries: InlineQueries | undefined,
	dialect: SqlDialect = defaultDialect,
	preserveExpression = false
): string {
	const interpolated = inlineQueries?.getInterpolated(name, dialect);
	if (interpolated) return interpolated;
	if (preserveExpression && name.trimStart().startsWith('(')) return name;
	return quoteUntrustedIdentifierPath(name, dialect);
}

/**
 * Generates search SQL condition based on search term and available columns
 * @param searchTerm - The search term to look for
 * @param searchColumns - Optional specific columns to search in
 * @param columns - The processed columns configuration from the query
 * @returns SQL condition string for searching
 */
function generateSearchSql(
	searchTerm: string,
	searchColumns?: string[],
	columns?: ProcessedColumns,
	dialect: SqlDialect = defaultDialect
): string {
	let searchableColumns: string[] = [];

	if (searchColumns && searchColumns.length > 0) {
		searchableColumns = searchColumns;
	} else if (columns) {
		searchableColumns = columns.map((col) => col.alias);
	}

	// Drop nullish/empty entries before they reach the dialect — a search column
	// that failed to resolve (e.g. an unquoted function) would crash formatAlias.
	searchableColumns = searchableColumns.filter(Boolean);

	if (searchableColumns.length === 0) {
		return '';
	}

	const escapedTerm = dialect.escapeStringLiteral(searchTerm);

	const searchConditions = searchableColumns.map((col) => {
		const quotedCol = col.includes('"') ? col : dialect.quoteAlias(dialect.formatAlias(col));
		const castExpr = dialect.castToString(quotedCol);
		return dialect.caseInsensitiveLike(castExpr, `%${escapedTerm}%`);
	});

	return `(${searchConditions.join(' OR ')})`;
}

/**
 * Generates a SQL query string based on the provided configuration
 */
export function generateSQLQuery(
	config: SQLQueryConfig,
	filterContexts: (Filters | undefined)[] | undefined,
	inlineQueries: InlineQueries | undefined,
	anchorDate?: Date,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday',
	dialect: SqlDialect = defaultDialect
): SQLQueryResult {
	// Get the actual table expression from the store if it exists
	// Pass filter contexts for interpolation
	let resolvedTableExpression: string;
	try {
		resolvedTableExpression = resolveTableExpressionName(
			config.tableExpressionName,
			inlineQueries,
			dialect,
			config.tableExpressionIsSql === true
		);
	} catch (error) {
		// If template errors occur, return them immediately without executing the query
		return {
			sql: '',
			error: error instanceof Error ? error.message : 'Template error occurred'
		};
	}

	// Process filter IDs if provided
	let processedFilterSql;
	if (config.filterIds && filterContexts) {
		processedFilterSql = processFilterIds(config.filterIds, filterContexts);
	}

	// Use either provided filterSql or processed filterSql
	const effectiveFilterSql = config.filterSql || processedFilterSql;

	// Columns are already processed with actual date ranges from processColumnExpression
	const processedColumns = config.columns;

	// Build SELECT clause by collecting all column parts
	const selectParts: string[] = [];

	// Add regular columns if available, deduplicating by sqlWithAlias
	if (processedColumns.length > 0) {
		const uniqueColumns = [...new Set(processedColumns.map((col) => col.sqlWithAlias))];
		selectParts.push(uniqueColumns.join(', '));
	}

	// Add subtotal helper columns if subtotals are enabled
	if (config.subtotals && config.subtotalHelperColumns) {
		selectParts.push(config.subtotalHelperColumns);
	}

	// Generate search SQL if search is provided
	let searchSql;
	if (config.search?.term?.trim()) {
		searchSql = generateSearchSql(
			config.search.term,
			config.search.columns,
			processedColumns,
			dialect
		);
	}

	// Determine if we need a subquery early (before using it in WHERE/HAVING logic)
	let needsSubquery = false;
	if (config.limit !== undefined && config.page_size !== undefined) {
		needsSubquery = true;
	}

	// Generate date filter SQL if date props are provided
	let dateFilterSql;
	if (config.date_range && config.date_range.range && config.date_range.range !== 'all time') {
		const processed = processDateRange(
			config.date_range.range,
			config.date_range.date,
			anchorDate,
			firstDayOfWeek,
			dialect
		);
		dateFilterSql = processed.whereClause;
	}

	// Build WHERE clause by combining filterSql, where, dateFilter, and search (when no measures)
	const whereParts = [];
	if (effectiveFilterSql) whereParts.push(effectiveFilterSql);
	if (config.where) whereParts.push(config.where);
	if (dateFilterSql) whereParts.push(dateFilterSql);
	// Add search to WHERE clause only when no measures AND not using subquery with search outside
	if (searchSql && !config.hasMeasures && !needsSubquery) whereParts.push(searchSql);

	let whereClause = '';
	if (whereParts.length > 0) {
		whereClause = `WHERE ${whereParts.map((component) => `(${component})`).join(' AND ')}`;
	}

	// Handle HAVING clause - include search when we have measures
	const havingParts = [];
	if (config.having) havingParts.push(config.having);
	// Add search to HAVING clause when we have measures AND not using subquery with search outside
	if (searchSql && config.hasMeasures && !needsSubquery) havingParts.push(searchSql);

	const havingClause =
		havingParts.length > 0
			? `HAVING ${havingParts.map((component) => `(${component})`).join(' AND ')}`
			: '';

	// Determine if GROUP BY will be used. Row-lookup queries (e.g. image) opt out:
	// grouping re-hashes rows, which discards the source query's ORDER BY and makes
	// "first row" nondeterministic.
	const willUseGroupBy = !config.skipGroupBy;

	// Handle other clauses
	const qualifyClause = config.qualify ? `QUALIFY ${config.qualify}` : '';
	// Without grouping the raw column is still a legal sort key, so leave it alone.
	const order =
		config.order && willUseGroupBy
			? resolveOrderByGrains(config.order, processedColumns, dialect)
			: config.order;
	const orderClause = order ? `ORDER BY ${order}` : '';

	// Handle limit and pagination logic to determine if we need a subquery.
	// `outerLimit`/`outerOffset` are the row-count + offset applied to the
	// outermost query; the dialect turns them into the right trailing clause
	// (`LIMIT n OFFSET m` for ClickHouse/Snowflake/BigQuery, `OFFSET m ROWS FETCH
	// NEXT n ROWS ONLY` for T-SQL/Fabric).
	let outerLimit: number | undefined;
	let outerOffset: number | undefined;

	// If both limit and page_size are provided, we need a subquery approach
	if (config.limit !== undefined && config.page_size !== undefined) {
		// Use subquery approach: apply user limit in subquery, pagination outside
		outerLimit = config.page_size;
		outerOffset = config.offset;
	} else if (config.page_size !== undefined && config.offset !== undefined) {
		// Pure pagination (no user limit) - tables only
		outerLimit = config.page_size;
		outerOffset = config.offset;
	} else if (config.limit !== undefined) {
		// Pure limit (no pagination)
		// For charts with fill, the limit will be applied after the fill operation
		// For everything else, apply the limit normally
		outerLimit = config.limit;
		outerOffset = config.offset;
	}

	// Handle GROUP BY clause
	let groupByClause = '';
	if (willUseGroupBy) {
		// Use subtotals with GROUPING SETS if needed
		if (config.subtotals) {
			groupByClause = `GROUP BY GROUPING SETS (${config.groupingSets})`;
		} else if (selectParts.length > 0) {
			// Fallback to GROUP BY ALL (or, for dialects without it, an explicit
			// GROUP BY over the non-aggregate expressions) for regular aggregation.
			const groupingExpressions = processedColumns
				.filter((c) => !c.hasAgg)
				.map((c) => c.sqlWithoutAlias);
			groupByClause = dialect.groupByAll(groupingExpressions);
		}
	}

	// Process comparisons and sparklines with full context
	const allInlineColumns: string[] = [];
	const allFragments: Fragment[] = [];

	if (config.comparisons && config.comparisons.length > 0) {
		const comparisonContext = {
			tableExpression: resolvedTableExpression,
			whereClause,
			groupByClause,
			filterSql: effectiveFilterSql,
			processedColumns: processedColumns,
			userWhere: config.where,
			dateFilterSql,
			dateDimensionExpression: config.dateDimensionExpression,
			dateDimensionGrain: config.dateDimensionGrain,
			subtotalsEnabled: !!config.subtotals
		};
		const comparisonResult = buildComparisons(
			config.comparisons,
			comparisonContext,
			anchorDate,
			firstDayOfWeek,
			dialect
		);
		allInlineColumns.push(...comparisonResult.inlineColumns);
		allFragments.push(...comparisonResult.fragments);
	}

	if (config.sparklines && config.sparklines.length > 0) {
		const sparklineContext: SparklineContext = {
			tableExpression: resolvedTableExpression,
			whereClause,
			groupByClause,
			filterSql: effectiveFilterSql,
			processedColumns: processedColumns,
			userWhere: config.where,
			dateFilterSql
		};
		const sparklineResult = buildSparklines(
			config.sparklines,
			sparklineContext,
			anchorDate,
			firstDayOfWeek,
			dialect
		);
		allInlineColumns.push(...sparklineResult.inlineColumns);
		allFragments.push(...sparklineResult.fragments);
	}

	// Deduplicate inline columns - multiple UI columns can reference the same SQL column
	// (e.g., different comparison display_types for the same underlying comparison)
	const uniqueInlineColumns = [...new Set(allInlineColumns.map((col) => col.trim()))];

	// Add inline columns to selectParts before final SELECT construction
	if (uniqueInlineColumns.length > 0) {
		selectParts.push(uniqueInlineColumns.join(', '));
	}

	// Check if ORDER BY clause references columns not in SELECT and add them
	// Only do this when we have explicit columns - if processedColumns is empty,
	// we'll use SELECT * which already includes all columns
	if (order && processedColumns.length > 0) {
		const missingColumns = parseOrderByColumns(order)
			.filter((orderColumn) => !isColumnInSelect(orderColumn.name, selectParts, processedColumns))
			// A grouped row has no single value outside its grouping keys; only a bare term resolves to the alias.
			// MIN/MAX rather than anyValue: the group sorts by its own best value in the requested
			// direction, and ANY_VALUE would let the row order shift between runs of the same query.
			.map((orderColumn) =>
				willUseGroupBy &&
				isBareIdentifier(orderColumn.name) &&
				!hasAgg(orderColumn.expression, dialect)
					? `${orderColumn.descending ? 'MAX' : 'MIN'}(${orderColumn.expression}) AS ${dialect.quoteAlias(orderColumn.name)}`
					: orderColumn.expression
			);
		if (missingColumns.length > 0) {
			selectParts.push(missingColumns.join(', '));
		}
	}

	// Construct final SELECT list with DISTINCT if needed, fallback to * if empty
	const selectList =
		selectParts.length > 0
			? config.shouldAddDistinct
				? `DISTINCT ${selectParts.join(', ')}`
				: selectParts.join(', ')
			: '*';

	// Build main query with inner limit (if needed for subquery)
	const mainQuerySql = normalizeWhitespace(
		`
		SELECT ${selectList}
		FROM ${resolvedTableExpression}
		${whereClause}
		${groupByClause}
		${havingClause}
		${qualifyClause}
		${orderClause}
		${
			needsSubquery && config.limit !== undefined
				? dialect.rowLimitClause({ limit: config.limit, hasOrderBy: !!orderClause })
				: ''
		}
	`.trim()
	);

	// Build core query (with or without fragments)
	let coreQuery: string;
	if (allFragments.length > 0) {
		coreQuery = buildFragmentQuery(
			mainQuerySql,
			allFragments,
			processedColumns,
			config.subtotals,
			allInlineColumns,
			dialect
		);
	} else {
		coreQuery = mainQuerySql;
	}

	// Apply final subquery/search/pagination logic uniformly
	let sql: string;
	if (needsSubquery) {
		const outerWhere = searchSql ? `WHERE ${searchSql}` : '';
		// The outer wrapper has no ORDER BY of its own (any ordering lives inside
		// `coreQuery`), so T-SQL dialects must synthesise one for OFFSET/FETCH.
		const paginationClause = dialect.rowLimitClause({
			limit: outerLimit,
			offset: outerOffset,
			hasOrderBy: false
		});
		// Alias the derived table (`AS evidence_paged`) — T-SQL/Fabric requires a
		// derived-table alias; it's a harmless no-op for ClickHouse/Snowflake/BigQuery.
		sql = normalizeWhitespace(
			`SELECT * FROM (${coreQuery}) AS evidence_paged ${outerWhere} ${paginationClause}`.trim()
		);
	} else {
		const paginationClause = dialect.rowLimitClause({
			limit: outerLimit,
			offset: outerOffset,
			hasOrderBy: !!orderClause
		});
		sql = normalizeWhitespace(`${coreQuery} ${paginationClause}`.trim());
	}

	return { sql };
}

/**
 * Common SQL options that can be used across various data-displaying components
 */
export const SQL_OPTIONS = {
	where: {
		type: String,
		required: false,
		description:
			'Custom SQL WHERE condition to apply to the query. For date filters, use date_range instead.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'sql' // Quoted values for filter conditions
	},
	having: {
		type: String,
		required: false,
		description: 'Custom SQL HAVING condition to apply to the query after GROUP BY',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'sql' // Quoted values for filter conditions
	},
	limit: {
		type: Number,
		required: false,
		description:
			'Maximum number of rows to return from the query. Note: When used with tables, limit will disable subtotals to prevent incomplete subtotal rows.',
		affectsQuery: true
	},
	order: {
		type: String,
		required: false,
		description: 'Column name(s) with optional direction (e.g. "column_name", "column_name desc")',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'sql' // Quoted values for filter conditions
	},
	qualify: {
		type: String,
		required: false,
		description: 'Custom SQL QUALIFY condition to filter windowed results',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'sql' // Quoted values for filter conditions
	}
	// Additional SQL options can be added here in the future
} as const satisfies Record<string, UserComponentAttribute>;

/**
 * Common refresh interval attribute for data-displaying components.
 * When set, the component's query will automatically re-fetch data after each interval.
 * The timer restarts after each query completes, so multiple components on a page
 * will naturally stagger their requests rather than all firing at once.
 * If not set, falls back to the page-level auto-refresh setting.
 */
export const REFRESH_INTERVAL_ATTRIBUTE = {
	refresh_interval: {
		type: Number,
		required: false,
		description:
			'Time in seconds between automatic data refreshes (minimum 30). Overrides the page-level auto-refresh setting for this component.',
		affectsQuery: false
	}
} as const satisfies Record<string, UserComponentAttribute>;

/**
 * Generates SQL WHERE conditions from filter IDs
 * @param filterIds - Array of filter IDs
 * @param repeatFilters - Filters from repeat context
 * @param globalFilters - Global filters
 * @returns SQL string for WHERE clause or undefined if no valid filters
 */
export function processFilterIds(
	filterIds: unknown[] = [],
	filterContexts: (Filters | undefined)[] = []
): string | undefined {
	if (!filterIds) return undefined;

	const sqls = filterIds
		.filter((id): id is string => typeof id === 'string')
		.map((id) => {
			const filterContext = filterContexts.find((filterContext) => filterContext?.has(id));
			return filterContext?.get(id)?.sql;
		})
		.filter((sql): sql is NonNullable<typeof sql> => typeof sql !== 'undefined');

	return sqls.length > 0 ? sqls.join(' AND ') : undefined;
}
// Additional SQL options can be added here in the future

/**
 * Generates a SQL CASE expression for the render_type column
 * @param dimensionColumns - Array of dimension column names
 * @param pivotColumns - Array of pivot column names
 * @param originalExprMap - Mapping from column aliases to original expressions
 * @returns SQL expression for render_type classification
 */
function generateRenderTypeExpression(
	dimensionColumns: string[],
	pivotColumns: string[],
	originalExprMap: Record<string, string> = {},
	dialect: SqlDialect = defaultDialect,
	subtotalLevelBareExpr?: string
): string {
	const HELPER_PREFIX = '__ev_';
	const groupingExpr = (col: string) => createGroupingExpr(col, originalExprMap);
	// BigQuery (unlike Snowflake/CH) doesn't allow referencing a sibling SELECT
	// alias in the same SELECT clause. Inline the subtotal_level expression when
	// the caller provided it; fall back to the alias reference otherwise.
	const subtotalLevelRef = subtotalLevelBareExpr
		? `(${subtotalLevelBareExpr})`
		: dialect.quoteAlias(`${HELPER_PREFIX}subtotal_level`);
	const renderTypeAlias = dialect.quoteAlias(`${HELPER_PREFIX}render_type`);

	// Handle the case when there are no dimensions or no pivots
	if (dimensionColumns.length === 0 && pivotColumns.length === 0) {
		return `'cell_data' AS ${renderTypeAlias}`;
	} else if (dimensionColumns.length === 0) {
		// For pivot-only tables, use subtotal_level to determine render_type
		return normalizeWhitespace(
			`
			CASE
				WHEN ${subtotalLevelRef} IS NULL THEN 'cell_data'
				WHEN ${subtotalLevelRef} = 0 THEN 'column_total'
				ELSE 'column_subtotal'
			END AS ${renderTypeAlias}
		`.trim()
		);
	} else if (pivotColumns.length === 0) {
		// For dimension-only tables, use subtotal_level
		return normalizeWhitespace(
			`
			CASE
				WHEN ${subtotalLevelRef} IS NULL THEN 'cell_data'
				WHEN ${subtotalLevelRef} = 0 THEN 'row_total'
				ELSE 'row_subtotal'
			END AS ${renderTypeAlias}
		`.trim()
		);
	} else {
		// For tables with both dimensions and pivots
		const allDimensionsNullCheck = dimensionColumns
			.map((dim) => `${groupingExpr(dim)} = 1`)
			.join(' AND ');
		const someDimensionsNullCheck = dimensionColumns
			.map((dim) => `${groupingExpr(dim)} = 1`)
			.join(' OR ');
		const allPivotsNullCheck = pivotColumns.map((piv) => `${groupingExpr(piv)} = 1`).join(' AND ');

		return normalizeWhitespace(
			`
			CASE
				/* Detail rows have no subtotal level */
				WHEN ${subtotalLevelRef} IS NULL THEN 'cell_data'

				/* Grand totals (level 0) */
				WHEN ${subtotalLevelRef} = 0 THEN
					CASE
						/* If all dimensions are NULL, it's a row total */
						WHEN ${allDimensionsNullCheck} THEN 'row_total'
						/* If all pivots are NULL, it's a column total */
						WHEN ${allPivotsNullCheck} THEN 'column_total'
						/* Otherwise it's a row total (fallback) */
						ELSE 'row_total'
					END

				/* Other subtotal levels */
				ELSE
					CASE
						/* If any dimension is NULL, it's a row subtotal */
						WHEN ${someDimensionsNullCheck} THEN 'row_subtotal'
						/* Otherwise it must be a column subtotal */
						ELSE 'column_subtotal'
					END
			END AS ${renderTypeAlias}
		`.trim()
		);
	}
}

/**
 * Helper function to simplify a string by replacing content inside parentheses with spaces
 * while preserving the outer structure
 */

/**
 * Creates a GROUPING expression that correctly handles complex expressions
 */
function createGroupingExpr(col: string, originalExprMap: Record<string, string> = {}): string {
	// Emit the expression verbatim so it matches the SELECT-level GROUPING() calls
	// (see generateSubtotalHelperColumns). Quoting a bare identifier here breaks
	// Snowflake, which folds unquoted `category` to `CATEGORY` but treats
	// `"category"` as a distinct (lowercase) identifier — `invalid identifier`.
	const expr = originalExprMap[col] ?? col;
	return `GROUPING(${expr})`;
}

/**
 * Generates GROUPING SETS for subtotal queries
 * @param allColumns - Array of all processed column expressions
 * @returns Comma-separated string of grouping sets ready for SQL
 */
export function generateGroupingSets(allColumns: ProcessedColumnExpression[]): string {
	const groupingSets = [];

	// Extract dimensions and pivots from the column list
	const dimensionExpressions = allColumns
		.filter((col) => col.type === 'dimension')
		.map((col) => col.sqlWithoutAlias);
	const pivotExpressions = allColumns
		.filter((col) => col.type === 'pivot')
		.map((col) => col.sqlWithoutAlias);

	// 1. Base detail level (all dimensions + all pivots)
	if (dimensionExpressions.length > 0 || pivotExpressions.length > 0) {
		const allGroupingExprs = [...dimensionExpressions, ...pivotExpressions];
		groupingSets.push(`(${allGroupingExprs.join(', ')})`);
	}

	// 2. Dimension hierarchies - only if we have dimensions
	if (dimensionExpressions.length > 0) {
		for (let i = dimensionExpressions.length; i >= 0; i--) {
			const dimensionPrefix = dimensionExpressions.slice(0, i);
			// For each dimension prefix, add it with all pivots
			if (pivotExpressions.length > 0) {
				// For each dimension prefix, add combinations with pivot prefixes
				for (let j = pivotExpressions.length; j >= 0; j--) {
					const pivotPrefix = pivotExpressions.slice(0, j);
					const withPivots = [...dimensionPrefix, ...pivotPrefix];
					if (withPivots.length > 0) {
						groupingSets.push(`(${withPivots.join(', ')})`);
					}
				}
			}

			// Also add just the dimension prefix without pivots
			if (dimensionPrefix.length > 0) {
				groupingSets.push(`(${dimensionPrefix.join(', ')})`);
			}
		}
	}

	// 3. Pivot combinations - only if we have pivots
	if (pivotExpressions.length > 0) {
		for (let i = pivotExpressions.length; i >= 0; i--) {
			const pivotPrefix = pivotExpressions.slice(0, i);

			// For each prefix length, add it with all dimensions (if any)
			if (dimensionExpressions.length > 0) {
				const withDimensions = [...dimensionExpressions, ...pivotPrefix];
				if (withDimensions.length > 0) {
					groupingSets.push(`(${withDimensions.join(', ')})`);
				}
			}

			// Also add just the pivot prefix without dimensions
			if (pivotPrefix.length > 0) {
				groupingSets.push(`(${pivotPrefix.join(', ')})`);
			}
		}
	}

	// 4. Grand total (empty grouping set)
	groupingSets.push('()');

	// Remove duplicates
	const normalizedMap = new Map<string, string>();
	for (const set of groupingSets) {
		const normalized = set.replace(/['"` ]/g, '').toLowerCase();
		if (!normalizedMap.has(normalized)) {
			normalizedMap.set(normalized, set);
		}
	}

	return Array.from(normalizedMap.values()).join(', ');
}

/**
 * Generates subtotal helper columns for queries with GROUPING SETS
 * @param allColumns - Array of all processed column expressions
 * @returns Comma-separated string of helper columns to add to SELECT clause
 */
export function generateSubtotalHelperColumns(
	allColumns: ProcessedColumnExpression[],
	dialect: SqlDialect = defaultDialect
): string {
	const HELPER_PREFIX = '__ev_';
	const helperColumns: string[] = [];

	// Extract dimensions and pivots from the column list
	const dimensionColumns = allColumns.filter((col) => col.type === 'dimension');
	const pivotColumns = allColumns.filter((col) => col.type === 'pivot');

	const dimensionExpressions = dimensionColumns.map((col) => col.sqlWithoutAlias);
	const dimensionAliases = dimensionColumns.map((col) => col.alias);
	const pivotExpressions = pivotColumns.map((col) => col.sqlWithoutAlias);
	const pivotAliases = pivotColumns.map((col) => col.alias);

	// 1. Add grouping indicator columns
	const groupingColumns = [
		...dimensionExpressions.map(
			(expr, i) =>
				`GROUPING(${expr}) AS ${dialect.quoteAlias(`__ev_grouping_${dimensionAliases[i]}`)}`
		),
		...pivotExpressions.map(
			(expr, i) => `GROUPING(${expr}) AS ${dialect.quoteAlias(`__ev_grouping_${pivotAliases[i]}`)}`
		)
	];
	helperColumns.push(...groupingColumns);

	// 2. Create GROUPING expressions for individual columns
	const dimensionGroupingExprs = dimensionExpressions.map((expr) => `GROUPING(${expr})`);
	const pivotGroupingExprs = pivotExpressions.map((expr) => `GROUPING(${expr})`);

	// Sum expressions for detecting if all columns of a type are grouped
	const allDimensionsGroupingExpr =
		dimensionExpressions.length > 0 ? dimensionGroupingExprs.join(' + ') : '0';
	const allPivotsGroupingExpr = pivotExpressions.length > 0 ? pivotGroupingExprs.join(' + ') : '0';

	// 3. Create a sophisticated subtotal level calculation
	const subtotalLevelCases = [];

	if (dimensionExpressions.length > 0) {
		// Case 1: Grand total (all columns are NULL)
		subtotalLevelCases.push(
			`WHEN ${allDimensionsGroupingExpr} = ${dimensionExpressions.length} AND ${allPivotsGroupingExpr} = ${pivotExpressions.length} THEN 0`
		);

		// Case 2: Dimension hierarchical levels
		for (let i = dimensionExpressions.length - 1; i > 0; i--) {
			const dimensionsWithValues = dimensionGroupingExprs
				.slice(0, i)
				.map((expr) => `${expr} = 0`)
				.join(' AND ');

			let additionalCondition = '';
			if (i < dimensionExpressions.length) {
				const dimensionsWithNulls = dimensionGroupingExprs
					.slice(i)
					.map((expr) => `${expr} = 1`)
					.join(' AND ');
				additionalCondition = ` AND ${dimensionsWithNulls}`;
			}

			subtotalLevelCases.push(`WHEN ${dimensionsWithValues}${additionalCondition} THEN ${i}`);
		}

		// Grand totals - all dimensions are NULL
		const allDimensionsNullCheck = dimensionGroupingExprs
			.map((expr) => `${expr} = 1`)
			.join(' AND ');
		subtotalLevelCases.push(`WHEN ${allDimensionsNullCheck} THEN 0`);
	}

	// Handle pivot subtotal levels
	if (pivotExpressions.length > 0) {
		for (let i = 0; i < pivotExpressions.length; i++) {
			const conditions = [];

			// All dimensions must have values for pivot subtotals
			if (dimensionExpressions.length > 0) {
				conditions.push(dimensionGroupingExprs.map((expr) => `${expr} = 0`).join(' AND '));
			}

			// Pivots before position i should have values (GROUPING=0)
			if (i > 0) {
				const pivotsBefore = pivotGroupingExprs
					.slice(0, i)
					.map((expr) => `${expr} = 0`)
					.join(' AND ');
				conditions.push(pivotsBefore);
			}

			// The pivot at position i must be NULL (GROUPING=1)
			conditions.push(`${pivotGroupingExprs[i]} = 1`);

			subtotalLevelCases.push(
				`WHEN ${conditions.join(' AND ')} THEN ${pivotExpressions.length - i}`
			);
		}

		// If no dimensions, handle grand total case (all pivots NULL)
		if (dimensionExpressions.length === 0) {
			const allPivotsNull = pivotGroupingExprs.map((expr) => `${expr} = 1`).join(' AND ');
			subtotalLevelCases.push(`WHEN ${allPivotsNull} THEN 0`);
		}
	}

	// Detail rows (all columns have values, no grouping)
	subtotalLevelCases.push(`ELSE NULL`);

	const subtotalLevelBareExpr = `CASE ${subtotalLevelCases.join(' ')} END`;
	const subtotalLevelExpr = `${subtotalLevelBareExpr} AS ${dialect.quoteAlias(`${HELPER_PREFIX}subtotal_level`)}`;
	helperColumns.push(subtotalLevelExpr);

	// 4. Add a render_type column to classify rows for pivot table rendering
	// Create mapping from aliases to expressions for render type logic
	const originalExprMap: Record<string, string> = {};
	dimensionAliases.forEach((alias, i) => {
		originalExprMap[alias] = dimensionExpressions[i];
	});
	pivotAliases.forEach((alias, i) => {
		originalExprMap[alias] = pivotExpressions[i];
	});

	const renderTypeExpr = generateRenderTypeExpression(
		dimensionAliases,
		pivotAliases,
		originalExprMap,
		dialect,
		subtotalLevelBareExpr
	);
	helperColumns.push(renderTypeExpr);

	return helperColumns.join(', ');
}
