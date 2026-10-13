import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'only_in_print',
	category: 'ui',
	description:
		'Show content only when printing or generating PDFs, without otherwise affecting its layout',
	selfClosing: false,
	attributes: {},
	componentWrapper: false,
	examples: [
		{
			title: 'Only in Print',
			example: '{% only_in_print %}\nThis content only appears when printed.\n{% /only_in_print %}'
		}
	]
} satisfies UserComponentSchema;
