import { describe, it, expect } from 'vitest';
import {
	buildComparisons,
	buildComparisonQueryConfig,
	generateComparisonId,
	augmentBenchmarkWithTemporalDimensions,
	type ComparisonContext,
	type ComparisonQueryConfig,
	type BenchmarkConfig
} from './build-comparisons';
import type { ProcessedColumnExpression } from './sql-expression-utils';
import { ClickHouseDialect } from '../../sql-dialect';

const dialect = new ClickHouseDialect();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a minimal ProcessedColumnExpression for testing
 */
function createDimension(
	alias: string,
	options: {
		sqlWithoutAlias?: string;
		isTemporalDateGrain?: boolean;
		dateGrain?: string;
	} = {}
): ProcessedColumnExpression {
	return {
		alias,
		displayAlias: alias,
		sqlWithoutAlias: options.sqlWithoutAlias ?? alias,
		sqlWithAlias: `${options.sqlWithoutAlias ?? alias} as ${alias}`,
		sqlWithoutDateFiltersOrAlias: options.sqlWithoutAlias ?? alias,
		type: 'dimension',
		isComplexExpression: false,
		hasAgg: false,
		hasDateGrain: false,
		hasDateRange: false,
		isTemporalDateGrain: options.isTemporalDateGrain ?? false,
		dateGrain: options.dateGrain,
		isTableComparison: false,
		isTableSparkline: false
	};
}

// Helper for creating measure columns - prefixed to suppress unused warning, available for future tests
function _createMeasure(alias: string, sqlWithoutAlias: string): ProcessedColumnExpression {
	return {
		alias,
		displayAlias: alias,
		sqlWithoutAlias,
		sqlWithAlias: `${sqlWithoutAlias} as ${alias}`,
		sqlWithoutDateFiltersOrAlias: sqlWithoutAlias,
		type: 'measure',
		isComplexExpression: true,
		hasAgg: true,
		hasDateGrain: false,
		hasDateRange: false,
		isTemporalDateGrain: false,
		isTableComparison: false,
		isTableSparkline: false
	};
}
void _createMeasure;

function createContext(overrides: Partial<ComparisonContext> = {}): ComparisonContext {
	return {
		tableExpression: 'test_table',
		whereClause: '',
		groupByClause: '',
		processedColumns: [],
		...overrides
	};
}

// Helper for normalizing SQL - prefixed to suppress unused warning, available for future tests
function _normalizeSQL(sql: string): string {
	return sql
		.replace(/\s+/g, ' ')
		.replace(/\(\s+/g, '(')
		.replace(/\s+\)/g, ')')
		.replace(/,\s+/g, ', ')
		.trim();
}
void _normalizeSQL; // Suppress unused warning - available for future tests

// ============================================================================
// augmentBenchmarkWithTemporalDimensions Tests
// ============================================================================

