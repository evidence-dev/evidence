/**
 *
 * @param {import("./types.js").EvidenceQueryResults} data
 * @param {string} column
 * @returns {import("./types.js").EvidenceTypeUnion[]}
 */
export default function getDistinctValues(data, column) {
	return Array.from(new Set(data.map((d) => d[column])));
}
