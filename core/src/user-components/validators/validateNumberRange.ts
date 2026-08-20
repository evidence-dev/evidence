import type { Validator } from './types';

export interface NumberRangeOptions {
	/** Minimum allowed value (inclusive). If undefined, no minimum constraint */
	min?: number;
	/** Maximum allowed value (inclusive). If undefined, no maximum constraint */
	max?: number;
	/** Whether to allow integers only. If false, allows any number */
	integersOnly?: boolean;
	/** Custom attribute name for error messages. If not provided, uses the attribute name */
	displayName?: string;
}

/**
 * Creates a validator for numeric attributes with configurable range and type constraints
 *
 * @param attributeName - The name of the attribute to validate
 * @param options - Configuration options for the validation
 * @returns A validator function
 *
 * @example
 * // Positive integers only, max 3000
 * validateNumberRange('page_size', { min: 1, max: 3000, integersOnly: true })
 *
 * @example
 * // Range -1 to 1, decimals allowed
 * validateNumberRange('correlation', { min: -1, max: 1 })
 *
 * @example
 * // Positive numbers only, no upper limit
 * validateNumberRange('amount', { min: 0 })
 */
export const validateNumberRange = (
	attributeName: string,
	options: NumberRangeOptions = {}
): Validator => {
	const { min, max, integersOnly = false, displayName = attributeName } = options;

	return (node, _config, _context) => {
		const errors = [];
		const value = node.attributes[attributeName];

		if (value !== undefined) {
			// Type check
			if (typeof value !== 'number') {
				errors.push({
					id: `invalid-${attributeName}-type`,
					level: 'error' as const,
					message: `${displayName}: Must be a number`,
					location: node.location
				});
				return errors;
			}

			// NaN check
			if (isNaN(value)) {
				errors.push({
					id: `invalid-${attributeName}-nan`,
					level: 'error' as const,
					message: `${displayName}: Must be a valid number`,
					location: node.location
				});
				return errors;
			}

			// Integer check
			if (integersOnly && !Number.isInteger(value)) {
				errors.push({
					id: `invalid-${attributeName}-integer`,
					level: 'error' as const,
					message: `${displayName}: Must be an integer`,
					location: node.location
				});
			}

			// Range checks
			if (min !== undefined && value < min) {
				errors.push({
					id: `${attributeName}-too-small`,
					level: 'error' as const,
					message: `${displayName}: Cannot be less than ${min}`,
					location: node.location
				});
			}

			if (max !== undefined && value > max) {
				errors.push({
					id: `${attributeName}-too-large`,
					level: 'error' as const,
					message: `${displayName}: Cannot be greater than ${max}`,
					location: node.location
				});
			}
		}

		return errors;
	};
};
