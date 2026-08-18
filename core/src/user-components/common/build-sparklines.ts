import type { QueryExtension, Fragment } from './sql-options';
import { normalizeWhitespace } from './sql-options';
import { processDateRange, getDateGrainSql } from './date-options';
import type { DateRangeObject } from './date-options';
import type { ProcessedColumnExpression } from './sql-expression-utils';
import type { SqlDialect } from '../../sql-dialect';
import { defaultDialect } from '../../sql-dialect';
import { cleanIdentifier, hasAgg } from './sql-expression-utils';

/**
 * Extend existing GROUPING SETS by adding the x-column to each set
 * This ensures sparklines mirror the main query's subtotal structure
 */
function extendGroupingSetsWithXColumn(
	groupByClause: string,
	xColumn: string,
	dimensionColumns?: ProcessedColumnExpression[]
): string {
	// Extract GROUPING SETS content from clause like "GROUP BY GROUPING SETS ((category), ())"
	const groupingSetsMatch = groupByClause.match(/GROUPING SETS \((.+)\)$/i);
	if (!groupingSetsMatch) {
		// Fallback: if not GROUPING SETS, include dimension columns and x-column
		// This handles the case when subtotals=false (GROUP BY ALL)
		const dimensionExprs =
			dimensionColumns
				?.filter((col) => col.type === 'dimension' || col.type === 'pivot')
				.map((col) => col.sqlWithoutAlias) || [];

		const allGroupByColumns = [...dimensionExprs, xColumn];
		return allGroupByColumns.length > 0
			? `GROUP BY ${allGroupByColumns.join(', ')}`
			: `GROUP BY ${xColumn}`;
	}

	const groupingSetsContent = groupingSetsMatch[1];

	// Parse individual grouping sets, handling nested parentheses
	const sets: string[] = [];
	let currentSet = '';
	let depth = 0;
	let inSet = false;

	for (let i = 0; i < groupingSetsContent.length; i++) {
		const char = groupingSetsContent[i];

		if (char === '(') {
			if (!inSet) {
				inSet = true;
				currentSet = '';
			} else {
				currentSet += char;
			}
			depth++;
		} else if (char === ')') {
			depth--;
			if (depth === 0 && inSet) {
				// End of a grouping set
				sets.push(currentSet.trim());
				inSet = false;
			} else {
				currentSet += char;
			}
		} else if (char === ',' && depth === 0) {
			// Skip commas between sets
			continue;
		} else if (inSet) {
			currentSet += char;
		}
	}

	// Extend each grouping set with x-column
	const extendedSets = sets.map((set) => {
		if (set === '') {
			// Empty set () becomes (x-column)
			return `(${xColumn})`;
		} else {
			// Non-empty set (a, b) becomes (a, b, x-column)
			return `(${set}, ${xColumn})`;
		}
	});

	return `GROUP BY GROUPING SETS (${extendedSets.join(', ')})`;
}

/**
 * Context needed for building sparkline queries
 */
export interface SparklineContext {
	tableExpression: string;
	whereClause: string;
	groupByClause: string;
	filterSql?: string;
	processedColumns: ProcessedColumnExpression[];
	userWhere?: string;
	dateFilterSql?: string;
}

/**
 * Configuration for a sparkline calculation
 */
export interface SparklineQueryConfig {
	id: string;
	xColumn: string;
	yColumn: string;
	type?: 'line' | 'area' | 'bar';
	date_range?: DateRangeObject;
	date_grain?: string;
}

/**
 * Main function to build all sparkline-related SQL
 */
