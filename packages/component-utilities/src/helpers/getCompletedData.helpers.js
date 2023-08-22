/**
 * This function is used to find difference between consecutive elements in an array.
 *
 * @param {Array<number>} arr - The array from which differences need to be found.
 * @return {Array<number>} An array containing the differences between consecutive elements.
 */
export function getDiffs(arr) {
	let diffs = [];
	for (let i = 1; i < arr.length; i++) diffs.push(arr[i] - arr[i - 1]);
	return diffs;
}

/**
 * The function is used to find greatest common divisor (gcd) between two numbers.
 *
 * @param {number} a - The first number to find gcd.
 * @param {number} b - The second number to find gcd.
 * @return {number} The greatest common divisor of the input numbers a and b.
 */
export function gcd(a, b) {
	// Treat non-numeric types as 0
	if (typeof a !== 'number' || isNaN(a)) a = 0;
	if (typeof b !== 'number' || isNaN(b)) b = 0;

	// Handle negative numbers properly
	// Never reaches base case w/o this
	a = Math.abs(a);
	b = Math.abs(b);

	// base case
	if (b <= 0.01) {
		return a;
	} else {
		return gcd(b, a % b);
	}
}

/**
 * This function is used to find the minimum and maximum values in an array.
 *
 * @param {Array} values - An array from which min and max values should be determined.
 * @param {Function} [valueof] - An optional function that defines how to obtain the measuring value.
 * @return {Array} An array containing the minimum and maximum of numbers, respectively.
 */
export function extent(values, valueof) {
	if (!Array.isArray(values)) throw new TypeError('Cannot calculate extent of non-array value.');
	let min;
	let max;
	if (valueof === undefined) {
		for (const value of values) {
			if (typeof value !== 'number') continue;

			if (min === undefined) {
				if (value >= value) min = max = value;
			} else {
				if (min > value) min = value;
				if (max < value) max = value;
			}
		}
	} else {
		let index = -1;
		for (let value of values) {
			if (typeof value !== 'number') continue;
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

/**
 * This function generates a sequence of numbers as a vector from minimum to maximum with the given period increment.
 *
 * @param {Array<number>} values - An array containing the data to be sequenced.
 * @param {number} period - The incremental value for each step in the sequence.
 * @return {Array<number>} An array containing the sequenced numbers.
 */
export function vectorSeq(values, period) {
	let [min, max] = extent(values);

	const sequence = [];
	let value = min;
	while (value <= max) {
		sequence.push(Math.round((value + Number.EPSILON) * 100000000) / 100000000);
		value += period;
	}

	return sequence;
}

/**
 * This function is used to find the interval distance among numbers in an array.
 *
 * @param {Array<number>} arr - An array containing numbers from which interval is calculated.
 * @return {number|undefined} The interval between numbers in the sorted array, or undefined if the array has only one element.
 */
export function findInterval(arr) {
	if (arr.length <= 1) {
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
	let interval = arr.reduce((a, b) => gcd(a, b)) / 100000000;
	interval = Math.round((interval + Number.EPSILON) * 100000000) / 100000000;
	return interval;
}
