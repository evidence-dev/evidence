import type { QueryExtension, Fragment } from './sql-options';
import type { DateRangeObject } from './date-options';
import type { ProcessedColumnExpression } from './sql-expression-utils';
import type { SqlDialect } from '../../sql-dialect';
import { defaultDialect } from '../../sql-dialect';
import { cleanIdentifier, processColumnExpression } from './sql-expression-utils';
import { getGrainRank, processDateRange } from './date-options';

// Dialect-aware SQL helpers.
function da(
	dialect: SqlDialect = defaultDialect,
	unit: string,
	amount: number | string,
	col: string
): string {
	return dialect.dateAdd(unit, amount, col);
}
function ds(
	dialect: SqlDialect = defaultDialect,
	unit: string,
	amount: number | string,
	col: string
): string {
	return dialect.dateSub(unit, amount, col);
}
/**
 * Context needed for building comparison queries
 */
export interface ComparisonContext {
	tableExpression: string;
	whereClause: string;
	groupByClause: string;
	filterSql?: string;
	processedColumns: ProcessedColumnExpression[];
	// Additional context for temporal CTEs
	userWhere?: string; // User's custom WHERE clause
	dateFilterSql?: string; // Date range filter from main query
	// Date range and dimension context
	dateRange?: DateRangeObject; // Table-level date range
	dateDimensionExpression?: string; // The actual dimension expression (e.g., "toStartOfMonth(date)")
	dateDimensionGrain?: string; // The grain (e.g., "month")
	/** Flag indicating that the parent query has subtotals enabled (GROUPING SETS, helper columns, etc.) */
	subtotalsEnabled?: boolean;
}

// ============================================================================
// Temporal Dimension Augmentation for Benchmarks
// ============================================================================

/**
 * Augments a benchmark config with temporal dimensions from the context.
 *
 * When a table/component has date dimensions (e.g., month, quarter), the benchmark
 * should calculate per-period values rather than a single grand average.
 *
 * This function keeps temporal logic isolated from the core benchmark CTE generation,
 * making it easy to test and modify independently.
 *
 * @param benchmark - The original benchmark configuration
 * @param allDimensions - All dimension columns from the context
 * @returns A new benchmark config with temporal dimensions added to `within`
 */
export function augmentBenchmarkWithTemporalDimensions(
	benchmark: BenchmarkConfig,
	allDimensions: ProcessedColumnExpression[]
): BenchmarkConfig {
	// Find temporal dimensions (columns with isTemporalDateGrain = true)
	const temporalDims = allDimensions.filter((d) => d.isTemporalDateGrain).map((d) => d.alias);

	// If no temporal dimensions, return unchanged
	if (temporalDims.length === 0) {
		return benchmark;
	}

	// Get existing within dimensions
	const existingWithin = benchmark.within ?? [];

	// Add temporal dims that aren't already in within
	const newWithin = [...existingWithin];
	for (const tempDim of temporalDims) {
		if (!newWithin.includes(tempDim)) {
			newWithin.push(tempDim);
		}
	}

	// If nothing changed, return original
	if (newWithin.length === existingWithin.length) {
		return benchmark;
	}

	// Return augmented config (immutable - creates new object)
	return {
		...benchmark,
		within: newWithin
	};
}

/**
 * Group benchmark comparisons by compatibility signature
 * Comparisons that can share a single CTE/JOIN are grouped together
 */
function groupBenchmarkComparisons(
	comparisons: ComparisonQueryConfig[],
	context: ComparisonContext | undefined
): Map<string, ComparisonQueryConfig[]> {
	const groups = new Map<string, ComparisonQueryConfig[]>();

	for (const comparison of comparisons) {
		const benchmark = comparison.benchmark;
		if (!benchmark) continue;

		// Create a signature that captures all factors that must match for CTEs to be compatible
		const signature = JSON.stringify({
			// Benchmark-specific properties
			agg: benchmark.agg,
			subject: benchmark.subject,
			value: benchmark.value, // Include value so benchmarks with different expressions aren't grouped
			within: (benchmark.within ?? []).sort(),
			where: benchmark.where,
			exclude_self: benchmark.exclude_self ?? false,
			// Context properties that affect query
			tableExpression: context?.tableExpression,
			filterSql: context?.filterSql,
			userWhere: context?.userWhere,
			groupByClause: context?.groupByClause,
			subtotalsEnabled: context?.subtotalsEnabled
		});

		if (!groups.has(signature)) {
			groups.set(signature, []);
		}
		groups.get(signature)!.push(comparison);
	}

	return groups;
}

/**
 * Map aggregation function names to SQL functions
 */
function mapAggFunction(agg: string): string {
	const mapping: Record<string, string> = {
		avg: 'avg',
		median: 'median',
		min: 'min',
		max: 'max',
		sum: 'sum',
		count: 'count'
	};
	return mapping[agg] || agg;
}

/**
 * Build a SQL aggregate expression, using dialect.countDistinct for count_distinct
 */
function buildAggExpression(
	agg: string,
	column: string,
	dialect: SqlDialect = defaultDialect
): string {
	if (agg === 'count_distinct') {
		return dialect.countDistinct(column);
	}
	return `${mapAggFunction(agg)}(${column})`;
}

/**
 * Build benchmark CTE SQL for a group of compatible comparisons
 */
