import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'row',
	category: 'ui',
	description: 'A flexible layout that places its children next to each other',
	attributes: {
		align: {
			type: String,
			description: 'How to vertically align items in this stack',
			// TODO would be nice if we could attach a description to each `matches` item - consider making a change to our Markdoc fork
			matches: ['top', 'center', 'bottom', 'stretch'],
			default: 'stretch'
		},
		justify: {
			type: String,
			description:
				'How to distribute items horizontally. `between` pushes the first and last items to the edges, e.g. a heading on the left and an input on the right.',
			matches: ['start', 'center', 'end', 'between'],
			default: 'start'
		},
		card: {
			type: Boolean,
			description: 'Display the row contents as a single card when card mode is enabled',
			default: false
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
<!-- 2 side-by-side charts -->
{% row %}
    {% line_chart
        data="demo.daily_orders"
        x="date"
        date_grain="quarter"
        y="sum(total_sales)"
    /%}
    {% bar_chart
        data="demo.daily_orders"
        x="category"
        y="sum(transactions)"
    /%}
{% /row %}
`
		},
		{
			title: 'Heading with a button on the right',
			example: `
{% row align="center" justify="between" %}
# Sales Overview
{% link_button url="https://example.com" title="Full report" /%}
{% /row %}
`
		}
	]
} as const satisfies UserComponentSchema;