describe('augmentBenchmarkWithTemporalDimensions', () => {
	it('should return unchanged benchmark when no temporal dimensions', () => {
		const benchmark: BenchmarkConfig = {
			agg: 'avg',
			subject: 'store_id',
			within: ['region']
		};

		const dimensions = [createDimension('region'), createDimension('category')];

		const result = augmentBenchmarkWithTemporalDimensions(benchmark, dimensions);

		expect(result).toBe(benchmark); // Same reference - no change
		expect(result.within).toEqual(['region']);
	});

	it('should add single temporal dimension to empty within', () => {
		const benchmark: BenchmarkConfig = {
			agg: 'avg',
			subject: 'store_id'
		};

		const dimensions = [
			createDimension('month', {
				sqlWithoutAlias: 'toStartOfMonth(date)',
				isTemporalDateGrain: true,
				dateGrain: 'month'
			})
		];

		const result = augmentBenchmarkWithTemporalDimensions(benchmark, dimensions);

		expect(result).not.toBe(benchmark); // New object
		expect(result.within).toEqual(['month']);
		expect(result.agg).toBe('avg'); // Other props unchanged
		expect(result.subject).toBe('store_id');
	});

	it('should add temporal dimension to existing within', () => {
		const benchmark: BenchmarkConfig = {
			agg: 'avg',
			subject: 'store_id',
			within: ['region']
		};

		const dimensions = [
			createDimension('region'),
			createDimension('month', {
				sqlWithoutAlias: 'toStartOfMonth(date)',
				isTemporalDateGrain: true,
				dateGrain: 'month'
			})
		];

		const result = augmentBenchmarkWithTemporalDimensions(benchmark, dimensions);

		expect(result.within).toEqual(['region', 'month']);
	});

	it('should add multiple temporal dimensions', () => {
		const benchmark: BenchmarkConfig = {
			agg: 'avg',
			subject: 'store_id'
		};

		const dimensions = [
			createDimension('month', {
				isTemporalDateGrain: true,
				dateGrain: 'month'
			}),
			createDimension('quarter', {
				isTemporalDateGrain: true,
				dateGrain: 'quarter'
			})
		];

		const result = augmentBenchmarkWithTemporalDimensions(benchmark, dimensions);

		expect(result.within).toContain('month');
		expect(result.within).toContain('quarter');
		expect(result.within).toHaveLength(2);
	});

	it('should not duplicate temporal dimension already in within', () => {
		const benchmark: BenchmarkConfig = {
			agg: 'avg',
			subject: 'store_id',
			within: ['month', 'region']
		};

		const dimensions = [
			createDimension('region'),
			createDimension('month', {
				isTemporalDateGrain: true,
				dateGrain: 'month'
			})
		];

		const result = augmentBenchmarkWithTemporalDimensions(benchmark, dimensions);

		// Should return same object since nothing changed
		expect(result).toBe(benchmark);
		expect(result.within).toEqual(['month', 'region']);
	});

	it('should preserve other benchmark properties', () => {
		const benchmark: BenchmarkConfig = {
			agg: 'median',
			subject: 'store_id',
			within: ['region'],
			where: 'is_active = true',
			exclude_self: true
		};

		const dimensions = [
			createDimension('month', {
				isTemporalDateGrain: true,
				dateGrain: 'month'
			})
		];

		const result = augmentBenchmarkWithTemporalDimensions(benchmark, dimensions);

		expect(result.agg).toBe('median');
		expect(result.subject).toBe('store_id');
		expect(result.where).toBe('is_active = true');
		expect(result.exclude_self).toBe(true);
		expect(result.within).toEqual(['region', 'month']);
	});
});

// ============================================================================
// generateComparisonId Tests
// ============================================================================

describe('generateComparisonId', () => {
	it('should generate ID for simple column name', () => {
		const id = generateComparisonId('sum_sales', 'prior year');
		expect(id).toBe('__ev_sum_sales_prior_year_comparison');
	});

	it('should generate ID for aggregate expression', () => {
		const id = generateComparisonId('sum(sales)', 'prior year');
		expect(id).toBe('__ev_sum_sales_prior_year_comparison');
	});

	it('should generate ID for benchmark with agg type', () => {
		const id = generateComparisonId('sum(revenue)', 'benchmark_avg');
		expect(id).toBe('__ev_sum_revenue_benchmark_avg_comparison');
	});

	it('should handle complex expressions', () => {
		const id = generateComparisonId('sum(quantity * price)', 'target');
		expect(id).toBe('__ev_sum_quantity_price_target_comparison');
	});

	it('should handle expressions with whitespace', () => {
		const id = generateComparisonId('  sum(sales)  ', '  prior period  ');
		expect(id).toBe('__ev_sum_sales_prior_period_comparison');
	});
});

// ============================================================================
// buildComparisonQueryConfig Tests
// ============================================================================

