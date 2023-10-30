/**
 *
 * @param {import("./types.js").QueryStoreValue} data
 * @param {string} column
 * @returns {import("./types.js").QueryResultValue[]}
 */
export default function getDistinctValues(data, column) {
	return Array.from(new Set(data.map((d) => d[column])));
}
