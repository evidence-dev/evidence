import { describe, it, expect } from 'vitest';
import {
	extent,
	findInterval,
	gcd,
	getDiffs,
	vectorSeq
} from '../helpers/getCompletedData.helpers.js';

describe('getDiffs(number, number)', () => {
	it('returns empty array if input array has less than 2 elements', () => {
		expect(getDiffs([])).toStrictEqual([]);
		expect(getDiffs([1])).toStrictEqual([]);
	});

	it('returns correct differences for array with 2 elements', () => {
		expect(getDiffs([1, 2])).toStrictEqual([1]);
		expect(getDiffs([3, -1])).toStrictEqual([-4]);
	});

	it('returns correct differences for array with multiple elements', () => {
		expect(getDiffs([1, 2, 5, 10])).toStrictEqual([1, 3, 5]);
		expect(getDiffs([0, 3, -1, 5])).toStrictEqual([3, -4, 6]);
	});

	it('returns correct differences when array contains null or undefined values', () => {
		expect(getDiffs([1, null, 3])).toStrictEqual([-1, 3]);
		expect(getDiffs([undefined, 3, 5])).toStrictEqual([NaN, 2]);
	});

	it('returns an empty array when array contains non-numeric types', () => {
		expect(getDiffs(['string', 2, 3])).toStrictEqual([NaN, 1]);
		expect(getDiffs([true, 3, 5])).toStrictEqual([2, 2]);
	});

	it('returns correct differences for array with large numbers', () => {
		expect(getDiffs([1000000000, 2000000000])).toStrictEqual([1000000000]);
		expect(getDiffs([333333333, -333333333])).toStrictEqual([-666666666]);
	});
});

describe('gcd(number, number)', () => {
	it('returns the correct gcd for two numbers', () => {
		expect(gcd(60, 48)).toBe(12);
		expect(gcd(101, 103)).toBe(1); // Prime numbers
	});

	it('returns the absolute number if the other number is 0', () => {
		expect(gcd(0, 0)).toBe(0);
		expect(gcd(0, 5)).toBe(5);
		expect(gcd(5, 0)).toBe(5);
	});

	it('returns a positive gcd regardless of the order of numbers', () => {
		expect(gcd(48, 60)).toBe(12);
		expect(gcd(60, 48)).toBe(12);
	});

	it('returns the gcd for two negative numbers', () => {
		expect(gcd(-60, -48)).toBe(12);
		expect(gcd(-101, -103)).toBe(1);
	});

	it('returns the gcd for one positive number and one negative number', () => {
		expect(gcd(-60, 48)).toBe(12);
		expect(gcd(60, -48)).toBe(12);
	});

	it('handle non-integer values correctly', () => {
		expect(gcd(60.5, 48.1)).toBeCloseTo(0.0999);
	});

	it('treats non-numeric inputs as 0', () => {
		expect(gcd(null, 48)).toBe(48);
		expect(gcd(undefined, 48)).toBe(48);
		expect(gcd('test', 48)).toBe(48);
	});

	it('works with very large numbers correctly', () => {
		expect(gcd(1234567890, 9876543210)).toBe(90);
		expect(gcd(1000000000, 100000000)).toBe(100000000);
	});

	it('works with date .getTime() results', () => {
		const date1 = new Date('2021-01-01');
		const date2 = new Date('2022-01-01');
		expect(gcd(date1.getTime(), date2.getTime())).toBe(86400000);
	});

	it('handles 0 correctly', () => {
		expect(gcd(0, 0)).toBe(0);
		expect(gcd(0, 5)).toBe(5);
		expect(gcd(5, 0)).toBe(5);
		expect(gcd(0, -5)).toBe(5);
		expect(gcd(-5, 0)).toBe(5);
	});
});

describe('extent(number[], number)', () => {
	it('returns correct minimum and maximum for array of numbers', () => {
		expect(extent([5, 1, 9, 4, 3, 6])).toEqual([1, 9]);
		expect(extent([-5, -1, -9, -4, -3, -6])).toEqual([-9, -1]);
	});

	it('returns undefined for empty array', () => {
		expect(extent([])).toEqual([undefined, undefined]);
	});

	it('uses valueof function correctly if provided', () => {
		expect(extent([1, 2, 3, 4, 5], (value) => value * 2)).toEqual([2, 10]);
		expect(extent([-5, -3, -1, 1, 3, 5], Math.abs)).toEqual([1, 5]);
	});

	it('ignores null values in array', () => {
		expect(extent([null, 3, 5, 7, 11])).toEqual([3, 11]);
	});

	it('returns correct values for array containing non-numeric elements', () => {
		expect(extent(['a', 'b', 'c', 5, 10, 15])).toEqual([5, 15]);
	});

	it('ignores undefined values in array', () => {
		expect(extent([undefined, 3, 5, 7, 11])).toEqual([3, 11]);
	});

	it('returns correct value for array with only one numeric element', () => {
		expect(extent([5])).toEqual([5, 5]);
	});

	it('throws error for non-array input', () => {
		expect(() => extent('not an array')).toThrowError(TypeError);
	});
});