describe('buildComparisonQueryConfig', () => {
	const processedValue = {
		alias: 'sum_sales',
		sqlWithoutAlias: 'sum(sales)'
	};

	it('should return null for undefined comparison', () => {
		const result = buildComparisonQueryConfig(undefined, processedValue);
		expect(result).toBeNull();
	});

	it('should return null for comparison without compare_vs', () => {
		const result = buildComparisonQueryConfig({}, processedValue);
		expect(result).toBeNull();
	});

	it('should build config for prior year comparison', () => {
		const result = buildComparisonQueryConfig({ compare_vs: 'prior year' }, processedValue);

		expect(result).not.toBeNull();
		expect(result!.compare_vs).toBe('prior year');
		expect(result!.valueColumn).toBe('sum(sales)');
		expect(result!.valueColumnAlias).toBe('sum_sales');
		expect(result!.id).toBe('__ev_sum_sales_prior_year_comparison');
	});

	it('should build config for target comparison', () => {
		const result = buildComparisonQueryConfig(
			{ compare_vs: 'target', target: '100000' },
			processedValue
		);

		expect(result).not.toBeNull();
		expect(result!.compare_vs).toBe('target');
		expect(result!.targetColumn).toBe('100000');
	});

	it('should build config for benchmark comparison', () => {
		const benchmark: BenchmarkConfig = {
			agg: 'avg',
			subject: 'store_id',
			within: ['region']
		};

		const result = buildComparisonQueryConfig(
			{ compare_vs: 'benchmark', benchmark },
			processedValue
		);

		expect(result).not.toBeNull();
		expect(result!.compare_vs).toBe('benchmark');
		expect(result!.benchmark).toEqual(benchmark);
		// ID should include agg type
		expect(result!.id).toBe('__ev_sum_sales_benchmark_avg_comparison');
	});

	it('should include date_range when provided', () => {
		const dateRange = { date: 'order_date', range: 'last 12 months' };
		const result = buildComparisonQueryConfig(
			{ compare_vs: 'prior year' },
			processedValue,
			dateRange
		);

		expect(result!.date_range).toEqual(dateRange);
	});
});

// ============================================================================
// buildComparisons - Benchmark CTE Structure Tests
// ============================================================================

