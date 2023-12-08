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

	// Ensures that all permutations of this map exist in the output
	// e.g. can include series and x values to ensure that all series have all x values
	const expandKeys = {};

	const xIsDate = data[0]?.[x] instanceof Date;

	/** @type {Array<number | string>} */
	let xDistinct;
	const exampleX = data[0]?.[x];

	switch (typeof exampleX) {
		case 'object':
			// If x is not a date; this shouldn't be hit, abort!
			if (!(exampleX instanceof Date)) {
				throw new Error('Unexpected object property, expected string, date, or number');
			}
			// Map dates to numeric values
			xDistinct = getDistinctValues(
				data.map((d) => ({ [x]: d[x].getTime() })),
				x
			);
			// We don't fillX here because date numbers are very large, so a small interval would create a _massive_ array
			break;
		case 'number':
			// Numbers are the most straightforward
			xDistinct = getDistinctValues(data, x);
			if (fillX) {
				// Attempt to derive the interval between X values and interpolate missing values in that set (within the bounds of min/max)
				const interval = findInterval(xDistinct);
				expandKeys[x] = vectorSeq(xDistinct, interval);
			}
			break;
		case 'string':
			xDistinct = getDistinctValues(data, x);
			expandKeys[x] = xDistinct;
			break;
	}

	const output = [];

	for (const value of Object.values(groups)) {
		const nullySpec = series ? { [series]: null } : {};
		if (nullsZero) {
			nullySpec[y] = 0;
		} else {
			// Ensure null for consistency
			nullySpec[y] = null;
		}

		if (series) {
			expandKeys[series] = series;
		}

		const tidyFuncs = [];
		if (Object.keys(expandKeys).length === 0) {
			// empty object, no special configuration
			tidyFuncs.push(complete([x], nullySpec));
		} else {
			tidyFuncs.push(complete(expandKeys, nullySpec));
		}
		if (xIsDate) {
			// Ensure that x is actually a date
			tidyFuncs.push(
				mutate({
					[x]: (val) => new Date(val[x])
				})
			);
		}

		output.push(tidy(value, ...tidyFuncs));
	}
	return output.flat();
}
