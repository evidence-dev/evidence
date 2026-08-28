import type { UserComponentSchema } from '../../types';
import {
	and,
	tableExists,
	columnsExistInTable,
	filtersExist,
	validateSqlExpression,
	validateDateAttributes,
	validateComparison,
	validateBenchmarkProperties,
	validateSqlOptions,
	expressionHasAggregation,
	orderCompatibleWithSingleValue,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent,
	validateDateRange,
	metricExists,
	sparklineHasTimeAxis
} from '../../validators';
import { ifCondition } from '../../validators/ifCondition';
import { validateDataSources, type DataSource } from '../../common/data-sources';
import { DATE_RANGE_ATTRIBUTE, dateRangeSchema } from '../../common/date-options';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { baseComparisonSchema } from '../../common/comparison-schema';
import { ZodAttribute, booleanVariableSchema } from '../../common/zod-attribute';
import { z } from 'zod';
import { setZodMetadata } from '../../common/zod-metadata';

const comparisonSchema = baseComparisonSchema
	.extend({
		// BigValue-specific properties (after base properties)
		text: setZodMetadata(
			z
				.string({
					description: 'Text displayed after the comparison value'
				})
				.optional(),
			{ supportsVariables: true }
		),
		delta: setZodMetadata(
			booleanVariableSchema
				.optional()
				.default(true)
				.describe('Whether to display the comparison as a delta'),
			{ supportsVariables: true }
		),
		down_is_good: setZodMetadata(
			booleanVariableSchema
				.optional()
				.default(false)
				.describe('Whether a decrease is considered positive'),
			{ supportsVariables: true }
		),
		neutral_range: setZodMetadata(
			z
				.array(z.number().nullable())
				.length(2)
				.optional()
				.default([0, 0])
				.describe(
					'Range [min, max] for neutral values. Use null for infinity (e.g., [null, 0] means anything ≤ 0 is neutral)'
				),
			{ supportsVariables: true }
		),
		chip: setZodMetadata(
			booleanVariableSchema
				.optional()
				.default(false)
				.describe('Whether to display the comparison delta as a chip / pill badge'),
			{ supportsVariables: true }
		)
	})
	.optional();

const sparklineSchema = z
	.object({
		type: setZodMetadata(
			z
				.union([
					z.enum(['line', 'area', 'bar']),
					z.string().refine((val) => /\{\{[^}]+\}\}/.test(val), {
						message: "Must be 'line', 'area', 'bar', or a variable like {{var}}"
					})
				])
				.optional()
				.default('line')
				.describe('The type of sparkline to display'),
			{ supportsVariables: true }
		),
		color: z
			.string({
				description: 'Color for the sparkline'
			})
			.optional(),
		x: setZodMetadata(
			z
				.string({
					description: 'X column for the sparkline'
				})
				.optional(),
			{ suggestionType: 'sql', supportsVariables: true }
		),
		y_fmt: setZodMetadata(
			z
				.string({
					description: 'Value format for the sparkline tooltips'
				})
				.optional(),
			{ suggestionType: 'format', supportsVariables: true }
		),
		x_fmt: setZodMetadata(
			z
				.string({
					description: 'Date format for the sparkline tooltips'
				})
				.optional(),
			{ suggestionType: 'format', supportsVariables: true }
		),
		fit_to_data: setZodMetadata(
			booleanVariableSchema
				.optional()
				.default(false)
				.describe('Whether to fit the Y axis scale to the data range'),
			{ supportsVariables: true }
		),
		connect_group: z
			.string({
				description: 'Connect group for the sparkline'
			})
			.optional(),
		date_grain: setZodMetadata(
			z
				.union([
					z.enum(['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute']),
					z.string().refine((val) => /\{\{[^}]+\}\}/.test(val), {
						message: 'Must be a valid date grain or a variable like {{var}}'
					})
				])
				.optional()
				.describe('Time grain for the sparkline data points'),
			{ supportsVariables: true }
		),
		date_range: dateRangeSchema.optional()
	})
	.optional();

