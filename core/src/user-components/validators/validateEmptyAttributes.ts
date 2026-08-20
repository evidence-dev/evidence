import type { Validator } from './types';

interface AttributeDefinition {
	required?: boolean;
	affectsQuery?: boolean;
}

/**
 * Generic validator that ensures attributes are not empty.
 * Validates both empty strings ("") and empty arrays ([]).
 * This prevents situations where a prop is technically present but has no meaningful value,
 * which often causes issues in queries.
 *
 * @param attributeNames Optional array of specific attribute names to validate.
 *                       If not provided, automatically validates required and query-affecting attributes.
 */
export const validateEmptyAttributes =
	(attributeNames?: string[]): Validator =>
	(node, config) => {
		const errors = [];

		// Get the attributes to check
		let attributesToCheck: string[];

		if (attributeNames) {
			// Use explicitly provided attribute names
			attributesToCheck = attributeNames;
		} else {
			// Auto-detect attributes that should be non-empty
			attributesToCheck = [];

			// Try to get the component schema from config
			const tagSchema = config?.tags?.[node.tag || ''];
			if (tagSchema?.attributes && typeof tagSchema.attributes === 'object') {
				// Find required and query-affecting attributes
				for (const [attrName, attrDefinition] of Object.entries(tagSchema.attributes)) {
					// Type guard for attribute definition
					if (typeof attrDefinition === 'object' && attrDefinition !== null) {
						const attr = attrDefinition as AttributeDefinition;
						const isRequired = attr.required === true;
						const affectsQuery = attr.affectsQuery === true;

						if (isRequired || affectsQuery) {
							attributesToCheck.push(attrName);
						}
					}
				}
			}

			// Fallback: if no schema found, check all provided attributes
			if (attributesToCheck.length === 0) {
				attributesToCheck = Object.keys(node.attributes);
			}
		}

		// Check each attribute
		for (const attributeName of attributesToCheck) {
			const value = node.attributes[attributeName];

			// Check for empty strings
			if (typeof value === 'string' && value === '') {
				errors.push({
					id: 'empty-attribute',
					level: 'error' as const,
					message: `${node.tag}: ${attributeName} cannot be empty`,
					location: node.location
				});
			}

			// Check for empty arrays
			if (Array.isArray(value) && value.length === 0) {
				errors.push({
					id: 'empty-attribute',
					level: 'error' as const,
					message: `${node.tag}: ${attributeName} cannot be empty`,
					location: node.location
				});
			}
		}

		return errors;
	};
