import type { UserComponentSchema } from '../../../types';
import { DATE_RANGE_ATTRIBUTE } from '../../../common/date-options';
import { baseComparisonSchema } from '../../../common/comparison-schema';
import {
	ZodAttribute,
	BooleanVariable,
	booleanVariableSchema
} from '../../../common/zod-attribute';
import { z } from 'zod';
import { setZodMetadata } from '../../../common/zod-metadata';
import { dateRangeSchema } from '../../../common/date-options';
import {
	and,
	validateSqlExpression,
	validateComparison,
	validateBenchmarkProperties,
	expressionHasAggregation,
	validateFormatCode,
	validateVizOptions,
	validateEmptyAttributes,
	validateVariablesInComponent,
	validateDateRange,
	metricExists
} from '../../../validators';
import { ifCondition } from '../../../validators/ifCondition';
import { METRIC_ATTRIBUTE } from '../../../common/metric-attribute';
import { validateDataSources, type DataSource } from '../../../common/data-sources';

/** True when the measure is NOT a metric reference (uses the raw `value` SQL). */
const notMetric = (node: { attributes?: Record<string, unknown> }) => !node.attributes?.metric;

const dataSources = [
	{ requires: ['value'], forbids: ['metric'] },
	{ requires: ['metric'], forbids: ['value'] }
] as const satisfies readonly DataSource[];

export const sparklineOptionsSchema = z
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
				.default('line'),
			{ supportsVariables: true }
		),
		x: setZodMetadata(
			z
				.string({
					description:
						'X-axis column (time/category column for sparkline) - required when viz type is sparkline'
				})
				.optional(),
			{ suggestionType: 'sql', supportsVariables: true }
		),
		color: z.string({ description: 'Color for the sparkline' }).optional(),
		fit_to_data: setZodMetadata(
			booleanVariableSchema
				.optional()
				.default(false)
				.describe('Whether to scale the y-axis to the data range'),
			{ supportsVariables: true }
		),
		date_grain: setZodMetadata(
			z
				.union([
					z.enum(['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second']),
					z.string().refine((val) => /\{\{[^}]+\}\}/.test(val), {
						message: 'Must be a valid date grain or a variable like {{var}}'
					})
				])
				.optional()
				.default('month')
				.describe('Date granularity for sparkline time series'),
			{ supportsVariables: true }
		),
		date_range: dateRangeSchema.describe(
			'Date range configuration object with period, end, and date properties'
		)
	})
	.optional();

export const deltaOptionsSchema = z
	.object({
		down_is_good: z
			.boolean({
				description: 'Whether a downward trend is considered positive'
			})
			.optional()
			.default(false),
		show_symbol: z
			.boolean({ description: 'Whether to show the delta symbol' })
			.optional()
			.default(true),
		symbol_position: z
			.enum(['left', 'right'], {
				description: 'Position of the delta symbol relative to the value'
			})
			.optional()
			.default('right'),
		neutral_range: z
			.array(z.number().nullable())
			.length(2)
			.optional()
			.default([0, 0])
			.describe(
				'Range [min, max] for neutral values. Use null for infinity (e.g., [null, 0] means anything ≤ 0 is neutral)'
			)
	})
	.optional();

export const barOptionsSchema = z
	.object({
		bar_color: z
			.string({
				description: 'Custom color for positive values. If not specified, uses default blue.'
			})
			.optional(),
		bar_color_negative: z
			.string({
				description:
					'Custom color for negative values. If not specified, uses bar_color if set, otherwise default red.'
			})
			.optional(),
		hide_labels: z
			.boolean({
				description: 'When true, hides the text values and shows only the bar visualization.'
			})
			.optional()
			.default(false),
		fit_to_data: z
			.boolean({
				description:
					'When true, scales bars to the data range instead of including zero. This makes bars use the full available width when all values are far from zero.'
			})
			.optional()
			.default(false)
	})
	.optional();

export const colorOptionsSchema = z
	.object({
		color_scale: z
			.array(z.string(), {
				description:
					'Custom color scale for type="color". Must be an array of colors (e.g., ["#ff0000", "#00ff00", "#0000ff"]).'
			})
			.optional(),
		color_stops: z
			.array(
				z.object({
					value: z.number({ description: 'Data value to pin this color to' }),
					color: z.string({ description: 'Color for this value (hex, rgb, or named color)' })
				}),
				{
					description:
						'Pin specific data values to specific colors for viz="color". Values beyond the first/last stop are clamped to the end colors. Takes precedence over color_scale.'
				}
			)
			.optional(),
		conditional_colors: z
			.string({
				description:
					"SQL expression that returns color values for each row. When specified, bypasses color_scale and uses explicit colors (e.g., \"case when sum(sales) > 1000 then '#22c55e' else '#ef4444' end\")."
			})
			.optional(),
		scale_column: z
			.string({
				description:
					'Column or SQL expression to use for color scale calculations when type="color". Supports: simple columns (e.g., "sc"), aggregated columns (e.g., "sum(sc)"), or expressions (e.g., "case when sales > 100 then 1 else 0 end"). If not specified, the measure column itself is used for scaling.'
			})
			.optional(),
		scale_mode: z
			.enum(['individual', 'shared'], {
				description:
					'How to calculate min/max for color and bar visualizations. "individual" calculates range per column (default), "shared" calculates range across all related columns.'
			})
			.optional()
			.default('individual')
	})
	.optional();

