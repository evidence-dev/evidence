import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';
import { validateSingleDefaultTab } from '../../validators';

export const schema = {
	render: 'tabs',
	category: 'ui',
	description: 'A tabs component that organizes content into multiple panels.',
	selfClosing: false,
	allowedChildren: ['tab'],
	validate: validateSingleDefaultTab,
	attributes: {
		variant: {
			type: String,
			description: 'Visual style variant of the tabs',
			required: false,
			default: 'default',
			matches: ['default', 'well'],
			affectsQuery: false
		},
		full_width: {
			type: Boolean,
			description: 'Whether the tabs should take the full width of their container',
			required: false,
			default: false,
			affectsQuery: false
		},
		color: {
			type: String,
			description: 'Custom color for active tab text and underline. Uses CSS color values.',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		align: {
			type: String,
			description:
				'Horizontal alignment of tabs. Note: align right only affects the default variant.',
			required: false,
			default: 'left',
			matches: ['left', 'right'],
			affectsQuery: false
		},
		print_break: {
			type: String,
			description:
				'Controls page breaks inside this component in PDF exports. `auto` allows content to flow across pages, `avoid` attempts to keep all content together on one page.',
			matches: ['auto', 'avoid'],
			default: 'auto'
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
	snippet: `{% tabs %}
\t{% tab title="Tab 1" icon="trending-up" %}
\t\tContent for tab 1
\t{% /tab %}
\t{% tab title="Tab 2" icon="alert-circle" %}
\t\tContent for tab 2
\t{% /tab %}
{% /tabs %}$0`,
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `{% tabs %}
\t{% tab title="Tab 1" icon="trending-up" %}
\t\tContent for tab 1
\t{% /tab %}
\t{% tab title="Tab 2" icon="alert-circle" %}
\t\tContent for tab 2
\t{% /tab %}
{% /tabs %}`
		},
		{
			title: 'Well Variant',
			example: `{% tabs variant="well" %}
\t{% tab title="Tab 1" icon="trending-up" %}
\t\tContent for tab 1
\t{% /tab %}
\t{% tab title="Tab 2" icon="alert-circle" %}
\t\tContent for tab 2
\t{% /tab %}
{% /tabs %}`
		}
	]
} as const satisfies UserComponentSchema;
