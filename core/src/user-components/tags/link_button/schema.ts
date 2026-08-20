import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'link_button',
	category: 'ui',
	description: 'A button that links to a URL',
	selfClosing: true,
	attributes: {
		url: {
			type: String,
			description: 'The URL to link to',
			required: true,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		title: {
			type: String,
			description: 'Text displayed on the button',
			required: true,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		new_tab: {
			type: Boolean,
			description: 'Whether to open the link in a new tab',
			required: false,
			default: false,
			affectsQuery: false
		},
		variant: {
			type: String,
			description: 'Button style variant',
			required: false,
			default: 'default',
			matches: ['default', 'primary', 'destructive', 'secondary', 'ghost', 'link'],
			affectsQuery: false
		}
	},
	componentWrapper: {
		display: 'inline'
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% link_button
    url="https://example.com"
    title="Visit Example"
/%}
`
		}
	]
} as const satisfies UserComponentSchema;
