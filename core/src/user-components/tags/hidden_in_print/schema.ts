import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'hidden_in_print',
	category: 'ui',
	description:
		'Hide content when printing or generating PDFs, without otherwise affecting its layout',
	selfClosing: false,
	attributes: {},
	componentWrapper: false,
	examples: [
		{
			title: 'Hidden in Print',
			example:
				'{% hidden_in_print %}\nThis content is hidden when printed.\n{% /hidden_in_print %}'
		}
	]
} satisfies UserComponentSchema;
