import type { UserComponentSchema } from '../../types';
import type { Validator } from '../../validators/types';
import { DATE_RANGE_ATTRIBUTE, DATE_GRAIN_ATTRIBUTE } from '../../common/date-options';
import { SQL_OPTIONS, REFRESH_INTERVAL_ATTRIBUTE } from '../../common/sql-options';
import {
	and,
	filtersExist,
	tableExists,
	validateSqlExpression,
	validateDateAttributes,
	validateDateRange,
	validateSqlOptions,
	validateInfoRequiresTitle,
	validateFormatCode,
	validateEmptyAttributes,
	validateVariablesInComponent,
	validateAxisMinMax,
	expressionHasAggregation
} from '../../validators';
import { ifCondition } from '../../validators/ifCondition';
import {
	containsVariableSyntax,
	isValidationContext,
	resolveDialect
} from '../../validators/types';
import { hasAgg } from '../../common/sql-expression-utils';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { HEIGHT_ATTRIBUTE } from '../../common/height-attribute';
import { CONNECT_GROUP_ATTRIBUTE } from '../../common/connect-group-attribute';
import {
	ZodAttribute,
	booleanVariableSchema,
	numberVariableSchema
} from '../../common/zod-attribute';
import { setZodMetadata } from '../../common/zod-metadata';
import { z } from 'zod';
import { DATA_ATTRIBUTE, TITLE_ATTRIBUTES } from '../../common/title-attributes';
import { TOOLTIP_FIELDS_ATTRIBUTE, validateTooltipFieldFormats } from '../../common/tooltip-fields';
import {
	ECHARTS_OPTIONS_ATTRIBUTE,
	ECHARTS_SERIES_OPTIONS_ATTRIBUTE
} from '../../common/echarts-options-attributes';
import { WATERFALL_SORT_OPTIONS } from './build-waterfall-chart-sql';

const hasBreakdown = (node: { attributes?: Record<string, unknown> }) =>
	Boolean(node.attributes?.breakdown);

/**
 * Breakdown bars are derived (totals from `x`, changes spanning two periods),
 * so per-row total markers have nothing to mark and a tooltip field has no
 * single row to read from.
 */
const validateBreakdownExclusivity = (node: { attributes?: Record<string, unknown> }) => {
	if (!hasBreakdown(node)) return [];
	const clashing = ['bar_type', 'totals', 'tooltip_fields'].filter(
		(name) => node.attributes?.[name] !== undefined
	);
	if (clashing.length === 0) return [];
	return [
		{
			id: 'waterfall-breakdown-exclusive',
			level: 'error' as const,
			message: `\`breakdown\` cannot be combined with ${clashing.map((n) => `\`${n}\``).join(' or ')}: every \`x\` value is already a total and each change bar spans two periods, so there is no single row to read from.`
		}
	];
};

const yAxisOptionsSchema = z
	.object({
		title: setZodMetadata(z.string().optional().describe('Axis title shown above the axis'), {
			supportsVariables: true
		}),
		labels: setZodMetadata(
			booleanVariableSchema.optional().default(true).describe('Show/hide axis labels'),
			{ supportsVariables: true }
		),
		gridlines: setZodMetadata(booleanVariableSchema.optional().describe('Show/hide gridlines'), {
			supportsVariables: true
		}),
		ticks: setZodMetadata(booleanVariableSchema.optional().default(false), {
			supportsVariables: true
		}),
		baseline: setZodMetadata(booleanVariableSchema.optional().describe('Show/hide the axis line'), {
			supportsVariables: true
		}),
		min: setZodMetadata(numberVariableSchema.optional().describe('Minimum axis value'), {
			supportsVariables: true
		}),
		max: setZodMetadata(numberVariableSchema.optional().describe('Maximum axis value'), {
			supportsVariables: true
		}),
		fit_to_data: setZodMetadata(
			booleanVariableSchema
				.optional()
				.default(false)
				.describe(
					'Fit the axis to the bars instead of including 0. Totals then start from the axis minimum; useful when changes are small relative to the totals.'
				),
			{ supportsVariables: true }
		),
		interval: setZodMetadata(
			numberVariableSchema
				.optional()
				.describe('Interval between axis ticks. A suggestion — the actual interval may differ.'),
			{ supportsVariables: true }
		)
	})
	.default({});