function buildBenchmarkCTE(
	comparisons: ComparisonQueryConfig[],
	allDimensions: ProcessedColumnExpression[],
	context: ComparisonContext,
	dialect: SqlDialect = defaultDialect
): string {
	const q = (alias: string) => dialect.quoteAlias(alias);
	const firstComparison = comparisons[0];
	const benchmark = firstComparison.benchmark!;
	// Normalize user-supplied identifiers via the dialect so they match the alias
	// casing that the main_query columns use (Snowflake uppercases; ClickHouse is identity).
	const benchmarkSubject = benchmark.subject ? dialect.formatAlias(benchmark.subject) : undefined;
	// Drop nullish entries — a within column that failed to resolve would crash formatAlias.
	const benchmarkWithin = (benchmark.within ?? [])
		.filter(Boolean)
		.map((d) => dialect.formatAlias(d));
	const excludeSelf = benchmark.exclude_self ?? false;
	const whereClause = benchmark.where;

	// Step 1: Build subject_totals CTE (calculate measures at subject grain)
	// Subject grain = table dimensions + benchmark groups + subject column

	// Table dimensions (from main table structure)
	const tableDimensionSelects = allDimensions.map(
		(col) => `${col.sqlWithoutAlias} as ${q(col.alias)}`
	);
	const tableDimensionAliases = allDimensions.map((col) => col.alias);

	// Benchmark within dimensions (may not be in table - e.g., "region" for BigValue)
	const additionalWithinDimensions = benchmarkWithin.filter(
		(dim) => !tableDimensionAliases.includes(dim)
	);
	const withinDimensionSelects = additionalWithinDimensions.map((dim) => `${dim} as ${q(dim)}`);

	// Subject column (defines individual entities - e.g., "store_name")
	// Only add if not already in dimensions
	const allDimensionNames = [...tableDimensionAliases, ...additionalWithinDimensions];
	const subjectSelect =
		benchmarkSubject && !allDimensionNames.includes(benchmarkSubject)
			? [`${benchmarkSubject} as ${q(benchmarkSubject)}`]
			: [];

	const allDimensionSelects = [
		...tableDimensionSelects,
		...withinDimensionSelects,
		...subjectSelect
	];
	const measureSelects = comparisons.map((comp) => {
		// Use benchmark.value if provided, otherwise use the main valueColumn
		const valueExpr = comp.benchmark?.value || comp.valueColumn;
		return `${valueExpr} as ${q(`${comp.id}_subject_total`)}`;
	});

	// Build WHERE clause for subject_totals
	// IMPORTANT: Benchmarks exclude component-level filters (filterSql, userWhere)
	// This allows benchmarks to calculate across all data, not just the filtered subset
	// Users can explicitly add filters via benchmark.where if needed
	const whereParts: string[] = [];
	// Do NOT include context.filterSql (page filters) or context.userWhere (component WHERE)
	// Only include date filters and explicit benchmark.where
	if (context.dateFilterSql) whereParts.push(`(${context.dateFilterSql})`);
	if (whereClause) whereParts.push(`(${whereClause})`);
	const whereSQL = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

	// Build GROUP BY: all dimensions (table + within + subject)
	const subjectColumn =
		benchmarkSubject && !allDimensionNames.includes(benchmarkSubject) ? [benchmarkSubject] : [];
	const allGroupByColumns = [
		...tableDimensionAliases,
		...additionalWithinDimensions,
		...subjectColumn
	];
	const groupBySQL = allGroupByColumns.length > 0 ? `GROUP BY ${allGroupByColumns.join(', ')}` : '';

	const subjectTotalsCTE = `
		SELECT 
			${[...allDimensionSelects, ...measureSelects].join(',\n\t\t\t')}
		FROM ${context.tableExpression}
		${whereSQL}
		${groupBySQL}
	`.trim();

	// Step 2: Build benchmark aggregation
	if (!excludeSelf) {
		// Simple case: aggregate to benchmark within groups
		const benchmarkGroupBy =
			benchmarkWithin.length > 0 ? `GROUP BY ${benchmarkWithin.map((d) => q(d)).join(', ')}` : '';

		const benchmarkSelects = benchmarkWithin.map((d) => q(d));
		const benchmarkAggs = comparisons.map((comp) => {
			const agg = comp.benchmark!.agg;
			return `${buildAggExpression(agg, q(`${comp.id}_subject_total`), dialect)} as ${q(`${comp.id}_benchmark`)}`;
		});

		return `
			WITH subject_totals AS (${subjectTotalsCTE})
			SELECT
				${[...benchmarkSelects, ...benchmarkAggs].join(',\n\t\t\t\t')}
			FROM subject_totals
			${benchmarkGroupBy}
		`.trim();
	} else {
		// Exclude self case: two approaches based on aggregation type
		// - AVG: Window function math (sum - self) / (count - 1) - O(n), single pass
		// - Other aggs (median, min, max): Self-JOIN to exclude current row - required because
		//   these aggregations can't be computed without seeing all other values
		const firstAgg = firstComparison.benchmark!.agg;

		// For avg: use window function optimization
		if (firstAgg === 'avg' && comparisons.every((c) => c.benchmark!.agg === 'avg')) {
			const partitionBy =
				benchmarkWithin.length > 0
					? `PARTITION BY ${benchmarkWithin.map((d) => q(d)).join(', ')}`
					: '';

			const allDimensionSelects = allDimensions.map((col) => q(col.alias));
			const benchmarkCalcs = comparisons.map(
				(comp) => `
					(sum(${q(`${comp.id}_subject_total`)}) OVER (${partitionBy}) - ${q(`${comp.id}_subject_total`)}) /
					(count(*) OVER (${partitionBy}) - 1) as ${q(`${comp.id}_benchmark`)}
				`
			);

			return `
				WITH subject_totals AS (${subjectTotalsCTE})
				SELECT
					${[...allDimensionSelects, ...benchmarkCalcs].join(',\n\t\t\t\t')}
				FROM subject_totals
			`.trim();
		}

		// For other aggregations: use JOIN approach
		const partitionConditions =
			benchmarkWithin.length > 0
				? benchmarkWithin.map((d) => `t1.${q(d)} = t2.${q(d)}`).join(' AND ')
				: '1=1';

		// Build exclude condition: based on subject (if specified) or all dimensions
		let excludeCondition: string;
		if (benchmarkSubject) {
			// Exclude based on subject column
			excludeCondition = `t1.${q(benchmarkSubject)} != t2.${q(benchmarkSubject)}`;
		} else if (allDimensions.length > 0) {
			// Exclude based on all dimensions (OR condition - different in any dimension)
			excludeCondition = allDimensions
				.map((col) => `t1.${q(col.alias)} != t2.${q(col.alias)}`)
				.join(' OR ');
		} else {
			// No way to identify entities - shouldn't happen with validation
			excludeCondition = '1=0'; // Never exclude (degenerate case)
		}

		// SELECT columns: all grouping dimensions
		const selectColumns: string[] = [];

		// Add benchmark within dimensions
		benchmarkWithin.forEach((d: string) => selectColumns.push(`t1.${q(d)}`));

		// Add subject if specified and not already in within
		if (benchmarkSubject && !benchmarkWithin.includes(benchmarkSubject)) {
			selectColumns.push(`t1.${q(benchmarkSubject)}`);
		}

		// Add table dimensions
		allDimensions.forEach((col) => {
			const colRef = `t1.${q(col.alias)}`;
			if (!selectColumns.includes(colRef)) {
				selectColumns.push(colRef);
			}
		});

		const benchmarkAggs = comparisons.map((comp) => {
			const agg = comp.benchmark!.agg;
			return `${buildAggExpression(agg, `t2.${q(`${comp.id}_subject_total`)}`, dialect)} as ${q(`${comp.id}_benchmark`)}`;
		});

		return `
			WITH subject_totals AS (${subjectTotalsCTE})
			SELECT 
				${[...selectColumns, ...benchmarkAggs].join(',\n\t\t\t\t')}
			FROM subject_totals t1
			LEFT JOIN subject_totals t2 
				ON ${partitionConditions}
				AND (${excludeCondition})
			GROUP BY ${selectColumns.join(', ')}
		`.trim();
	}
}

