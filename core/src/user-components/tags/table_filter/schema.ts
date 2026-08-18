import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';
import { and, tableExists, validateEmptyAttributes, type Validator } from '../../validators';

const validateSelectModeOverlap: Validator = (node) => {
	const singleSelect = node.attributes.single_select;
	const multiSelect = node.attributes.multi_select;
	if (!Array.isArray(singleSelect) || !Array.isArray(multiSelect)) return [];

	const overlap = singleSelect.filter(
		(column) => typeof column === 'string' && multiSelect.includes(column)
	);
	if (overlap.length === 0) return [];

	return [
		{
			id: 'select-mode-overlap',
			level: 'warning',
			message: `Columns listed in both single_select and multi_select will be single-select: ${overlap.join(', ')}`,
			location: node.location
		}
	];
};

const attributes = {
	id: {
		type: String,
		description: 'Unique identifier for the filter component',
		required: true
	},
	className: {
		type: String,
		description: 'Additional CSS classes to apply'
	},
	data: {
		type: String,
		description: 'ID of the table to filter',
		required: true,
		suggestionType: 'table'
	},
	title: {
		type: String,
		description: 'Custom title text for the filter button (defaults to "Filter")',
		default: 'Filter'
	},
	defaultConjunction: {
		type: String,
		description: 'Default conjunction between filters (AND or OR)',
		matches: ['AND', 'OR'],
		default: 'AND'
	},
	columns: {
		type: Array,
		description:
			'Array of column IDs to filter on. If not provided, all columns are available for filtering',
		suggestionType: 'column'
	},
	labels: {
		type: Array,
		description:
			'Array of custom labels to display instead of column names. Must match the order of the columns array.'
	},
	showClearButton: {
		type: Boolean,
		description: 'Whether to show a clear button to remove all filters',
		default: true
	},
	minimumRecords: {
		type: Number,
		description:
			'When set, string filters will only show values that have at least this many records, and filters will always use AND conjunction',
		required: false
	},
	multiple: {
		type: Boolean,
		description:
			'When false, string filters will only allow selecting a single value instead of multiple values. Can be overridden per column with single_select and multi_select.',
		default: true
	},
	single_select: {
		type: Array,
		description:
			'Array of column names whose string filter only allows selecting a single value, regardless of the multiple setting',
		default: [],
		suggestionType: 'column'
	},
	multi_select: {
		type: Array,
		description:
			'Array of column names whose string filter allows selecting multiple values, regardless of the multiple setting',
		default: [],
		suggestionType: 'column'
	},
	initial_values: {
		type: Object,
		description:
			"An object with column names as keys and this filter's initial value for that column as the value",
		default: {}
	},
	require_selection: {
		type: Array,
		description:
			'An array containing column names that always require a selection. Only supports text columns.',
		default: []
	},
	...WIDTH_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'table_filter',
	category: 'input',
	selfClosing: true,
	description: 'A filter component for tables with multiple condition support',
	attributes,
	validate: and(tableExists('data'), validateEmptyAttributes(), validateSelectModeOverlap),
	isFilterInput: true,
	filterProperties: [
		{
			name: 'filter',
			defaultFor: ['sql', 'text', 'column'],
			description:
				'Returns a complete SQL filter expression combining all active filter conditions. Returns `true` when no filters are active.',
			noSelectionValue: 'true',
			singleValue: "category = 'Electronics' AND total_sales > 1000",
			example: `{% table_filter id="my_filter" data="demo.daily_orders" /%}

\`\`\`sql filtered_orders
select * from demo.daily_orders
where {{my_filter}}
\`\`\``
		}
	],
	componentWrapper: {
		display: 'block',
		noCard: true,
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 250
		}
	},
	examples: [
		{
			title: 'Using `filters`',
			hero: true,
			example: `
{% table_filter
    id="my_filter"
    data="demo.daily_orders"
/%}

{% bar_chart
    data="demo.daily_orders"
    x="date"
    y="sum(total_sales)"
    filters=["my_filter"]
    date_grain="month"
/%}
`
		},
		{
			title: 'Using Inline SQL',
			example: `
{% table_filter
    id="my_filter"
    data="demo.daily_orders"
/%}

\`\`\`sql filtered_orders
select * from demo.daily_orders
where {{my_filter.filter}}
\`\`\`

{% table data="filtered_orders" /%}
`
		},
		{
			title: 'Custom Title',
			example: `
{% table_filter
    id="orders_filter"
    data="demo.daily_orders"
    title="Order Search"
/%}
`
		},
		{
			title: 'Mixed Single and Multi Select',
			example: `
{% table_filter
    id="mixed_filter"
    data="demo.daily_orders"
    columns=["category", "item"]
    single_select=["category"]
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
