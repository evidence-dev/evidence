import type { Validator } from './types';

/**
 * Valid benchmark property names
 */
const VALID_BENCHMARK_PROPERTIES = new Set([
	'agg',
	'subject',
	'value',
	'within',
	'where',
	'exclude_self'
]);

/**
 * Validates that benchmark objects only contain valid property names.
 * Catches typos like 'grain' instead of 'subject' or 'groups' instead of 'within'.
 *
 * @param comparisonAttribute The attribute path for the comparison object (default: 'comparison')
 * @returns A validator function that checks benchmark property names
 */
export const validateBenchmarkProperties =
	(comparisonAttribute: string = 'comparison'): Validator =>
	(node) => {
		const comparison = node.attributes[comparisonAttribute];

		// Only validate if comparison is provided and has a benchmark
		if (!comparison || typeof comparison !== 'object') {
			return [];
		}

		const benchmark = comparison.benchmark;
		if (!benchmark || typeof benchmark !== 'object') {
			return [];
		}

		const errors: Array<{
			id: string;
			level: 'error';
			message: string;
			location: typeof node.location;
		}> = [];

		// Check for unknown properties
		const unknownProperties = Object.keys(benchmark).filter(
			(key) => !VALID_BENCHMARK_PROPERTIES.has(key)
		);

		if (unknownProperties.length > 0) {
			// Try to suggest the correct property name for common typos
			const suggestions = unknownProperties.map((prop) => {
				if (prop === 'grain') return `'${prop}' (did you mean 'subject'?)`;
				if (prop === 'groups') return `'${prop}' (did you mean 'within'?)`;
				if (prop === 'dimensions') return `'${prop}' (did you mean 'within'?)`;
				return `'${prop}'`;
			});

			errors.push({
				id: 'unknown-benchmark-property',
				level: 'error',
				message: `${comparisonAttribute}.benchmark: Unknown ${unknownProperties.length === 1 ? 'property' : 'properties'}: ${suggestions.join(', ')}. Valid properties are: ${Array.from(VALID_BENCHMARK_PROPERTIES).join(', ')}.`,
				location: node.location
			});
		}

		return errors;
	};