/**
 * Build benchmark JOIN SQL
 * Maps benchmark group dimensions to their actual aliases in main_query (which may be __benchmark_ prefixed)
 */
function buildBenchmarkJoin(
	fragmentAlias: string,
	rawBenchmarkWithin: string[],
	rawBenchmarkSubject: string | undefined,
	allDimensions: ProcessedColumnExpression[],
	excludeSelf: boolean,
	context: ComparisonContext,
	dialect: SqlDialect = defaultDialect
): string {
	const q = (alias: string) => dialect.quoteAlias(alias);
	const benchmarkWithin = rawBenchmarkWithin.filter(Boolean).map((d) => dialect.formatAlias(d));
	const benchmarkSubject = rawBenchmarkSubject
		? dialect.formatAlias(rawBenchmarkSubject)
		: undefined;
	if (excludeSelf) {
		// Exclude self: join on within + subject + table dimensions
		const joinDimensions: string[] = [];

		// Add within dimensions
		joinDimensions.push(...benchmarkWithin);

		// Add subject (needed to identify which entity to exclude)
		if (benchmarkSubject && !joinDimensions.includes(benchmarkSubject)) {
			joinDimensions.push(benchmarkSubject);
		}

		// Add table dimensions
		allDimensions.forEach((d) => {
			if (!joinDimensions.includes(d.alias)) {
				joinDimensions.push(d.alias);
			}
		});

		if (joinDimensions.length === 0) {
			return `LEFT JOIN ${fragmentAlias} ON 1=1`;
		}

		const joinConditions = joinDimensions
			.map((dim) => {
				// Find actual alias in main_query
				const mainQueryColumn = context.processedColumns.find(
					(col) => col.alias === dim || col.alias === `__benchmark_${dim}`
				);
				const mainQueryAlias = mainQueryColumn?.alias || dim;
				return dialect.nullSafeEqual(
					`main_query.${q(mainQueryAlias)}`,
					`${fragmentAlias}.${q(dim)}`
				);
			})
			.join(' AND ');

		return `LEFT JOIN ${fragmentAlias} ON ${joinConditions}`;
	}

	// Include mode: join on benchmark within dimensions only
	if (benchmarkWithin.length === 0) {
		// No within: cartesian (every row gets same benchmark)
		return `LEFT JOIN ${fragmentAlias} ON 1=1`;
	}

	// Build join conditions, mapping benchmark within dimensions to their aliases in main_query
	// The benchmark within dimension might be:
	//   1. A regular table dimension (alias = dimension name)
	//   2. A hidden measure (alias = __benchmark_{dimension name})
	const joinConditions = benchmarkWithin
		.map((dim) => {
			// Search through ALL columns (dimensions + measures) to find this benchmark group
			const mainQueryColumn = context.processedColumns.find(
				(col) => col.alias === dim || col.alias === `__benchmark_${dim}`
			);

			const mainQueryAlias = mainQueryColumn?.alias || dim;

			return dialect.nullSafeEqual(`main_query.${q(mainQueryAlias)}`, `${fragmentAlias}.${q(dim)}`);
		})
		.join(' AND ');

	return `LEFT JOIN ${fragmentAlias} ON ${joinConditions}`;
}

/**
 * Build benchmark calculation columns for a single comparison
 */
function buildBenchmarkCalculationColumns(
	comparison: ComparisonQueryConfig,
	fragmentAlias: string,
	dialect: SqlDialect = defaultDialect
): string[] {
	const q = (alias: string) => dialect.quoteAlias(alias);
	const benchmarkValueCol = `${fragmentAlias}.${q(`${comparison.id}_benchmark`)}`;
	const currentValueCol = `main_query.${q(comparison.valueColumnAlias!)}`;

	return [
		// Compared value: benchmark value
		`${benchmarkValueCol} as ${q(`${comparison.id}_compared_value`)}`,

		// Absolute change: (current - benchmark)
		`(${currentValueCol} - ${benchmarkValueCol}) * 1.0 as ${q(`${comparison.id}_abs`)}`,

		// Percentage change: (current - benchmark) / benchmark
		`((${currentValueCol} - ${benchmarkValueCol}) * 1.0 / nullIf(abs(${benchmarkValueCol}), 0)) as ${q(`${comparison.id}_pct`)}`
	];
}

/**
 * Build benchmark fragments for all benchmark comparisons
 */
function buildBenchmarkFragments(
	comparisons: ComparisonQueryConfig[],
	dimensionColumns: ProcessedColumnExpression[],
	context: ComparisonContext,
	dialect: SqlDialect = defaultDialect
): Fragment[] {
	if (comparisons.length === 0) return [];

	// Group comparisons by compatibility
	const groups = groupBenchmarkComparisons(comparisons, context);
	const fragments: Fragment[] = [];

	let fragmentIndex = 1;
	for (const group of groups.values()) {
		const fragmentAlias = `benchmark_${fragmentIndex}_fragment`;

		const firstComparison = group[0];
		const originalBenchmark = firstComparison.benchmark!;

		// Augment benchmark with temporal dimensions for per-period calculations
		// This ensures benchmarks work correctly with date dimensions (e.g., monthly tables)
		const augmentedBenchmark = augmentBenchmarkWithTemporalDimensions(
			originalBenchmark,
			dimensionColumns
		);

		const benchmarkWithin = augmentedBenchmark.within ?? [];
		const excludeSelf = augmentedBenchmark.exclude_self ?? false;

		// Create augmented comparisons for CTE generation
		const augmentedGroup = group.map((comp) => ({
			...comp,
			benchmark: augmentedBenchmark
		}));

		// Build CTE with augmented benchmark
		const cteSql = buildBenchmarkCTE(augmentedGroup, dimensionColumns, context, dialect);

		// Build JOIN (use augmented within + subject for join dimensions)
		const joinSql = buildBenchmarkJoin(
			fragmentAlias,
			benchmarkWithin,
			augmentedBenchmark.subject,
			dimensionColumns,
			excludeSelf,
			context,
			dialect
		);

		// Build calculation columns for all comparisons in group
		const calculationColumns = group.flatMap((comp) =>
			buildBenchmarkCalculationColumns(comp, fragmentAlias, dialect)
		);

		fragments.push({
			cteSql,
			joinSql,
			calculationColumns,
			alias: fragmentAlias
		});

		fragmentIndex++;
	}

	return fragments;
}

