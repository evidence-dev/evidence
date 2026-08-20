import { schema as ifSchema } from '../if/schema';
import { and, tableExists, validateEmptyAttributes, validateSqlOptions } from '../../../validators';
import { validateConditionalOrder } from '../../../validators/validateConditionalOrder';
import type { UserComponentSchema } from '../../../types';

export const schema = {
	...ifSchema,
	render: 'else_if',
	category: 'logic',
	description:
		'If prior conditional blocks do not pass, conditionally render the contents based on whether rows are returned by the query.',
	validate: and(
		tableExists('data'),
		validateSqlOptions('data'),
		validateConditionalOrder,
		validateEmptyAttributes()
	),
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% if data="demo.daily_orders" condition="no_rows" %}
	If Content
{% /if %}
{% else_if data="demo.daily_orders" %}
	Else If Content
{% /else_if %}
`
		}
	]
} as const satisfies UserComponentSchema;
