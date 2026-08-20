import type { UserComponentSchema } from '../../types';

/**
 * Internal slot used by the accordion_item tree transform to hold the
 * non-title children of an accordion_item as a lazy snippet.
 */
export const schema = {
	render: 'accordion_body_slot',
	category: 'ui',
	selfClosing: false,
	attributes: {},
	componentWrapper: false,
	undocumented: true
} as const satisfies UserComponentSchema;