/**
 * Main function to build all comparison-related SQL
 */
export function buildComparisons(
	comparisons: ComparisonQueryConfig[],
	context?: ComparisonContext | undefined,
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

	// Separate comparisons by type
	const targetComparisons = comparisons.filter((c) => c.compare_vs === 'target');
	const temporalComparisons = comparisons.filter(
		(c) => c.compare_vs === 'prior year' || c.compare_vs === 'prior period'
	);
	const benchmarkComparisons = comparisons.filter((c) => c.compare_vs === 'benchmark');

	// Process target comparisons (always inline)
	for (const comparison of targetComparisons) {
		const targetInlineColumns = buildTargetInlineColumns(comparison, context, dialect);
		inlineColumns.push(...targetInlineColumns);
	}

	// Process benchmark comparisons (fragment system)
	if (benchmarkComparisons.length > 0 && context) {
		const benchmarkFragments = buildBenchmarkFragments(
			benchmarkComparisons,
			dimensionColumns,
			context,
			dialect
		);
		fragments.push(...benchmarkFragments);
	}

	// Group temporal comparisons by compatibility signature
	const groupedComparisons = groupTemporalComparisons(
		temporalComparisons,
		context,
		firstDayOfWeek,
		dialect
	);

	// Build one fragment per group
	let fragmentIndex = 1;
	for (const group of groupedComparisons.values()) {
		const fragmentAlias = `comparison_${fragmentIndex}_fragment`;

		// All comparisons in the group share the same dateInfo - use the first one
		const firstComparison = group[0];
		const dateInfo = processTemporalDateInfo(
			firstComparison,
			context,
			anchorDate,
			firstDayOfWeek,
			dialect
		);

		// Add date range display columns for each comparison in the group
		for (const comparison of group) {
			const dateRangeColumns = buildDateRangeDisplayColumns(comparison, dateInfo, context, dialect);
			inlineColumns.push(...dateRangeColumns);
		}

		// Build a combined CTE that includes all measures from this group
		const cteSql = buildCombinedCTE(
			group,
			dimensionColumns,
			context!.tableExpression,
			context!.userWhere,
			context!.filterSql,
			context!.groupByClause,
			dateInfo.whereClause,
			context?.subtotalsEnabled,
			dialect
		);

		const joinSql = buildTemporalJoin(context, dateInfo, fragmentAlias, dialect, firstDayOfWeek);

		// Build calculation columns for each comparison in the group
		const allCalculationColumns: string[] = [];
		for (const comparison of group) {
			const calculationColumns = buildCalculationColumns(
				comparison,
				fragmentAlias,
				context,
				dialect
			);
			allCalculationColumns.push(...calculationColumns);
		}

		if (cteSql && joinSql) {
			fragments.push({
				cteSql,
				joinSql,
				calculationColumns: allCalculationColumns,
				alias: fragmentAlias
			});
		}

		fragmentIndex++;
	}

	return { inlineColumns, fragments };
}

/**
 * Group temporal comparisons by compatibility signature
 * Comparisons that can share a single CTE/JOIN are grouped together
 */
function groupTemporalComparisons(
	comparisons: ComparisonQueryConfig[],
	context: ComparisonContext | undefined,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday',
	dialect: SqlDialect = defaultDialect
): Map<string, ComparisonQueryConfig[]> {
	const groups = new Map<string, ComparisonQueryConfig[]>();

	for (const comparison of comparisons) {
		const dateInfo = processTemporalDateInfo(
			comparison,
			context,
			undefined,
			firstDayOfWeek,
			dialect
		);

		// Create a signature that captures all the factors that must match for CTEs to be compatible
		const signature = JSON.stringify({
			tableExpression: context?.tableExpression,
			dimensions: context?.processedColumns
				.filter((col) => col.type === 'dimension' || col.type === 'pivot')
				.map((col) => col.sqlWithoutAlias),
			userWhere: context?.userWhere,
			filterSql: context?.filterSql,
			groupByClause: context?.groupByClause,
			subtotalsEnabled: context?.subtotalsEnabled,
			temporalWhereClause: dateInfo.whereClause,
			offsetGrain: dateInfo.offsetGrain,
			offsetAmount: dateInfo.offsetAmount
		});

		if (!groups.has(signature)) {
			groups.set(signature, []);
		}
		groups.get(signature)!.push(comparison);
	}

	return groups;
}

/**
 * Build a combined CTE that includes multiple measures from compatible comparisons
 */
function buildCombinedCTE(
	comparisons: ComparisonQueryConfig[],
	dimensionColumns: ProcessedColumnExpression[],
	tableExpression: string,
	userWhere?: string,
	filterSql?: string,
	groupByClause?: string,
	temporalWhereClause?: string,
	subtotalsEnabled?: boolean,
	dialect: SqlDialect = defaultDialect
): string {
	const q = (alias: string) => dialect.quoteAlias(alias);
	const selectParts: string[] = [];

	// Add dimension columns
	if (dimensionColumns.length > 0) {
		const dimensionSelects = dimensionColumns.map(
			(col) => `${col.sqlWithoutAlias} as ${col.alias}`
		);
		selectParts.push(...dimensionSelects);

		// Add GROUPING() indicator columns only when subtotals are enabled
		if (subtotalsEnabled) {
			const groupingSelects = dimensionColumns.map(
				(col) => `GROUPING(${col.sqlWithoutAlias}) as ${q(`__ev_grouping_${col.alias}`)}`
			);
			selectParts.push(...groupingSelects);
		}
	}

	// Add all measures from the group
	for (const comparison of comparisons) {
		selectParts.push(`${comparison.valueColumn} as ${q(comparison.id)}`);
	}

	const selectClause = selectParts.join(', ');

	// Build WHERE clause: combine all filters + temporal date range
	const whereParts: string[] = [];
	if (filterSql) whereParts.push(filterSql);
	if (userWhere) whereParts.push(userWhere);
	if (temporalWhereClause) whereParts.push(temporalWhereClause);

	const whereClause =
		whereParts.length > 0 ? `WHERE ${whereParts.map((part) => `(${part})`).join(' AND ')}` : '';

	// Assemble the CTE SQL (reuse GROUP BY exactly from main query)
	return `
		SELECT ${selectClause}
		FROM ${tableExpression}
		${whereClause}
		${groupByClause || ''}
	`.trim();
}

