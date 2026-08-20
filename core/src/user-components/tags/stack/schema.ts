import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'stack',
	category: 'ui',
	description: 'A flexible layout that stacks its children vertically',
	attributes: {
		align: {
			type: String,
			description: 'How to horizontally align items in this stack',
			// TODO would be nice if we could attach a description to each `matches` item - consider making a change to our Markdoc fork
			matches: ['left', 'center', 'right', 'stretch'],
			default: 'stretch'
		},
		card: {
			type: Boolean,
			description: 'Display the stack contents as a single card when card mode is enabled',
			default: false
		},
		print_break: {
			type: String,
			description:
				'Controls page breaks inside this component in PDF exports. `auto` allows content to flow across pages, `avoid` attempts to keep all content together on one page.',
			matches: ['auto', 'avoid'],
			default: 'auto'
		},
		...WIDTH_ATTRIBUTE
	},
	selfClosing: false,
	componentWrapper: {
		display: 'block',
		width: 'full',
		noCard: true,
		flex: {
			grow: 'children',
			minWidth: 'children'
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
<!-- 2 big values stacked vertically -->
{% stack  %}
    {% big_value
        data="demo.daily_orders"
        value="sum(total_sales)"
    /%}
    {% big_value
        data="demo.daily_orders"
        value="avg(avg_transaction_value)"
    /%}
{% /stack %}
`
		}
	]
} as const satisfies UserComponentSchema;