const xAxisOptionsSchema = z
	.object({
		labels: setZodMetadata(
			booleanVariableSchema.optional().default(true).describe('Show/hide axis labels'),
			{ supportsVariables: true }
		),
		ticks: setZodMetadata(booleanVariableSchema.optional().default(false), {
			supportsVariables: true
		}),
		baseline: setZodMetadata(booleanVariableSchema.optional().describe('Show/hide the axis line'), {
			supportsVariables: true
		}),
		gridlines: setZodMetadata(
			booleanVariableSchema.optional().default(false).describe('Show/hide gridlines'),
			{ supportsVariables: true }
		),
		label_rotate: setZodMetadata(
			numberVariableSchema
				.optional()
				.describe('Rotation of axis labels in degrees. Overrides the automatic rotation.'),
			{ supportsVariables: true }
		)
	})
	.default({});

/**
 * Pre-summarized rows render in query order, and SQL does not promise one
 * without ORDER BY — a UNION ALL of literals comes back shuffled on ClickHouse.
 * The chart cannot detect a shuffled bridge, so the only safety net is here.
 */
const validateWaterfallOrdering: Validator = (node, _config, context) => {
	const attrs = node.attributes ?? {};
	if (attrs.breakdown || attrs.order || attrs.x_sort !== undefined) return [];
	const y = attrs.y;
	if (typeof y !== 'string' || !y || containsVariableSyntax(y)) return [];
	const dialect = isValidationContext(context) ? resolveDialect(context) : undefined;
	if (hasAgg(y, dialect)) return [];
	return [
		{
			id: 'waterfall-unordered-rows',
			level: 'warning' as const,
			message:
				'Bars render in query order, which SQL does not guarantee without ORDER BY. Add a step number to the query and pass order="step_order", or list the labels in x_sort=[...], so the bridge cannot come back shuffled.',
			location: node.location
		}
	];
};

