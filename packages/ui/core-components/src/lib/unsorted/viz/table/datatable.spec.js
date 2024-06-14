import { describe, expect, it } from 'vitest';
import { weightedMean } from './datatable.js';

describe('weightedMean', () => {
	it('should return weighted mean when data is not empty', () => {
		const result = weightedMean(
			[
				{ value: 1, weight: 3 },
				{ value: 2, weight: 2 },
				{ value: 3, weight: 3 }
			],
			'value',
			'weight'
		);
		expect(result).toBe(2);
	});

	it('should ignore rows where the weight is missing', () => {
		const result = weightedMean(
			[{ value: 1 }, { value: 2, weight: 2 }, { value: 3, weight: 3 }],
			'value',
			'weight'
		);
		const result2 = weightedMean(
			[
				{ value: 2, weight: 2 },
				{ value: 3, weight: 3 }
			],
			'value',
			'weight'
		);
		expect(result).toBe(result2);
	});
	it('should default to 0 when the value is missing', () => {
		const result = weightedMean(
			[{ weight: 1 }, { value: 2, weight: 2 }, { value: 3, weight: 3 }],
			'value',
			'weight'
		);
		const result2 = weightedMean(
			[
				{ value: 0, weight: 1 },
				{ value: 2, weight: 2 },
				{ value: 3, weight: 3 }
			],
			'value',
			'weight'
		);
		expect(result).toBe(result2);
	});

	it('should return null when data is empty', () => {
		const result = weightedMean([], 'value', 'weight');
		expect(result).toBe(null);
	});
	it('should return null when weightCol is not provided', () => {
		const result = weightedMean(
			[
				{ value: 1, weight: 3 },
				{ value: 2, weight: 2 },
				{ value: 3, weight: 3 }
			],
			'value'
		);
		expect(result).toBe(null);
	});
});
