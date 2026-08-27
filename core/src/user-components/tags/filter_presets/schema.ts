import type { UserComponentSchema } from '../../types';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';

export const schema = {
	render: 'filter_presets',
	category: 'input',
	description: 'Display quick filter presets / saved views that apply multiple filters simultaneously',
	keywords: [
		'filter presets',
		'saved views',
		'quick filters',
		'filter bookmarks',
		'filter pills',
		'presets',
		'views'
	],
	attributes: {
		title: {
			type: String,
			required: false,
			description: 'Title displayed above the filter presets',
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		presets: {
			type: Array,
			required: true,
			description:
				'Array of preset configurations. Each entry is `{ label: string, values: Record<string, any> }`',
			affectsQuery: false
		},
		default_preset: {
			type: String,
			required: false,
			description: 'Label of the preset to activate by default on initial page load',
			affectsQuery: false
		},
		variant: {
			type: String,
			required: false,
			default: 'pills',
			description: 'Visual style for presets: "pills", "buttons", or "chips"',
			affectsQuery: false
		},
		size: {
			type: String,
			required: false,
			default: 'sm',
			description: 'Size of the preset controls: "sm", "base", or "lg"',
			affectsQuery: false
		},
		align: {
			type: String,
			required: false,
			default: 'left',
			description: 'Alignment of presets: "left", "center", or "right"',
			affectsQuery: false
		},
		...WIDTH_ATTRIBUTE
	}
} as const satisfies UserComponentSchema;