export function buildSparklines(
	sparklines: SparklineQueryConfig[],
	context?: SparklineContext | undefined,
	anchorDate?: Date,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday',
	dialect: SqlDialect = defaultDialect
): QueryExtension {
	const inlineColumns: string[] = [];
	const fragments: Fragment[] = [];

	// Extract dimension columns once
	const dimensionColumns =
		context?.processedColumns.filter((col) => col.type === 'dimension' || col.type === 'pivot') ||
		[];

	const hasDimensions = dimensionColumns.length > 0;

	// Check if there are any measures in the query
	const hasMeasures = context?.processedColumns.some((col) => col.type === 'measure') || false;

	// When sparklines exist but no measures are present, we need to add a dummy measure
	// to force GROUP BY aggregation which generates the subtotal rows that sparklines join against
	if (sparklines.length > 0 && !hasMeasures) {
		inlineColumns.push(`count(*) as ${dialect.quoteAlias('__ev_count')}`);
	}

	let fragmentIndex = 1;

	for (const sparkline of sparklines) {
		if (!hasDimensions) {
			// For single-value components (BigValue), use inline subqueries
			const inlineSubquery = buildSparklineInlineSubquery(
				sparkline,
				context,
				anchorDate,
				firstDayOfWeek,
				dialect
			);
			inlineColumns.push(inlineSubquery);
		} else {
			// For multi-dimensional components, use fragments
			const fragmentAlias = `sparkline_${fragmentIndex}_fragment`;

			const cteSql = buildSparklineCTE(
				sparkline,
				dimensionColumns,
				context,
				anchorDate,
				firstDayOfWeek,
				dialect
			);
			const joinSql = buildSparklineJoin(dimensionColumns, fragmentAlias, dialect);
			const calculationColumns = [`${fragmentAlias}.${dialect.quoteAlias(sparkline.id)}`];

			if (cteSql && joinSql) {
				fragments.push({ cteSql, joinSql, calculationColumns, alias: fragmentAlias });
			}

			fragmentIndex++;
		}
	}

	return { inlineColumns, fragments };
}

/**
 * Build inline sparkline subquery for single-value results
 */
function buildSparklineInlineSubquery(
	sparkline: SparklineQueryConfig,
	context?: SparklineContext | undefined,
	anchorDate?: Date,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday',
	dialect: SqlDialect = defaultDialect
): string {
	if (!context) return '';

	// Process x column for date grain if specified
	const processedXColumn = sparkline.date_grain
		? getDateGrainSql(sparkline.date_grain, sparkline.xColumn, firstDayOfWeek, dialect)
		: sparkline.xColumn;

	// Build WHERE clause
	const whereParts: string[] = [];
	if (context.filterSql) whereParts.push(context.filterSql);
	if (context.userWhere) whereParts.push(context.userWhere);

	// Add date filtering if specified
	if (sparkline.date_range?.range && sparkline.date_range.range !== 'all time') {
		const processed = processDateRange(
			sparkline.date_range.range,
			sparkline.xColumn,
			anchorDate,
			firstDayOfWeek,
			dialect
		);
		if (processed.whereClause) whereParts.push(processed.whereClause);
	}

	const whereClause =
		whereParts.length > 0 ? `WHERE ${whereParts.map((part) => `(${part})`).join(' AND ')}` : '';

	// Determine if we need aggregation
	const hasAggregation = hasAgg(sparkline.yColumn, dialect);
	const aggregatedY = hasAggregation ? sparkline.yColumn : `sum(${sparkline.yColumn})`;

	// Build the inline subquery. T-SQL/Fabric (strictDerivedTables) can't GROUP BY
	// a SELECT alias, can't ORDER BY inside a derived table, and requires the
	// derived table to be aliased — so group by the x *expression*, drop the inner
	// ORDER BY (the groupArray already orders WITHIN GROUP), and alias the source.
	const groupArrayExpr = dialect.groupArray('x_val', 'y_val');
	const innerGroupBy = dialect.strictDerivedTables
		? `GROUP BY ${processedXColumn}`
		: 'GROUP BY x_val';
	const innerOrderBy = dialect.strictDerivedTables ? '' : '\n\t\t\tORDER BY x_val';
	const sourceAlias = dialect.strictDerivedTables
		? ` as ${dialect.quoteAlias('__ev_spark_src')}`
		: '';
	return `(
		SELECT ${groupArrayExpr}
		FROM (
			SELECT ${processedXColumn} as x_val, ${aggregatedY} as y_val
			FROM ${context.tableExpression}
			${whereClause}
			${innerGroupBy}${innerOrderBy}
		)${sourceAlias}
	) as ${dialect.quoteAlias(sparkline.id)}`;
}

