import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'callout',
	category: 'ui',
	description: 'Add a callout box to show a message or highlight a section of text',
	keywords: ['alert', 'banner', 'notice', 'admonition'],
	selfClosing: false,
	attributes: {
		type: {
			type: String,
			default: 'info',
			matches: ['info', 'success', 'warning', 'error'],
			errorLevel: 'error',
			supportsVariables: true,
			variableContext: 'text'
		},
		title: {
			type: String,
			default: '',
			supportsVariables: true,
			variableContext: 'text'
		},
		...WIDTH_ATTRIBUTE
	},
	componentWrapper: {
		display: 'block',
		width: 'full',
		noCard: true,
		flex: {
			grow: 3,
			minWidth: 100
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% callout type="info" title="Report Info"%}
This is an info callout
{% /callout %}
`
		}
	]
} as const satisfies UserComponentSchema;
