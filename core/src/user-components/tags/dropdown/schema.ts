import type { UserComponentSchema } from '../../types';
import {
	and,
	columnsExistInTable,
	tableExists,
	validateSqlExpression,
	filtersExist,
	validateEmptyAttributes,
	validateDateRange,
	validateVariablesInComponent
} from '../../validators';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { availableIconNames } from '../../common/icon-names';
import { SQL_OPTIONS } from '../../common/sql-options';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';

export const schema = {
	render: 'dropdown',
	category: 'input',
	description: 'Display a dropdown with distinct values from a database column to use in filters',
	keywords: [
		'cascading',
		'linked',
		'dependent',
		'hierarchical',
		'filter',
		'select',
		'relevant values'
	],
	attributes: {
		id: {
			type: String,
			description: 'The id of the dropdown to be used in a `filters` prop',
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
			description:
				'Array of filter IDs to apply when querying for dropdown options. Use this to create cascading/linked dropdowns where selecting a value in one dropdown narrows the available options in this dropdown.',
			suggestionType: 'filter',
			affectsQuery: true
		},
		value_column: {
			type: String,
			description:
				"Column name to use as the value for each option, and the column to filter by when this dropdown's `id` is used in the `filters` prop of a chart",
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
		options: {
			type: Array,
			description: 'List of options to display in the dropdown',
			required: false,
			affectsQuery: false
		},
		title: {
			type: String,
			description: 'Text displayed above the dropdown',
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
		icon: {
			type: String,
			description: 'Icon to display in the dropdown trigger',
			required: false,
			matches: [...availableIconNames],
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
		select_first: {
			type: Boolean,
			description: 'Automatically select the first option when the component loads',
			required: false,
			default: false,
			affectsQuery: false
		},
		default_top_n: {
			type: Number,
			description:
				'For a multi-select dropdown, pre-selects the first N options (after `order` is applied) when the component loads. Generalizes `select_first`. Does not limit the option list and has no effect when `multiple=false`.',
			required: false,
			affectsQuery: false
		},
		placeholder: {
			type: String,
			description: 'Placeholder text displayed when no value is selected',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		search: {
			type: Boolean,
			description: 'Includes a search input within the dropdown menu',
			required: false,
			default: true,
			affectsQuery: false
		},
		multiple: {
			type: Boolean,
			description: 'Allows multiple selections',
			required: false,
			default: false,
			affectsQuery: false
		},
		clear: {
			type: Boolean,
			description: 'Includes a clear button to unselect the selected value(s)',
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
			multiValue: "category IN ('Sports', 'Home')",
			example: `{% dropdown id="category_filter" data="products" value_column="category" /%}

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
			example: `{% dropdown id="category_filter" data="products" value_column="category" /%}

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
			example: `{% dropdown id="sort_column" data="products" value_column="column_name" /%}

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
			example: `{% dropdown id="category_filter" %}
    {% option value="Electronics" label="Electronics" /%}
    {% option value="Sports" label="Sports" /%}
    {% option value="Home" label="Home" /%}
{% /dropdown %}

Selected: {{category_filter.label}}`
		},
		{
			name: 'fmt',
			description:
				'Returns the format string associated with the selected option. For multiple selections, returns the first format.',
			noSelectionValue: '',
			singleValue: 'usd',
			multiValue: 'usd',
			example: `{% dropdown id="metric_selector" %}
    {% option value="revenue" label="Revenue" fmt="usd" /%}
    {% option value="growth_rate" label="Growth Rate" fmt="pct1" /%}
{% /dropdown %}

{% big_value data={metrics} value=value fmt={{metric_selector.fmt}} /%}`
		}
	],
	validate: and(
		tableExists('data'),
		columnsExistInTable('data', ['value_column', 'label_column']),
		validateSqlExpression('order', 'data', 'order'),
		validateSqlExpression('where', 'data', 'where'),
		validateDateRange(),
		filtersExist('filters'),
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
		},
		(node) => {
			const topN = node.attributes.default_top_n;
			if (topN !== undefined && (typeof topN !== 'number' || !Number.isInteger(topN) || topN < 1)) {
				return [
					{
						id: 'default-top-n-invalid',
						level: 'error',
						message: "'default_top_n' must be a positive integer (e.g. default_top_n=3)"
					}
				];
			}
			return [];
		},
		(node) => {
			// Only warn once the value itself is valid — otherwise the invalid-value error above
			// already covers it, and surfacing both at once is just noise.
			const topN = node.attributes.default_top_n;
			const isValid = typeof topN === 'number' && Number.isInteger(topN) && topN >= 1;
			if (isValid && node.attributes.multiple !== true) {
				return [
					{
						id: 'default-top-n-requires-multiple',
						level: 'warning',
						message:
							"'default_top_n' only has an effect when 'multiple=true'. For single-select dropdowns, use 'select_first'."
					}
				];
			}
			return [];
		},
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	allowedChildren: ['option', 'dropdown_option'],
	isFilterInput: true,
	componentWrapper: {
		display: 'block',
		noCard: true,
		width: 'fit',
		flex: {
			grow: 1,
			minWidth: 200,
			automaticallyWrapConsecutiveComponentsInRow: true
		}
	},
	examples: [
		{
			title: 'Using `filters`',
			hero: true,
			example: `
{% dropdown
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
{% dropdown
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
{% dropdown
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
			title: 'Using `date_range`',
			example: `
{% dropdown
    id="category_filter"
    data="demo.daily_orders"
    value_column="category"
    date_range={
        date="date"
        range="last 12 months"
    }
/%}
`
		},
		{
			title: 'Cascading Dropdowns (Linked Filters)',
			example: `
{% dropdown
    id="category"
    data="demo.order_details"
    value_column="category"
    title="Category"
/%}

{% dropdown
    id="item"
    data="demo.order_details"
    value_column="item_name"
    title="Item"
    filters=["category"]
/%}

{% table
    data="demo.order_details"
    filters=["category", "item"]
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
