import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'filter_bar',
	category: 'input',
	description: 'Renders a floating bar of filters at the top or bottom of your page',
	selfClosing: false,
	attributes: {},
	allowedChildren: [
		'dropdown',
		'table_filter',
		'date_grain_selector',
		'comparison_selector',
		'range_calendar',
		'button_group'
	],
	componentWrapper: false
} as const satisfies UserComponentSchema;
