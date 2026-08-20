import { z } from 'zod';
import { setZodMetadata } from './zod-metadata';
import { booleanVariableSchema } from './zod-attribute';

/**
 * Valid comparison values - single source of truth
 */
export const COMPARISON_VALUES = ['prior year', 'prior period', 'target', 'benchmark'] as const;

/**
 * Comparison value schema with variable support
 */
export const compareVsSchema = z
	.union([
		z.enum(COMPARISON_VALUES, {
			description:
				'Type of comparison to perform. Options: prior year (same period last year), prior period (previous period of same duration), target (compare against a target value), benchmark (compare against group average/aggregate)'
		}),
		z.string().regex(/^\{\{[^}]+\}\}$/, {
			message: 'Must be a valid comparison value or variable syntax ({{ ... }})'
		})
	])
	.optional();

/**
 * Benchmark configuration schema
 * Note: Unknown property validation is handled by validateBenchmarkProperties validator
 */
export const benchmarkConfigSchema = setZodMetadata(
	z.object({
		agg: z.enum(['avg', 'median', 'min', 'max', 'sum', 'count', 'count_distinct'], {
			description:
				'Aggregation function to apply across benchmark group. Options: avg (average), median, min, max, sum, count, count_distinct'
		}),
		subject: setZodMetadata(
			z
				.string({
					description:
						'Column or expression that defines individual entities in the benchmark (e.g., "store_name", "customer_id"). Required for single-value components.'
				})
				.optional(),
			{ suggestionType: 'sql' }
		),
		value: setZodMetadata(
			z
				.string({
					description:
						'Optional column or expression to use for benchmark calculation. If not specified, uses the main value column. Useful if you have a pre-aggregated benchmark table for RLS reasons.'
				})
				.optional(),
			{ suggestionType: 'sql' }
		),
		within: setZodMetadata(
			z
				.array(z.string().min(1, { message: 'Within dimension cannot be an empty string' }), {
					description:
						'Dimension columns to group the benchmark by (e.g., ["region"]). Leave empty for dataset-wide benchmark.'
				})
				.optional(),
			{ suggestionType: 'column' }
		),
		where: setZodMetadata(
			z
				.string({
					description: 'SQL WHERE clause to filter which entities are included in the benchmark'
				})
				.optional(),
			{ suggestionType: 'sql' }
		),
		exclude_self: z
			.boolean({
				description:
					'Exclude the current row from its own benchmark calculation (table context only). Default: false'
			})
			.optional()
			.default(false)
	}),
	{
		example: `{
    agg = "avg"
    subject = "store_name"
    within = ["region"]
  }`
	}
);

/**
 * Base comparison schema with shared properties that can be extended by different components
 * Property order determines autocomplete suggestion order
 */
/**
 * Inferred benchmark config type from schema
 */
export type BenchmarkConfigSchema = z.infer<typeof benchmarkConfigSchema>;

export const baseComparisonSchema = z.object({
	// 1. compare_vs - most important, determines comparison type
	compare_vs: setZodMetadata(compareVsSchema, { supportsVariables: true }),
	// 2. display_type - controls what value is shown
	// Note: No .default() here - defaults are applied in components after selector merge
	display_type: setZodMetadata(
		z
			.union([
				z.enum(['compared_value', 'abs', 'pct']),
				z.string().refine((val) => /\{\{[^}]+\}\}/.test(val), {
					message: "Must be 'compared_value', 'abs', 'pct', or a variable like {{var}}"
				})
			])
			.optional()
			.describe(
				'What to display for comparison. Options: compared_value (comparison period value), abs (absolute change), pct (percentage change). Default: pct'
			),
		{ supportsVariables: true }
	),
	// 3. target - for target comparisons
	target: setZodMetadata(
		z
			.string({
				description:
					'Target value for target comparison. Can be a column name, aggregation (e.g., "sum(target_sales)"), or literal value.'
			})
			.optional(),
		{ suggestionType: 'sql', supportsVariables: true }
	),
	// 4. benchmark - for benchmark comparisons
	benchmark: benchmarkConfigSchema.optional(),
	// 5. hide_pct - common display option
	hide_pct: setZodMetadata(
		booleanVariableSchema
			.optional()
			.default(false)
			.describe('Hide the percentage change line in comparison tooltips'),
		{ supportsVariables: true }
	),
	// 6. pct_fmt - format for percentage display
	pct_fmt: setZodMetadata(
		z
			.string({
				description: 'Format code for percentage values in comparison tooltips'
			})
			.optional(),
		{ suggestionType: 'format', supportsVariables: true }
	),
	// 7. abs_fmt - format for absolute display
	abs_fmt: setZodMetadata(
		z
			.string({
				description: 'Format code for absolute values in comparison tooltips'
			})
			.optional(),
		{ suggestionType: 'format', supportsVariables: true }
	)
});

/**
 * Inferred comparison type from schema
 */
export type ComparisonSchema = z.infer<typeof baseComparisonSchema>;

/**
 * Resolved comparison type with properly typed benchmark
 * Used after resolving selector configs
 */
export interface ResolvedComparison extends Omit<ComparisonSchema, 'benchmark'> {
	benchmark?: BenchmarkConfigSchema;
	name?: string; // Custom name from comparison_selector
	// Additional properties that may come from component schemas or selector configs
	text?: string;
	down_is_good?: boolean;
	neutral_range?: [number | null, number | null];
	delta?: boolean;
}
