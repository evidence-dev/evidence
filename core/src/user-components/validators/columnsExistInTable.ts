import {
	isValidationContext,
	type Validator,
	getTableFromContext,
	stripTypeCast,
	stripIdentifierQuotes,
	containsVariableSyntax
} from './types';

export const columnsExistInTable =
	(tableNameAttribute: string, columnNameAttribute: string | string[]): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];

		const tableName = node.attributes[tableNameAttribute];
		if (!tableName || typeof tableName !== 'string') return [];

		// Skip validation if table name contains variable syntax - will be validated at runtime
		if (containsVariableSyntax(tableName)) return [];

		// Try to get table from either regular metadata or inline query metadata
		const table = getTableFromContext(tableName, context);
		if (!table) return [];

		// Handle both single column name and array of column names
		const columnNameAttributes = Array.isArray(columnNameAttribute)
			? columnNameAttribute
			: [columnNameAttribute];

		const errors = [];

		for (const attr of columnNameAttributes) {
			const columnName = node.attributes[attr];

			if (!columnName || typeof columnName !== 'string') continue;

			// Skip validation if column name contains variable syntax - will be validated at runtime
			if (containsVariableSyntax(columnName)) continue;

			const lookupName = stripIdentifierQuotes(stripTypeCast(columnName));
			const column = table.getColumn(lookupName);
			if (!column) {
				errors.push({
					id: 'invalid-column',
					level: 'error' as 'error' | 'debug' | 'info' | 'warning' | 'critical',
					message: `${attr}: Column "${lookupName}" does not exist in table "${tableName}"`,
					location: node.location
				});
			}
		}

		return errors;
	};
