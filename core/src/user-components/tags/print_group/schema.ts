import type { UserComponentSchema } from '../../types';
import { BooleanVariable } from '../../common/zod-attribute';

export const schema = {
	render: 'print_group',
	category: 'ui',
	description:
		'Group content together to prevent page breaks or hide content when printing or generating PDFs',
	selfClosing: false,
	attributes: {
		hide: {
			type: BooleanVariable,
			required: false,
			description: 'Whether to hide this group when printing',
			default: false,
			supportsVariables: true,
			variableContext: 'text'
		}
	},
	componentWrapper: false,
	examples: [
		{
			title: 'Basic Print Group',
			example:
				'{% print_group %}\nThis content will stay together when printed.\n{% /print_group %}'
		},
		{
			title: 'Hidden Print Group',
			example:
				'{% print_group hide=true %}\nThis content will be hidden when printed.\n{% /print_group %}'
		}
	]
} satisfies UserComponentSchema;
