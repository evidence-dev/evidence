import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'fill',
	category: 'ui',
	selfClosing: false,
	description:
		'Fills a NAMED slot of a custom component at the call site. Use only as a direct child of a custom component tag whose body declares {% slot name="..." /%}: {% fill slot="figure" %}…{% /fill %} routes its children to that slot. Call-site content outside any fill block flows to the component\'s unnamed default slot. A fill block outside a custom component renders nothing.',
	attributes: {
		slot: {
			type: String,
			required: true,
			description:
				'Name of the slot to fill — must match a {% slot name="..." /%} in the component body.'
		}
	},
	examples: [
		{
			hero: true,
			title: 'Filling named slots',
			example: `
{% metric_card title="EMEA Revenue" %}
{% fill slot="figure" %}{% big_value data="emea" value="rev" fmt="usd0" /%}{% /fill %}
{% fill slot="detail" %}{% line_chart data="emea_monthly" x="month" y="rev" /%}{% /fill %}
{% /metric_card %}
`
		}
	],
	// Consumed at the AST level by the enclosing custom component's transform;
	// a fill that reaches its own transform is outside any component → render
	// nothing rather than leak raw children into the page.
	transform() {
		return null;
	},
	componentWrapper: false,
	undocumented: true
} as const satisfies UserComponentSchema;