/**
 * Build the CTE SQL for sparkline fragments
 * Uses two-step approach: inner query with extended GROUPING SETS, outer query with groupArray
 */
function buildSparklineCTE(
	sparkline: SparklineQueryConfig,
	dimensionColumns: ProcessedColumnExpression[],
	context?: SparklineContext | undefined,
	anchorDate?: Date,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday',
	dialect: SqlDialect = defaultDialect
): string {
	if (!context) return '';

	// Process x column for date grain if specified
	const processedXColumn = sparkline.date_grain
		? getDateGrainSql(sparkline.date_grain, sparkline.xColumn, firstDayOfWeek, dialect)
		: sparkline.xColumn;

	// Determine if we need aggregation for the y column
	const hasAggregation = hasAgg(sparkline.yColumn, dialect);
	const aggregatedY = hasAggregation ? sparkline.yColumn : `sum(${sparkline.yColumn})`;

	// Build WHERE clause for the inner query
	const whereParts: string[] = [];
	if (context.filterSql) whereParts.push(context.filterSql);
	if (context.userWhere) whereParts.push(context.userWhere);

	// Add date filtering if specified
	if (sparkline.date_range?.range && sparkline.date_range.range !== 'all time') {
		const processed = processDateRange(
			sparkline.date_range.range,
			sparkline.xColumn,
			anchorDate,
			firstDayOfWeek,
			dialect
		);
		if (processed.whereClause) whereParts.push(processed.whereClause);
	}

	const whereClause =
		whereParts.length > 0 ? `WHERE ${whereParts.map((part) => `(${part})`).join(' AND ')}` : '';

	// Extend the main query's GROUPING SETS with x-column (like comparisons but with time dimension)
	const sparklineGroupingSets = extendGroupingSetsWithXColumn(
		context.groupByClause,
		processedXColumn,
		dimensionColumns
	);

	// Build inner CTE SQL - gets time-series data with subtotals
	const innerSelectParts: string[] = [];

	// Add dimension columns
	if (dimensionColumns.length > 0) {
		const dimensionSelects = dimensionColumns
			.filter((col) => col.type === 'dimension' || col.type === 'pivot')
			.map((col) => col.sqlWithAlias);
		innerSelectParts.push(...dimensionSelects);
	}

	// Add x and y columns
	innerSelectParts.push(`${processedXColumn} as x_val`);
	innerSelectParts.push(`${aggregatedY} as y_val`);

	const innerSelectClause = innerSelectParts.join(', ');

	const innerCteSQL = normalizeWhitespace(
		`
		SELECT ${innerSelectClause}
		FROM ${context.tableExpression}
		${whereClause}
		${sparklineGroupingSets}
	`.trim()
	);

	// Build outer query - aggregates time-series into sparklines
	const outerSelectParts: string[] = [];

	// Add dimension columns for outer SELECT
	if (dimensionColumns.length > 0) {
		const outerDimensionSelects = dimensionColumns
			.filter((col) => col.type === 'dimension' || col.type === 'pivot')
			.map((col) => col.alias);
		outerSelectParts.push(...outerDimensionSelects);
	}

	// Add sparkline aggregation
	const groupArrayExpr = dialect.groupArray('x_val', 'y_val');
	outerSelectParts.push(`${groupArrayExpr} as ${dialect.quoteAlias(sparkline.id)}`);

	const outerSelectClause = outerSelectParts.join(', ');

	// Build outer GROUP BY - just dimensions (no x-column)
	const outerGroupBy =
		dimensionColumns.length > 0
			? `GROUP BY ${dimensionColumns
					.filter((col) => col.type === 'dimension' || col.type === 'pivot')
					.map((col) => col.alias)
					.join(', ')}`
			: '';

	// Combine into final CTE SQL using subquery. T-SQL/Fabric requires the derived
	// table to be aliased; the outer GROUP BY then references its (real) columns.
	const sourceAlias = dialect.strictDerivedTables
		? ` as ${dialect.quoteAlias('__ev_spark_src')}`
		: '';
	return normalizeWhitespace(
		`
		SELECT ${outerSelectClause}
		FROM (${innerCteSQL})${sourceAlias}
		${outerGroupBy}
	`.trim()
	);
}

