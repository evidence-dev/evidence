import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'accordion',
	category: 'ui',
	description: 'An accordion component that organizes content into collapsible sections.',
	keywords: ['collapsible', 'expandable', 'disclosure'],
	selfClosing: false,
	allowedChildren: ['accordion_item'],
	attributes: {
		single: {
			type: Boolean,
			description: 'Whether only one item can be open at a time',
			required: false,
			default: false,
			affectsQuery: false
		},
		variant: {
			type: String,
			description: 'Visual style variant of the accordion',
			required: false,
			default: 'default',
			matches: ['default', 'well', 'card'],
			affectsQuery: false
		},
		...WIDTH_ATTRIBUTE
	},
	componentWrapper: {
		display: 'block',
		width: 'full',
		noCard: true,
		flex: {
			grow: 1,
			minWidth: 300
		}
	},
	snippet: `{% accordion %}
\t{% accordion_item
\t\ttitle="My Accordion"
\t\ticon="trending-up"
\t%}
\t\tType your content here
\t{% /accordion_item %}
{% /accordion %}$0`
} as const satisfies UserComponentSchema;
