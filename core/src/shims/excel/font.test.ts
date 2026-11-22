import { describe, expect, it } from 'vitest';
import {
	CALIBRI_11,
	columnWidthToPx,
	defineExcelFont,
	maxDigitWidthPx,
	measureTextPx,
	pxToColumnWidth
} from './font';

describe('Excel font metrics', () => {
	it('matches Excel’s own numbers for Calibri 11', () => {
		// Excel documents Calibri 11 as a 7px digit with 5px of column padding.
		expect(maxDigitWidthPx(CALIBRI_11)).toBe(7);
		expect(pxToColumnWidth(56, CALIBRI_11)).toBe(8.71484375);
		expect(columnWidthToPx(8.71484375, CALIBRI_11)).toBeCloseTo(56, 0);
	});

	it('covers every printable ASCII character', () => {
		expect(CALIBRI_11.regular).toHaveLength(95);
		expect(CALIBRI_11.bold).toHaveLength(95);
	});

	it('measures proportional text, bold wider than regular', () => {
		expect(measureTextPx('WWW', CALIBRI_11)).toBeGreaterThan(measureTextPx('iii', CALIBRI_11) * 3);
		expect(measureTextPx('Total', CALIBRI_11, true)).toBeGreaterThan(
			measureTextPx('Total', CALIBRI_11)
		);
		// CJK characters are a full em: 11pt at 96 DPI.
		expect(measureTextPx('中', CALIBRI_11)).toBeCloseTo(14.67, 1);
	});

	it('rejects incomplete metrics instead of skewing every width', () => {
		expect(() => defineExcelFont({ ...CALIBRI_11, regular: CALIBRI_11.regular.slice(1) })).toThrow(
			/regular/
		);
		expect(() => defineExcelFont({ ...CALIBRI_11, extra: { ab: [1, 1] } })).toThrow(/extra/);
		expect(() => defineExcelFont({ ...CALIBRI_11, lineHeight: 0 })).toThrow(/lineHeight/);
	});
});
