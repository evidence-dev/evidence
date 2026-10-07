import type { UserComponentSchema } from '../../types';
import { BooleanVariable } from '../../common/zod-attribute';

const isLiteralTrue = (value: unknown) => value === true || value === 'true';

export const schema = {
	render: 'print_group',
	category: 'ui',
	description:
		'Group content together to prevent page breaks, or hide or show content only when printing or generating PDFs',
	selfClosing: false,
	attributes: {
		hide: {
			type: BooleanVariable,
			required: false,
			description: 'Whether to hide this group when printing',
			default: false,
			supportsVariables: true,
			variableContext: 'text'
		},
		print_only: {
			type: BooleanVariable,
			required: false,
			description: 'Show this group only when printing or generating PDFs; hidden on screen',
			default: false,
			supportsVariables: true,
			variableContext: 'text'
		}
	},
	validate: (node) => {
		const { hide, print_only } = node.attributes ?? {};
		if (isLiteralTrue(hide) && isLiteralTrue(print_only)) {
			return [
				{
					id: 'print-group-hide-and-print-only',
					level: 'error' as const,
					message:
						'print_group cannot set both `hide` and `print_only` — the content would never be shown'
				}
			];
		}
		return [];
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
		},
		{
			title: 'Print-Only Group',
			example:
				'{% print_group print_only=true %}\nThis content only appears when printed.\n{% /print_group %}'
		}
	]
} satisfies UserComponentSchema;
