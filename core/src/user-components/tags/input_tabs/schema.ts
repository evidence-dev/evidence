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
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { SQL_OPTIONS } from '../../common/sql-options';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';

export const schema = {
	render: 'input_tabs',
	category: 'input',
	description:
		'Display a tab-style selector with distinct values from a database column to use in filters. Appears full-width and does not group with other filter inputs.',
	attributes: {
		id: {
			type: String,
			description: 'The id of the input tabs to be used in a `filters` prop',
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
				"Column name to use as the value for each option, and the column to filter by when this input tabs' `id` is used in the `filters` prop of a chart",
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
		initial_value: {
			type: String,
			description: 'Initial selected value (single selection only)',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		variant: {
			type: String,
			description:
				'Visual style variant: "default" for underline style, "well" for button-style tabs',
			required: false,
			default: 'default',
			matches: ['default', 'well'],
			affectsQuery: false
		},
		full_width: {
			type: Boolean,
			description: 'Whether the tabs should take the full width of their container',
			required: false,
			default: false,
			affectsQuery: false
		},
		align: {
			type: String,
			description:
				'Horizontal alignment of tabs. Note: align right only affects the default variant.',
			required: false,
			default: 'left',
			matches: ['left', 'right'],
			affectsQuery: false
		},
		select_first: {
			type: Boolean,
			description:
				'Automatically select the first option when the component loads (defaults to true)',
			required: false,
			default: true,
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
		...DATE_RANGE_ATTRIBUTE,
		...WIDTH_ATTRIBUTE
	},
	filterProperties: [
		{
			name: 'filter',
			description:
				'Returns a complete SQL filter expression ready to use in WHERE clauses. Returns `true` when no value is selected.',
			noSelectionValue: 'true',
			singleValue: "category = 'Electronics'",
			example: `{% input_tabs id="category_filter" data="products" value_column="category" /%}

\`\`\`sql filtered_products
select * from products
where {{category_filter.filter}}
\`\`\``
		},
		{
			name: 'selected',
			defaultFor: ['sql'],
			description:
				'Returns the selected value wrapped in quotes, suitable for SQL comparisons. Returns an empty string when no value is selected.',
			noSelectionValue: "''",
			singleValue: "'Electronics'",
			example: `{% input_tabs id="category_filter" data="products" value_column="category" /%}

\`\`\`sql products_by_category
select * from products
where category = {{category_filter.selected}}
\`\`\``
		},
		{
			name: 'literal',
			defaultFor: ['text', 'column'],
			description:
				'Returns the raw unescaped selected value, useful for display in text or dynamic column selection.',
			noSelectionValue: '',
			singleValue: 'Electronics',
			example: `{% input_tabs id="sort_column" data="products" value_column="column_name" /%}

\`\`\`sql dynamic_sort
select * from products
order by {{sort_column.literal}}
\`\`\``
		},
		{
			name: 'label',
			description:
				'Returns the display label for the selected option. Falls back to the value if no label is defined.',
			noSelectionValue: '',
			singleValue: 'Electronics',
			example: `{% input_tabs id="category_filter" %}
    {% option value="Electronics" label="Electronics" /%}
    {% option value="Sports" label="Sports" /%}
    {% option value="Home" label="Home" /%}
{% /input_tabs %}

Selected: {{category_filter.label}}`
		},
		{
			name: 'fmt',
			description:
				'Returns the format string associated with the selected option. Useful for dynamically updating chart formatting.',
			noSelectionValue: '',
			singleValue: 'usd',
			example: `{% input_tabs id="metric_selector" %}
    {% option value="revenue" label="Revenue" fmt="usd" /%}
    {% option value="growth_rate" label="Growth Rate" fmt="pct1" /%}
{% /input_tabs %}

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
			automaticallyWrapConsecutiveComponentsInRow: false // Tabs don't group with other inputs
		}
	},
	examples: [
		{
			title: 'Using `filters`',
			hero: true,
			example: `
{% input_tabs
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
{% input_tabs
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
{% input_tabs
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
		}
	]
} as const satisfies UserComponentSchema;
