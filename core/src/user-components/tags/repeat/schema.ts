import type { UserComponentSchema } from '../../types';
import {
	and,
	tableExists,
	filtersExist,
	validateEmptyAttributes,
	validateSqlExpression
} from '../../validators';

export const schema = {
	render: 'repeat',
	category: 'logic',
	description: 'Repeats the children of this component once for each distinct value of a column',
	selfClosing: false,
	validate: and(
		tableExists('data'),
		filtersExist('filters'),
		validateSqlExpression('column', 'data', 'select'),
		validateSqlExpression('where', 'data', 'where'),
		validateEmptyAttributes()
	),
	attributes: {
		id: {
			type: String,
			required: true,
			description:
				'The id of this repeat component to be used in the `filters` prop of its children',
			affectsQuery: false
		},
		data: {
			type: String,
			required: true,
			description: 'The name of the table to query',
			suggestionType: 'table',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		column: {
			type: String,
			required: true,
			description: 'The name of the column within the `data` table to get distinct values',
			suggestionType: 'sql',
			affectsQuery: true,
			supportsVariables: true,
			variableContext: 'column'
		},
		where: {
			type: String,
			required: false,
			description: 'SQL WHERE clause to filter which values to repeat over',
			suggestionType: 'sql',
			supportsVariables: true,
			variableContext: 'sql',
			affectsQuery: true
		},
		filters: {
			type: Array,
			required: false,
			default: [],
			description: 'Array of filter IDs to apply when querying for distinct values',
			suggestionType: 'filter',
			affectsQuery: true
		}
	},
	componentWrapper: false,
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% repeat 
	id="category_repeat" 
	data="demo.daily_orders" 
	column="category" 
%}
   {% line_chart
        data="demo.daily_orders"
        x="date"
        date_grain="month"
        y="sum(total_sales)"
        filters=["category_repeat"]
   /%}
{% /repeat %}
`
		},
		{
			title: 'With WHERE Clause',
			example: `
{% repeat 
	id="top_categories" 
	data="demo.daily_orders" 
	column="category"
	where="total_sales > 1000"
%}
   ### {{top_categories}}
   {% line_chart
        data="demo.daily_orders"
        x="date"
        y="sum(total_sales)"
        filters=["top_categories"]
   /%}
{% /repeat %}
`
		}
	]
} as const satisfies UserComponentSchema;
