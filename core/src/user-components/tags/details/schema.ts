import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'details',
	category: 'ui',
	keywords: ['expandable', 'collapsible section', 'show more'],
	selfClosing: false,
	attributes: {
		title: {
			type: String,
			required: true,
			description: 'Title of the details section',
			supportsVariables: true,
			variableContext: 'text'
		},
		open: {
			type: Boolean,
			required: false,
			description: 'Whether the details section starts open',
			default: false
		},
		open_mobile: {
			type: Boolean,
			required: false,
			description:
				'Whether the details section starts open on mobile screens. Defaults to the value of `open`'
		},
		...WIDTH_ATTRIBUTE
	},
	componentWrapper: {
		display: 'block',
		width: 'full',
		noCard: true,
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
{% details
    title="Metric Definitions"
%}

**Sales:** includes sales of all core products in all regions

**Sales Growth:** YoY growth in sales

{% /details %}
`
		},
		{
			title: 'Open on Desktop, Collapsed on Mobile',
			example: `
{% details
    title="Metric Definitions"
    open=true
    open_mobile=false
%}

**Sales:** includes sales of all core products in all regions

**Sales Growth:** YoY growth in sales

{% /details %}
`
		}
	]
} satisfies UserComponentSchema;
