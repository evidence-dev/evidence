import { tidy, complete, mutate } from '@tidyjs/tidy';
import getDistinctValues from './getDistinctValues';
import { findInterval, vectorSeq } from './helpers/getCompletedData.helpers.js';

/**
 * This function fills missing data points in the given data array for a specific series.
 *
 * @param {Record<string, unknown>[]} data - The data as an array of objects.
 * @param {string} x - The property used as x-axis.
 * @param {string} y - The property used as y-axis.
 * @param {string} series - The specific series in the data to be filled.
 * @param {boolean} [nullsZero=false] - A flag indicating whether nulls should be replaced with zero.
 * @param {boolean} [fillX=false] - A flag indicating whether the x-axis values should be filled (based on the found interval distance).
 * @return {Record<string, unknown>[]} An array containing the filled data objects.
 */
export default function getCompletedData(data, x, y, series, nullsZero = false, fillX = false) {
	const groups = Array.from(data).reduce((a, v) => {
		if (series) {
			if (!a[v[series]]) a[v[series]] = [];
			a[v[series]].push(v);
		} else {
			if (!a.default) a.default = [];
			a.default.push(v);
		}
		return a;
	}, {});

	const output = [];

	let xIsDate = Object.values(groups)[0][0]?.[x] instanceof Date;

	const nullySpec = { [series]: null };
	if (nullsZero) {
		nullySpec[y] = 0;
	} else {
		// Ensure null for consistency
		nullySpec[y] = null;
	}

	const expandKeys = {};

	if (fillX) {
		/** @type {Array<number>} */
		let xDistinct;

		if (xIsDate)
			xDistinct = getDistinctValues(
				data.map((d) => ({ [x]: d[x].getTime() })),
				x
			);
		else xDistinct = getDistinctValues(data, x);

		/** @type {number} */
		let interval = findInterval(xDistinct);

		// Array of all possible x values
		expandKeys[x] = vectorSeq(xDistinct, interval);
	} else {
		expandKeys[x] = x;
	}
	if (series) {
		expandKeys[series] = series;
	}

	const tidyFuncs = [];

	if (Object.keys(expandKeys).length === 0) {
		tidyFuncs.push(complete([x], nullySpec));
		// empty object, no special configuration
	} else {
		tidyFuncs.push(complete(expandKeys, nullySpec));
	}

	if (xIsDate) {
		tidyFuncs.push(
			mutate({
				[x]: (val) => new Date(val[x])
			})
		);
	}

	output.push(...tidy(data, ...tidyFuncs));

	return output;
}
