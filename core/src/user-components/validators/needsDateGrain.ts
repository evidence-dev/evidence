import { isValidationContext, type Validator, getTableFromContext, stripTypeCast } from './types';

/**
 * Warns when a date/datetime column is used without specifying a `date_grain`.
 *
 * Pattern follows other simple validators like `expressionHasAggregation`.
 * It attempts to identify the column referenced by the given attribute. If the
 * column type includes "date", "datetime", or "timestamp" (case-insensitive)
 * and the component does **not** already provide a `date_grain` attribute, a
 * warning is emitted suggesting the user add one.
 */
export const needsDateGrain =
	(propName: string): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];

		const propValue = node.attributes[propName];
		if (!propValue || typeof propValue !== 'string') return [];

		// If the component already specifies a date_grain, no warning is necessary
		if (node.attributes.date_grain !== undefined) return [];

		// Table name is usually defined on the parent <table> component (see pivot schema)
		const tableName =
			(node.parent?.attributes?.data as string) || (node.attributes?.data as string);
		if (!tableName || typeof tableName !== 'string') return [];

		const tableMetadata = getTableFromContext(tableName, context);
		if (!tableMetadata) return [];

		// Only handle simple column names (single identifier)
		const simpleIdentifierMatch = propValue.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
		if (!simpleIdentifierMatch) return [];

		const columnName = simpleIdentifierMatch[1];
		const column = tableMetadata.getColumn(stripTypeCast(columnName));
		if (!column) return [];

		const columnType = (column.type || '').toLowerCase();
		const isDateType = /date|datetime|timestamp/.test(columnType);
		if (!isDateType) return [];

		return [
			{
				id: 'date-column-needs-grain',
				level: 'warning',
				message: `${propName}: Column "${columnName}" is a date/time type. Consider specifying a date_grain (e.g., 'day', 'month', 'year') to control how dates are grouped.`,
				location: node.location
			}
		];
	};
