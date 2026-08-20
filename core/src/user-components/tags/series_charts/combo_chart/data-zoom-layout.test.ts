import { describe, it, expect } from 'vitest';
import { hasBottomSliderDataZoom, authorPinnedGridBottom } from './data-zoom-layout';

describe('hasBottomSliderDataZoom', () => {
	it('is false without echarts_options or dataZoom', () => {
		expect(hasBottomSliderDataZoom(undefined)).toBe(false);
		expect(hasBottomSliderDataZoom({})).toBe(false);
		expect(hasBottomSliderDataZoom({ grid: { bottom: 70 } })).toBe(false);
	});

	it('detects an explicit bottom slider (array or object form)', () => {
		expect(hasBottomSliderDataZoom({ dataZoom: [{ type: 'slider' }] })).toBe(true);
		expect(hasBottomSliderDataZoom({ dataZoom: { type: 'slider' } })).toBe(true);
		expect(hasBottomSliderDataZoom({ dataZoom: [{ type: 'slider', bottom: 6 }] })).toBe(true);
	});

	it('treats a missing type as a slider (ECharts default)', () => {
		expect(hasBottomSliderDataZoom({ dataZoom: [{}] })).toBe(true);
	});

	it('ignores inside dataZoom (no visual footprint)', () => {
		expect(hasBottomSliderDataZoom({ dataZoom: [{ type: 'inside' }] })).toBe(false);
	});

	it('ignores sliders that do not sit in the bottom footer', () => {
		// Pinned to the top.
		expect(hasBottomSliderDataZoom({ dataZoom: [{ type: 'slider', top: 10 }] })).toBe(false);
		// Explicitly vertical.
		expect(hasBottomSliderDataZoom({ dataZoom: [{ type: 'slider', orient: 'vertical' }] })).toBe(
			false
		);
		// y-only zoom defaults to vertical (side gutter, not the bottom).
		expect(hasBottomSliderDataZoom({ dataZoom: [{ type: 'slider', yAxisIndex: 0 }] })).toBe(false);
	});

	it('counts a slider bound to the x-axis even if it also lists a y-axis', () => {
		expect(
			hasBottomSliderDataZoom({ dataZoom: [{ type: 'slider', xAxisIndex: 0, yAxisIndex: 0 }] })
		).toBe(true);
	});

	it('detects a bottom slider mixed in with an inside zoom', () => {
		expect(hasBottomSliderDataZoom({ dataZoom: [{ type: 'inside' }, { type: 'slider' }] })).toBe(
			true
		);
	});
});

describe('authorPinnedGridBottom', () => {
	it('is false without a grid bottom', () => {
		expect(authorPinnedGridBottom(undefined)).toBe(false);
		expect(authorPinnedGridBottom({})).toBe(false);
		expect(authorPinnedGridBottom({ grid: {} })).toBe(false);
		expect(authorPinnedGridBottom({ grid: { right: 60 } })).toBe(false);
	});

	it('detects a pinned grid.bottom (array or object form, including 0)', () => {
		expect(authorPinnedGridBottom({ grid: { bottom: 70 } })).toBe(true);
		expect(authorPinnedGridBottom({ grid: { bottom: 0 } })).toBe(true);
		expect(authorPinnedGridBottom({ grid: [{ bottom: 70 }] })).toBe(true);
	});
});
