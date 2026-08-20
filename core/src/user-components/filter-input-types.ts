import { tags } from '../index';

/**
 * Dynamically get all filter input component names from their schemas.
 * This uses the `isFilterInput: true` flag in each component's schema.
 */
export function getFilterInputComponentNames(): string[] {
	return Object.entries(tags)
		.filter(([_, component]) => component.schema.isFilterInput === true)
		.map(([_, component]) => component.schema.render);
}

/**
 * Centralized type for filter component names.
 * This is the single source of truth for filter component types used throughout the app.
 */
export type FilterComponentType =
	| 'dropdown'
	| 'text_input'
	| 'table_filter'
	| 'range_calendar'
	| 'date_grain_selector'
	| 'comparison_selector';

/**
 * Interface for filter component metadata used in context packs.
 */
export interface FilterComponentMetadata {
	type: FilterComponentType;
	id: string;
	attributes: Record<string, unknown>;
	currentValue?: unknown;
}

/**
 * Check if a component name is a filter input component.
 */
export function isFilterInputComponent(
	componentName: string
): componentName is FilterComponentType {
	const filterInputNames = getFilterInputComponentNames();
	return filterInputNames.includes(componentName);
}
