import type { Config, ValidationError } from '@markdoc/markdoc';
import type { Validator } from './types';
import { isValidationContext } from './types';
import { VariableProcessor } from '../../filter-variables/VariableProcessor';
import type { UserComponentSchema } from '../types';
import { logger } from '../../shims/logger';

/**
 * Extended Config type that includes tags registry
 */
interface ConfigWithTags extends Config {
	tags?: Record<string, UserComponentSchema>;
}

/**
 * Validates variable syntax in component attributes
 *
 * This validator checks ONLY variable-related concerns:
 * - Variables are only used in attributes that support them (supportsVariables: true)
 * - Variable syntax is valid (filter exists, property exists, etc.)
 *
 * Domain-specific validation (e.g., date_range requirements) should be in separate validators.
 */
export function validateVariablesInComponent(): Validator {
	return (node, config, context) => {
		if (!isValidationContext(context)) return [];
		if (!node.tag) return [];

		const errors: ValidationError[] = [];

		try {
			const frontmatter = (config as Config & { variables?: Record<string, unknown> }).variables;
			const processor = new VariableProcessor(context.filters, context.inlineQueries, frontmatter);

			// Get schema from validation context instead of importing user components
			// This avoids circular dependency via user-components barrel
			const configWithTags = config as ConfigWithTags;
			const schema = configWithTags.tags?.[node.tag];
			if (!schema) return [];

			for (const [attrName, attrValue] of Object.entries(node.attributes)) {
				// Handle string attributes with variables
				if (typeof attrValue === 'string') {
					if (!/\{\{(?!\s*\$)/.test(attrValue)) continue;

					const attrSchema = schema.attributes[attrName];
					if (!attrSchema?.supportsVariables) {
						errors.push({
							id: 'unsupported-filter-variable',
							level: 'error' as const,
							message: `${attrName}: Filter variables are not supported in this attribute`,
							location: node.location
						});
						continue;
					}

					// Validate variable syntax (filter exists, property exists, etc.)
					// Use the variableContext from schema if available, otherwise default to 'text' for non-SQL attributes
					const variableContext = attrSchema.variableContext || 'text';
					const validationErrors = processor.validateString(attrValue, {
						location: node.location,
						variableContext
					});
					errors.push(
						...validationErrors.map((err) => ({
							...err,
							message: `${attrName}: ${err.message}`
						}))
					);
				}

				// Handle nested objects that might contain variables (e.g., date_range, comparison)
				if (typeof attrValue === 'object' && attrValue !== null && !Array.isArray(attrValue)) {
					for (const [nestedKey, nestedValue] of Object.entries(attrValue)) {
						if (typeof nestedValue === 'string' && /\{\{(?!\s*\$)/.test(nestedValue)) {
							// Validate variable syntax in nested properties
							const validationErrors = processor.validateString(nestedValue, {
								location: node.location
							});
							errors.push(
								...validationErrors.map((err) => ({
									...err,
									message: `${attrName}.${nestedKey}: ${err.message}`
								}))
							);
						}
					}
				}
			}
		} catch (err) {
			logger.warn({ err, tag: node.tag }, 'Could not validate filter variables for component');
		}

		return errors;
	};
}
