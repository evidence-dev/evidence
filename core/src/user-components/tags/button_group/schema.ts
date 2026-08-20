import type { UserComponentSchema } from '../../types';
import {
	and,
	columnsExistInTable,
	tableExists,
	validateSqlExpression,
	filtersExist,
	validateEmptyAttributes,
	validateDateRange
} from '../../validators';
import { SQL_OPTIONS } from '../../common/sql-options';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';

export const schema = {
	render: 'button_group',
	category: 'input',
	keywords: ['radio buttons', 'segmented control', 'chip selector'],
	description:
		'Display a segmented button group with distinct values from a database column to use in filters',
	attributes: {
		id: {
			type: String,
			description: 'The id of the button group to be used in a `filters` prop',
			required: true,
			affectsQuery: false
		},
		data: {
			type: String,
			description: 'Name of the table to query',
			required: false,
			suggested: true,
			suggestionType: 'table',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		filters: {
			type: Array,
			required: false,
			default: [],
			description: 'Array of filter IDs to apply when querying for options',
			suggestionType: 'filter',
			affectsQuery: true
		},
		value_column: {
			type: String,
			description:
				"Column name to use as the value for each option, and the column to filter by when this button group's `id` is used in the `filters` prop of a chart",
			required: false,
			suggested: true,
			suggestionType: 'column',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		label_column: {
			type: String,
			description: 'Column name to use as the label for each option',
			required: false,
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		title: {
			type: String,
			description: 'Text displayed above the button group',
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
		initial_value: {
			type: [String, Number, Array],
			description: 'Initial selected value(s)',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		multiple: {
			type: Boolean,
			description: 'Allows multiple selections',
			required: false,
			default: false,
			affectsQuery: false
		},
		select_first: {
			type: Boolean,
			description: 'Automatically select the first option when the component loads',
			required: false,
			default: false,
			affectsQuery: false
		},
		orientation: {
			type: String,
			description:
				'Layout direction of the button group. Use "vertical" to stack buttons in a column. Best paired with a sibling element inside a `row` so the stack sits alongside its target content.',
			required: false,
			default: 'horizontal',
			matches: ['horizontal', 'vertical'],
			affectsQuery: false
		},
		max_height: {
			type: Number,
			description:
				'Maximum height in pixels for the button stack when `orientation="vertical"`. Buttons scroll if the list overflows. Ignored when horizontal.',
			required: false,
			affectsQuery: false
		},
		order: {
			type: String,
			description:
				'Column name(s) with optional direction (e.g. "column_name", "column_name desc")',
			required: false,
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'sql'
		},
		where: SQL_OPTIONS.where,
		...DATE_RANGE_ATTRIBUTE
	},
	filterProperties: [
		{
			name: 'filter',
			description:
				'Returns a complete SQL filter expression ready to use in WHERE clauses. Returns `true` when no value is selected.',
			noSelectionValue: 'true',
			singleValue: "category = 'Electronics'",
			multiValue: "category IN ('Sports', 'Home')",
			example: `{% button_group id="category_filter" data="products" value_column="category" /%}

\`\`\`sql filtered_products
select * from products
where {{category_filter.filter}}
\`\`\``
		},
		{
			name: 'selected',
			defaultFor: ['sql'],
			description:
				'Returns the selected value(s) wrapped in quotes, suitable for SQL comparisons. Returns an empty string when no value is selected.',
			noSelectionValue: "''",
			singleValue: "'Electronics'",
			multiValue: "('Sports', 'Home')",
			example: `{% button_group id="category_filter" data="products" value_column="category" /%}

\`\`\`sql products_by_category
select * from products
where category = {{category_filter.selected}}
\`\`\``
		},
		{
			name: 'literal',
			defaultFor: ['text', 'column'],
			description:
				'Returns the raw unescaped selected value(s), useful for display in text or dynamic column selection.',
			noSelectionValue: '',
			singleValue: 'Electronics',
			multiValue: 'Sports, Home',
			example: `{% button_group id="sort_column" data="products" value_column="column_name" /%}

\`\`\`sql dynamic_sort
select * from products
order by {{sort_column.literal}}
\`\`\``
		},
		{
			name: 'label',
			description:
				'Returns the display label for the selected option(s). Falls back to the value if no label is defined.',
			noSelectionValue: '',
			singleValue: 'Electronics',
			multiValue: 'Sports, Home',
			example: `{% button_group id="category_filter" %}
    {% option value="Electronics" label="Electronics" /%}
    {% option value="Sports" label="Sports" /%}
    {% option value="Home" label="Home" /%}
{% /button_group %}

Selected: {{category_filter.label}}`
		},
		{
			name: 'fmt',
			description:
				'Returns the format string associated with the selected option. For multiple selections, returns the first format.',
			noSelectionValue: '',
			singleValue: 'usd',
			multiValue: 'usd',
			example: `{% button_group id="metric_selector" %}
    {% option value="revenue" label="Revenue" fmt="usd" /%}
    {% option value="growth_rate" label="Growth Rate" fmt="pct1" /%}
{% /button_group %}

{% big_value data={metrics} value=value fmt={{metric_selector.fmt}} /%}`
		}
	],
	validate: and(
		tableExists('data'),
		columnsExistInTable('data', ['value_column', 'label_column']),
		validateSqlExpression('order', 'data', 'order'),
		validateDateRange(),
		filtersExist('filters'),
		(node) => {
			const errors: Array<{ id: string; level: 'error'; message: string }> = [];

			if (node.attributes.data && !node.attributes.value_column) {
				errors.push({
					id: 'value_column-required',
					level: 'error',
					message: "'value_column' must be provided when 'data' is provided"
				});
			}

			return errors;
		},
		validateEmptyAttributes()
	),
	allowedChildren: ['option'],
	isFilterInput: true,
	componentWrapper: {
		display: 'block',
		noCard: true,
		width: 'full',
		flex: {
			grow: 0,
			minWidth: 10,
			automaticallyWrapConsecutiveComponentsInRow: true
		}
	},
	examples: [
		{
			title: 'Using `filters`',
			hero: true,
			example: `
{% button_group
    id="category_filter"
    data="demo.daily_orders"
    value_column="category"
/%}

{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    filters=["category_filter"]
    date_grain="month"
/%}
`
		},
		{
			title: 'Using `where`',
			example: `
{% button_group
    id="category_filter"
    data="demo.daily_orders"
    value_column="category"
/%}

{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    where="category = {{category_filter}}"
    date_grain="month"
/%}
`
		},
		{
			title: 'Using Inline SQL',
			example: `
{% button_group
    id="category_filter"
    data="demo.daily_orders"
    value_column="category"
/%}

\`\`\`sql filtered_orders
select * from demo.daily_orders
where category = {{category_filter}}
\`\`\`

{% table data="filtered_orders" /%}
`
		},
		{
			title: 'Vertical orientation inside a row',
			example: `
{% row %}

{% button_group
    id="category_filter"
    data="demo.daily_orders"
    value_column="category"
    orientation="vertical"
/%}

{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    filters=["category_filter"]
    date_grain="month"
/%}

{% /row %}
`
		}
	]
} as const satisfies UserComponentSchema;