/**
 * Build inline columns for target comparisons
 * Returns: [compared_value, abs_change, pct_change]
 */
function buildTargetInlineColumns(
	comparison: ComparisonQueryConfig,
	_context?: ComparisonContext,
	dialect: SqlDialect = defaultDialect
): string[] {
	const q = (alias: string) => dialect.quoteAlias(alias);
	// Use valueColumnAlias for the main value reference (this is the column alias in the main query)
	const mainValueRef = comparison.valueColumnAlias;
	const targetColumnRef = comparison.targetColumn;

	return [
		// 1. Target value as compared_value
		`${targetColumnRef} as ${q(`${comparison.id}_compared_value`)}`,

		// 2. Absolute change: (main_value - target_value)
		`(${mainValueRef} - ${targetColumnRef}) * 1.0 as ${q(`${comparison.id}_abs`)}`,

		// 3. Percentage change: simple floating-point division for reliable percentage calculation
		`((${mainValueRef} - ${targetColumnRef}) * 1.0 / nullIf(abs(${targetColumnRef}), 0)) as ${q(`${comparison.id}_pct`)}`
	];
}

/**
 * Structured date information for temporal comparisons
 */
interface TemporalDateInfo {
	whereClause: string; // "order_date >= '2022-01-01' AND order_date <= '2022-12-31'"
	offsetGrain: string; // "month", "year", etc. (for date_add function)
	offsetAmount: number; // -1, -6, etc. (amount to add/subtract)
	currentStartDate?: string; // Start date expression for current period
	currentEndDate?: string; // End date expression for current period
	priorStartDate?: string; // prior period start date expression
	priorEndDate?: string; // prior period end date expression
	// Literal date range boundaries derived from the original date_range (if provided)
	rangeStartDate?: string;
	rangeEndDate?: string;
}

/**
 * Process temporal date information for a comparison
 */
function processTemporalDateInfo(
	comparison: ComparisonQueryConfig,
	context?: ComparisonContext | undefined,
	anchorDate?: Date,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday',
	dialect: SqlDialect = defaultDialect
): TemporalDateInfo {
	// for now, assume the table will be able to pass through the date dimension that has the most granular grain

	// step 1: get info we have
	// date range?
	// date dimension?
	const hasDateRange = !!comparison.date_range;
	const hasDateDimension = !!(context?.dateDimensionExpression && context?.dateDimensionGrain);

	// step 2: process date range
	let dateRangeInfo: {
		whereClause: string;
		startDate?: string;
		endDate?: string;
		periodGrain: string;
		periodCount: number;
		isToDate: boolean;
	} | null = null;
	if (hasDateRange) {
		const processed = processDateRange(
			comparison.date_range!.range!,
			comparison.date_range!.date!,
			anchorDate,
			firstDayOfWeek,
			dialect
		);
		if (processed.type !== 'all_time') {
			// Use the flatter structure directly
			dateRangeInfo = {
				whereClause: processed.whereClause,
				startDate: processed.startDateSql,
				endDate: processed.endDateSql,
				periodGrain: processed.periodGrain,
				periodCount: processed.periodCount,
				isToDate: processed.isToDate
			};
		}
	}

	// step 3: process date dimension
	// need:
	// period grain
	// period count (always 1 for date dimension)
	// current start date (the date dimension expression)
	// current end date: date_sub(day, 1, date_add(month, 1, toStartOfMonth(date)))
	let dateDimensionInfo: {
		periodGrain: string;
		periodCount: number;
		currentStartDate: string;
		currentEndDate: string;
	} | null = null;
	if (hasDateDimension) {
		const grain = context!.dateDimensionGrain!;
		const expression = context!.dateDimensionExpression!;
		dateDimensionInfo = {
			periodGrain: grain,
			periodCount: 1, // always 1 for date dimension
			currentStartDate: expression,
			currentEndDate: ds(dialect, 'day', 1, da(dialect, grain, 1, expression))
		};
	}

	// step 4: combine into current period info object: if date dimension use all of that, otherwise use date range info
	// period grain
	// period count
	// currentStartDate
	// currentEndDate
	let currentStartDate: string = '';
	let currentEndDate: string = '';
	let periodGrain: string = '';
	let periodCount: number = 1;

	if (hasDateDimension && dateDimensionInfo) {
		// Date dimension takes priority
		currentStartDate = dateDimensionInfo.currentStartDate;
		currentEndDate = dateDimensionInfo.currentEndDate;
		periodGrain = dateDimensionInfo.periodGrain;
		periodCount = dateDimensionInfo.periodCount;
	} else if (hasDateRange && dateRangeInfo) {
		// Use date range info from explicit date resolution
		currentStartDate = dateRangeInfo.startDate || '';
		currentEndDate = dateRangeInfo.endDate || '';
		periodGrain = dateRangeInfo.periodGrain;
		periodCount = dateRangeInfo.periodCount;
	}

	// step 5: determine offset grain and amount based on current period info + comparison type
	// if comparison type is prior year, offset grain is year, offset amount is 1
	// if comparison type is prior period, offset grain is the same as period grain, offset amount is the same as period count
	let offsetGrain: string = '';
	let offsetAmount: number = 0;

	if (comparison.compare_vs === 'prior year') {
		offsetGrain = 'year';
		offsetAmount = -1;
	} else if (comparison.compare_vs === 'prior period') {
		offsetGrain = periodGrain;
		offsetAmount = -periodCount;
	}

	// step 6: determine prior period info
	// use the offset grain and amount to determine the prior period start and end dates
	// based on the current start and end dates from step 4
	// output: priorStartDate, priorEndDate
	const priorStartDate = currentStartDate
		? da(dialect, offsetGrain, offsetAmount, currentStartDate)
		: '';
	const priorEndDate = currentEndDate ? da(dialect, offsetGrain, offsetAmount, currentEndDate) : '';

	// Build WHERE clause: use the literal date-range bounds (if provided) shifted by the same offset
	let whereClause = '';
	if (
		hasDateRange &&
		dateRangeInfo?.startDate &&
		dateRangeInfo?.endDate &&
		comparison.date_range?.date
	) {
		const dateColumnName = comparison.date_range.date;
		const priorRangeStart = da(dialect, offsetGrain, offsetAmount, dateRangeInfo.startDate);
		const priorRangeEnd = da(dialect, offsetGrain, offsetAmount, dateRangeInfo.endDate);
		whereClause = `${dateColumnName} >= ${priorRangeStart} AND ${dateColumnName} <= ${priorRangeEnd}`;
	}

	const result: TemporalDateInfo = {
		whereClause,
		currentStartDate,
		currentEndDate,
		priorStartDate,
		priorEndDate,
		offsetGrain,
		offsetAmount,
		rangeStartDate: dateRangeInfo?.startDate,
		rangeEndDate: dateRangeInfo?.endDate
	};

	return result;
}

