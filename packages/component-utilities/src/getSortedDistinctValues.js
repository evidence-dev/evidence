/**
 * Gets an array of distinct values from a specified column in a dataset. If sorting by the same column,
 * sorts the distinct values directly. If sorting by a different column, sorts the entire dataset by that column
 * first, then extracts distinct values, ensuring the order reflects the sorted dataset.
 *
 * @param {Object[]} data - The dataset to process, represented as an array of objects.
 * @param {string} sortColumn - The name of the column from which to extract distinct values.
 * @param {string} [sortByColumn] - The name of the column by which to sort. If not specified or the same as sortColumn,
 *                                   the distinct values of sortColumn are sorted directly. If different, the entire dataset
 *                                   is sorted by this column before extracting distinct sortColumn values.
 * @param {string} [sortOrder='asc'] - The order in which to sort ('asc' for ascending, 'desc' for descending). Defaults to 'asc'.
 * @returns {any[]} An array of distinct values from the `sortColumn`, sorted according to the specified criteria.
 */
export default function getSortedDistinctValues(data, sortColumn, sortByColumn, sortOrder = 'asc') {
	let sortedData = [...data]; // Make a shallow copy of the dataset

	if (sortColumn !== sortByColumn && sortByColumn) {
		// If sortByColumn is different, sort the full dataset first
		sortedData.sort((a, b) => {
			const valueA = a[sortByColumn],
				valueB = b[sortByColumn];
			// Handling undefined values explicitly for sorting
			if (valueA === undefined) return 1;
			if (valueB === undefined) return -1;
			// Apply the specified sortOrder
			return (valueA < valueB ? -1 : valueA > valueB ? 1 : 0) * (sortOrder === 'asc' ? 1 : -1);
		});
	}

	// Extract distinct values of sortColumn from the (possibly) sorted dataset, excluding undefined
	let distinctValues = [
		...new Set(sortedData.map((item) => item[sortColumn]).filter((value) => value !== undefined))
	];

	// If sortColumn equals sortByColumn, sort the distinct values directly
	if (sortColumn === sortByColumn) {
		distinctValues.sort((a, b) => {
			// Direct comparison since undefined values are already filtered out
			return (a < b ? -1 : a > b ? 1 : 0) * (sortOrder === 'asc' ? 1 : -1);
		});
	}

	return distinctValues;
}
