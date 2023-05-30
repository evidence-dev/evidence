import { describe, it, expect } from 'vitest';
import { getColumnUnitSummary } from '../getColumnExtents';

describe('getColumnUnitSummary', () => {
	it('should return a valid unit type for mixed type array', () => {
		const data = [
			{ column1: 'foo', column2: 3.1 },
			{ column1: 'bar', column2: 'value' },
			{ column1: 'far', column2: 4.1 },
			{ column1: 'far', column2: undefined }
		];
		const summary = getColumnUnitSummary(data, 'column2');
		let { unitType, maxDecimals, median } = summary;
		expect(unitType).toStrictEqual('unknown');
		expect(median).toBeCloseTo(3.6, 1);
		expect(maxDecimals).toStrictEqual(1);
	});

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
			min: 1,
			max: 5,
			median: 3,
			maxDecimals: 0,
			unitType: 'number'
		});
	});
	it('should return correct values with a string data series', () => {
		const data = [
			{ column1: 'foo', column2: 3 },
			{ column1: 'bar', column2: null },
			{ column1: 'dar', column2: undefined },
			{ column1: 'far', column2: 1 },
			{ column1: 'zar', column2: 5 }
		];
		const summary = getColumnUnitSummary(data, 'column1');
		expect(summary).toStrictEqual({
			min: 'bar',
			max: 'zar',
			median: undefined,
			maxDecimals: 0,
			unitType: 'string'
		});
	});
});
