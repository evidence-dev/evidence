import type { UserComponentAttribute } from '../types';

export const CROSS_FILTER_ATTRIBUTES = {
	cross_filter: {
		type: [Boolean, String],
		required: false,
		default: false,
		description:
			'Enables interactive cross-filtering on click. Pass `true` to use the primary category column, or a string to bind to a specific filter id.',
		affectsQuery: false
	},
	cross_filter_column: {
		type: String,
		required: false,
		description:
			'Explicit database column to filter when a chart or table element is clicked. Defaults to the category column.',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text'
	},
	cross_filter_multiple: {
		type: Boolean,
		required: false,
		default: false,
		description:
			'When true, clicking multiple elements adds them to an array of selected filter values instead of toggling a single value.',
		affectsQuery: false
	}
} as const satisfies Record<string, UserComponentAttribute>;
