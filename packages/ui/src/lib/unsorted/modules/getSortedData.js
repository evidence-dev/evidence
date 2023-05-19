export default function getSortedData(data, col, isAsc) {
	return [...data].sort((a, b) => {
		return (a[col] < b[col] ? -1 : 1) * (isAsc ? 1 : -1);
	});
}
