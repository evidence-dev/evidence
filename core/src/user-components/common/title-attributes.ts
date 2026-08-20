import type { UserComponentAttribute } from '../types';

/**
 * Common data attribute for components that query a table.
 * Supports variable interpolation for dynamic table names.
 *
 * @example
 * ```typescript
 * const attributes = {
 *   ...DATA_ATTRIBUTE,
 *   ...TITLE_ATTRIBUTES,
 *   // component-specific attributes
 * } as const;
 * ```
 */
export const DATA_ATTRIBUTE = {
	data: {
		type: String,
		required: true,
		description: 'Name of the table or view to query',
		suggestionType: 'table',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text' // Table names are unquoted text
	}
} as const satisfies Record<string, UserComponentAttribute>;

/**
 * Common title-related attributes that can be spread into component schemas.
 * All text display attributes support variable interpolation.
 *
 * @example
 * ```typescript
 * const attributes = {
 *   ...DATA_ATTRIBUTE,
 *   ...TITLE_ATTRIBUTES,
 *   // component-specific attributes
 * } as const;
 * ```
 */
export const TITLE_ATTRIBUTES = {
	title: {
		type: String,
		required: false,
		description: 'Title to display above the component',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text' // Display text
	},
	subtitle: {
		type: String,
		required: false,
		description: 'Subtitle to display below the title',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text' // Display text
	},
	info: {
		type: String,
		required: false,
		description:
			'Information tooltip text (can only be used with title). Displays an info icon next to the title.',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text' // Display text
	},
	info_link: {
		type: String,
		required: false,
		description: 'URL to link the info text to (can only be used with info)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text' // URL text
	},
	info_link_title: {
		type: String,
		required: false,
		description:
			'Create a custom link title for the info link, placed after the info text (can only be used with info_link)',
		affectsQuery: false,
		supportsVariables: true,
		variableContext: 'text' // Display text
	}
} as const satisfies Record<string, UserComponentAttribute>;

/**
 * Props interface for components using TITLE_ATTRIBUTES
 */
export interface TitleProps {
	title?: string;
	subtitle?: string;
	info?: string;
	info_link?: string;
	info_link_title?: string;
}

/**
 * Helper to extract title props from a props object
 */
export function extractTitleProps<T extends TitleProps>(props: T): TitleProps {
	return {
		title: props.title,
		subtitle: props.subtitle,
		info: props.info,
		info_link: props.info_link,
		info_link_title: props.info_link_title
	};
}
