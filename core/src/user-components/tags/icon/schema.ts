import type { UserComponentSchema } from '../../types';
import { availableIconNames } from '../../common/icon-names';

export const schema = {
	render: 'icon',
	category: 'ui',
	selfClosing: true,
	description: 'Display an icon with customizable size and color',
	attributes: {
		name: {
			type: String,
			description: 'Name of the icon to display',
			required: true,
			matches: [...availableIconNames],
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		size: {
			type: Number,
			description: 'Size of the icon',
			required: false,
			default: 20,
			affectsQuery: false
		},
		color: {
			type: String,
			description: 'Color of the icon, use hex codes, rgb/rgba, or a css color name',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		tooltip: {
			type: String,
			description: 'Tooltip text for the icon',
			required: false,
			affectsQuery: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		stroke_width: {
			type: Number,
			description: 'Width of the icon outline',
			required: false,
			default: 2,
			affectsQuery: false
		}
	},
	componentWrapper: {
		display: 'inline'
	},
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% icon name="info" /%}
`
		},
		{
			title: 'With Size',
			example: `
{% icon name="star" size=24 color="#ff0000" /%}
`
		},
		{
			title: 'With Color',
			example: `
{% icon name="check" color="#0000ff" /%}
`
		},
		{
			title: 'With Tooltip',
			example: `
{% icon name="info" tooltip="This is an info icon" /%}
`
		}
	]
} as const satisfies UserComponentSchema;
