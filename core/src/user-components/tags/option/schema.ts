import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'option',
	category: 'input',
	description: 'Add an option to a dropdown or button_group component',
	selfClosing: true,
	attributes: {
		value: {
			type: [String, Number],
			description: 'Value of the option',
			required: true
		},
		label: {
			type: String,
			description: 'Label text displayed in the option',
			required: false
		},
		fmt: {
			type: String,
			description: 'Format string to associate with this option (e.g., "usd" or "pct1")',
			required: false
		}
	},
	componentWrapper: {
		display: 'inline'
	},
	allowedParents: ['dropdown', 'button_group', 'input_tabs'],
	examples: [
		{
			title: 'In a Dropdown',
			hero: true,
			example: `
{% dropdown id="category" label="Category" %}
    {% option value="electronics" label="Electronics" /%}
    {% option value="clothing" label="Clothing" /%}
    {% option value="home" label="Home & Garden" /%}
{% /dropdown %}
`
		},
		{
			title: 'In a Button Group',
			example: `
{% button_group id="metric" label="Metric" %}
    {% option value="revenue" label="Revenue" fmt="usd" /%}
    {% option value="quantity" label="Quantity" fmt="num0" /%}
    {% option value="margin" label="Margin" fmt="pct1" /%}
{% /button_group %}
`
		}
	]
} as const satisfies UserComponentSchema;
