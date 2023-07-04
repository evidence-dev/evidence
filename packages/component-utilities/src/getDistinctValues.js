/**
 * 
 * @param {import("./types.js").EvidenceQueryResults} data 
 * @param {string} column 
 * @returns {import("./types.js").EvidenceTypeUnion[]}
 */
export default function getDistinctValues(data, column) {
	const distinctValueSet = new Set();
	data.forEach((d) => {
		distinctValueSet.add(d[column]);
	});
	return Array.from(distinctValueSet);
}
