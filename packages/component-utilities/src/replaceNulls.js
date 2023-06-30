import { tidy, replaceNully } from '@tidyjs/tidy';

/**
 * Replaces null values in a column or columns with 0
 * @param {Record<string, unknown>[]} data 
 * @param {string | string[]} columns 
 * @returns 
 */
export default function replaceNulls(data, columns) {
    /** @type {Record<string, unknown>} */
	let colObj = {};
	if (Array.isArray(columns)) {
		for (let i = 0; i < columns.length; i++) {
			colObj[columns[i]] = 0;
		}
	} else {
		colObj[columns] = 0;
	}
	data = tidy(data, replaceNully(colObj));
	return data;
}