/**
 * Build the JOIN SQL for temporal comparisons
 */
function buildTemporalJoin(
	context?: ComparisonContext,
	dateInfo?: TemporalDateInfo,
	fragmentAlias?: string,
	dialect: SqlDialect = defaultDialect,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday'
): string {
	if (!context?.processedColumns || !fragmentAlias || !dateInfo) {
		return '';
	}
	const q = (alias: string) => dialect.quoteAlias(alias);

	// Extract dimension columns (both dimensions and pivots participate in joins)
	const dimensionColumns = context.processedColumns.filter(
		(col) => col.type === 'dimension' || col.type === 'pivot'
	);

	// Determine if GROUPING helper columns are present
	const subtotalsEnabled = !!context.subtotalsEnabled;

	if (dimensionColumns.length === 0) {
		// No dimensions to join on (BigValue, single-cell tables)
		return `LEFT JOIN ${fragmentAlias} ON 1 = 1`;
	}

	// Identify the most-granular temporal dimension once (matches context.dateDimensionGrain)
	const mostGranularDim = dimensionColumns.find(
		(d) => d.isTemporalDateGrain && d.dateGrain === context.dateDimensionGrain
	);
	const mostGranularRef = mostGranularDim ? `main_query.${q(mostGranularDim.alias)}` : null;

	// Build join conditions for each dimension
	const joinConditions: string[] = [];

	for (const dimension of dimensionColumns) {
		const mainRef = `main_query.${q(dimension.alias)}`;
		const fragmentRef = `${fragmentAlias}.${q(dimension.alias)}`;

		// Determine grouping column reference once per dimension
		const groupingAlias = `__ev_grouping_${dimension.alias}`;
		const groupingRef = `main_query.${q(groupingAlias)}`;

		if (dimension.isTemporalDateGrain) {
			if (dimension.dateGrain && dimension.dateGrain === context.dateDimensionGrain) {
				// Most-granular temporal dimension — apply conditional shift only
				// when this dimension is present (grouping = 0).
				const shifted = da(dialect, dateInfo.offsetGrain, dateInfo.offsetAmount, mainRef);
				const conditionalExpr = subtotalsEnabled
					? dialect.iff(`${groupingRef} = 0`, shifted, mainRef)
					: shifted;
				joinConditions.push(dialect.nullSafeEqual(conditionalExpr, fragmentRef));
			} else {
				// Decide whether we can safely shift this dimension directly
				if (dateInfo.offsetGrain === 'year' || dateInfo.offsetGrain === dimension.dateGrain) {
					const shiftedSelf = da(dialect, dateInfo.offsetGrain, dateInfo.offsetAmount, mainRef);
					const conditionalExpr = subtotalsEnabled
						? dialect.iff(`${groupingRef} = 0`, shiftedSelf, mainRef)
						: shiftedSelf;
					joinConditions.push(dialect.nullSafeEqual(conditionalExpr, fragmentRef));
				} else {
					// For coarser grains, derive from shifted most-granular expression (if available)
					if (mostGranularRef) {
						const baseShifted = da(
							dialect,
							dateInfo.offsetGrain,
							dateInfo.offsetAmount,
							mostGranularRef!
						);
						const derivedShifted = dimension.dateGrain
							? dialect.dateGrain(dimension.dateGrain, baseShifted, firstDayOfWeek)
							: baseShifted;

						const conditionalExpr = subtotalsEnabled
							? dialect.iff(`${groupingRef} = 0`, derivedShifted, mainRef)
							: derivedShifted;
						joinConditions.push(dialect.nullSafeEqual(conditionalExpr, fragmentRef));
					} else {
						// Fallback to raw equality
						joinConditions.push(dialect.nullSafeEqual(mainRef, fragmentRef));
					}
				}
			}
		} else {
			// Non-temporal dimensions — raw equality
			joinConditions.push(dialect.nullSafeEqual(mainRef, fragmentRef));
		}
	}

	return `LEFT JOIN ${fragmentAlias} ON ${joinConditions.join(' AND ')}`;
}

/**
 * Build date range display columns by applying offsets to structured date info
 */
