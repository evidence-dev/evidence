import type { ValidationError } from '@markdoc/markdoc';
import { containsVariableSyntax, isValidationContext, type Validator } from './types';

/**
 * Validates comparison configuration to ensure required properties are provided
 *
 * Checks:
 * - When compare_vs is 'target', the target property must be provided
 * - When compare_vs is 'benchmark' in single-value components, dimensions must be provided
 *
 * @param comparisonAttribute The attribute name for the comparison object (default: 'comparison')
 * @returns A validator function that checks comparison configuration
 */
export const validateComparison =
	(comparisonAttribute: string = 'comparison'): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];

		const comparison = node.attributes[comparisonAttribute];

		// Only validate if comparison is provided and is an object
		if (!comparison || typeof comparison !== 'object') {
			return [];
		}

		// Skip validation if compare_vs or target contain variable syntax - values unknown until runtime
		if (
			containsVariableSyntax(comparison.compare_vs) ||
			containsVariableSyntax(comparison.target)
		) {
			return [];
		}

		const errors: ValidationError[] = [];

		// Check if compare_vs is 'target' but target is missing
		if (comparison.compare_vs === 'target' && !comparison.target) {
			errors.push({
				id: 'missing-target-for-target-comparison',
				level: 'error',
				message: `${comparisonAttribute}: When compare_vs is 'target', the 'target' property is required to specify what to compare against`,
				location: node.location
			});
		}

		// Check if compare_vs is 'benchmark'
		if (comparison.compare_vs === 'benchmark') {
			const benchmark = comparison.benchmark;

			// All components require benchmark.agg when compare_vs is 'benchmark'
			if (!benchmark || !benchmark.agg) {
				errors.push({
					id: 'missing-benchmark-agg',
					level: 'error',
					message: `${comparisonAttribute}.benchmark: When compare_vs is 'benchmark', the 'benchmark' object with 'agg' (aggregation function) is required. Example: benchmark={ agg="avg" }`,
					location: node.location
				});
			}

			// Single-value components (BigValue, Value, Delta) also require subject
			// Only check this if benchmark exists (otherwise the first error is sufficient)
			const isSingleValueComponent = node.tag && ['big_value', 'value', 'delta'].includes(node.tag);

			if (isSingleValueComponent && benchmark) {
				if (!benchmark.subject || typeof benchmark.subject !== 'string') {
					errors.push({
						id: 'missing-subject-for-benchmark',
						level: 'error',
						message: `${comparisonAttribute}.benchmark: For BigValue/Value/Delta components, 'subject' is required to define individual entities in the benchmark. Specify the column that identifies them (e.g., subject="store_name").`,
						location: node.location
					});
				}
				// Note: When exclude_self=true, subject is automatically added to main query dimensions
				// so users don't need to manually include it in 'within'
			}

			// Info warning: Component WHERE clause won't apply to benchmark
			// Only show this if benchmark exists (otherwise the first error is sufficient)
			if (benchmark) {
				const componentWhere = node.attributes.where;
				const benchmarkWhere = benchmark.where;

				if (
					componentWhere &&
					typeof componentWhere === 'string' &&
					componentWhere.trim().length > 0 &&
					(!benchmarkWhere || benchmarkWhere.trim().length === 0)
				) {
					errors.push({
						id: 'benchmark-excludes-component-where',
						level: 'warning',
						message: `${comparisonAttribute}.benchmark: Component's 'where' clause ("${componentWhere}") is not applied to benchmark calculation. If you want the same filter in the benchmark, add it to 'benchmark.where'.`,
						location: node.location
					});
				}
			}
		}

		return errors;
	};