describe('buildComparisons - Benchmark Comparisons', () => {
	describe('Basic Benchmark CTE Generation', () => {
		it('should generate benchmark CTE with subject only', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id'
					}
				}
			];

			const context = createContext({
				processedColumns: []
			});

			const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			const fragment = result.fragments[0];

			// Verify CTE structure
			expect(fragment.cteSql).toContain('WITH subject_totals AS');
			expect(fragment.cteSql).toContain('store_id as "store_id"');
			expect(fragment.cteSql).toContain(
				'sum(sales) as "__ev_sum_sales_benchmark_avg_comparison_subject_total"'
			);
			expect(fragment.cteSql).toContain('GROUP BY store_id');
			expect(fragment.cteSql).toContain(
				'avg("__ev_sum_sales_benchmark_avg_comparison_subject_total")'
			);
		});

		it('should generate benchmark CTE with within dimensions', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id',
						within: ['region']
					}
				}
			];

			const context = createContext({
				processedColumns: [createDimension('region')]
			});

			const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			const fragment = result.fragments[0];

			// Verify within dimension in GROUP BY
			expect(fragment.cteSql).toContain('GROUP BY "region"');
		});

		it('should generate benchmark CTE with where clause', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id',
						where: 'is_franchise = true'
					}
				}
			];

			const context = createContext();

			const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			const fragment = result.fragments[0];

			expect(fragment.cteSql).toContain('WHERE');
			expect(fragment.cteSql).toContain('is_franchise = true');
		});

		it('should include date filter in benchmark CTE', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id'
					}
				}
			];

			const context = createContext({
				dateFilterSql: "order_date >= '2024-01-01' AND order_date <= '2024-12-31'"
			});

			const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			const fragment = result.fragments[0];

			expect(fragment.cteSql).toContain("order_date >= '2024-01-01'");
		});

		it('should NOT include component filters in benchmark CTE', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id'
					}
				}
			];

			const context = createContext({
				filterSql: "category = 'Electronics'",
				userWhere: "status = 'active'"
			});

			const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			const fragment = result.fragments[0];

			// Component filters should NOT be in benchmark CTE
			expect(fragment.cteSql).not.toContain('Electronics');
			expect(fragment.cteSql).not.toContain('active');
		});
	});

	describe('Benchmark Aggregation Functions', () => {
		const aggregations: Array<{ agg: BenchmarkConfig['agg']; sqlFunc: string }> = [
			{ agg: 'avg', sqlFunc: 'avg' },
			{ agg: 'median', sqlFunc: 'median' },
			{ agg: 'min', sqlFunc: 'min' },
			{ agg: 'max', sqlFunc: 'max' },
			{ agg: 'sum', sqlFunc: 'sum' },
			{ agg: 'count', sqlFunc: 'count' }
		];

		aggregations.forEach(({ agg, sqlFunc }) => {
			it(`should use ${sqlFunc}() for agg="${agg}"`, () => {
				const comparisons: ComparisonQueryConfig[] = [
					{
						id: `__ev_sum_sales_benchmark_${agg}_comparison`,
						compare_vs: 'benchmark',
						valueColumn: 'sum(sales)',
						valueColumnAlias: 'sum_sales',
						benchmark: {
							agg,
							subject: 'store_id'
						}
					}
				];

				const result = buildComparisons(comparisons, createContext(), undefined, 'sunday', dialect);

				expect(result.fragments).toHaveLength(1);
				expect(result.fragments[0].cteSql).toContain(`${sqlFunc}("`);
			});
		});
	});

	describe('Benchmark JOIN Generation', () => {
		it('should generate cartesian join when no within dimensions', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id'
					}
				}
			];

			const result = buildComparisons(comparisons, createContext(), undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			expect(result.fragments[0].joinSql).toContain('ON 1=1');
		});

		it('should generate join on within dimensions', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id',
						within: ['region']
					}
				}
			];

			const context = createContext({
				processedColumns: [createDimension('region')]
			});

			const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			expect(result.fragments[0].joinSql).toContain('main_query."region"');
			expect(result.fragments[0].joinSql).toContain('<=>');
		});

		it('should handle hidden benchmark dimensions with __benchmark_ prefix', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id',
						within: ['region']
					}
				}
			];

			const context = createContext({
				processedColumns: [createDimension('__benchmark_region', { sqlWithoutAlias: 'region' })]
			});

			const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			// Should find and use the __benchmark_ prefixed column
			expect(result.fragments[0].joinSql).toContain('main_query."__benchmark_region"');
		});
	});

	describe('Benchmark Calculation Columns', () => {
		it('should generate compared_value, abs, and pct columns', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id'
					}
				}
			];

			const result = buildComparisons(comparisons, createContext(), undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			const calcCols = result.fragments[0].calculationColumns;

			expect(calcCols).toHaveLength(3);
			expect(calcCols.some((c) => c.includes('_compared_value'))).toBe(true);
			expect(calcCols.some((c) => c.includes('_abs'))).toBe(true);
			expect(calcCols.some((c) => c.includes('_pct'))).toBe(true);
		});

		it('should reference correct main_query and fragment columns', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id'
					}
				}
			];

			const result = buildComparisons(comparisons, createContext(), undefined, 'sunday', dialect);

			const calcCols = result.fragments[0].calculationColumns;

			// Should reference main_query for current value
			expect(calcCols.some((c) => c.includes('main_query."sum_sales"'))).toBe(true);

			// Should reference fragment for benchmark value
			expect(
				calcCols.some((c) =>
					c.includes('benchmark_1_fragment."__ev_sum_sales_benchmark_avg_comparison_benchmark"')
				)
			).toBe(true);
		});
	});

	describe('exclude_self Behavior', () => {
		it('should use window function optimization for exclude_self with avg', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id',
						exclude_self: true
					}
				}
			];

			const context = createContext({
				processedColumns: [createDimension('store_id')]
			});

			const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			const cte = result.fragments[0].cteSql;

			// Should use window function approach
			expect(cte).toContain('OVER');
			expect(cte).toContain('sum(');
			expect(cte).toContain('count(*)');
		});

		it('should use self-join for exclude_self with median', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_median_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'median',
						subject: 'store_id',
						exclude_self: true
					}
				}
			];

			const context = createContext({
				processedColumns: [createDimension('store_id')]
			});

			const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

			expect(result.fragments).toHaveLength(1);
			const cte = result.fragments[0].cteSql;

			// Should use self-join approach
			expect(cte).toContain('LEFT JOIN subject_totals t2');
			expect(cte).toContain('t1."store_id" != t2."store_id"');
		});
	});

	describe('Multiple Benchmark Comparisons', () => {
		it('should share CTE for compatible benchmarks', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id'
					}
				},
				{
					id: '__ev_sum_revenue_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(revenue)',
					valueColumnAlias: 'sum_revenue',
					benchmark: {
						agg: 'avg',
						subject: 'store_id'
					}
				}
			];

			const result = buildComparisons(comparisons, createContext(), undefined, 'sunday', dialect);

			// Should have only one fragment (shared CTE)
			expect(result.fragments).toHaveLength(1);

			// Should have 6 calculation columns (3 per comparison)
			expect(result.fragments[0].calculationColumns).toHaveLength(6);
		});

		it('should create separate CTEs for incompatible benchmarks', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id'
					}
				},
				{
					id: '__ev_sum_revenue_benchmark_median_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(revenue)',
					valueColumnAlias: 'sum_revenue',
					benchmark: {
						agg: 'median', // Different agg
						subject: 'store_id'
					}
				}
			];

			const result = buildComparisons(comparisons, createContext(), undefined, 'sunday', dialect);

			// Should have two separate fragments
			expect(result.fragments).toHaveLength(2);
		});

		it('should create separate CTEs for different within dimensions', () => {
			const comparisons: ComparisonQueryConfig[] = [
				{
					id: '__ev_sum_sales_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(sales)',
					valueColumnAlias: 'sum_sales',
					benchmark: {
						agg: 'avg',
						subject: 'store_id',
						within: ['region']
					}
				},
				{
					id: '__ev_sum_revenue_benchmark_avg_comparison',
					compare_vs: 'benchmark',
					valueColumn: 'sum(revenue)',
					valueColumnAlias: 'sum_revenue',
					benchmark: {
						agg: 'avg',
						subject: 'store_id',
						within: ['category'] // Different within
					}
				}
			];

			const context = createContext({
				processedColumns: [createDimension('region'), createDimension('category')]
			});

			const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

			// Should have two separate fragments
			expect(result.fragments).toHaveLength(2);
		});
	});
});

