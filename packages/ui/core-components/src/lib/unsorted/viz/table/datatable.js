import { strictBuild } from '@evidence-dev/component-utilities/chartContext';

/**
 * Will find the matching column in columnSummary or throw an error if not found
 * @param column
 */
export function safeExtractColumn(column, columnSummary) {
	const foundCols = columnSummary.filter((d) => d.id === column.id);
	if (foundCols === undefined || foundCols.length !== 1) {
		const error =
			column.id === undefined
				? new Error(`please add an "id" property to all the <Column ... />`)
				: new Error(`column with id: "${column.id}" not found`);
		if (strictBuild) {
			throw error;
		}
		console.warn(error.message);
		return '';
	}

	return foundCols[0];
}

/**
 *
 * @param {object[]} data
 * @param {string} valueCol
 * @param {string} weightCol
 * @returns {number | null} Null when weightCol is missing, or data is empty
 */
export function weightedMean(data, valueCol, weightCol) {
	if (!weightCol) return null;
	if (!data.length) return null;
	let totalWeightedValue = 0;
	let totalWeight = 0;

	data.forEach((item) => {
		const value = Number(item[valueCol] ?? 0);
		const weight = Number(item[weightCol] ?? 0);
		totalWeightedValue += value * weight;
		totalWeight += weight;
	});

	return totalWeight > 0 ? totalWeightedValue / totalWeight : 0;
}

export function median(data, column) {
	// Extract the relevant values and filter out undefined or non-numeric values
	const values = data
		.map((item) => item[column])
		.filter((val) => val !== undefined && !isNaN(val))
		.sort((a, b) => a - b);

	if (values.length === 0) return 0; // Return 0 or another placeholder if no valid values exist

	const midIndex = Math.floor(values.length / 2);

	// If odd number of values, return the middle one; if even, return the average of the two middle values
	return values.length % 2 !== 0 ? values[midIndex] : (values[midIndex - 1] + values[midIndex]) / 2;
}

/**
 * Aggregates column values from an array of objects based on the specified aggregation type.
 * This function supports various aggregation types like sum, min, max, mean, count, countDistinct,
 * weightedMean, and median. It defaults to sum for numeric columns if the aggregation type is not specified.
 * For non-numeric columns attempting numeric aggregation, it returns '-'.
 *
 * @param {Object[]} data - Array of objects representing the dataset.
 * @param {string} columnName - The name of the column to aggregate.
 * @param {string} [aggType] - The type of aggregation to perform. Defaults to 'sum' for numeric columns if not specified.
 * @param {string} columnType - The data type of the column ('number' for numeric columns).
 * @param {string} [weightColumnName=null] - The name of the column to use for weighted mean calculations, if applicable.
 * @returns {number|string} The result of the aggregation operation, or '-' for invalid numeric operations on non-numeric columns.
 */
export function aggregateColumn(data, columnName, aggType, columnType, weightColumnName = null) {
	// Default to 'sum' if aggType is not provided and columnType is 'number'
	if (!aggType && columnType === 'number') {
		aggType = 'sum';
	}

	if (!data || !data.length) return null; // Return null if data is empty

	// Check column type compatibility
	if (
		columnType !== 'number' &&
		['sum', 'min', 'max', 'mean', 'weightedMean', 'median', undefined].includes(aggType)
	) {
		return '-'; // Return dash if attempting numeric aggregation on a non-numeric column
	}
	const columnValues = data.map((row) => row[columnName]).filter((val) => val !== undefined);

	switch (aggType) {
		case 'sum':
			return columnValues.reduce((sum, val) => sum + Number(val), 0);
		case 'min':
			return Math.min(...columnValues);
		case 'max':
			return Math.max(...columnValues);
		case 'mean':
			return columnValues.length
				? columnValues.reduce((sum, val) => sum + Number(val), 0) / columnValues.length
				: '-';
		case 'count':
			return data.length;
		case 'countDistinct':
			return new Set(columnValues).size;
		case 'weightedMean': {
			if (!weightColumnName) return 'Weight column name required for weightedMean';
			let totalWeight = 0;
			let weightedSum = data.reduce((sum, row) => {
				const weight = row[weightColumnName] || 0;
				totalWeight += weight;
				return sum + (Number(row[columnName]) || 0) * weight;
			}, 0);
			return totalWeight > 0 ? weightedSum / totalWeight : null;
		}
		case 'median': {
			const sortedValues = columnValues.sort((a, b) => a - b);
			const mid = Math.floor(sortedValues.length / 2);
			return sortedValues.length % 2 !== 0
				? sortedValues[mid]
				: (sortedValues[mid - 1] + sortedValues[mid]) / 2;
		}
		default:
			return `${aggType}`;
	}
}

/**
 * Generates the final column order for a DataTable based on group column(s) and the columns
 * supplied by the user. Group columns are placed first, followed either by the order specified in
 * Column components or the original order of the data
 *
 * @param {Array<string>} columns - An array of column names that represents all columns to be shown in the table
 * @param {Array<string>} priorityColumns - An array of column names that should be shown first (group column(s))
 * @returns {Array<string>} A new array of column names sorted such that priority columns
 *                          come first, followed by the rest of the columns in their original order.
 */
export function getFinalColumnOrder(columns, priorityColumns) {
	const restColumns = columns.filter((key) => !priorityColumns.includes(key));
	return [...priorityColumns, ...restColumns];
}
