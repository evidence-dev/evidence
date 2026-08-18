import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'page_break',
	category: 'ui',
	description: 'Start content on a new page when printing or generating PDFs',
	selfClosing: true,
	attributes: {},
	componentWrapper: false,
	examples: [
		{
			title: 'Basic Page Break',
			example:
				'Content before page break.\n\n{% page_break /%}\n\nContent that appears on the next page.'
		}
	]
} satisfies UserComponentSchema;
