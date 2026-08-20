import { isValidationContext, type Validator } from './types';
import { validateSqlExpression } from './validateSqlExpression';

/**
 * Extract SQL aliases from a SELECT expression
 * @param sql SQL expression that might contain aliases
 * @returns Array of extracted alias names
 */
function extractAliases(sql: string): string[] {
	if (!sql) return [];

	// Match patterns like "... AS alias" or "... as alias"
	const aliasPattern = /\s+AS\s+([a-zA-Z0-9_]+)\b/gi;
	const matches = [...sql.matchAll(aliasPattern)];

	// Extract the alias names (capture group 1)
	return matches.map((match) => match[1]);
}

/**
 * Validates that SQL-related options are properly formatted
 * This validation handles all common SQL options (where, having, order, limit)
 *
 * @param tableNameAttribute The attribute name for the table name
 * @returns A validator function that checks SQL option formatting
 */
export const validateSqlOptions =
	(tableNameAttribute: string = 'data'): Validator =>
	(node, config, context) => {
		if (!isValidationContext(context)) return [];

		const tableName = node.attributes[tableNameAttribute];
		if (!tableName || typeof tableName !== 'string') return [];

		const errors = [];

		// Check limit is a valid number
		const limit = node.attributes['limit'];
		if (limit !== undefined) {
			if (typeof limit !== 'number' || limit <= 0 || !Number.isInteger(limit)) {
				errors.push({
					id: 'invalid-limit',
					level: 'error' as const,
					message: `limit: Must be a positive integer`,
					location: node.location
				});
			}
		}

		// Extract aliases from various attributes that might define them
		const aliases: string[] = [];

		// Define attributes that might contain SQL with aliases
		const attributesWithAliases = ['value', 'x', 'y', 'size', 'target'];

		// Loop through all potential attributes and extract aliases
		for (const attr of attributesWithAliases) {
			if (typeof node.attributes[attr] === 'string') {
				const extractedAliases = extractAliases(node.attributes[attr] as string);
				aliases.push(...extractedAliases);
			}
		}

		// Run the core validator (functions, syntax, etc.)

		// WHERE clause validation
		if (node.attributes['where'] !== undefined) {
			const whereSql = node.attributes['where'];
			if (typeof whereSql === 'string') {
				// Standard validation (now includes filter variable preprocessing)
				const whereValidator = validateSqlExpression('where', tableNameAttribute, 'where', {
					supportsVariables: true
				});
				const whereErrors = whereValidator(node, config, context);

				// Filter out "column does not exist" errors for columns that match aliases
				const filteredWhereErrors = whereErrors.filter((error) => {
					// Keep all errors that aren't about invalid columns
					if (!error.message.includes('Column "') || !error.message.includes('" does not exist')) {
						return true;
					}

					// Extract the column name from the error message
					const match = error.message.match(/Column "([^"]+)"/);
					if (!match) return true;

					const columnName = match[1];

					// If it's an alias, filter out this error
					return !aliases.some((alias) => alias.toLowerCase() === columnName.toLowerCase());
				});

				errors.push(...filteredWhereErrors);
			}
		}

		// HAVING clause validation
		if (node.attributes['having'] !== undefined) {
			const havingSql = node.attributes['having'];
			if (typeof havingSql === 'string') {
				// Standard validation
				const havingValidator = validateSqlExpression('having', tableNameAttribute, 'having');
				const havingErrors = havingValidator(node, config, context);

				// Filter out "column does not exist" errors for columns that match aliases
				const filteredHavingErrors = havingErrors.filter((error) => {
					// Keep all errors that aren't about invalid columns
					if (!error.message.includes('Column "') || !error.message.includes('" does not exist')) {
						return true;
					}

					// Extract the column name from the error message
					const match = error.message.match(/Column "([^"]+)"/);
					if (!match) return true;

					const columnName = match[1];

					// If it's an alias, filter out this error
					return !aliases.some((alias) => alias.toLowerCase() === columnName.toLowerCase());
				});

				errors.push(...filteredHavingErrors);
			}
		}

		// ORDER BY clause validation
		if (node.attributes['order'] !== undefined) {
			const orderSql = node.attributes['order'];
			if (typeof orderSql === 'string') {
				// Standard validation
				const orderValidator = validateSqlExpression('order', tableNameAttribute, 'order');
				const orderErrors = orderValidator(node, config, context);

				// Filter out "column does not exist" errors for columns that match aliases
				const filteredOrderErrors = orderErrors.filter((error) => {
					// Keep all errors that aren't about invalid columns
					if (!error.message.includes('Column "') || !error.message.includes('" does not exist')) {
						return true;
					}

					// Extract the column name from the error message
					const match = error.message.match(/Column "([^"]+)"/);
					if (!match) return true;

					const columnName = match[1];

					// If it's an alias, filter out this error
					return !aliases.some((alias) => alias.toLowerCase() === columnName.toLowerCase());
				});

				errors.push(...filteredOrderErrors);

				// We don't need the additional column validation for ORDER BY since
				// it's already covered by the validateSqlExpression function,
				// and we're just filtering out aliases above
			}
		}

		// QUALIFY clause validation
		if (node.attributes['qualify'] !== undefined) {
			const qualifySql = node.attributes['qualify'];
			if (typeof qualifySql === 'string') {
				const qualifyValidator = validateSqlExpression('qualify', tableNameAttribute, 'qualify');
				const qualifyErrors = qualifyValidator(node, config, context);

				// Filter out "column does not exist" errors for columns that match aliases
				const filteredQualifyErrors = qualifyErrors.filter((error) => {
					if (!error.message.includes('Column "') || !error.message.includes('" does not exist')) {
						return true;
					}
					const match = error.message.match(/Column "([^"]+)"/);
					if (!match) return true;
					const columnName = match[1];
					return !aliases.some((alias) => alias.toLowerCase() === columnName.toLowerCase());
				});

				errors.push(...filteredQualifyErrors);
			}
		}

		return errors;
	};
