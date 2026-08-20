import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';
import { availableIconNames } from '../../common/icon-names';

export const schema = {
	render: 'tab',
	category: 'ui',
	description: 'An individual tab panel within a tabs component.',
	allowedParents: ['tabs'],
	selfClosing: false,
	attributes: {
		title: {
			type: String,
			description: 'The title/label displayed on the tab',
			required: true,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		icon: {
			type: String,
			description: 'Icon to display in the tab',
			required: false,
			matches: [...availableIconNames],
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		default: {
			type: Boolean,
			description:
				'Whether this tab is selected by default when the page loads. Only one tab should have this set.',
			required: false,
			default: false,
			affectsQuery: false
		},
		print_break: {
			type: String,
			description:
				'Controls page breaks inside this tab in PDF exports. `auto` allows content to flow across pages, `avoid` attempts to keep all content together on one page.',
			matches: ['auto', 'avoid'],
			default: 'avoid'
		},
		...WIDTH_ATTRIBUTE
	},
	componentWrapper: false,
	examples: [
		{
			title: 'Tabs with Content',
			hero: true,
			example: `
{% tabs %}
    {% tab title="Overview" %}
        This is the overview content.
    {% /tab %}
    {% tab title="Details" %}
        This is the details content.
    {% /tab %}
    {% tab title="Settings" icon="settings" %}
        This is the settings content.
    {% /tab %}
{% /tabs %}
`
		}
	]
} as const satisfies UserComponentSchema;