// ============================================================================
// buildComparisons - Mixed Comparison Types
// ============================================================================

describe('buildComparisons - Mixed Comparison Types', () => {
	it('should handle benchmark and target comparisons together', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_target_comparison',
				compare_vs: 'target',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				targetColumn: '100000'
			},
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: {
					agg: 'avg',
					subject: 'store_id'
				}
			}
		];

		const result = buildComparisons(comparisons, createContext(), undefined, 'sunday', dialect);

		// Target should be inline
		expect(result.inlineColumns).toHaveLength(3);
		expect(result.inlineColumns.some((c) => c.includes('target'))).toBe(true);

		// Benchmark should be a fragment
		expect(result.fragments).toHaveLength(1);
		expect(result.fragments[0].cteSql).toContain('subject_totals');
	});

	it('should handle benchmark and temporal comparisons together', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_prior_year_comparison',
				compare_vs: 'prior year',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				date_range: { date: 'order_date', range: 'last 12 months' }
			},
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: {
					agg: 'avg',
					subject: 'store_id'
				}
			}
		];

		const context = createContext({
			dateFilterSql: "order_date >= '2024-01-01'"
		});

		const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

		// Should have fragments for both
		expect(result.fragments.length).toBeGreaterThanOrEqual(1);

		// Should have benchmark fragment
		const benchmarkFragment = result.fragments.find((f) => f.cteSql.includes('subject_totals'));
		expect(benchmarkFragment).toBeDefined();
	});
});

// ============================================================================
// buildComparisons - Table Dimensions Integration
// ============================================================================

