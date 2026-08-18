import type { UserComponentSchema } from '../../../types';
import { and, tableExists } from '../../../validators';
import { SQL_OPTIONS } from '../../../common/sql-options';
import { validateSqlOptions, validateEmptyAttributes } from '../../../validators';

export const schema = {
	render: 'if',
	category: 'logic',
	description: 'Conditionally render the contents based on whether rows are returned by the query.',
	attributes: {
		data: {
			type: String,
			required: true,
			suggestionType: 'table',
			description: 'Table or view to query',
			affectsQuery: true
		},
		filters: {
			type: Array,
			required: false,
			default: [],
			description: 'IDs of filters to apply to the query',
			suggestionType: 'filter',
			affectsQuery: true
		},
		condition: {
			type: String,
			required: false,
			default: 'has_rows',
			description:
				'Set to "no_rows" to render children only if the query returns no rows. Set to "has_rows" (or omit) to render if query returns rows.',
			matches: ['no_rows', 'has_rows']
		},
		...SQL_OPTIONS
	},
	selfClosing: false,
	// required to get the component console to render
	componentWrapper: false,
	validate: and(tableExists('data'), validateSqlOptions('data'), validateEmptyAttributes()),
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% if data="demo.daily_orders" %}
	Content
{% /if %}
`
		}
	]
} as const satisfies UserComponentSchema;
