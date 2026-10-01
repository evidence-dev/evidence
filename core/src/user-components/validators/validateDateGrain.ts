import {
	isValidationContext,
	type Validator,
	getTableFromContext,
	stripTypeCast,
	containsVariableSyntax
} from './types';

/**
 * Validates that the column `date_grain` buckets is a date column (or cast with `::date`).
 *
 * @param columnAttribute The attribute holding the column that `date_grain` truncates
 * @param tableAttribute The attribute name for the table
 */
export const validateDateGrain =
	(columnAttribute: string = 'x', tableAttribute: string = 'data'): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];
		if (!context.metadata || context.metadata.loading) return [];
		// Metric mode supplies the time column from the metric view.
		if (node.attributes['metric']) return [];
		if (!node.attributes['date_grain']) return [];

		const tableName = node.attributes[tableAttribute];
		const column = node.attributes[columnAttribute];

		if (!column || typeof column !== 'string') {
			return [
				{
					id: 'missing-date-grain-column',
					level: 'error',
					message: `date_grain: Requires a date column in '${columnAttribute}' to bucket.`,
					location: node.location
				}
			];
		}

		if (!tableName || typeof tableName !== 'string') return [];
		if (containsVariableSyntax(tableName) || containsVariableSyntax(column)) return [];
		if (column.includes('::date')) return [];

		const table = getTableFromContext(tableName, context);
		if (!table) return [];

		if (table.getColumn(stripTypeCast(column))?.jsType === 'date') return [];

		return [
			{
				id: 'invalid-date-grain-column',
				level: 'error',
				message: `${columnAttribute}: "${column}" is not a date column, so date_grain can't bucket it. Use a date column or cast it with ::date.`,
				location: node.location
			}
		];
	};
