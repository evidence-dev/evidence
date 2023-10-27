import { tidy, replaceNully } from '@tidyjs/tidy';

/**
 * Replaces null values in a column or columns with 0
 * @param {Record<string, unknown>[]} data
 * @param {string | string[]} columns
 * @returns
 */
export default function replaceNulls(data, columns) {
	/** @type {Record<string, unknown>} */
	const colObj = {};
	if (!Array.isArray(columns)) columns = [columns];
	for (const column of columns) {
		colObj[column] = 0;
	}
	data = tidy(data, replaceNully(colObj));
	return data;
}
