export default function getDistinctValues(data, column) {
	return data.reduce((a, v) => {
		if (a.includes(v[column])) return a;
		return [...a, v[column]];
	}, []);
}