const attributes = {
	...DATA_ATTRIBUTE,
	filters: {
		type: Array,
		required: false,
		default: [],
		description: 'IDs of filters to apply to the query',
		suggestionType: 'filter',
		affectsQuery: true
	},
	...DATE_RANGE_ATTRIBUTE,
	...DATE_GRAIN_ATTRIBUTE,
	x: {
		type: String,
		required: true,
		description:
			'Column that labels each bar. With an aggregate `y`, one bar per distinct value; add `date_grain` to bucket a date column.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	y: {
		type: String,
		required: true,
		description:
			'The change for each bar: positive rises, negative falls. A plain column reads pre-summarized rows in query order; an aggregate such as `sum(amount)` groups raw rows by `x`. On a total row, `y` is the absolute total.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	bar_type: {
		type: String,
		required: false,
		description:
			'Column that marks total rows. Values `total` or `subtotal` (case-insensitive) draw a bar from zero and reset the running total; anything else is a change.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	breakdown: {
		type: String,
		required: false,
		description:
			'Explain the change between consecutive `x` values by this column. Each `x` value becomes a total bar; between two totals, one bar per `breakdown` value shows how much it moved. Requires an aggregate `y`. Cannot be combined with `bar_type`, `totals` or `tooltip_fields`.',
		suggestionType: 'sql',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'column'
	},
	breakdown_limit: {
		type: Number,
		required: false,
		description:
			'With `breakdown`, keep this many contributors per span (by absolute change) and fold the rest into an "Other" bar.',
		affectsQuery: false
	},
	totals: {
		type: Array,
		required: false,
		description:
			'`x` labels of the total rows, e.g. `totals=["Starting ARR", "Ending ARR"]`. An alternative to `bar_type` when the query has no marker column. An entry that matches no row is an error.',
		affectsQuery: false
	},
	total: {
		type: Boolean,
		required: false,
		default: true,
		description:
			'Append a computed total bar after the last row. Skipped when the last row is already a total.',
		affectsQuery: false
	},
	total_label: {
		type: String,
		required: false,
		default: 'Total',
		description: 'Label for the computed total bar',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	x_sort: {
		type: ZodAttribute.create(
			z.union([z.enum(WATERFALL_SORT_OPTIONS), z.array(z.string())]).optional()
		),
		required: false,
		description:
			'Bar order. By default a plain `y` keeps query order and an aggregate `y` sorts largest change first. `asc`/`desc` sort by label, `value_asc`/`value_desc` by change, or pass a label array such as `["Start", "New", "Churn"]`. `order` (raw SQL) overrides all of these.',
		affectsQuery: true
	},
	...TITLE_ATTRIBUTES,
	x_fmt: {
		type: String,
		required: false,
		description: 'Format for bar labels on the x-axis (useful when `x` is a date)',
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	y_fmt: {
		type: String,
		required: false,
		description: 'Format for values — applied to the y-axis, data labels and tooltip',
		suggestionType: 'format',
		supportsVariables: true,
		variableContext: 'text'
	},
	labels: {
		type: Boolean,
		required: false,
		default: true,
		description:
			'Show the value on each bar, signed for changes. Labels hide when the bars are too narrow for them.',
		affectsQuery: false
	},
	connectors: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Draw the line joining each bar to the next',
		affectsQuery: false
	},
	legend: {
		type: Boolean,
		required: false,
		default: true,
		description: 'Show an Increase / Decrease / Total legend for the kinds present',
		affectsQuery: false
	},
	legend_location: {
		type: ZodAttribute.create(z.enum(['top', 'bottom'])),
		required: false,
		default: 'top',
		description: 'Position of the legend',
		affectsQuery: false
	},
	chart_options: {
		type: ZodAttribute.create(
			z.object({
				increase_color: z
					.string()
					.optional()
					.describe('Color for bars that rise. Defaults to the theme positive color.'),
				decrease_color: z
					.string()
					.optional()
					.describe('Color for bars that fall. Defaults to the theme negative color.'),
				total_color: z
					.string()
					.optional()
					.describe('Color for total bars. Defaults to the first theme palette color.'),
				label_color: z
					.string()
					.optional()
					.describe(
						'Color for value labels, or `inherit` to match each bar. Defaults to the theme foreground.'
					),
				connector_color: z
					.string()
					.optional()
					.describe('Color of the connector lines. Defaults to the theme muted foreground.')
			})
		),
		required: false,
		default: {},
		description: 'Waterfall chart configuration options',
		affectsQuery: false
	},
	y_axis_options: {
		type: ZodAttribute.create(yAxisOptionsSchema),
		required: false,
		default: {},
		description: 'Configure the y-axis'
	},
	x_axis_options: {
		type: ZodAttribute.create(xAxisOptionsSchema),
		required: false,
		default: {},
		description: 'Configure the x-axis'
	},
	...REFRESH_INTERVAL_ATTRIBUTE,
	...SQL_OPTIONS,
	...WIDTH_ATTRIBUTE,
	...HEIGHT_ATTRIBUTE,
	...CONNECT_GROUP_ATTRIBUTE,
	...TOOLTIP_FIELDS_ATTRIBUTE,
	...ECHARTS_OPTIONS_ATTRIBUTE,
	...ECHARTS_SERIES_OPTIONS_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'waterfall_chart',
	category: 'chart',
	validate: and(
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('x', 'data', 'select'),
		validateSqlExpression('y', 'data', 'select'),
		validateSqlExpression('bar_type', 'data', 'select'),
		validateSqlExpression('breakdown', 'data', 'select'),
		ifCondition(hasBreakdown, expressionHasAggregation('y')),
		validateBreakdownExclusivity,
		validateWaterfallOrdering,
		validateSqlExpression('tooltip_fields', 'data', 'select'),
		validateTooltipFieldFormats,
		validateDateAttributes(),
		validateDateRange(),
		validateSqlOptions(),
		validateInfoRequiresTitle,
		validateFormatCode('x_fmt'),
		validateFormatCode('y_fmt'),
		validateAxisMinMax('y_axis_options'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	description:
		'Display a waterfall chart: a sequence of increases and decreases that bridges one total to another.',
	keywords: ['waterfall', 'bridge chart', 'variance', 'walk', 'cascade'],
	attributes,
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 320,
			minHeight: 215
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
\`\`\`sql revenue_bridge
SELECT 1 AS step_order, 'Q1 Revenue' AS step, 1200000 AS amount, 'total' AS bar_type
UNION ALL SELECT 2, 'New customers', 340000, 'change'
UNION ALL SELECT 3, 'Expansion', 180000, 'change'
UNION ALL SELECT 4, 'Price increase', 95000, 'change'
UNION ALL SELECT 5, 'Churn', -260000, 'change'
UNION ALL SELECT 6, 'Contraction', -85000, 'change'
UNION ALL SELECT 7, 'Q2 Revenue', NULL, 'total'
\`\`\`

{% waterfall_chart
    data="revenue_bridge"
    x="step"
    y="amount"
    bar_type="bar_type"
    order="step_order"
    y_fmt="usd0k"
    title="Q1 to Q2 revenue bridge"
/%}
`
		},
		{
			title: 'Marking totals by label',
			example: `
\`\`\`sql headcount
SELECT 1 AS step_order, 'Start of year' AS step, 210 AS people
UNION ALL SELECT 2, 'Hires', 64
UNION ALL SELECT 3, 'Transfers in', 12
UNION ALL SELECT 4, 'Transfers out', -9
UNION ALL SELECT 5, 'Attrition', -31
\`\`\`

{% waterfall_chart
    data="headcount"
    x="step"
    y="people"
    order="step_order"
    totals=["Start of year"]
    total_label="End of year"
    title="Headcount walk"
/%}
`
		},
		{
			title: 'From raw data',
			example: `
{% waterfall_chart
    data="demo.daily_orders"
    x="category"
    y="sum(total_sales)"
    y_fmt="usd"
    title="Sales by category"
    subtitle="Each bar is a category's contribution to total sales"
/%}
`
		},
		{
			title: 'Build-up over time',
			example: `
{% waterfall_chart
    data="demo.daily_orders"
    x="date"
    date_grain="month"
    x_sort="asc"
    y="sum(total_sales)"
    date_range={ date="date" range="2024-07-01 to 2024-12-31" }
    y_fmt="usd0k"
    total_label="H2 total"
    title="Monthly sales build-up"
/%}
`
		},
		{
			title: 'Change between periods, by dimension',
			example: `
{% waterfall_chart
    data="demo.daily_orders"
    x="date"
    date_grain="year"
    y="sum(total_sales)"
    breakdown="category"
    date_range={ date="date" range="2023-01-01 to 2024-12-31" }
    y_fmt="usd"
    title="What drove sales growth in 2024"
/%}
`
		},
		{
			title: 'Custom colors and no connectors',
			example: `
\`\`\`sql cash_flow
SELECT 1 AS step_order, 'Opening cash' AS step, 500 AS amount, 'total' AS kind
UNION ALL SELECT 2, 'Operating', 320, 'change'
UNION ALL SELECT 3, 'Investing', -410, 'change'
UNION ALL SELECT 4, 'Financing', 150, 'change'
\`\`\`

{% waterfall_chart
    data="cash_flow"
    x="step"
    y="amount"
    bar_type="kind"
    order="step_order"
    total_label="Closing cash"
    connectors=false
    y_fmt="usd0"
    chart_options={
        increase_color="#0ea5e9"
        decrease_color="#f97316"
        total_color="#334155"
    }
/%}
`
		}
	],
	extraDocsSections: [
		{
			title: 'Data structure',
			content: `
One row per bar, in display order. \`x\` is the label and \`y\` is the change: positive rises, negative falls. Running totals are computed by the chart; do not pre-compute them in SQL.

**Pre-summarized rows** (a plain \`y\` column) are read in query order. SQL does not guarantee an order without \`ORDER BY\`, so include a step number and pass \`order="step_order"\`, or list the labels in \`x_sort\`.

**Raw rows** (an aggregate \`y\` such as \`sum(amount)\`) are grouped by \`x\` and sorted largest change first. Override with \`x_sort\` or \`order\`.

### Totals

A total bar is drawn from zero and resets the running total. Mark total rows with \`bar_type="kind"\` (a column whose value is \`total\` or \`subtotal\`) or \`totals=["Start", "End"]\` (a list of labels). A total row with a \`NULL\` value takes the running total, so an "End" row needs no value. Unless the last row is a total, a computed **Total** bar is appended; set \`total=false\` to suppress it.
`
		},
		{
			title: 'Patterns',
			content: `
| Your data | Write |
| --- | --- |
| One row per bar | plain \`y\`, \`order\`, \`totals\` or \`bar_type\` |
| Events with a column that is the bar label | \`x\` = that column, \`y="sum(…)"\` |
| Events over time | \`x\` = date, \`date_grain\`, \`x_sort="asc"\` |
| Events whose bar label is derived | SQL labels each row; \`y="sum(…)"\`, \`order="min(step_order)"\` |
| Bridge between two balances | SQL: start total, grouped movements, \`NULL\` end; \`bar_type\`, \`order\` |
| Before/after snapshots by a dimension | \`x\` = period, \`breakdown\` = dimension |

### One row per bar

| step_order | step | amount |
| --- | --- | --- |
| 1 | Opening cash | 500 |
| 2 | Operating | 320 |
| 3 | Investing | -410 |
| 4 | Financing | 150 |

\`\`\`\`liquid
{% waterfall_chart data="cash_flow" x="step" y="amount" order="step_order" totals=["Opening cash"] total_label="Closing cash" /%}
\`\`\`\`

### Events with a bar-label column

| txn_id | date | category | amount |
| --- | --- | --- | --- |
| 1 | 2024-07-02 | Product sales | 1200 |
| 2 | 2024-07-02 | Refunds | -80 |
| 3 | 2024-07-03 | Product sales | 950 |
| 4 | 2024-07-03 | Shipping fees | 60 |

\`\`\`\`liquid
{% waterfall_chart data="transactions" x="category" y="sum(amount)" y_fmt="usd" /%}
\`\`\`\`

For a build-up over time, use \`x="date" date_grain="month" x_sort="asc"\` on the same table.

### Events whose bar label is derived

Label each row in SQL, keeping the sign, and let the chart aggregate.

\`\`\`\`liquid
\`\`\`sql revenue_lines
SELECT 1 AS step_order, 'Gross sales' AS step, qty * unit_price AS amount FROM orders
UNION ALL SELECT 2, 'Discounts', -(qty * unit_price * discount_pct / 100) FROM orders
UNION ALL SELECT 3, 'Returns', -(qty * unit_price) FROM orders WHERE returned
\`\`\`

{% waterfall_chart data="revenue_lines" x="step" y="sum(amount)" order="min(step_order)" total_label="Net sales" y_fmt="usd" /%}
\`\`\`\`

### Bridge between two balances

The start is a total, the movements are a \`GROUP BY\`, and the end is a \`NULL\` total the chart computes. If the computed end differs from the real closing balance, the movements do not reconcile.

\`\`\`\`liquid
\`\`\`sql arr_bridge
SELECT 0 AS step_order, 'Q1 ARR' AS step, sum(arr) AS amount, 'total' AS kind
FROM arr_snapshots WHERE snapshot_date = '2024-03-31'
UNION ALL
SELECT CASE movement_type WHEN 'new' THEN 1 WHEN 'expansion' THEN 2 WHEN 'contraction' THEN 3 ELSE 4 END,
       movement_type, sum(delta), 'change'
FROM arr_movements WHERE date BETWEEN '2024-04-01' AND '2024-06-30'
GROUP BY movement_type
UNION ALL
SELECT 9, 'Q2 ARR', NULL, 'total'
\`\`\`

{% waterfall_chart data="arr_bridge" x="step" y="amount" bar_type="kind" order="step_order" y_fmt="usd" /%}
\`\`\`\`

Subscription data has no movement column; derive one by comparing each customer's value at the start and end of the period and classifying the difference (new, expansion, contraction, churn) in a \`CASE\`.

### Before/after snapshots by a dimension

| period | segment | revenue |
| --- | --- | --- |
| 2023 | Enterprise | 4.0M |
| 2023 | SMB | 1.5M |
| 2024 | Enterprise | 4.8M |
| 2024 | SMB | 1.9M |

\`\`\`\`liquid
{% waterfall_chart data="revenue" x="period" y="sum(revenue)" breakdown="segment" y_fmt="usd" /%}
\`\`\`\`

Draws **2023** → Enterprise +0.8M → SMB +0.4M → **2024**. With more periods the pattern repeats between each consecutive pair; \`breakdown_limit\` folds small contributors into an "Other" bar. A value present in only one period counts as moving from or to zero.
`
		},
		{
			title: 'Styling',
			content: `
Per-kind colors are set in \`chart_options\`: \`increase_color\`, \`decrease_color\`, \`total_color\`, \`label_color\` (a color, or \`inherit\` to match each bar) and \`connector_color\`.

\`echarts_options\` deep-merges over the whole chart configuration, as on other charts.

The bars, labels and connectors are drawn by a custom series, so \`echarts_series_options\` supports these keys:

| Key | Applies to | Fields |
| --- | --- | --- |
| \`itemStyle\` | bars | \`color\`, \`opacity\`, \`borderColor\`, \`borderWidth\`, \`borderType\`, \`borderRadius\` |
| \`label\` | value labels | \`show\`, \`color\` (including \`inherit\`), \`fontSize\`, \`fontWeight\`, \`fontFamily\`, \`fontStyle\`, \`opacity\` |
| \`lineStyle\` | connectors | \`color\`, \`width\`, \`opacity\`, \`type\` |

Other series keys (\`z\`, \`silent\`, animation) pass through unchanged.
`
		}
	]
} as const satisfies UserComponentSchema;
