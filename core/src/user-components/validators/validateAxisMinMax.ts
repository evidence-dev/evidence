import type { ValidationError } from '@markdoc/markdoc';
import { containsVariableSyntax, type Validator } from './types';
import { coerceNumber } from '../common/process-variables';

/**
 * Validates that an axis options object's `min` is strictly less than its `max`
 * when both values are provided as numbers.
 *
 * Skips validation when either value is missing, contains a variable reference,
 * or cannot be coerced to a number (e.g. date strings — date ordering is
 * handled separately by the date range validators).
 *
 * @param axisOptionsAttribute The attribute name for the axis options object
 *   (e.g. 'x_axis_options', 'y_axis_options', 'y2_axis_options')
 */
export const validateAxisMinMax =
	(axisOptionsAttribute: string): Validator =>
	(node, _config, _context) => {
		const axisOptions = node.attributes[axisOptionsAttribute];
		if (!axisOptions || typeof axisOptions !== 'object') return [];

		const rawMin = (axisOptions as Record<string, unknown>).min;
		const rawMax = (axisOptions as Record<string, unknown>).max;

		if (rawMin === undefined || rawMax === undefined) return [];
		if (containsVariableSyntax(rawMin) || containsVariableSyntax(rawMax)) return [];

		const min = coerceNumber(rawMin);
		const max = coerceNumber(rawMax);

		if (min === undefined || max === undefined) return [];

		if (min >= max) {
			const errors: ValidationError[] = [
				{
					id: 'invalid-axis-min-max',
					level: 'error',
					message: `${axisOptionsAttribute}: 'min' (${min}) must be less than 'max' (${max})`,
					location: node.location
				}
			];
			return errors;
		}

		return [];
	};
