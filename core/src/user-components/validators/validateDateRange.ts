import {
	isValidationContext,
	type Validator,
	getTableFromContext,
	stripIdentifierQuotes,
	containsVariableSyntax
} from './types';

/**
 * Validates date_range attribute requirements:
 * - Both date and range properties must be provided
 * - If range uses a variable, it must reference a range_calendar filter
 * - The date column must exist in the table and be of date type
 */
export function validateDateRange(): Validator {
	return (node, _config, context) => {
		if (!isValidationContext(context)) return [];

		const dateRange = node.attributes.date_range;
		if (!dateRange || typeof dateRange !== 'object' || Array.isArray(dateRange)) {
			return [];
		}

		const errors = [];
		const dateRangeObj = dateRange as { range?: string; date?: string };

		// Validate that both date and range are provided
		if (!dateRangeObj.date || !dateRangeObj.range) {
			const missing = [];
			if (!dateRangeObj.date) missing.push('date');
			if (!dateRangeObj.range) missing.push('range');
			errors.push({
				id: 'incomplete-date-range',
				level: 'error' as const,
				message: `date_range: Missing required ${missing.length > 1 ? 'properties' : 'property'}: ${missing.join(', ')}`,
				location: node.location
			});
		}

		// Validate that if range uses a variable, it references a range_calendar filter
		if (typeof dateRangeObj.range === 'string' && /\{\{(?!\s*\$)/.test(dateRangeObj.range)) {
			const match = dateRangeObj.range.match(/\{\{\s*([a-zA-Z0-9_-]+)\./);
			if (match && context.filters) {
				const filterId = match[1];
				const filter = context.filters.get(filterId);
				if (filter && filter.userComponentName !== 'range_calendar') {
					errors.push({
						id: 'invalid-date-range-filter-type',
						level: 'error' as const,
						message: `date_range.range: Only range_calendar filters can be used here. '${filterId}' is a ${filter.userComponentName}.`,
						location: node.location
					});
				}
			}
		}

		// Validate that the date column exists in the table and is a date type
		// Skip validation if either the date column or table name contains variable syntax
		if (typeof dateRangeObj.date === 'string' && !containsVariableSyntax(dateRangeObj.date)) {
			const tableName = node.attributes.data;
			if (tableName && typeof tableName === 'string' && !containsVariableSyntax(tableName)) {
				const table = getTableFromContext(tableName, context);
				if (table) {
					const dateColumn = stripIdentifierQuotes(dateRangeObj.date);
					const column = table.getColumn(dateColumn);
					if (!column) {
						errors.push({
							id: 'invalid-date-column',
							level: 'error' as const,
							message: `date_range.date: Column "${dateColumn}" does not exist in table "${tableName}"`,
							location: node.location
						});
					} else if (column.jsType !== 'date') {
						errors.push({
							id: 'invalid-date-column-type',
							level: 'error' as const,
							message: `date_range.date: Column "${dateColumn}" must be a date column (found type: ${column.jsType})`,
							location: node.location
						});
					}
				}
			}
		}

		return errors;
	};
}
