import type { UserComponentSchema } from '../../types';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';

export const schema = {
	render: 'language_selector',
	category: 'input',
	description: 'Interactive language & locale selector for switching report localization and formatting',
	keywords: [
		'language selector',
		'locale selector',
		'language',
		'locale',
		'i18n',
		'translation',
		'lingua',
		'italiano'
	],
	attributes: {
		title: {
			type: String,
			required: false,
			description: 'Title or label displayed above or beside the selector',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		locales: {
			type: Array,
			required: false,
			description:
				'Array of supported locales to display. Defaults to English and Italian (`["en-US", "it-IT"]`)',
			affectsQuery: false
		},
		variant: {
			type: String,
			required: false,
			default: 'pills',
			description: 'Display style: "pills", "buttons", or "dropdown"',
			affectsQuery: false
		},
		size: {
			type: String,
			required: false,
			default: 'sm',
			description: 'Size of the selector: "sm", "base", or "lg"',
			affectsQuery: false
		},
		...WIDTH_ATTRIBUTE
	}
} as const satisfies UserComponentSchema;
