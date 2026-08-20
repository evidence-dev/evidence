import { describe, it, expect } from 'vitest';
import {
	createCategoricalColorMap,
	createColorScale,
	getColorForCategory,
	getColorForValue
} from './color-scale-utils';

describe('createCategoricalColorMap', () => {
	const defaultPalette = ['#236aa4', '#45a1bf', '#a5cdee', '#8dacbf', '#85c7c6'];

	it('should assign colors to unique categories in order', () => {
		const categories = ['hotel', 'restaurant', 'bar', 'hotel'];
		const result = createCategoricalColorMap(categories, {
			defaultColorPalette: defaultPalette
		});

		expect(result).not.toBeNull();
		expect(result!.categories).toEqual(['hotel', 'restaurant', 'bar']);
		expect(result!.categoryColors.get('hotel')).toBe('#236aa4');
		expect(result!.categoryColors.get('restaurant')).toBe('#45a1bf');
		expect(result!.categoryColors.get('bar')).toBe('#a5cdee');
	});

	it('should cycle through palette when more categories than colors', () => {
		const categories = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
		const smallPalette = ['#ff0000', '#00ff00', '#0000ff'];
		const result = createCategoricalColorMap(categories, {
			defaultColorPalette: smallPalette
		});

		expect(result).not.toBeNull();
		expect(result!.categoryColors.get('A')).toBe('#ff0000');
		expect(result!.categoryColors.get('B')).toBe('#00ff00');
		expect(result!.categoryColors.get('C')).toBe('#0000ff');
		expect(result!.categoryColors.get('D')).toBe('#ff0000'); // cycles
		expect(result!.categoryColors.get('E')).toBe('#00ff00');
		expect(result!.categoryColors.get('F')).toBe('#0000ff');
		expect(result!.categoryColors.get('G')).toBe('#ff0000');
	});

	it('should filter out null and undefined values', () => {
		const categories = ['hotel', null, 'restaurant', undefined, 'bar'];
		const result = createCategoricalColorMap(categories, {
			defaultColorPalette: defaultPalette
		});

		expect(result).not.toBeNull();
		expect(result!.categories).toEqual(['hotel', 'restaurant', 'bar']);
		expect(result!.categories.length).toBe(3);
	});

	it('should handle numeric categories', () => {
		const categories = [1, 2, 3, 1];
		const result = createCategoricalColorMap(categories, {
			defaultColorPalette: defaultPalette
		});

		expect(result).not.toBeNull();
		expect(result!.categories).toEqual(['1', '2', '3']);
		expect(result!.categoryColors.get('1')).toBe('#236aa4');
		expect(result!.categoryColors.get('2')).toBe('#45a1bf');
		expect(result!.categoryColors.get('3')).toBe('#a5cdee');
	});

	it('should use custom palette when provided', () => {
		const categories = ['A', 'B'];
		const customPalette = ['#ff0000', '#00ff00'];
		const result = createCategoricalColorMap(categories, {
			colorPalette: customPalette,
			defaultColorPalette: defaultPalette
		});

		expect(result).not.toBeNull();
		expect(result!.categoryColors.get('A')).toBe('#ff0000');
		expect(result!.categoryColors.get('B')).toBe('#00ff00');
		expect(result!.colorPalette).toEqual(customPalette);
	});

	it('should return null when no valid categories', () => {
		const categories = [null, undefined, null];
		const result = createCategoricalColorMap(categories, {
			defaultColorPalette: defaultPalette
		});

		expect(result).toBeNull();
	});

	it('should preserve order of first occurrence', () => {
		const categories = ['C', 'A', 'B', 'A', 'C', 'B'];
		const result = createCategoricalColorMap(categories, {
			defaultColorPalette: defaultPalette
		});

		expect(result).not.toBeNull();
		expect(result!.categories).toEqual(['C', 'A', 'B']); // First occurrence order
		expect(result!.categoryColors.get('C')).toBe('#236aa4');
		expect(result!.categoryColors.get('A')).toBe('#45a1bf');
		expect(result!.categoryColors.get('B')).toBe('#a5cdee');
	});
});