const comparisonSchema = baseComparisonSchema.optional();

const attributes = {
	value: {
		type: String,
		required: false,
		// Kept in the slash-command scaffold (raw-mode default) though not required.
		suggested: true,
		affectsQuery: true,
		suggestionType: 'sql',
		supportsVariables: true,
		variableContext: 'column'
	},
	// A measure can instead reference a semantic metric by name; it supplies the
	// aggregate SQL, format, and label (and the table's base). Use instead of `value`.
	...METRIC_ATTRIBUTE,
	fmt: {
		type: String,
		required: false,
		default: undefined,
		description: 'Format for values. Can be a built-in format or a custom Excel-style format code.',
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text',
		keywords: [
			'format',
			'number format',
			'currency format',
			'percentage format',
			'date format',
			'custom format',
			'excel format',
			'format code',
			'formatting',
			'number formatting',
			'percentage formatting',
			'date formatting',
			'custom formatting',
			'excel formatting'
		]
	},
	fmt_column: {
		type: String,
		required: false,
		default: undefined,
		description:
			'Column of format codes used to format values. The format code is pulled from this column for each row in the table.',
		supportsVariables: true,
		variableContext: 'column',
		keywords: [
			'format column',
			'format based on column',
			'dynamic format',
			'multi-format',
			'multiple formats',
			'row-based format',
			'row-based formatting',
			'row-based format code',
			'row-based format codes'
		]
	},
	// Visualization configuration
	viz: {
		type: String,
		required: false,
		matches: ['bar', 'color', 'delta', 'sparkline'],
		default: undefined,
		description:
			'Visualization to show for this measure, including sparklines, bars, colors, and deltas.',
		supportsVariables: true,
		variableContext: 'text'
	},
	// Visualization options - presence of any of these implies that visualization type
	delta_options: {
		type: ZodAttribute.create(deltaOptionsSchema),
		required: false,
		default: undefined,
		description: 'Delta visualization configuration. When present, enables delta visualization.'
	},
	sparkline_options: {
		type: ZodAttribute.create(sparklineOptionsSchema),
		required: false,
		default: undefined,
		description:
			'Sparkline visualization configuration. When present, enables sparkline visualization.'
	},
	bar_options: {
		type: ZodAttribute.create(barOptionsSchema),
		required: false,
		default: undefined,
		description: 'Bar visualization configuration. When present, enables bar visualization.'
	},
	color_options: {
		type: ZodAttribute.create(colorOptionsSchema),
		required: false,
		default: undefined,
		description:
			'Color scale visualization configuration. When present, enables color visualization.',
		affectsQuery: true
	},
	viz_include_subtotals: {
		type: Boolean,
		required: false,
		default: false,
		description:
			'Whether to apply visualizations (like color and bar charts) to subtotal rows. When false, subtotal rows will not have visualizations applied.'
	},
	red_negatives: {
		type: Boolean,
		required: false,
		default: false,
		description: 'When true, negative values will be displayed in red (rgb(220 38 38))'
	},
	title: {
		type: String,
		required: false,
		default: undefined,
		supportsVariables: true,
		variableContext: 'text'
	},
	align: {
		type: String,
		required: false,
		matches: ['left', 'center', 'right'],
		default: undefined
	},
	info: {
		type: String,
		required: false,
		default: undefined,
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
	hide: {
		type: BooleanVariable,
		required: false,
		default: false,
		description:
			'Whether to hide this column from the table display. Hidden columns are still included in queries and can be referenced by other columns.',
		supportsVariables: true,
		variableContext: 'text'
	},
	sort: {
		type: String,
		required: false,
		matches: ['asc', 'desc'],
		default: undefined,
		description:
			'Sort direction for this measure column. When specified, the table will be sorted by this column.'
	},
	column_group: {
		type: String,
		required: false,
		default: undefined,
		description:
			'Group name for this column. Columns with matching group names will be visually grouped under a shared header.'
	},
	// Comparison properties
	comparison: {
		type: ZodAttribute.create(comparisonSchema),
		required: false,
		default: undefined,
		description: 'Comparison configuration object',
		affectsQuery: true,
		keywords: [
			'comparison',
			'year-over-year',
			'quarter-over-quarter',
			'month-over-month',
			'period-over-period',
			'growth rate',
			'calculate change',
			'delta',
			'prior year',
			'previous year',
			'prior period',
			'previous period',
			'target',
			'benchmark',
			'benchmark average',
			'compared value',
			'absolute change',
			'percentage change'
		]
	},
	// Subtotal control properties
	hide_column_totals: {
		type: Boolean,
		required: false,
		default: undefined,
		description:
			'Whether to hide this measure in column total/subtotal calculations. When undefined, auto-detection determines if totals should be hidden based on temporal comparison context.'
	},
	hide_row_totals: {
		type: Boolean,
		required: false,
		default: undefined,
		description:
			'Whether to hide this measure in row total/subtotal calculations. When undefined, auto-detection determines if totals should be hidden based on temporal comparison context.'
	},
	// Regular measure date filtering (applies to all viz types except sparklines)
	...DATE_RANGE_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'measure',
	category: 'table',
	description: 'Add a measure to a table, including comparisons, sparklines, and more',
	selfClosing: true,
	attributes,
	allowedParents: ['table'],
	componentWrapper: false,
	dataSources,
	validate: and(
		validateDataSources(dataSources),
		metricExists('metric'),
		// `value` SQL checks only apply to the raw path — a metric supplies its own
		// aggregation (validated by `metricExists`).
		ifCondition(
			notMetric,
			and(
				validateSqlExpression('value', 'data', 'select', { getTableNameFromParent: true }),
				expressionHasAggregation('value')
			)
		),
		validateSqlExpression('color_options.conditional_colors', 'data', 'select', {
			getTableNameFromParent: true
		}),
		validateSqlExpression('comparison.benchmark.where', 'data', 'where', {
			getTableNameFromParent: true
		}),
		validateSqlExpression('comparison.benchmark.subject', 'data', 'select', {
			getTableNameFromParent: true
		}),
		validateSqlExpression('comparison.benchmark.value', 'data', 'select', {
			getTableNameFromParent: true
		}),
		validateSqlExpression('comparison.benchmark.within', 'data', 'select', {
			getTableNameFromParent: true
		}),
		validateComparison(),
		validateBenchmarkProperties(),
		validateFormatCode('fmt'),
		validateFormatCode('comparison.abs_fmt'),
		validateFormatCode('comparison.pct_fmt'),
		validateVizOptions(),
		validateDateRange(),
		validateEmptyAttributes(),
		validateVariablesInComponent()
		// TODO: Add validation for scale_column once we determine proper validation strategy for SQL expressions
	),
	examples: [
		{
			title: 'Table with Measures',
			hero: true,
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure value="sum(total_sales)" fmt="usd1m" /%}
    {% measure value="sum(quantity)" fmt="num0" /%}
{% /table %}
`
		},
		{
			title: 'Date Range Filtering',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        date_range={
            range="last 12 months"
            date="date"
        }
        fmt="usd1m"
    /%}
    {% measure
        value="sum(total_sales)"
        date_range={
            range="last 6 months"
            date="date"
        }
        fmt="usd1m"
    /%}
{% /table %}
`
		},
		{
			title: 'Prior Year Comparison',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        date_range={
            range="last 12 months"
            date="date"
        }
        comparison={
            compare_vs="prior year"
        }
    /%}
{% /table %}
`
		},
		{
			title: 'Calculated Measures',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales) / sum(transactions) as avg_price" 
        fmt="usd2"
    /%}
{% /table %}
`
		},
		{
			title: 'Viz: Color Scale',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        fmt="usd1m"
        viz="color"
    /%}
{% /table %}
`
		},
		{
			title: 'Viz: Color Scale with Custom Colors',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        fmt="usd1m"
        viz="color"
        color_options={
            color_scale=["#c0392b","#f4f4f4","#27ae60"]
        }
    /%}
{% /table %}
`
		},
		{
			title: 'Viz: Color Scale with Pinned Values',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        fmt="usd"
        viz="color"
        color_options={
            color_stops=[
                { value=5000 color="#e74c3c" },
                { value=10000 color="#f39c12" },
                { value=15000 color="#27ae60" }
            ]
        }
    /%}
{% /table %}
`
		},
		{
			title: 'Viz: Color with Conditional Colors',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        fmt="usd1m"
        viz="color"
        color_options={
            conditional_colors="case when sum(total_sales) > 10000 then '#22c55e' when sum(total_sales) > 5000 then '#f59e0b' else '#ef4444' end"
        }
    /%}
{% /table %}
`
		},
		{
			title: 'Viz: Bar',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        fmt="usd1m"
        viz="bar"
    /%}
{% /table %}
`
		},
		{
			title: 'Viz: Bar with Custom Colors',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        fmt="usd1m"
        viz="bar"
        bar_options={
            bar_color="#2c7d00"
        }
    /%}
    {% measure
        value="sum(transactions)"
        viz="bar"
        bar_options={
            bar_color="#339e9c"
        }
    /%}
{% /table %}
`
		},
		{
			title: 'Viz: Delta',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        date_range={
            range="last 12 months"
            date="date"
        }
        comparison={
            compare_vs="prior year"
        }
        viz="delta"
    /%}
{% /table %}
`
		},
		{
			title: 'Viz: Sparkline',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        fmt="usd1m"
        viz="sparkline"
        sparkline_options={
            x="date"
            type="area"
        }
    /%}
{% /table %}
`
		},
		{
			title: 'Column Info',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        fmt="usd1m"
        info="Includes all product sales"
    /%}
{% /table %}
`
		},
		{
			title: 'Sorting',
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% measure
        value="sum(total_sales)"
        fmt="usd1m"
        viz="color"
        sort="asc"
    /%}
{% /table %}
`
		}
	]
} as const satisfies UserComponentSchema;
