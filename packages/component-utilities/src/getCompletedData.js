import { tidy, complete } from '@tidyjs/tidy';
import getDistinctValues from './getDistinctValues';
import { findInterval, vectorSeq } from './helpers/getCompletedData.helpers.js';

/**
 * This function fills missing data points in the given data array for a specific series.
 *
 * @param {Array<object>} data - The data as an array of objects.
 * @param {string} x - The property used as x-axis.
 * @param {string} y - The property used as y-axis.
 * @param {string} series - The specific series in the data to be filled.
 * @param {boolean} [nullsZero=false] - A flag indicating whether nulls should be replaced with zero.
 * @param {boolean} [fillX=false] - A flag indicating whether the x-axis values should be filled (based on the found interval distance).
 * @return {Array<object>} An array containing the filled data objects.
 */
export default function getCompletedData(data, x, y, series, nullsZero = false, fillX = false) {
	/** @type {Array<number>} */
	let xDistinct = getDistinctValues(data, x);
	/** @type {number} */
	let interval;
	/** @type {Array<object>} */
	let filledData;

	if (series) {
		if (fillX) {
			interval = findInterval(xDistinct);

			if (nullsZero) {
				filledData = tidy(
					data,
					complete({ [x]: vectorSeq(xDistinct, interval), [series]: series }, { [y]: 0 })
				);
			} else {
				filledData = tidy(
					data,
					complete({ [x]: vectorSeq(xDistinct, interval), [series]: series }, { [y]: null })
				);
			}
		} else {
			filledData = tidy(
				data,
				complete(
					[x, series],
					// Nully values in the x and series columns to be treated as nulls
					{ [series]: null, [x]: null }
				)
			);
		}
	} else {
		if (fillX) {
			interval = findInterval(xDistinct);

			if (nullsZero) {
				filledData = tidy(data, complete({ [x]: vectorSeq(xDistinct, interval) }, { [y]: 0 }));
			} else {
				filledData = tidy(data, complete({ [x]: vectorSeq(xDistinct, interval) }));
			}
		} else {
			filledData = tidy(data, complete([x]));
		}
	}

	return filledData;
}