describe('createColorScale', () => {
	const defaultScale = ['#ffffff', '#000000'];
	const divergingPalette = ['#d73027', '#ffffbf', '#1a9850'];

	it('uses data min/max as the domain by default', () => {
		const result = createColorScale([10, 50, 90], { defaultColorScale: defaultScale });

		expect(result).not.toBeNull();
		expect(result!.minValue).toBe(10);
		expect(result!.maxValue).toBe(90);
		expect(result!.midpoint).toBeNull();
		expect(result!.domain).toEqual([10, 90]);
	});

	it('honours min/max overrides on the domain', () => {
		const result = createColorScale([20, 30, 40], {
			defaultColorScale: defaultScale,
			min: 0,
			max: 100
		});

		expect(result).not.toBeNull();
		expect(result!.minValue).toBe(0);
		expect(result!.maxValue).toBe(100);
		// Values within [min, max] should land at the expected position on the scale.
		// At 50 (midpoint of [0, 100]) the chroma scale should produce a mid-grey.
		const midColor = result!.scale(50).hex();
		expect(midColor.toLowerCase()).not.toBe('#ffffff');
		expect(midColor.toLowerCase()).not.toBe('#000000');
	});

	it('clamps values outside [min, max]', () => {
		const result = createColorScale([-50, 0, 50], {
			defaultColorScale: defaultScale,
			min: 0,
			max: 100
		});

		expect(result).not.toBeNull();
		// chroma's scale clamps outside the domain to the endpoint colors.
		expect(getColorForValue(-9999, result!).toLowerCase()).toBe('#ffffff');
		expect(getColorForValue(9999, result!).toLowerCase()).toBe('#000000');
	});

	it('places the midpoint at the middle color of a 3-color diverging palette', () => {
		const result = createColorScale([-100, 0, 100], {
			colorPalette: divergingPalette,
			defaultColorScale: defaultScale,
			min: -100,
			max: 100,
			midpoint: 0
		});

		expect(result).not.toBeNull();
		expect(result!.midpoint).toBe(0);
		expect(result!.domain).toEqual([-100, 0, 100]);
		// At the midpoint, the colour should be the middle palette colour.
		expect(getColorForValue(0, result!).toLowerCase()).toBe('#ffffbf');
		expect(getColorForValue(-100, result!).toLowerCase()).toBe('#d73027');
		expect(getColorForValue(100, result!).toLowerCase()).toBe('#1a9850');
	});

	it('places the midpoint correctly with an asymmetric range', () => {
		const result = createColorScale([-50, 0, 200], {
			colorPalette: divergingPalette,
			defaultColorScale: defaultScale,
			min: -50,
			max: 200,
			midpoint: 0
		});

		expect(result).not.toBeNull();
		expect(result!.domain).toEqual([-50, 0, 200]);
		// At 0 we still want the middle color, even though it's not the geometric mid.
		expect(getColorForValue(0, result!).toLowerCase()).toBe('#ffffbf');
	});

	it('builds an evenly-split domain for 5-color diverging palettes', () => {
		const palette = ['#d73027', '#fc8d59', '#ffffbf', '#91bfdb', '#1a9850'];
		const result = createColorScale([-100, 0, 100], {
			colorPalette: palette,
			defaultColorScale: defaultScale,
			min: -100,
			max: 100,
			midpoint: 0
		});

		expect(result).not.toBeNull();
		expect(result!.colorPalette).toHaveLength(palette.length);
		expect(result!.domain).toHaveLength(palette.length);
		// Domain entries should be strictly increasing and bracket the midpoint.
		for (let i = 1; i < result!.domain.length; i++) {
			expect(result!.domain[i]).toBeGreaterThan(result!.domain[i - 1]);
		}
		const midIndex = (palette.length - 1) / 2;
		expect(result!.domain[midIndex]).toBe(0);
		// At the midpoint we expect the centre palette colour.
		expect(getColorForValue(0, result!).toLowerCase()).toBe('#ffffbf');
	});

	it('ignores midpoint with fewer than 3 colors', () => {
		const result = createColorScale([0, 100], {
			colorPalette: ['#000000', '#ffffff'],
			defaultColorScale: defaultScale,
			midpoint: 50
		});

		expect(result).not.toBeNull();
		expect(result!.midpoint).toBeNull();
		expect(result!.domain).toEqual([0, 100]);
	});

	it('accepts overrides even with no values', () => {
		const result = createColorScale([], {
			defaultColorScale: defaultScale,
			min: -10,
			max: 10
		});

		expect(result).not.toBeNull();
		expect(result!.minValue).toBe(-10);
		expect(result!.maxValue).toBe(10);
	});

	it('returns null with no values and no overrides', () => {
		const result = createColorScale([], { defaultColorScale: defaultScale });
		expect(result).toBeNull();
	});

	it('uses the neutral→high half of the palette for all-positive data (midpoint 0)', () => {
		// Regression: previously a midpoint outside the data range collapsed to a
		// full linear gradient, so a barely-positive value wrongly showed the
		// low-end (red) color. It should now render neutral→high only.
		const result = createColorScale([2.5, 40, 78.3], {
			colorPalette: divergingPalette,
			defaultColorScale: defaultScale,
			midpoint: 0
		});

		expect(result).not.toBeNull();
		// Only the middle→high colors are used; the low-end (red) is dropped.
		expect(result!.colorPalette).toEqual(['#ffffbf', '#1a9850']);
		expect(result!.domain).toEqual([0, 78.3]);
		// No reported midpoint (it sits at the domain edge, so no tick).
		expect(result!.midpoint).toBeNull();
		// The largest value hits the high color; the smallest is near-neutral, NOT red.
		expect(getColorForValue(78.3, result!).toLowerCase()).toBe('#1a9850');
		const smallest = getColorForValue(2.5, result!).toLowerCase();
		expect(smallest).not.toBe('#d73027');
		expect(smallest).not.toBe('#1a9850');
	});

	it('uses the low→neutral half of the palette for all-negative data (midpoint 0)', () => {
		const result = createColorScale([-78.3, -40, -2.5], {
			colorPalette: divergingPalette,
			defaultColorScale: defaultScale,
			midpoint: 0
		});

		expect(result).not.toBeNull();
		expect(result!.colorPalette).toEqual(['#d73027', '#ffffbf']);
		expect(result!.domain).toEqual([-78.3, 0]);
		expect(result!.midpoint).toBeNull();
		// The most-negative value hits the low color; the least-negative is near-neutral.
		expect(getColorForValue(-78.3, result!).toLowerCase()).toBe('#d73027');
		const leastNegative = getColorForValue(-2.5, result!).toLowerCase();
		expect(leastNegative).not.toBe('#1a9850');
		expect(leastNegative).not.toBe('#d73027');
	});

	it('anchors the neutral color at the midpoint even when it sits at min', () => {
		const result = createColorScale([0, 100], {
			colorPalette: divergingPalette,
			defaultColorScale: defaultScale,
			min: 0,
			max: 100,
			midpoint: 0
		});

		expect(result).not.toBeNull();
		expect(result!.colorPalette).toEqual(['#ffffbf', '#1a9850']);
		expect(result!.domain).toEqual([0, 100]);
		expect(result!.midpoint).toBeNull();
		// 0 (== min == midpoint) is the neutral color, 100 the high color.
		expect(getColorForValue(0, result!).toLowerCase()).toBe('#ffffbf');
		expect(getColorForValue(100, result!).toLowerCase()).toBe('#1a9850');
	});

	it('clears midpoint when palette has fewer than 3 colors', () => {
		const result = createColorScale([0, 100], {
			colorPalette: ['#000000', '#ffffff'],
			defaultColorScale: defaultScale,
			midpoint: 50
		});

		expect(result).not.toBeNull();
		expect(result!.midpoint).toBeNull();
	});

	it('pins colors to values with explicit color_stops (kind=stops)', () => {
		const result = createColorScale([], {
			defaultColorScale: defaultScale,
			colorStops: [
				{ value: 0, color: '#ffffff' },
				{ value: 100, color: '#1a9850' }
			]
		});

		expect(result).not.toBeNull();
		expect(result!.kind).toBe('stops');
		expect(result!.colorPalette).toEqual(['#ffffff', '#1a9850']);
		expect(result!.domain).toEqual([0, 100]);
		expect(result!.minValue).toBe(0);
		expect(result!.maxValue).toBe(100);
		expect(result!.midpoint).toBeNull();
		expect(getColorForValue(0, result!).toLowerCase()).toBe('#ffffff');
		expect(getColorForValue(100, result!).toLowerCase()).toBe('#1a9850');
		// Values beyond the outermost stops clamp to the end colors.
		expect(getColorForValue(-50, result!).toLowerCase()).toBe('#ffffff');
		expect(getColorForValue(9999, result!).toLowerCase()).toBe('#1a9850');
	});

	it('sorts stops and takes precedence over palette + midpoint', () => {
		const result = createColorScale([5, 50, 95], {
			colorPalette: divergingPalette,
			defaultColorScale: defaultScale,
			midpoint: 0,
			colorStops: [
				{ value: 100, color: '#1a9850' },
				{ value: 0, color: '#d73027' },
				{ value: 50, color: '#ffffbf' }
			]
		});

		expect(result).not.toBeNull();
		expect(result!.kind).toBe('stops');
		expect(result!.domain).toEqual([0, 50, 100]);
		expect(getColorForValue(0, result!).toLowerCase()).toBe('#d73027');
		expect(getColorForValue(50, result!).toLowerCase()).toBe('#ffffbf');
		expect(getColorForValue(100, result!).toLowerCase()).toBe('#1a9850');
	});

	it('drops invalid stops and collapses duplicate values', () => {
		const result = createColorScale([], {
			defaultColorScale: defaultScale,
			colorStops: [
				{ value: 0, color: '#000000' },
				{ value: 0, color: '#111111' }, // duplicate value -> collapsed (first kept)
				{ value: 50, color: 'not-a-color' }, // invalid -> dropped
				{ value: 100, color: '#ffffff' }
			]
		});

		expect(result).not.toBeNull();
		expect(result!.kind).toBe('stops');
		expect(result!.domain).toEqual([0, 100]);
		expect(result!.colorPalette).toEqual(['#000000', '#ffffff']);
	});

	it('falls back to the palette scale when fewer than 2 valid stops remain', () => {
		const result = createColorScale([0, 100], {
			colorPalette: ['#000000', '#ffffff'],
			defaultColorScale: defaultScale,
			colorStops: [{ value: 10, color: '#ff0000' }] // only one stop
		});

		expect(result).not.toBeNull();
		expect(result!.kind).toBe('linear');
		expect(result!.domain).toEqual([0, 100]);
	});

	it('keeps the midpoint reference when it lies far beyond the data range', () => {
		// midpoint 500 is above all data (0..100): everything is "below neutral",
		// so the low→neutral half is used and no value reaches the neutral color.
		const result = createColorScale([0, 100], {
			colorPalette: divergingPalette,
			defaultColorScale: defaultScale,
			min: 0,
			max: 100,
			midpoint: 500
		});

		expect(result).not.toBeNull();
		expect(result!.colorPalette).toEqual(['#d73027', '#ffffbf']);
		// Neutral (#ffffbf) is anchored at the midpoint (500), so the domain extends there.
		expect(result!.domain).toEqual([0, 500]);
		expect(result!.midpoint).toBeNull();
		expect(getColorForValue(0, result!).toLowerCase()).toBe('#d73027');
		// The largest value (100) is still well below neutral -> reddish, not neutral.
		expect(getColorForValue(100, result!).toLowerCase()).not.toBe('#ffffbf');
	});
});

