import type { UserComponentSchema } from '../../types';
import {
	validateEmptyAttributes,
	validateFormatCode,
	and,
	tableExists,
	columnsExistInTable,
	validateNumericColumn,
	validateDateRange
} from '../../validators';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';

export const schema = {
	render: 'slider',
	category: 'input',
	description: 'A numeric slider input that can be used in filters',
	keywords: ['range input', 'range slider', 'numeric input'],
	attributes: {
		id: {
			type: String,
			description: 'The id of the slider to be used in a `filters` prop',
			required: true,
			affectsQuery: false
		},
		title: {
			type: String,
			description: 'Text displayed above the slider',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		info: {
			type: String,
			description: 'Information tooltip text',
			required: false,
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
		data: {
			type: String,
			description: 'Name of the table to query for min/max values',
			required: false,
			suggested: true,
			suggestionType: 'table',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		value_column: {
			type: String,
			description:
				'SQL expression to get min/max values from. When provided with data, queries MIN(value_column) and MAX(value_column) to set the slider range.',
			required: false,
			suggested: true,
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		min: {
			type: Number,
			description: 'Minimum value for the slider',
			required: false,
			affectsQuery: false
		},
		max: {
			type: Number,
			description: 'Maximum value for the slider',
			required: false,
			affectsQuery: false
		},
		step: {
			type: Number,
			description: 'Step size for the slider (must be greater than 0)',
			required: false,
			default: 1,
			affectsQuery: false
		},
		snap_to_step: {
			type: Boolean,
			description:
				'If true, automatically adjusts min/max to align with step boundaries for cleaner numbers (e.g., range 15-103818 with step=10000 becomes 0-110000)',
			required: false,
			default: true,
			affectsQuery: false
		},
		fmt: {
			type: String,
			description:
				'Format code for the slider values (e.g., "num", "usd", "pct"). See formatValue documentation for available formats.',
			required: false,
			default: 'num',
			affectsQuery: false,
			suggestionType: 'format',
			supportsVariables: true,
			variableContext: 'text'
		},
		range: {
			type: Boolean,
			description: 'If true, enables range mode with two handles for selecting a min/max range',
			required: false,
			default: false,
			affectsQuery: false
		},
		initial_value: {
			type: [Number, Array],
			description:
				'Initial selected value (number for single value, [min, max] array for range mode)',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		show_input: {
			type: Boolean,
			description: 'If true, shows a number input next to the slider value for direct editing',
			required: false,
			default: false,
			affectsQuery: false
		},
		...DATE_RANGE_ATTRIBUTE
	},
	filterProperties: [
		{
			name: 'value',
			defaultFor: ['sql', 'text', 'column'],
			description: 'Returns the numeric slider value, or the selected range when in range mode.',
			singleValue: '500',
			example: `{% slider id="age_filter" data="users" value_column="age" /%}

\`\`\`sql filtered_users
select * from users
where age >= {{age_filter}}
\`\`\``
		},
		{
			name: 'filter',
			description:
				'Returns a complete SQL filter expression. Returns `true` when no value is selected. Only available when `value_column` is provided.',
			singleValue: 'age >= 25',
			example: `{% slider id="age_filter" data="users" value_column="age" /%}

\`\`\`sql filtered_users
select * from users
where {{age_filter.filter}}
\`\`\``
		},
		{
			name: 'literal',
			description: 'Returns the raw numeric value. Only available in single value mode.',
			singleValue: '500',
			example: `{% slider id="price_filter" min=0 max=1000 /%}

\`\`\`sql filtered_products
select * from products
where price >= {{price_filter.literal}}
\`\`\``
		},
		{
			name: 'min',
			description:
				'Returns the minimum value of the selected range. Only available when range mode is enabled.',
			singleValue: '25',
			example: `{% slider id="age_filter" data="users" value_column="age" range=true /%}

\`\`\`sql filtered_users
select * from users
where age >= {{age_filter.min}}
\`\`\``
		},
		{
			name: 'max',
			description:
				'Returns the maximum value of the selected range. Only available when range mode is enabled.',
			singleValue: '65',
			example: `{% slider id="age_filter" data="users" value_column="age" range=true /%}

\`\`\`sql filtered_users
select * from users
where age <= {{age_filter.max}}
\`\`\``
		},
		{
			name: 'between',
			description:
				'Returns a SQL BETWEEN clause fragment. Only available when range mode is enabled.',
			singleValue: 'BETWEEN 25 AND 65',
			example: `{% slider id="price_filter" min=0 max=1000 range=true /%}

\`\`\`sql filtered_products
select * from products
where sale_price {{price_filter.between}}
\`\`\``
		}
	],
	validate: and(
		validateEmptyAttributes(),
		validateFormatCode('fmt'),
		tableExists('data'),
		columnsExistInTable('data', ['value_column']),
		validateNumericColumn('value_column', 'data'),
		validateDateRange(),
		(node) => {
			const step = node.attributes.step;
			if (step !== undefined && step <= 0) {
				return [
					{
						id: 'step-must-be-positive',
						level: 'error',
						message: "'step' must be greater than 0"
					}
				];
			}
			return [];
		},
		(node) => {
			if (node.attributes.data && !node.attributes.value_column) {
				return [
					{
						id: 'value_column-required',
						level: 'error',
						message: "'value_column' must be provided when 'data' is provided"
					}
				];
			}
			return [];
		}
	),
	isFilterInput: true,
	componentWrapper: {
		display: 'block',
		noCard: true,
		width: 'fit',
		flex: {
			grow: 0,
			minWidth: 200,
			automaticallyWrapConsecutiveComponentsInRow: true
		}
	},
	examples: [
		{
			title: 'Using `filters`',
			hero: true,
			example: `
{% slider
    id="sales_filter"
    data="demo.daily_orders"
    value_column="total_sales"
    title="Sales Amount"
/%}

{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    filters=["sales_filter"]
    date_grain="month"
/%}
`
		},
		{
			title: 'Using `where`',
			example: `
{% slider
    id="sales_filter"
    data="demo.daily_orders"
    value_column="total_sales"
    range=true
/%}

{% table
    data="demo.daily_orders"
    where="total_sales {{sales_filter.between}}"
/%}
`
		},
		{
			title: 'Using Inline SQL',
			example: `
{% slider
    id="sales_filter"
    data="demo.daily_orders"
    value_column="total_sales"
    range=true
/%}

\`\`\`sql filtered_orders
select * from demo.daily_orders
where total_sales {{sales_filter.between}}
\`\`\`

{% table data="filtered_orders" /%}
`
		}
	]
} as const satisfies UserComponentSchema;