const attributes = {
	data: {
		type: String,
		required: false,
		// Kept in the slash-command scaffold (raw-mode default) though not required.
		suggested: true,
		suggestionType: 'table',
		description: 'Table or view to query. Omit when using `metric`.',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	},
	metric: {
		type: String,
		required: false,
		suggestionType: 'metric',
		description:
			'Semantic metric to display (the whole reference — a metric is a single number). Use instead of `data` + `value`.',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text'
	},
	value: {
		type: String,
		required: false,
		// Kept in the slash-command scaffold (raw-mode default) though not required.
		suggested: true,
		suggestionType: 'sql',
		description: 'The SQL aggregation to display (with `data`). Omit when using `metric`.',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	// Include the new date range attribute
	...DATE_RANGE_ATTRIBUTE,
	comparison: {
		type: ZodAttribute.create(comparisonSchema),
		required: false,
		default: undefined,
		description: 'Comparison configuration object',
		affectsQuery: true
	},
	sparkline: {
		type: ZodAttribute.create(sparklineSchema),
		required: false,
		default: undefined,
		description: 'Sparkline configuration object',
		affectsQuery: false
	},
	fmt: {
		type: String,
		required: false,
		description: 'Format for the main value',
		affectsQuery: false,
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	title: {
		type: String,
		required: false,
		description: 'Title for the main value',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	subtitle: {
		type: String,
		required: false,
		description: 'Subtitle displayed below the title',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	card: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Whether to style the component as an individual card with border and padding',
		affectsQuery: false
	},
	max_width: {
		type: String,
		required: false,
		default: 'fit-content',
		description: 'Maximum width of the component',
		affectsQuery: false
	},
	min_width: {
		type: String,
		required: false,
		default: 'auto',
		description: 'Minimum width of the component',
		affectsQuery: false
	},
	text_size: {
		type: ZodAttribute.create(
			z.enum(['sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']).optional()
		),
		required: false,
		description: 'Text size for the value. Options: sm, base, lg, xl (default), 2xl, 3xl, 4xl, 5xl',
		affectsQuery: false
	},
	title_class: {
		type: String,
		required: false,
		description: 'Additional CSS classes for the title',
		affectsQuery: false
	},
	subtitle_class: {
		type: String,
		required: false,
		description: 'Additional CSS classes for the subtitle',
		affectsQuery: false
	},
	value_class: {
		type: String,
		required: false,
		description: 'Additional CSS classes for the value',
		affectsQuery: false
	},
	link: {
		type: String,
		required: false,
		description: 'URL to link the title to',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info: {
		type: String,
		required: false,
		description: 'Information tooltip text',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link: {
		type: String,
		required: false,
		description: 'URL to link the info text to (can only be used with info)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	info_link_title: {
		type: String,
		required: false,
		description:
			'Create a custom link title for the info link, placed after the info text (can only be used with info_link)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	filters: {
		type: Array,
		required: false,
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},
	...SQL_OPTIONS,
	class_name: {
		type: String,
		required: false,
		description: 'Additional CSS classes for the component',
		affectsQuery: false
	},
	...REFRESH_INTERVAL_ATTRIBUTE,
	...WIDTH_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

/** True when the component is NOT in metric mode (i.e. uses the raw data path). */
const notMetric = (node: { attributes?: Record<string, unknown> }) => !node.attributes?.metric;

/**
 * A big_value is driven EITHER by a `metric` (the whole reference) OR by
 * `data` + `value` (the raw path) — not both, not neither. Declared here so
 * autocomplete/docs/AI can read the arrangements; enforced by
 * `validateDataSources`.
 */
const dataSources = [
	{ requires: ['data', 'value'], forbids: ['metric'] },
	{ requires: ['metric'], forbids: ['data', 'value'] }
] as const satisfies readonly DataSource[];

export const schema = {
	render: 'big_value',
	category: 'value',
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		tableExists('data'),
		filtersExist('filters'),
		columnsExistInTable('data', ['date']),
		// With `metric`, `value` is a measure NAME (not SQL against `data`) — skip the
		// SQL/aggregation checks that only apply to the raw data path.
		ifCondition(notMetric, validateSqlExpression('value', 'data', 'select')),
		validateSqlExpression('comparison.target', 'data', 'select'),
		validateSqlExpression('comparison.benchmark.where', 'data', 'where'),
		validateSqlExpression('comparison.benchmark.subject', 'data', 'select'),
		validateSqlExpression('comparison.benchmark.value', 'data', 'select'),
		validateSqlExpression('comparison.benchmark.within', 'data', 'select'),
		validateDateAttributes(),
		validateDateRange(),
		validateComparison(),
		validateBenchmarkProperties(),
		validateSqlOptions(),
		ifCondition(notMetric, expressionHasAggregation('value')),
		ifCondition(notMetric, orderCompatibleWithSingleValue('order', 'value')),
		expressionHasAggregation('comparison.target'),
		expressionHasAggregation('comparison.benchmark.value'),
		validateFormatCode('fmt'),
		validateFormatCode('comparison.abs_fmt'),
		validateFormatCode('comparison.pct_fmt'),
		validateFormatCode('sparkline.x_fmt'),
		validateFormatCode('sparkline.y_fmt'),
		sparklineHasTimeAxis('sparkline', 'metric', 'date_range'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description: 'Display a big value with optional comparison, delta, and sparkline',
	keywords: ['KPI', 'metric', 'big number', 'scorecard', 'headline number'],
	attributes,
	componentWrapper: {
		display: 'block',
		width: 'fit',
		compactErrors: true,
		flex: {
			grow: 1,
			minWidth: 180,
			automaticallyWrapConsecutiveComponentsInRow: true
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% big_value
  data="demo.daily_orders"
  value="sum(total_sales)"
  fmt="usd1m"
/%}
`
		},
		{
			title: 'Comparison',
			example: `
{% big_value
	data="demo.daily_orders"
	value="sum(total_sales)"
	fmt="usd1m"
	date_range={
		date="date"
		range="last 12 months"
	}
	comparison={
		compare_vs="prior year"
	}
/%}
`
		},
		{
			title: 'Sparkline',
			example: `
{% big_value
	data="demo.daily_orders"
	value="sum(total_sales)"
	fmt="usd1m"
	sparkline={
		type="line"
		x="date"
	}
/%}
`
		},
		{
			title: 'Text Size',
			example: `
{% big_value
	data="demo.daily_orders"
	value="sum(total_sales)"
	fmt="usd1m"
	text_size="4xl"
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
