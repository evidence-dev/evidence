import {
	isValidationContext,
	type Validator,
	getTableFromContext,
	stripTypeCast,
	containsVariableSyntax
} from './types';

/**
 * Validates that when date_range or date_grain is specified,
 * either a date column is provided or x is a date column
 *
 * @param dateColumnAttribute The attribute name for the date column
 * @param dateRangeAttribute The attribute name for the date range selection
 * @param tableAttribute The attribute name for the table
 * @param xColumnAttribute The attribute name for the x-axis column (can be a date column alternative)
 * @returns A validator function that checks appropriate date columns are available
 */
export const validateDateAttributes =
	(
		dateColumnAttribute: string = 'date',
		dateRangeAttribute: string = 'date_range',
		tableAttribute: string = 'data',
		xColumnAttribute: string = 'x'
	): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];
		if (!context.metadata) return [];
		if (context.metadata.loading) return [];

		// Metric mode supplies `data`/`x`/date column from the metric view, so the
		// component itself won't have them as attributes — this validator would
		// then emit "must specify a date column using the 'date' attribute" even
		// though the metric layer already handles it correctly. Trust the metric
		// contract and skip; a bad metric ref is caught by `metricExists`.
		if (node.attributes['metric']) return [];

		const dateRange = node.attributes[dateRangeAttribute];
		const dateGrain = node.attributes['date_grain'];

		// Handle date_range object format only
		let needsDateValidation = false;
		if (dateRange && typeof dateRange === 'object' && dateRange.range) {
			needsDateValidation = dateRange.range !== 'all time';
		}

		// Only validate if date_range needs validation or if date_grain is specified
		if (!needsDateValidation && !dateGrain) {
			return [];
		}

		const dateColumn = node.attributes[dateColumnAttribute];

		// Check if date column is explicitly provided (either as separate attribute or in date_range object)
		const explicitDateColumn = dateColumn || (typeof dateRange === 'object' && dateRange?.date);

		if (
			explicitDateColumn &&
			typeof explicitDateColumn === 'string' &&
			explicitDateColumn.trim() !== ''
		) {
			// Skip validation if the date column contains variable syntax
			if (containsVariableSyntax(explicitDateColumn)) {
				return [];
			}

			// Check if the explicit date column is valid (either JS date type or has ::date casting)
			const tableName = node.attributes[tableAttribute];
			if (tableName && typeof tableName === 'string') {
				// Skip validation if the table name contains variable syntax
				if (containsVariableSyntax(tableName)) {
					return [];
				}

				const table = getTableFromContext(tableName, context);
				if (table) {
					// Check if column has ::date casting
					const hasDateCasting = explicitDateColumn.includes('::date');

					// Check if column (without casting) is a date type
					const columnWithoutCast = stripTypeCast(explicitDateColumn);
					const column = table.getColumn(columnWithoutCast);
					const isDateType = column?.jsType === 'date';

					if (!hasDateCasting && !isDateType) {
						return [
							{
								id: 'invalid-date-column',
								level: 'error',
								message: `date: "${explicitDateColumn}" is not a date column`,
								location: node.location
							}
						];
					}
				}
			}
			return []; // Date column is valid
		}

		// If no explicit date column, check if x column is a date type or has ::date casting
		const tableName = node.attributes[tableAttribute];
		const xColumn = node.attributes[xColumnAttribute];

		if (tableName && typeof tableName === 'string' && xColumn && typeof xColumn === 'string') {
			// Skip validation if either contains variable syntax
			if (containsVariableSyntax(tableName) || containsVariableSyntax(xColumn)) {
				return [];
			}

			// Use modern helper that handles both regular and inline query metadata
			const table = getTableFromContext(tableName, context);
			if (table) {
				// Check if column has ::date casting
				const hasDateCasting = xColumn.includes('::date');

				// Check if column (without casting) is a date type
				const columnWithoutCast = stripTypeCast(xColumn);
				const column = table.getColumn(columnWithoutCast);
				const isDateType = column?.jsType === 'date';

				if (hasDateCasting || isDateType) {
					return []; // x column is valid (either has ::date or is date type)
				}

				// If we have metadata but column is not a date type and doesn't have ::date casting, that's an error
				return [
					{
						id: 'invalid-date-column',
						level: 'error',
						message: `${xColumnAttribute}: "${xColumn}" is not a date column. Either specify a date column explicitly using the 'date' attribute, or use a date column for the x-axis.`,
						location: node.location
					}
				];
			}

			// If no table metadata available (shouldn't happen with modern system),
			// require explicit date column specification
			return [
				{
					id: 'missing-date-column-metadata',
					level: 'warning',
					message: `${xColumnAttribute}: Unable to verify if "${xColumn}" is a date column. Please specify the date column explicitly using the 'date' attribute to ensure proper date filtering.`,
					location: node.location
				}
			];
		}

		// If we get here and need date validation, we need either explicit date or valid x column
		if (needsDateValidation) {
			return [
				{
					id: 'missing-date-in-date-range',
					level: 'error',
					message: `${dateRangeAttribute}: When using a date range other than 'all time', you must either specify the 'date' property or use a date column as the x-axis.`,
					location: node.location
				}
			];
		}

		// For date_grain without explicit date column
		return [
			{
				id: 'missing-date-specification',
				level: 'error',
				message: `When using date grains, you must either specify a date column using the 'date' attribute or provide a date column as the x-axis.`,
				location: node.location
			}
		];
	};
