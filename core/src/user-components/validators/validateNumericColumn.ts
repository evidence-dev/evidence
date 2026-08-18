import { isValidationContext, type Validator, getTableFromContext, stripTypeCast } from './types';
import { extractColumnReferences } from './validateSqlExpression';

/**
 * Validates that a column or SQL expression returns a numeric type
 * Used for components that require numeric values (like sliders)
 */
export const validateNumericColumn =
	(valueAttribute: string, dataAttribute: string = 'data'): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];

		const value = node.attributes[valueAttribute];
		const data = node.attributes[dataAttribute];

		// Only validate if both data and value are provided
		if (!data || !value || typeof data !== 'string' || typeof value !== 'string') {
			return [];
		}

		// Get table metadata
		const table = getTableFromContext(data, context);
		if (!table) {
			// Table doesn't exist or metadata not loaded - skip validation
			return [];
		}

		// Extract column references from the expression
		const columnNames = extractColumnReferences(value);

		// If no simple column reference, can't validate (might be a complex expression)
		// For now, we'll only validate simple column references
		if (columnNames.length !== 1) {
			// For complex expressions, we can't easily validate - skip for now
			// TODO: Could parse the expression more deeply to check return types
			return [];
		}

		const columnName = stripTypeCast(columnNames[0]);
		const column = table.getColumn(columnName);

		if (!column) {
			// Column doesn't exist - already handled by columnsExistInTable validator
			return [];
		}

		// Check if column is numeric
		const isNumeric = column.jsType === 'number';
		if (!isNumeric) {
			return [
				{
					id: 'invalid-numeric-column',
					level: 'error' as const,
					message: `${valueAttribute}: "${value}" must be a numeric column or expression. Found type: ${column.jsType || 'unknown'}`,
					location: node.location
				}
			];
		}

		return [];
	};
