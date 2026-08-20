import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';
export const schema = {
	render: 'iframe',
	category: 'ui',
	description: 'Embed another URL into your page',
	selfClosing: true,
	attributes: {
		src: {
			type: String,
			required: true,
			supportsVariables: true,
			variableContext: 'text'
		},
		height: {
			type: Number,
			required: false,
			description: 'Set a fixed height for the iframe in pixels'
		},
		attrs: {
			type: Object,
			required: false
		},
		...WIDTH_ATTRIBUTE
	},
	componentWrapper: {
		display: 'block',
		width: 'full',
		flex: {
			grow: 3,
			minWidth: 200
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% iframe src="https://example.com" /%}
`
		},
		{
			title: 'Custom Height',
			example: `
{% iframe src="https://example.com" height=400 /%}
`
		}
	]
} as const satisfies UserComponentSchema;
