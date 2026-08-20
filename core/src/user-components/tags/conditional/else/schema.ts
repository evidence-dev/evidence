import type { UserComponentSchema } from '../../../types';
import { validateConditionalOrder } from '../../../validators/validateConditionalOrder';

export const schema = {
	render: 'else',
	category: 'logic',
	description:
		'If prior conditional blocks do not pass, the contents of the else block are rendered.',
	attributes: {},
	selfClosing: false,
	componentWrapper: false,
	validate: validateConditionalOrder,
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% if data="demo.daily_orders" %}
	If Content
{% /if %}
{% else %}
	Else Content
{% /else %}
`
		}
	]
} as const satisfies UserComponentSchema;
