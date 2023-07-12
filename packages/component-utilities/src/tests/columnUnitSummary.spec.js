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
});
