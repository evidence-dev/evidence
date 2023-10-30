/**
 *
 * @param {import("./types.js").QueryStoreValue} data
 * @param {string} col
 * @param {boolean} isAsc
 * @returns {import("./types.js").QueryResult[]}
 */
export default function getSortedData(data, col, isAsc) {
	return [...data].sort((a, b) => {
		// @ts-expect-error typescript doesn't like that a[col] could be null
		return (a[col] < b[col] ? -1 : 1) * (isAsc ? 1 : -1);
	});
}