describe('buildComparisons - Table Dimensions', () => {
	it('should include table dimensions in subject_totals grouping', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: {
					agg: 'avg',
					subject: 'store_id'
				}
			}
		];

		const context = createContext({
			processedColumns: [createDimension('category'), createDimension('region')]
		});

		const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

		expect(result.fragments).toHaveLength(1);
		const cte = result.fragments[0].cteSql;

		// Table dimensions should be in subject_totals SELECT and GROUP BY
		expect(cte).toContain('category as "category"');
		expect(cte).toContain('region as "region"');
	});

	it('should handle temporal dimensions in table', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: {
					agg: 'avg',
					subject: 'store_id'
				}
			}
		];

		const context = createContext({
			processedColumns: [
				createDimension('month', {
					sqlWithoutAlias: 'toStartOfMonth(order_date)',
					isTemporalDateGrain: true,
					dateGrain: 'month'
				}),
				createDimension('store_name')
			],
			dateDimensionExpression: 'toStartOfMonth(order_date)',
			dateDimensionGrain: 'month'
		});

		const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

		expect(result.fragments).toHaveLength(1);
		const cte = result.fragments[0].cteSql;

		// Temporal dimension should be in subject_totals
		expect(cte).toContain('toStartOfMonth(order_date) as "month"');
	});
});

// ============================================================================
// buildComparisons - Temporal Dimension Augmentation Integration
// ============================================================================

