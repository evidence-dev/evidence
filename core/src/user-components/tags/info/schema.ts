import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'info',
	category: 'ui',
	selfClosing: true,
	description: 'Display an info icon with a tooltip showing additional information on hover',
	attributes: {
		text: {
			type: String,
			required: true,
			description:
				'Tooltip text. Wrap in triple quotes (`"""`) to write text across multiple lines',
			supportsVariables: true,
			variableContext: 'text'
		},
		color: {
			type: String,
			required: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		className: {
			type: String
		},
		link: {
			type: String,
			required: false,
			description: 'Add a link to a URL for the info text',
			supportsVariables: true,
			variableContext: 'text'
		},
		link_title: {
			type: String,
			required: false,
			description: 'Create a custom link title for the URL, placed after the info text',
			supportsVariables: true,
			variableContext: 'text'
		}
	},
	componentWrapper: false,
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% info text="Report data as of Dec 31, 2024" /%}
`
		},
		{
			title: 'Multi-line Text',
			example: `
{% info text="""Revenue is gross sales minus refunds.
Excludes test orders.""" /%}
`
		}
	]
} as const satisfies UserComponentSchema;