/**
 * Build the JOIN SQL for sparkline fragments
 */
function buildSparklineJoin(
	dimensionColumns: ProcessedColumnExpression[],
	fragmentAlias: string,
	dialect: SqlDialect = defaultDialect
): string {
	if (dimensionColumns.length === 0) {
		return `LEFT JOIN ${fragmentAlias} ON 1 = 1`;
	}

	// Build join conditions for each dimension
	const joinConditions = dimensionColumns.map((dimension) => {
		const mainRef = `main_query.${dialect.quoteAlias(dimension.alias)}`;
		const fragmentRef = `${fragmentAlias}.${dialect.quoteAlias(dimension.alias)}`;
		// Use NULL-safe equality for subtotal compatibility
		return dialect.nullSafeEqual(mainRef, fragmentRef);
	});

	return `LEFT JOIN ${fragmentAlias} ON ${joinConditions.join(' AND ')}`;
}

/**
 * Reserved prefix for Evidence-generated sparkline columns. Lives in the
 * `__ev_` namespace (alongside `__ev_count`, comparison columns) so it
 * can't collide with user-named columns. The BigQuery client uses
 * `isSparklineColumnId` to identify these for JSON-string deserialization.
 */
export const SPARKLINE_COLUMN_PREFIX = '__ev_sparkline_';

export function isSparklineColumnId(name: string): boolean {
	return name.startsWith(SPARKLINE_COLUMN_PREFIX);
}

export function generateSparklineId(valueColumn: string): string {
	const cleanName = cleanIdentifier(valueColumn);
	return `${SPARKLINE_COLUMN_PREFIX}${cleanName}`;
}

/**
 * Build sparkline query configuration from props
 */
export function buildSparklineQueryConfig(props: {
	x: string;
	y: string;
	type?: string;
	date_range?: DateRangeObject;
	date_grain?: string;
}): SparklineQueryConfig {
	const id = generateSparklineId(props.y);

	return {
		id,
		xColumn: props.x,
		yColumn: props.y,
		type: props.type as 'line' | 'area' | 'bar',
		date_range: props.date_range,
		date_grain: props.date_grain
	};
}

/**
 * Sparkline metadata interface for components
 */
export interface Sparkline {
	x: string;
	y: string;
	type?: 'line' | 'area' | 'bar';
	date_range?: DateRangeObject;
	date_grain?: string;
	// Display properties
	x_fmt?: string;
	y_fmt?: string;
	color?: string;
	fit_to_data?: boolean;
	interactive?: boolean;
	class_name?: string;
	filters?: string[];
}

/**
 * Props interface for sparkline columns in components
 * This interface is specifically for component prop validation and UI concerns
 */
export interface SparklineColumnProps {
	id: string;
	type?: 'line' | 'area' | 'bar';
	x?: string;
	y: string;
	x_fmt?: string;
	y_fmt?: string;
	color?: string;
	fit_to_data?: boolean;
	interactive?: boolean;
	class_name?: string;
	date_range?: DateRangeObject;
	date_grain?: string;
	filters?: string[];
}
