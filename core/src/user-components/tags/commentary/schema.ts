import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';
import { validateEmail } from '../../validators/validateEmail';

const attributes = {
	id: {
		type: String,
		required: true,
		description: 'Unique identifier for the commentary component'
	},
	placeholder: {
		type: String,
		required: false,
		description: 'Placeholder text to show when the commentary is empty'
	},
	className: {
		type: String,
		required: false,
		description: 'Additional CSS classes to apply to the component'
	},
	allowedEditors: {
		type: Array,
		required: false,
		description: 'Emails of allowed commentary editors'
	},
	title: {
		type: String,
		required: false,
		description: 'Title to display above the commentary'
	},
	hideEditMetadata: {
		type: String,
		required: false,
		description: 'When to hide the edit metadata',
		matches: ['always', 'never', 'print'],
		default: 'print'
	},
	style: {
		type: String,
		required: false,
		description: 'Style of the commentary',
		matches: ['quote', 'normal'],
		default: 'normal'
	},
	...WIDTH_ATTRIBUTE
} as const satisfies UserComponentSchema['attributes'];

export const schema = {
	render: 'commentary',
	category: 'ui',
	selfClosing: true,
	description: 'Allows users to input commentary to be saved with the page',
	attributes: attributes,
	validate: validateEmail('allowedEditors'),
	componentWrapper: {
		display: 'block',
		width: 'full',
		noCard: true,
		flex: {
			grow: 3,
			minWidth: 250
		}
	}
} as const satisfies UserComponentSchema;
