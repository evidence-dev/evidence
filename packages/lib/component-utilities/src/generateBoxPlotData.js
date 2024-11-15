export default function generateBoxPlotData(
	data,
	min = undefined,
	minInterval,
	midpoint,
	maxInterval,
	max = undefined,
	name,
	color,
	confidenceInterval = undefined
) {
	let boxData = {
		data: [],
		names: [],
		colors: []
	};

	for (let i = 0; i < data.length; i++) {
		boxData.data.push([
			min
				? data[i][min]
				: confidenceInterval
					? data[i][midpoint] - data[i][confidenceInterval]
					: data[i][minInterval],
			confidenceInterval ? data[i][midpoint] - data[i][confidenceInterval] : data[i][minInterval],
			data[i][midpoint],
			confidenceInterval ? data[i][midpoint] + data[i][confidenceInterval] : data[i][maxInterval],
			max
				? data[i][max]
				: confidenceInterval
					? data[i][midpoint] + data[i][confidenceInterval]
					: data[i][maxInterval]
		]);

		boxData.names.push(data[i][name]);

		boxData.colors.push(data[i][color] ?? color);
	}

	return boxData;
}
