import type { UserComponentSchema } from '../../types';
import { availableIconNames } from '../../common/icon-names';

export const schema = {
	render: 'modal',
	category: 'ui',
	description: 'Modal that shows content when opened.',
	keywords: ['dialog', 'popup', 'overlay'],
	selfClosing: false,
	attributes: {
		title: {
			type: String,
			description: 'Title displayed in the modal header',
			required: true,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		buttonText: {
			type: String,
			description:
				'Text displayed on the button that opens the modal. Defaults to the title if not provided.',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		variant: {
			type: String,
			description: 'Button style variant',
			required: false,
			default: 'default',
			matches: ['default', 'primary', 'destructive', 'secondary', 'ghost', 'link'],
			affectsQuery: false
		},
		icon: {
			type: String,
			description: 'Icon to display in the button and modal header',
			required: false,
			matches: [...availableIconNames],
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		icon_only: {
			type: Boolean,
			description: 'Show only the icon in the button with a tooltip containing the title',
			required: false,
			default: false,
			affectsQuery: false
		}
	},
	componentWrapper: {
		display: 'block',
		noCard: true,
		width: 'fit',
		flex: {
			grow: 0,
			minWidth: 6,
			automaticallyWrapConsecutiveComponentsInRow: true
		}
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% modal
    title="Detailed Trend"
%}
Below is a detailed sales trend

    {% line_chart
        data="demo.daily_orders"
        x="date"
        y="sum(total_sales)"
        date_grain="quarter"
    /%}
{% /modal %}
`
		}
	]
} as const satisfies UserComponentSchema;