describe('getColorForCategory', () => {
	const defaultPalette = ['#236aa4', '#45a1bf', '#a5cdee'];

	it('should return correct color for category', () => {
		const categories = ['hotel', 'restaurant', 'bar'];
		const result = createCategoricalColorMap(categories, {
			defaultColorPalette: defaultPalette
		});

		expect(getColorForCategory('hotel', result!)).toBe('#236aa4');
		expect(getColorForCategory('restaurant', result!)).toBe('#45a1bf');
		expect(getColorForCategory('bar', result!)).toBe('#a5cdee');
	});

	it('should return fallback color for unknown category', () => {
		const categories = ['A', 'B'];
		const result = createCategoricalColorMap(categories, {
			defaultColorPalette: defaultPalette
		});

		expect(getColorForCategory('Unknown', result!)).toBe('#236aa4'); // First palette color
		expect(getColorForCategory('Unknown', result!, '#custom')).toBe('#custom'); // Custom fallback
	});

	it('should handle null/undefined category', () => {
		const categories = ['A', 'B'];
		const result = createCategoricalColorMap(categories, {
			defaultColorPalette: defaultPalette
		});

		expect(getColorForCategory(null, result!)).toBe('#236aa4');
		expect(getColorForCategory(undefined, result!)).toBe('#236aa4');
	});

	it('should handle numeric categories', () => {
		const categories = [1, 2, 3];
		const result = createCategoricalColorMap(categories, {
			defaultColorPalette: defaultPalette
		});

		expect(getColorForCategory(1, result!)).toBe('#236aa4');
		expect(getColorForCategory(2, result!)).toBe('#45a1bf');
		expect(getColorForCategory(3, result!)).toBe('#a5cdee');
	});
});
