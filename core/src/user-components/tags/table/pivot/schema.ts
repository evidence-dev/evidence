import type { UserComponentSchema } from '../../../types';
import {
	and,
	validateSqlExpression,
	needsDateGrain,
	validateFormatCode,
	validateEmptyAttributes
} from '../../../validators';
import { DATE_GRAIN_ATTRIBUTE } from '../../../common/date-options';

const attributes = {
	value: {
		type: String,
		required: true,
		affectsQuery: true,
		suggestionType: 'sql',
		supportsVariables: true,
		variableContext: 'column'
	},
	fmt: {
		type: String,
		required: false,
		default: undefined,
		supportsVariables: true,
		variableContext: 'text'
	},
	...DATE_GRAIN_ATTRIBUTE,
	sort: {
		type: String,
		required: false,
		matches: ['asc', 'desc'],
		default: undefined,
		description:
			'Sort direction for this pivot column. When specified, the table will be sorted by this column.'
	}
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'pivot',
	category: 'table',
	description:
		'Add a pivot to a table, including date filtering, date grains, formatting, and more',
	selfClosing: true,
	attributes,
	allowedParents: ['table'],
	componentWrapper: false,
	validate: and(
		validateSqlExpression('value', 'data', 'select', { getTableNameFromParent: true }),
		needsDateGrain('value'),
		validateFormatCode('fmt'),
		validateEmptyAttributes()
	),
	examples: [
		{
			title: 'Pivoted Table',
			hero: true,
			example: `
{% table data="demo.daily_orders" %}
    {% dimension value="category" /%}
    {% pivot value="date" date_grain="year" /%}
    {% measure value="sum(total_sales)" fmt="usd1m" /%}
{% /table %}
`
		}
	]
} as const satisfies UserComponentSchema;
