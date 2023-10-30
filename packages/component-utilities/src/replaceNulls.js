import { tidy, replaceNully } from '@tidyjs/tidy';

/**
 * Replaces null values in a column or columns with 0
 * @param {import('./types.js').QueryStoreValue} data
 * @param {string | string[]} columns
 * @returns {import('./types.js').QueryResult[]}
 */
export default function replaceNulls(data, columns) {
	/** @type {Record<string, 0>} */
	const colObj = {};
	if (!Array.isArray(columns)) columns = [columns];
	for (const column of columns) {
		colObj[column] = 0;
	}
	return tidy(data, replaceNully(colObj));
}
