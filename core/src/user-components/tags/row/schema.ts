import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'row',
	category: 'ui',
	description: 'A flexible layout that places its children next to each other',
	attributes: {
		align: {
			type: String,
			description: 'How to vertically align items in this row',
			// TODO would be nice if we could attach a description to each `matches` item - consider making a change to our Markdoc fork
			matches: ['top', 'center', 'bottom', 'stretch'],
			default: 'stretch'
		},
		justify: {
			type: String,
			description:
				'How to place items horizontally when they leave free space. `start` packs them to the left, `center` to the middle, `end` to the right, and `between` pushes the first and last items to the edges. With `center`, `end` or `between`, inputs and big values keep their minimum width instead of stretching on screens at least 1024px wide and in PDFs. Charts and tables still fill the row.',
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
		},
		{
			title: 'Heading with a filter on the right',
			example: `
{% row align="center" justify="between" %}
## Orders by category
{% dropdown id="category" data="demo.daily_orders" value_column="category" /%}
{% /row %}
`
		},
		{
			title: 'Filter on the right',
			example: `
{% row justify="end" %}
{% dropdown id="category" data="demo.daily_orders" value_column="category" /%}
{% /row %}
`
		},
		{
			title: 'Centered big values',
			example: `
{% row justify="center" %}
{% big_value data="demo.daily_orders" value="sum(total_sales)" title="Sales" /%}
{% big_value data="demo.daily_orders" value="sum(transactions)" title="Transactions" /%}
{% /row %}
`
		},
		{
			title: "Setting an item's width",
			example: `
{% row justify="end" %}
{% dropdown id="category" data="demo.daily_orders" value_column="category" width=40 /%}
{% /row %}
`
		}
	],
	extraDocsSections: [
		{
			title: 'How items are sized',
			content: `By default, items in a row stretch to share its width. Each component has a minimum width; items that don't fit wrap onto the next line.

- Charts, tables and other content blocks stretch to fill the row.
- Inputs and big values also stretch, unless the row sets \`justify\` to \`center\`, \`end\` or \`between\` and the screen is at least 1024px wide (or the page is a PDF). Then they keep their minimum width (about 200px for inputs, 180px for big values) so \`justify\` can move them.
- Buttons, text and headings keep their natural width.
- Set \`width\` (a percentage) on an item to size it yourself.

\`justify\` only moves items when there is free space, so it has no visible effect on a row of charts.

Rows wrap on narrow screens, and \`justify\` applies to each line. On screens narrower than 1024px, such as phones and tablets, inputs and big values stretch to the full width again. A \`stack\` inside a row stretches like a content block.`
		}
	]
} as const satisfies UserComponentSchema;
