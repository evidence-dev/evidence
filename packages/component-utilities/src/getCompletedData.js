import { tidy, complete } from '@tidyjs/tidy';
import getDistinctValues from './getDistinctValues';

function getDiffs(arr) {
	var diffs = [];
	for (var i = 1; i < arr.length; i++) diffs.push(arr[i] - arr[i - 1]);
	return diffs;
}

function gcd(a, b) {
	// Get greatest common divisor of the differences between values
	if (a < b) return gcd(b, a);

	// base case
	if (Math.abs(b) < 0.001) return a;
	else return gcd(b, a - Math.floor(a / b) * b);
}

function extent(values, valueof) {
	let min;
	let max;
	if (valueof === undefined) {
		for (const value of values) {
			if (value != null) {
				if (min === undefined) {
					if (value >= value) min = max = value;
				} else {
					if (min > value) min = value;
					if (max < value) max = value;
				}
			}
		}
	} else {
		let index = -1;
		for (let value of values) {
			if ((value = valueof(value, ++index, values)) != null) {
				if (min === undefined) {
					if (value >= value) min = max = value;
				} else {
					if (min > value) min = value;
					if (max < value) max = value;
				}
			}
		}
	}
	return [min, max];
}

function vectorSeq(values, period) {
	let min = extent(values)[0];
	let max = extent(values)[1];

	const sequence = [];
	let value = min;
	while (value <= max) {
		sequence.push(Math.round((value + Number.EPSILON) * 100000000) / 100000000);
		value += period;
	}

	return sequence;
}

function findInterval(arr) {
	if (arr.length === 1) {
		return;
	}
	// Sort array ascending
	arr.sort(function (a, b) {
		return a - b;
	});

	// 1. Multiply array by 100
	arr = arr.map(function (x) {
		return x * 100000000;
	});

	// 2. Get diffs
	arr = getDiffs(arr);

	// 3. Calculate greatest common divisor of diffs and divide by 100
	let interval = arr.reduce(gcd) / 100000000;
	interval = Math.round((interval + Number.EPSILON) * 100000000) / 100000000;

	return interval;
}

export default function getCompletedData(data, x, y, series, nullsZero = false, fillX = false) {
	let xDistinct = getDistinctValues(data, x);
	let interval;
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
					complete({ [x]: vectorSeq(xDistinct, interval), [series]: series })
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
