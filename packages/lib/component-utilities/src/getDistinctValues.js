/**
 * Extracts an array of distinct values from a specified column in a dataset.
 *
 * This function iterates over the dataset, collecting values from the specified
 * column into a Set to ensure uniqueness. It then converts the Set into an array
 * of distinct values and returns this array.
 *
 * @param {Object[]} data - The dataset to process, represented as an array of objects.
 * @param {string} column - The name of the column from which to extract distinct values.
 * @returns {any[]} An array containing distinct values from the specified column of the dataset.
 */
export default function getDistinctValues(data, column) {
	const set = new Set(data.map((val) => val[column]));
	return Array.from(set);
}
