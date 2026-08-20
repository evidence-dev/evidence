import { findClosestMatch } from '../../utils/findClosestMatch';
import { isValidationContext, type Validator } from './types';
import { isArrayOf } from './utils/isArrayOf';
import type { ValidationError } from '@markdoc/markdoc';

export const filtersExist =
	(filtersAttribute: string): Validator =>
	(node, config, context) => {
		// Standard validation setup
		if (!isValidationContext(context)) return [];
		const filtersContext = context.filters;
		if (!filtersContext) return [];

		const filters = node.attributes[filtersAttribute];
		if (!isArrayOf(filters, 'string')) return [];

		// Extract IDs from parent repeat tags
		const parentRepeatIds: string[] = [];
		config?.validation?.parents?.forEach((parent) => {
			if (parent.type === 'tag' && parent.tag === 'repeat' && parent.attributes?.id) {
				parentRepeatIds.push(parent.attributes.id);
			}
		});

		const errors: ValidationError[] = [];

		// Check each filter
		filters.forEach((filterId) => {
			// Skip if it's from a parent repeat
			if (parentRepeatIds.includes(filterId)) return;

			const filter = filtersContext.get(filterId);

			if (!filter) {
				// Filter doesn't exist - use improved error handling with suggestions
				const availableFilters = [...parentRepeatIds, ...filtersContext.filterIds];
				let message = `${filtersAttribute}: Filter "${filterId}" does not exist`;

				const bestMatch = findClosestMatch(filterId, availableFilters);
				if (bestMatch) {
					message = `${message}. Did you mean "${bestMatch}"?`;
				}

				errors.push({
					id: 'invalid-filter',
					level: 'error',
					message,
					location: node.location
				});
			} else if (filter.queryOnly) {
				// Filter exists but is not allowed in filter props
				errors.push({
					id: 'invalid-filter',
					level: 'error',
					message: `This filter can only be referenced in queries.`,
					location: node.location
				});
			}
		});

		return errors;
	};
