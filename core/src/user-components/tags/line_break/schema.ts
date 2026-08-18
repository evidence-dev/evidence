import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'line_break',
	category: 'ui',
	description: 'Adds vertical spacing between content by inserting line breaks',
	selfClosing: true,
	keywords: ['spacer', 'vertical space', 'margin', 'padding', 'gap', 'whitespace', 'blank lines'],
	attributes: {
		lines: {
			type: Number,
			required: false,
			description: 'Number of lines to break',
			default: 1
		},
		...WIDTH_ATTRIBUTE
	},
	componentWrapper: {
		display: 'inline'
	}
} satisfies UserComponentSchema;
