import type { UserComponentSchema } from '../../types';
import {
	and,
	columnsExistInTable,
	tableExists,
	validateSqlExpression,
	filtersExist,
	validateEmptyAttributes,
	validateFormatCode,
	validateDateRange,
	validateVariablesInComponent
} from '../../validators';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import { DATE_RANGE_ATTRIBUTE } from '../../common/date-options';

export const schema = {
	render: 'dimension_grid',
	category: 'input',
	keywords: ['facet filter', 'dimension filter', 'multi-select grid'],
	description:
		'Display an interactive grid of dimension columns with aggregated metrics and bar visualizations for filtering',
	attributes: {
		id: {
			type: String,
			description: 'The id of the dimension grid to use in a `filters` prop',
			required: true,
			affectsQuery: false
		},
		data: {
			type: String,
			description: 'Name of the table to query',
			required: true,
			suggested: true,
			suggestionType: 'table',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		dimensions: {
			type: Array,
			description:
				'Array of column names to display as dimensions. If not provided, auto-detects string columns.',
			required: false,
			suggestionType: 'column',
			affectsQuery: true
		},
		metric: {
			type: String,
			description: 'SQL aggregation expression (default: count(*))',
			required: false,
			default: 'count(*)',
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		metric_label: {
			type: String,
			description: 'Label displayed above the metric values',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		fmt: {
			type: String,
			description: 'Format code for the metric values (e.g., "num0", "usd", "pct1")',
			required: false,
			suggestionType: 'format',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		limit: {
			type: Number,
			description: 'Maximum number of values to show per dimension (default: 10)',
			required: false,
			default: 10,
			affectsQuery: true
		},
		multiple: {
			type: Boolean,
			description: 'Allow multiple selections per dimension (default: true)',
			required: false,
			default: true,
			affectsQuery: false
		},
		filters: {
			type: Array,
			required: false,
			default: [],
			description: 'Array of filter IDs to apply when querying dimension values',
			suggestionType: 'filter',
			affectsQuery: true
		},
		where: {
			type: String,
			description: 'SQL WHERE clause to filter data',
			required: false,
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'sql'
		},
		title: {
			type: String,
			description: 'Title displayed above the dimension grid',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		subtitle: {
			type: String,
			description: 'Subtitle displayed below the title',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		...DATE_RANGE_ATTRIBUTE,
		...WIDTH_ATTRIBUTE
	},
	filterProperties: [
		{
			name: 'filter',
			description:
				'Returns a complete SQL filter expression combining all dimension selections. Returns `true` when no values are selected.',
			example: `{% dimension_grid id="dim_filter" data="orders" /%}

\`\`\`sql filtered_orders
select * from orders
where {{dim_filter.filter}}
\`\`\``
		},
		{
			name: 'selected',
			description:
				'Returns an object with dimension names as keys and selected values as arrays. Useful for accessing individual dimension selections.',
			example: `{% dimension_grid id="dim_filter" data="orders" dimensions=["category", "region"] /%}

Selected categories: {{dim_filter.category}}
Selected regions: {{dim_filter.region}}`
		},
		{
			name: 'literal',
			description: 'Returns a human-readable summary of all selections.',
			example: `{% dimension_grid id="dim_filter" data="orders" /%}

Active filters: {{dim_filter.literal}}`
		}
	],
	validate: and(
		tableExists('data'),
		columnsExistInTable('data', ['dimensions']),
		validateSqlExpression('metric', 'data', 'select'),
		validateSqlExpression('where', 'data', 'where'),
		validateDateRange(),
		filtersExist('filters'),
		validateFormatCode('fmt'),
		validateEmptyAttributes(),
		validateVariablesInComponent()
	),
	selfClosing: true,
	isFilterInput: true,
	componentWrapper: {
		display: 'block',
		noCard: false,
		width: 'full',
		flex: {
			grow: 1,
			minWidth: 400
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% dimension_grid
    id="product_filter"
    data="demo.daily_orders"
/%}
`
		},
		{
			title: 'With Explicit Dimensions and Metric',
			example: `
{% dimension_grid
    id="sales_filter"
    data="orders"
    dimensions=["category", "region"]
    metric="sum(sales)"
    fmt="usd"
    limit=5
/%}
`
		},
		{
			title: 'Using Filter in Query',
			example: `
{% dimension_grid id="order_filter" data="orders" /%}

\`\`\`sql filtered_orders
select * from orders
where {{order_filter.filter}}
\`\`\`
`
		}
	]
} as const satisfies UserComponentSchema;
