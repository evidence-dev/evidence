import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'note',
	category: 'ui',
	keywords: ['footnote', 'annotation', 'caption', 'small text'],
	selfClosing: false,
	attributes: {
		class: {
			type: String,
			required: false,
			description: 'Additional CSS classes to apply to the text'
		},
		...WIDTH_ATTRIBUTE
	},
	componentWrapper: {
		display: 'inline'
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% note  %}
Report data sourced from the World Bank
{% /note %}
`
		}
	]
} satisfies UserComponentSchema;
