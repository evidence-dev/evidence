import { performance } from 'perf_hooks';
/**
 * @typedef {Object} NotEqualsFilter
 * @property {"ne"} type
 s * @property {string[]} fields
 */

/**
 * @typedef {Object} UniqueFilter
 * @property {"unique"} type
 * @property {string[]} fields
 */

/**
 * @typedef {NotEqualsFilter | UniqueFilter} Filter
 */

/**
 * @param {any[]} rows
 * @param {Filter[]} filters
 */
export const filter = (rows, filters) => {
	let outputRows = rows;
	for (const filter of filters) {
		switch (filter.type) {
			case 'unique':
				// O(n) unique function
				console.debug(
					`Running unique filter with ${filter.fields.length} fields over ${rows.length} rows. This may take some time`
				);
				const before = performance.now();
				const uniq = {};
				const distinct = [];
				/**
				 * @param {any} r
				 * @returns {string}
				 */
				const buildKey = (r) => JSON.stringify(filter.fields.map((f) => r[f]));

				for (const row of rows) {
					const k = buildKey(row);
					if (uniq[k]) continue;
					distinct.push(row);
					uniq[k] = true;
				}
				const after = performance.now();
				console.debug(`Finished unique filter, took ${(after - before).toFixed(0)}ms`);
				outputRows = distinct;

				break;
			case 'ne':
				outputRows = outputRows.filter((row) => {
					// Map filter fields to their values in this row
					// Then get the number of distinct values
					// If the number of distinct values is equal to
					//     the number of filter fields; they are all different
					const distinctValues = filter.fields.reduce((acc, filterField) => {
						if (!acc.includes(row[filterField])) {
							acc.push(row[filterField]);
						}
						return acc;
					}, []); //.length === filter.fields.length
					return distinctValues.length === filter.fields.length;
				});
				break;
			default:
				console.warn(`Unknown filter type ${filter.type}`);
				break;
		}
	}
	return outputRows;
};
