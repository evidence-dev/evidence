import type { UserComponentSchema } from '../../types';

// Backwards compatibility alias for 'option' component
// Users should migrate to using 'option' instead
export const schema = {
	render: 'dropdown_option',
	category: 'input',
	description:
		'Add an option to a dropdown or button_group component (deprecated - use option instead)',
	deprecated: true,
	selfClosing: true,
	attributes: {
		value: {
			type: [String, Number],
			description: 'Value of the option',
			required: true
		},
		label: {
			type: String,
			description: 'Label text displayed in the option',
			required: false
		}
	},
	componentWrapper: {
		display: 'inline'
	},
	allowedParents: ['dropdown'],
	examples: [
		{
			title: 'Basic Usage',
			hero: true,
			example: `
{% dropdown_option value="option_one" label="Option One" /%}
`
		}
	]
} as const satisfies UserComponentSchema;
