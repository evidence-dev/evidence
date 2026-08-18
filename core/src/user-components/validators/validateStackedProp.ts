import type { Validator } from './types';

/**
 * Validates that the 'stacked' prop is either a boolean or the string "100%"
 */
export const validateStackedProp =
	(attributeName = 'stacked'): Validator =>
	(node) => {
		const value = node.attributes[attributeName];

		// If not provided, skip validation (let default handle it)
		if (value === undefined) {
			return [];
		}

		// Valid values: true, false, "100%"
		if (typeof value === 'boolean') {
			return [];
		}

		if (value === '100%') {
			return [];
		}

		return [
			{
				id: 'invalid-stacked-value',
				level: 'error' as const,
				message: `${attributeName}: Must be true, false, or "100%"`,
				location: node.location
			}
		];
	};
