export default function getDistinctValues(data, column) {
	let distinctValues = [];
	const distinctValueSet = new Set();
	data.forEach((d) => {
		distinctValueSet.add(d[column]);
	});
	distinctValues = [...distinctValueSet];
	return distinctValues;
}