describe('buildComparisons - Benchmarks with Date Dimensions', () => {
	it('should automatically group benchmark by temporal dimension', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: {
					agg: 'avg',
					subject: 'store_id'
					// No explicit within - should auto-add month
				}
			}
		];

		const context = createContext({
			processedColumns: [
				createDimension('month', {
					sqlWithoutAlias: 'toStartOfMonth(order_date)',
					isTemporalDateGrain: true,
					dateGrain: 'month'
				}),
				createDimension('store_name')
			]
		});

		const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

		expect(result.fragments).toHaveLength(1);
		const cte = result.fragments[0].cteSql;
		const join = result.fragments[0].joinSql;

		// Outer query should GROUP BY the temporal dimension
		expect(cte).toContain('GROUP BY "month"');

		// JOIN should include temporal dimension
		expect(join).toContain('"month"');
	});

	it('should join on temporal dimension for per-period benchmarks', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: {
					agg: 'avg',
					subject: 'store_id'
				}
			}
		];

		const context = createContext({
			processedColumns: [
				createDimension('month', {
					sqlWithoutAlias: 'toStartOfMonth(order_date)',
					isTemporalDateGrain: true,
					dateGrain: 'month'
				})
			]
		});

		const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

		expect(result.fragments).toHaveLength(1);
		const join = result.fragments[0].joinSql;

		// Should join on month, not cartesian
		expect(join).not.toContain('ON 1=1');
		expect(join).toContain('main_query."month"');
		expect(join).toContain('<=>');
	});

	it('should preserve explicit within and add temporal dimensions', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: {
					agg: 'avg',
					subject: 'store_id',
					within: ['region'] // Explicit within
				}
			}
		];

		const context = createContext({
			processedColumns: [
				createDimension('region'),
				createDimension('month', {
					sqlWithoutAlias: 'toStartOfMonth(order_date)',
					isTemporalDateGrain: true,
					dateGrain: 'month'
				})
			]
		});

		const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

		expect(result.fragments).toHaveLength(1);
		const cte = result.fragments[0].cteSql;

		// Should GROUP BY both region and month
		expect(cte).toContain('"region"');
		expect(cte).toContain('"month"');
	});

	it('should handle multiple temporal dimensions (month + quarter)', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: {
					agg: 'avg',
					subject: 'store_id'
				}
			}
		];

		const context = createContext({
			processedColumns: [
				createDimension('month', {
					sqlWithoutAlias: 'toStartOfMonth(order_date)',
					isTemporalDateGrain: true,
					dateGrain: 'month'
				}),
				createDimension('quarter', {
					sqlWithoutAlias: 'toStartOfQuarter(order_date)',
					isTemporalDateGrain: true,
					dateGrain: 'quarter'
				})
			]
		});

		const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

		expect(result.fragments).toHaveLength(1);
		const join = result.fragments[0].joinSql;

		// Should join on both temporal dimensions
		expect(join).toContain('"month"');
		expect(join).toContain('"quarter"');
	});

	it('should work with exclude_self and temporal dimensions', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: {
					agg: 'avg',
					subject: 'store_id',
					exclude_self: true
				}
			}
		];

		const context = createContext({
			processedColumns: [
				createDimension('store_id'),
				createDimension('month', {
					sqlWithoutAlias: 'toStartOfMonth(order_date)',
					isTemporalDateGrain: true,
					dateGrain: 'month'
				})
			]
		});

		const result = buildComparisons(comparisons, context, undefined, 'sunday', dialect);

		expect(result.fragments).toHaveLength(1);
		const cte = result.fragments[0].cteSql;

		// Should use window function with PARTITION BY month
		expect(cte).toContain('PARTITION BY');
		expect(cte).toContain('"month"');
	});
});
describe('buildComparisons (full SQL output)', () => {
	it('benchmark with no within (cartesian join, dimensionless)', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: { agg: 'avg', subject: 'store_id' }
			}
		];

		const result = buildComparisons(comparisons, createContext());
		expect(result.fragments).toHaveLength(1);
		const fragment = result.fragments[0];
		expect(fragment.alias).toMatchInlineSnapshot(`"benchmark_1_fragment"`);
		expect(fragment.cteSql).toMatchInlineSnapshot(`
			"WITH subject_totals AS (SELECT 
						store_id as "store_id",
						sum(sales) as "__ev_sum_sales_benchmark_avg_comparison_subject_total"
					FROM test_table
					
					GROUP BY store_id)
						SELECT
							avg("__ev_sum_sales_benchmark_avg_comparison_subject_total") as "__ev_sum_sales_benchmark_avg_comparison_benchmark"
						FROM subject_totals"
		`);
		expect(fragment.joinSql).toMatchInlineSnapshot(`"LEFT JOIN benchmark_1_fragment ON 1=1"`);
		expect(fragment.calculationColumns).toMatchInlineSnapshot(`
			[
			  "benchmark_1_fragment."__ev_sum_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_sales_benchmark_avg_comparison_compared_value"",
			  "(main_query."sum_sales" - benchmark_1_fragment."__ev_sum_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_sales_benchmark_avg_comparison_abs"",
			  "((main_query."sum_sales" - benchmark_1_fragment."__ev_sum_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_sales_benchmark_avg_comparison_pct"",
			]
		`);
		expect(result.inlineColumns).toMatchInlineSnapshot(`[]`);
	});

	it('benchmark with explicit within dimension', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: { agg: 'avg', subject: 'store_id', within: ['region'] }
			}
		];

		const result = buildComparisons(
			comparisons,
			createContext({ processedColumns: [createDimension('region')] })
		);
		expect(result.fragments).toHaveLength(1);
		expect(result.fragments[0].cteSql).toMatchInlineSnapshot(`
			"WITH subject_totals AS (SELECT 
						region as "region",
						store_id as "store_id",
						sum(sales) as "__ev_sum_sales_benchmark_avg_comparison_subject_total"
					FROM test_table
					
					GROUP BY region, store_id)
						SELECT
							"region",
							avg("__ev_sum_sales_benchmark_avg_comparison_subject_total") as "__ev_sum_sales_benchmark_avg_comparison_benchmark"
						FROM subject_totals
						GROUP BY "region""
		`);
		expect(result.fragments[0].joinSql).toMatchInlineSnapshot(
			`"LEFT JOIN benchmark_1_fragment ON main_query."region" <=> benchmark_1_fragment."region""`
		);
	});

	it('benchmark auto-augments with temporal dimension when none explicitly given', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_benchmark_avg_comparison',
				compare_vs: 'benchmark',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				benchmark: { agg: 'avg', subject: 'store_id' }
			}
		];

		const result = buildComparisons(
			comparisons,
			createContext({
				processedColumns: [
					createDimension('month', {
						sqlWithoutAlias: 'toStartOfMonth(order_date)',
						isTemporalDateGrain: true,
						dateGrain: 'month'
					})
				]
			})
		);
		expect(result.fragments).toHaveLength(1);
		expect(result.fragments[0].cteSql).toMatchInlineSnapshot(`
			"WITH subject_totals AS (SELECT 
						toStartOfMonth(order_date) as "month",
						store_id as "store_id",
						sum(sales) as "__ev_sum_sales_benchmark_avg_comparison_subject_total"
					FROM test_table
					
					GROUP BY month, store_id)
						SELECT
							"month",
							avg("__ev_sum_sales_benchmark_avg_comparison_subject_total") as "__ev_sum_sales_benchmark_avg_comparison_benchmark"
						FROM subject_totals
						GROUP BY "month""
		`);
		expect(result.fragments[0].joinSql).toMatchInlineSnapshot(
			`"LEFT JOIN benchmark_1_fragment ON main_query."month" <=> benchmark_1_fragment."month""`
		);
	});

	it('period-over-period (prior year) emits inline columns and a comparison fragment', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_prior_year_comparison',
				compare_vs: 'prior year',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				date_range: { date: 'order_date', range: 'last 12 months' }
			}
		];

		const result = buildComparisons(
			comparisons,
			createContext({
				processedColumns: [
					createDimension('month', {
						sqlWithoutAlias: 'toStartOfMonth(order_date)',
						isTemporalDateGrain: true,
						dateGrain: 'month'
					})
				],
				dateFilterSql: "order_date >= toDate('2024-04-27') AND order_date <= toDate('2026-04-27')"
			}),
			new Date(2026, 3, 27),
			'sunday'
		);
		expect(result.inlineColumns).toMatchInlineSnapshot(`
			[
			  "(formatDateTime("month", '%b %e/%y') || ' - ' || formatDateTime(date_sub(day, 1, date_add(month, 1, "month")), '%b %e/%y')) as "__ev_sum_sales_prior_year_comparison_current_period"",
			  "(formatDateTime(date_add(year, -1, "month"), '%b %e/%y') || ' - ' || formatDateTime(date_sub(day, 1, date_add(month, 1, date_add(year, -1, "month"))), '%b %e/%y')) as "__ev_sum_sales_prior_year_comparison_previous_period"",
			]
		`);
		expect(result.fragments).toMatchInlineSnapshot(`
			[
			  {
			    "alias": "comparison_1_fragment",
			    "calculationColumns": [
			      "comparison_1_fragment."__ev_sum_sales_prior_year_comparison" as "__ev_sum_sales_prior_year_comparison_compared_value"",
			      "(main_query."sum_sales" - comparison_1_fragment."__ev_sum_sales_prior_year_comparison") * 1.0 as "__ev_sum_sales_prior_year_comparison_abs"",
			      "((main_query."sum_sales" - comparison_1_fragment."__ev_sum_sales_prior_year_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_sales_prior_year_comparison"), 0)) as "__ev_sum_sales_prior_year_comparison_pct"",
			    ],
			    "cteSql": "SELECT toStartOfMonth(order_date) as month, sum(sales) as "__ev_sum_sales_prior_year_comparison"
					FROM test_table
					WHERE (order_date >= date_add(year, -1, toDate('2025-04-28')) AND order_date <= date_add(year, -1, toDate('2026-04-27')))",
			    "joinSql": "LEFT JOIN comparison_1_fragment ON date_add(year, -1, main_query."month") <=> comparison_1_fragment."month"",
			  },
			]
		`);
	});

	it('target comparison emits a single inline column trio', () => {
		const comparisons: ComparisonQueryConfig[] = [
			{
				id: '__ev_sum_sales_target_comparison',
				compare_vs: 'target',
				valueColumn: 'sum(sales)',
				valueColumnAlias: 'sum_sales',
				targetColumn: '100000'
			}
		];

		const result = buildComparisons(comparisons, createContext());
		expect(result.inlineColumns).toMatchInlineSnapshot(`
			[
			  "100000 as "__ev_sum_sales_target_comparison_compared_value"",
			  "(sum_sales - 100000) * 1.0 as "__ev_sum_sales_target_comparison_abs"",
			  "((sum_sales - 100000) * 1.0 / nullIf(abs(100000), 0)) as "__ev_sum_sales_target_comparison_pct"",
			]
		`);
		expect(result.fragments).toMatchInlineSnapshot(`[]`);
	});
});
