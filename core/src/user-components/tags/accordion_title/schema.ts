import type { UserComponentSchema } from '../../types';

export const ACCORDION_TITLE_DEFAULT_PADDING_PX = 16;

export const schema = {
	render: 'accordion_title',
	category: 'ui',
	description:
		'Rich title content for an accordion item. Use this instead of the `title` attribute when the title needs to contain other components (e.g. `big_value`).',
	allowedParents: ['accordion_item'],
	selfClosing: false,
	attributes: {
		padding_top: {
			type: Number,
			description:
				'Top padding of the accordion trigger, in pixels. Lower this when the slotted content already provides its own top padding.',
			required: false,
			default: ACCORDION_TITLE_DEFAULT_PADDING_PX,
			affectsQuery: false
		},
		padding_bottom: {
			type: Number,
			description:
				'Bottom padding of the accordion trigger, in pixels. Lower this when the slotted content already provides its own bottom padding.',
			required: false,
			default: ACCORDION_TITLE_DEFAULT_PADDING_PX,
			affectsQuery: false
		}
	},
	componentWrapper: false,
	examples: [
		{
			title: 'Accordion item with a big_value in the title',
			example: `
{% accordion %}
    {% accordion_item %}
        {% accordion_title padding_top=8 padding_bottom=8 %}
            {% big_value data="orders" value="sum(sales)" fmt="usd" /%}
        {% /accordion_title %}
        Body content for this section.
    {% /accordion_item %}
{% /accordion %}
`
		}
	]
} as const satisfies UserComponentSchema;