function buildDateRangeDisplayColumns(
	comparison: ComparisonQueryConfig,
	dateInfo: TemporalDateInfo,
	context?: ComparisonContext,
	dialect: SqlDialect = defaultDialect
): string[] {
	const q = (alias: string) => dialect.quoteAlias(alias);
	// Helper to build an end-date expression based on a grain and a reference date expression
	const buildEndDate = (dateExpr: string, grain: string) =>
		ds(dialect, 'day', 1, da(dialect, grain, 1, dateExpr));

	// Gather temporal dimensions once
	let dateDims = context?.processedColumns?.filter(
		(c) => (c.type === 'dimension' || c.type === 'pivot') && c.isTemporalDateGrain
	);

	// If query has NO temporal dimensions (e.g. only non-date dims but has date_range)
	// we should still output literal range strings. Handle that up-front.

	const literalCurrentStart = dateInfo.currentStartDate ?? dateInfo.rangeStartDate;
	const literalCurrentEnd = dateInfo.currentEndDate ?? dateInfo.rangeEndDate;

	const literalPriorStart =
		dateInfo.priorStartDate ??
		(dateInfo.rangeStartDate
			? da(dialect, dateInfo.offsetGrain, dateInfo.offsetAmount, dateInfo.rangeStartDate)
			: undefined);
	const literalPriorEnd =
		dateInfo.priorEndDate ??
		(dateInfo.rangeEndDate
			? da(dialect, dateInfo.offsetGrain, dateInfo.offsetAmount, dateInfo.rangeEndDate)
			: undefined);

	// Helper to build a date-range display expression: "MMM DD/YY - MMM DD/YY".
	// String concatenation goes through the dialect — `||` for ClickHouse/
	// Snowflake/BigQuery, CONCAT(...) for T-SQL/Fabric (which has no `||`).
	const dateRangeDisplay = (startExpr: string, endExpr: string) =>
		`(${dialect.concat([dialect.shortDateLabel(startExpr), "' - '", dialect.shortDateLabel(endExpr)])})`;

	// When there are no temporal dimensions, emit simple literal columns and exit early.
	if (!dateDims || dateDims.length === 0) {
		const cols: string[] = [];
		if (literalCurrentStart && literalCurrentEnd) {
			const currDisplay = dateRangeDisplay(literalCurrentStart, literalCurrentEnd);
			cols.push(`${currDisplay} as ${q(`${comparison.id}_current_period`)}`);
		}
		if (literalPriorStart && literalPriorEnd) {
			const priorDisplay = dateRangeDisplay(literalPriorStart, literalPriorEnd);
			cols.push(`${priorDisplay} as ${q(`${comparison.id}_previous_period`)}`);
		}
		return cols;
	}

	// Build CASE-based dynamic display strings when temporal dimensions are present.
	// Fallback to the fixed dateInfo values when everything is grouped out.

	// Sort by centralised grain ranking (fine → coarse)
	dateDims = dateDims?.sort((a, b) => getGrainRank(a.dateGrain) - getGrainRank(b.dateGrain));

	const buildDynamicDisplay = (isPrior: boolean) => {
		if (!dateDims || dateDims.length === 0) return '';

		const subtotalsEnabled = !!context?.subtotalsEnabled;

		// When subtotals are disabled, use simple dimension-based expressions
		if (!subtotalsEnabled) {
			// For non-subtotal queries, just use the first (finest grain) temporal dimension
			const primaryDim = dateDims[0];
			const alias = primaryDim.alias;
			const grain = primaryDim.dateGrain || 'year';
			const aliasRef = q(alias);

			const startExpr = isPrior
				? da(dialect, dateInfo.offsetGrain, dateInfo.offsetAmount, aliasRef)
				: aliasRef;

			const endExpr = isPrior
				? buildEndDate(da(dialect, dateInfo.offsetGrain, dateInfo.offsetAmount, aliasRef), grain)
				: buildEndDate(aliasRef, grain);

			return dateRangeDisplay(startExpr, endExpr);
		}

		// For subtotal queries, use CASE logic with grouping columns
		const whenClauses: string[] = [];

		// 1) Grand-total clause only if we have explicit table or measure-level range
		if (dateInfo.rangeStartDate && dateInfo.rangeEndDate) {
			const allGroupedCondition = dateDims
				.map((d) => `${q(`__ev_grouping_${d.alias}`)} = 1`)
				.join(' AND ');

			const literalStart = isPrior
				? da(dialect, dateInfo.offsetGrain, dateInfo.offsetAmount, dateInfo.rangeStartDate)
				: `${dateInfo.rangeStartDate}`;

			const literalEnd = isPrior
				? da(dialect, dateInfo.offsetGrain, dateInfo.offsetAmount, dateInfo.rangeEndDate)
				: `${dateInfo.rangeEndDate}`;

			whenClauses.push(
				`WHEN ${allGroupedCondition} THEN ${dateRangeDisplay(literalStart, literalEnd)}`
			);
		}

		// 2) Dimension-specific clauses (quarter/month)…
		for (const dim of dateDims) {
			const alias = dim.alias;
			const grain = dim.dateGrain || 'year';
			const aliasRef = q(alias);
			const groupingRef = q(`__ev_grouping_${alias}`);

			const startExpr = isPrior
				? da(dialect, dateInfo.offsetGrain, dateInfo.offsetAmount, aliasRef)
				: aliasRef;

			const endExpr = isPrior
				? buildEndDate(da(dialect, dateInfo.offsetGrain, dateInfo.offsetAmount, aliasRef), grain)
				: buildEndDate(aliasRef, grain);

			// Use this dimension when it is part of the grouping set (grouping=0)
			whenClauses.push(`WHEN ${groupingRef} = 0 THEN ${dateRangeDisplay(startExpr, endExpr)}`);
		}

		// Fallback expression using the static dateInfo values (for grand-total rows)
		const fallbackStart = isPrior
			? (dateInfo.priorStartDate ?? dateInfo.rangeStartDate)
			: (dateInfo.currentStartDate ?? dateInfo.rangeStartDate);
		const fallbackEnd = isPrior
			? (dateInfo.priorEndDate ?? dateInfo.rangeEndDate)
			: (dateInfo.currentEndDate ?? dateInfo.rangeEndDate);

		if (!fallbackStart || !fallbackEnd) return '';

		return `CASE ${whenClauses.join(' ')} ELSE ${dateRangeDisplay(fallbackStart, fallbackEnd)} END`;
	};

	const currentDisplayCase = buildDynamicDisplay(false);
	const priorDisplayCase = buildDynamicDisplay(true);

	// If for some reason we couldn't build dynamic expressions, keep original behaviour
	const columns: string[] = [];

	if (currentDisplayCase) {
		columns.push(`${currentDisplayCase} as ${q(`${comparison.id}_current_period`)}`);
	}

	if (priorDisplayCase) {
		columns.push(`${priorDisplayCase} as ${q(`${comparison.id}_previous_period`)}`);
	}

	return columns;
}

/**
 * Build the calculation columns that appear in the final SELECT with fragments
 */
function buildCalculationColumns(
	comparison: ComparisonQueryConfig,
	fragmentAlias: string,
	_context?: ComparisonContext,
	dialect: SqlDialect = defaultDialect
): string[] {
	const q = (alias: string) => dialect.quoteAlias(alias);
	// Main query column reference (single source of truth)
	const mainValueRef = `main_query.${q(comparison.valueColumnAlias!)}`;

	// Fragment column reference (the comparison id is used as the column alias in the fragment)
	const fragmentValueRef = `${fragmentAlias}.${q(comparison.id)}`;

	return [
		// Compared value: fragment.value as id_compared_value
		`${fragmentValueRef} as ${q(`${comparison.id}_compared_value`)}`,

		// Absolute change: (main.value - fragment.value) as id_abs
		`(${mainValueRef} - ${fragmentValueRef}) * 1.0 as ${q(`${comparison.id}_abs`)}`,

		// Percentage change: simple floating-point division for reliable percentage calculation
		`((${mainValueRef} - ${fragmentValueRef}) * 1.0 / nullIf(abs(${fragmentValueRef}), 0)) as ${q(`${comparison.id}_pct`)}`
	];
}

