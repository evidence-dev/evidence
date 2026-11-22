import { describe, expect, it } from 'vitest';
import { resolveExcelPalette, toExcelRgb } from './palette';

describe('toExcelRgb', () => {
	it('converts CSS colors to the RRGGBB form Excel stores', () => {
		expect(toExcelRgb('#60a5fa')).toBe('60A5FA');
		expect(toExcelRgb('rgb(220 38 38)')).toBe('DC2626');
	});

	it('blends translucent colors over the white sheet rather than turning them black', () => {
		expect(toExcelRgb('transparent')).toBe('FFFFFF');
		expect(toExcelRgb('rgba(0, 0, 0, 0.5)')).toBe('808080');
	});

	it('leaves colors it cannot read unset', () => {
		expect(toExcelRgb('var(--theme-negative)')).toBeUndefined();
		expect(toExcelRgb(undefined)).toBeUndefined();
	});
});

describe('resolveExcelPalette', () => {
	it('uses the light theme’s table colors', () => {
		const palette = resolveExcelPalette();
		expect(toExcelRgb(palette.background)).toBe('FFFFFF');
		expect(palette.colorScale.length).toBeGreaterThanOrEqual(2);
		expect(toExcelRgb(palette.negative)).toBeDefined();
	});
});
