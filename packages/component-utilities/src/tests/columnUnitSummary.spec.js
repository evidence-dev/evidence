import { describe, it, expect } from 'vitest';
import { getColumnUnitSummary } from '../getColumnExtents';

describe('getColumnUnitSummary', () => {
	it('should return correct values with real valued nubmer array', () => {
		const data = [
			{ columnOne: 'three', columnTwo: 3 },
			{ columnOne: 'threpointone', columnTwo: 3.1 },
			{ columnOne: 'pi', columnTwo: 3.14159 },
			{ columnOne: 'one', columnTwo: 1 },
			{ columnOne: 'five', columnTwo: 5 }
		];

		const summary = getColumnUnitSummary(data, 'columnTwo');
		expect(summary).toStrictEqual({
			count: 5,
			countDistinct: 5,
			mean: 3.048318,
			sum: 15.24159,
			min: 1,
			max: 5,
			median: 3.1,
			maxDecimals: 5,
			unitType: 'number'
		});
	});
	it('should return correct values when there are undefined and null elements in numbered data series', () => {
		const data = [
			{ column1: 'foo', column2: 3 },
			{ column1: 'bar', column2: null },
			{ column1: 'dar', column2: undefined },
			{ column1: 'blah', column2: 1 },
			{ column1: 'blah', column2: 5 }
		];
		const summary = getColumnUnitSummary(data, 'column2');
		expect(summary).toStrictEqual({
			count: 5,
			countDistinct: 4,
			mean: 3,
			sum: 9,
			min: 1,
			max: 5,
			median: 3,
			maxDecimals: 0,
			unitType: 'number'
		});
	});
	it('should only return count and countDistinct when the data is not numeric, and other values should be undefined', () => {
		const data = [
			{ column1: 'foo', column2: 'bar', bool: true },
			{ column1: 'dar', column2: 'blah', bool: false },
			{ column1: 'blah', column2: 'blah', bool: true },
			{ column1: 'blah', column2: 'blah', bool: false }
		];
		const summary = getColumnUnitSummary(data, 'column2', false);
		expect(summary).toStrictEqual({
			count: 4,
			countDistinct: 2,
			maxDecimals: 0,
			max: undefined,
			mean: undefined,
			median: undefined,
			min: undefined,
			sum: undefined,
			// Probably undesired behavior, fixed downstream
			unitType: 'number'
		});
		const summaryBool = getColumnUnitSummary(data, 'bool', false);
		expect(summaryBool).toStrictEqual({
			count: 4,
			countDistinct: 2,
			maxDecimals: 0,
			max: undefined,
			mean: undefined,
			median: undefined,
			min: undefined,
			sum: undefined,
			// Probably undesired behavior, fixed downstream
			unitType: 'number'
		});
	});
});