/**
 * Configuration for benchmark comparisons
 */
export interface BenchmarkConfig {
	agg: 'avg' | 'median' | 'min' | 'max' | 'sum' | 'count' | 'count_distinct';
	subject?: string; // Column/expression that defines individual entities (required for single-value components)
	value?: string; // Optional column/expression to use for benchmark calculation (if different from main value)
	within?: string[]; // Dimensions to group benchmark by
	where?: string; // SQL WHERE clause to filter which entities are included in benchmark
	exclude_self?: boolean; // Exclude current row from benchmark (table context only, default: false)
}

/**
 * Configuration for a comparison calculation
 */
export interface ComparisonQueryConfig {
	id: string; // unique identifier like 'prior year', 'prior period', 'target', 'benchmark'
	compare_vs: 'prior period' | 'prior year' | 'target' | 'benchmark';
	valueColumn: string; // column to compare (base expression)
	valueColumnAlias?: string; // final column alias in the main query
	targetColumn?: string; // for target comparisons
	date_range?: DateRangeObject; // for temporal comparisons
	dateGrain?: string; // for temporal comparisons
	// Dynamic comparison properties
	hasDateDimensions?: boolean; // whether this is a dynamic dimension-based comparison
	dateDimensions?: string[]; // date dimension expressions for dynamic comparisons
	// Benchmark comparison properties
	benchmark?: BenchmarkConfig; // for benchmark comparisons
}

/**
 * Comparison metadata interface for components
 */
export interface Comparison {
	compare_vs: 'target' | 'prior year' | 'prior period' | 'benchmark';
	display_type: 'abs' | 'pct' | 'compared_value';
	abs_fmt?: string;
	pct_fmt?: string;
	hide_pct?: boolean;
	// Base comparison ID without suffixes (e.g., "__ev_sum_sales_prior year_comparison")
	id?: string;
	// Custom name for display (from comparison_selector custom options)
	name?: string;
	// Date range object for comparison calculations (unified structure)
	date_range?: DateRangeObject;
	// Date grain for temporal comparisons
	dateGrain?: string;
	// Target column for target comparisons
	targetColumn?: string;
	// Benchmark configuration
	benchmark?: BenchmarkConfig;
	// Period count for proper title formatting (e.g., 1 for MoM, 6 for "Last 6 months")
	// Uses date dimension grain if available, otherwise uses date range period grain
	periodCount?: number;
	// Period grain for proper title formatting (e.g., "month" for MoM, "year" for YoY)
	rangePeriodGrain?: string;
	// Period count for date range period. Used to check whether totals should be hidden in pivot data function
	rangePeriodCount?: number;
}

/**
 * Generate a unique comparison ID for use in SQL
 */
export function generateComparisonId(valueColumn: string, comparisonType: string): string {
	// Extract and clean the base expression for naming
	const baseExpr = valueColumn.trim();

	// Convert to clean identifier using centralized function
	const cleanName = cleanIdentifier(baseExpr);

	// Clean up comparison type: trim, lowercase, replace spaces with underscores
	const cleanComparisonType = comparisonType
		.trim()
		.toLowerCase()
		.replace(/[ \t]+/g, '_');

	return `__ev_${cleanName}_${cleanComparisonType}_comparison`;
}

/**
 * Builds a comparison query configuration for use in query execution
 * @param comparison - The comparison configuration object
 * @param processedValue - The processed value column with alias, sqlWithoutAlias, and sqlWithoutAlias
 * @param date_range - The date range object for temporal comparisons
 * @returns A single comparison query configuration or null if no comparison
 */
export function buildComparisonQueryConfig(
	comparison: { compare_vs?: string; target?: string; benchmark?: BenchmarkConfig } | undefined,
	processedValue: Pick<ProcessedColumnExpression, 'alias' | 'sqlWithoutAlias'>,
	date_range?: DateRangeObject
): ComparisonQueryConfig | null {
	if (!comparison || !comparison.compare_vs) {
		return null;
	}

	// Use resolved compare_vs value for ID generation
	const compareVs = comparison.compare_vs?.trim();
	if (!compareVs) {
		return null;
	}

	// For benchmarks, include the agg type in the ID to allow multiple benchmarks with different aggs
	let comparisonType = compareVs;
	if (compareVs === 'benchmark' && comparison.benchmark?.agg) {
		comparisonType = `${compareVs}_${comparison.benchmark.agg}`;
	}

	const comparisonId = generateComparisonId(processedValue.alias, comparisonType);

	// Build base config
	const config: ComparisonQueryConfig = {
		id: comparisonId,
		compare_vs: compareVs as 'prior period' | 'prior year' | 'target' | 'benchmark',
		valueColumn: processedValue.sqlWithoutAlias,
		valueColumnAlias: processedValue.alias,
		date_range: date_range,
		targetColumn: comparison.target
	};

	// Add benchmark config if present
	if (compareVs === 'benchmark' && comparison.benchmark) {
		config.benchmark = comparison.benchmark;
	}

	return config;
}

/**
 * Build the extra dimension columns needed in the main query to support a benchmark.
 *
 * `within` drives GROUP BY; `subject` is added under `exclude_self` so the JOIN can drop "self".
 */
export function buildBenchmarkDimensionColumns(
	comparison: { benchmark?: BenchmarkConfig } | undefined,
	dialect: SqlDialect = defaultDialect
): ProcessedColumnExpression[] {
	const benchmark = comparison?.benchmark;
	if (!benchmark) return [];

	const columns: ProcessedColumnExpression[] = [];
	const within = benchmark.within ?? [];

	for (const dim of within) {
		columns.push(processColumnExpression({ value: dim, type: 'dimension' }, dialect));
	}

	if (benchmark.exclude_self && benchmark.subject && !within.includes(benchmark.subject)) {
		columns.push(processColumnExpression({ value: benchmark.subject, type: 'dimension' }, dialect));
	}

	return columns;
}
