import {
	isValidationContext,
	type Validator,
	getTableFromContext,
	stripTypeCast,
	containsVariableSyntax
} from './types';
import { hasAgg } from '../common/sql-expression-utils';

/**
 * Check if a specific expression contains aggregation functions
 * Returns a warning if no aggregation is detected
 */
export const expressionHasAggregation =
	(propName: string): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];

		const propValue = node.attributes[propName];

		if (!propValue || typeof propValue !== 'string') {
			return [];
		}

		// Skip validation if value contains variable syntax - will be validated at runtime
		if (containsVariableSyntax(propValue)) {
			return [];
		}

		// If prop has aggregation, we're good
		if (hasAgg(propValue)) {
			return [];
		}

		// Try to get specific guidance from metadata
		const table = node.attributes.data;
		const tableMetadata = table && typeof table === 'string' && getTableFromContext(table, context);

		if (tableMetadata) {
			const column = tableMetadata.getColumn(stripTypeCast(propValue));
			const isNumeric = column?.jsType === 'number';

			if (isNumeric) {
				return [
					{
						id: 'expression-missing-aggregation',
						level: 'warning' as const,
						message: `${propName}: Consider using an aggregation function like sum(${propValue}) or avg(${propValue}). Raw column values may not aggregate properly across groups.`,
						location: node.location
					}
				];
			}
		}

		// Default message
		return [
			{
				id: 'expression-missing-aggregation',
				level: 'warning' as const,
				message: `${propName}: Consider using an aggregation function like sum(${propValue}) or avg(${propValue}). Raw column values may not aggregate properly across groups.`,
				location: node.location
			}
		];
	};
