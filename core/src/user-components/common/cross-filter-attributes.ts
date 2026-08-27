import type { UserComponentAttribute } from '../types';

/**
 * Shared cross-filter attributes for chart components.
 */
export const CROSS_FILTER_ATTRIBUTES: Record<string, UserComponentAttribute> = {
	cross_filter: {
		type: [Boolean, String],
		required: false,
		description:
			'Enable cross-filtering on click. Pass `true` to filter on the primary dimension, or a string to specify the filter ID/name.',
		supportsVariables: true
	},
	cross_filter_column: {
		type: String,
		required: false,
		description: 'Explicit column name to filter on when cross-filtering is enabled.',
		suggestionType: 'column',
		supportsVariables: true
	},
	cross_filter_multiple: {
		type: Boolean,
		required: false,
		default: false,
		description: 'Allow selecting multiple values simultaneously during cross-filtering.'
	}
};
