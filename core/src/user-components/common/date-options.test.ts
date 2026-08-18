import { describe, it, expect } from 'vitest';
import { coarserGrain } from './date-options';

describe('coarserGrain', () => {
	it('returns the coarser of two temporal grains', () => {
		expect(coarserGrain('month', 'day')).toBe('month');
		expect(coarserGrain('year', 'quarter')).toBe('year');
		expect(coarserGrain('week', 'hour')).toBe('week');
	});

	it('is order-independent', () => {
		expect(coarserGrain('day', 'month')).toBe('month');
		expect(coarserGrain('quarter', 'year')).toBe('year');
	});

	it('returns the defined one when the other is undefined', () => {
		expect(coarserGrain(undefined, 'day')).toBe('day');
		expect(coarserGrain('month', undefined)).toBe('month');
	});

	it('returns undefined when both are undefined', () => {
		expect(coarserGrain(undefined, undefined)).toBeUndefined();
	});

	it('prefers the temporal grain when only one side is temporal', () => {
		// Non-temporal grains (like `day of week`) have rank -1 in the map; the
		// temporal one wins because you can't align a category-shaped grain and
		// a temporal grain on the same x-axis.
		expect(coarserGrain('day of week', 'month')).toBe('month');
		expect(coarserGrain('week', 'month of year')).toBe('week');
	});

	it('handles same-grain inputs deterministically', () => {
		expect(coarserGrain('month', 'month')).toBe('month');
	});
});