describe('vectorSeq(number[], number)', () => {
	it('returns correct sequence for given values and period', () => {
		expect(vectorSeq([1, 4, 7, 10], 2)).toEqual([1, 3, 5, 7, 9]);
		expect(vectorSeq([-1, -4, -7, -10], 3)).toEqual([-10, -7, -4, -1]);
		expect(vectorSeq([1.5, 2, 2.5], 0.5)).toEqual([1.5, 2, 2.5]);
	});

	it('should return single value sequence if period is greater than the range', () => {
		expect(vectorSeq([1, 2, 3, 4], 5)).toEqual([1]);
	});

	it('should return an empty sequence for an empty array', () => {
		expect(vectorSeq([], 1)).toEqual([]);
	});

	it('should handle decimal periods', () => {
		expect(vectorSeq([1, 2, 3, 4], 0.5)).toEqual([1, 1.5, 2, 2.5, 3, 3.5, 4]);
	});

	it('should ignore non-numeric elements in the array', () => {
		expect(vectorSeq(['a', 'b', 'c'], 1)).toEqual([]);
	});

	it('should handle an array of a single number', () => {
		expect(vectorSeq([1], 1)).toEqual([1]);
	});

	it('should handle non-array inputs for the values parameter', () => {
		expect(() => vectorSeq(1, 1)).toThrowError(TypeError);
	});
});

describe('findInterval(number[])', () => {
	it('returns correct interval for array with more than one element', () => {
		expect(findInterval([5, 10, 15, 20, 25])).toBe(5);
		expect(findInterval([3, 6, 12, 24])).toBe(3);
		expect(findInterval([1.5, 2, 2.5, 3])).toBeCloseTo(0.5, 8); // Precision of 8 decimal places
	});

	it('returns undefined for array with only one element', () => {
		expect(findInterval([1])).toBeUndefined();
	});

	it('returns correct interval for array with unordered elements', () => {
		expect(findInterval([10, 2, 6, 4, 8])).toBe(2);
	});

	it('returns correct interval for array containing 0', () => {
		expect(findInterval([0, 10, 20, 30, 40])).toBe(10);
		expect(findInterval([-5, 0, 5])).toBe(5);
		expect(findInterval([-5, 0, 5, 15])).toBe(5);
	});

	it('returns correct interval for array with negative numbers', () => {
		expect(findInterval([-5, -10, -15, -20, -25])).toBe(5);
	});

	it('returns correct interval for array with non-numeric elements', () => {
		expect(findInterval([1, 3, 'a', 6])).toBe(2);
	});

	it('returns correct interval for array with duplicate elements', () => {
		expect(findInterval([1, 1, 1, 1, 3, 4, 5])).toBe(1);
	});

	it('returns undefined for an empty array', () => {
		expect(findInterval([])).toBeUndefined();
	});

	it('returns correct interval for array with Date objects', () => {
		expect(findInterval([new Date(2021, 1, 1), new Date(2021, 1, 2), new Date(2021, 1, 3)])).toBe(
			86400000
		); // 1 day in milliseconds
		expect(
			findInterval([
				new Date(2021, 1, 1, 1, 0),
				new Date(2021, 1, 1, 2, 0),
				new Date(2021, 1, 1, 3, 0)
			])
		).toBe(3600000); // 1 hour in milliseconds
	});

	it('returns correct interval for array with Date objects having gaps', () => {
		expect(findInterval([new Date(2021, 5, 1), new Date(2021, 5, 2), new Date(2021, 5, 4)])).toBe(
			86400000
		); // 1 day in milliseconds
		expect(
			findInterval([
				new Date(2021, 5, 1, 1, 0),
				new Date(2021, 5, 1, 3, 0),
				new Date(2021, 5, 1, 7, 0)
			])
		).toBe(7200000); // 2 hours in milliseconds
	});
});
