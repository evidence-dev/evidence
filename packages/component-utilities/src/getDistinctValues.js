export default function getDistinctValues(data, column) {
	const set = new Set(data.map((val) => val[column]));
	return Array.from(set);
}
