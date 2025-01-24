// @ts-check

/** @template T @typedef {import('svelte/store').Readable<T>} Readable */

/**
 * @typedef {{
 * 	data: unknown[][]
 * 	names: string[]
 * 	colors: Readable<(string | undefined)[]>
 * }} BoxPlotData
 */

/**
 * @param {unknown[]} data
 * @param {string} min
 * @param {string} minInterval
 * @param {string} midpoint
 * @param {string} maxInterval
 * @param {string} max
 * @param {string} name
 * @param {string | undefined} color
 * @param {string} confidenceInterval
 * @param {(color: unknown[]) => Readable<(string | undefined)[]>} resolveColor
 * @returns {BoxPlotData}
 */
export const generateBoxPlotData = (
	data,
	min = undefined,
	minInterval,
	midpoint,
	maxInterval,
	max = undefined,
	name,
	color,
	confidenceInterval = undefined,
	resolveColor
) => {
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

	return {
		...boxData,
		colors: resolveColor(boxData.colors)
	};
};
