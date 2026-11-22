import { describe, expect, it } from 'vitest';
import { convertSingleQuotesToDouble, FORMAT_PRESETS } from '../../user-components/formatValue';
import { isValidExcelNumFmt } from './num-fmt';
import { toExcelCell } from './cell-value';

describe('isValidExcelNumFmt', () => {
	it('accepts every built-in preset', () => {
		const rejected = Object.entries(FORMAT_PRESETS).filter(
			([, code]) => !isValidExcelNumFmt(convertSingleQuotesToDouble(code))
		);
		expect(rejected).toEqual([]);
	});

	// Each case was opened in Excel for Mac: accepted codes open cleanly, rejected ones prompt a repair.
	it('matches what Excel opens without a repair prompt', () => {
		for (const code of [
			'$#,##0.00',
			'#,##0.0" units"',
			'€#,##0.00',
			'£#,##0.00',
			'₹#,##0.00',
			'General'
		]) {
			expect(isValidExcelNumFmt(code), code).toBe(true);
		}
		for (const code of ['usd2x', '[Purple]0.0', '0@', '0;0;0;0;0', '0.0" units']) {
			expect(isValidExcelNumFmt(code), code).toBe(false);
		}
	});

	it('accepts conditions, colors, elapsed time and fractions', () => {
		for (const code of [
			'[Red][<0]-0;[Blue]0',
			'[h]:mm:ss',
			'# ??/16',
			'[$€-407] #,##0',
			'yyyy-mm-dd hh:mm AM/PM'
		]) {
			expect(isValidExcelNumFmt(code), code).toBe(true);
		}
	});
});

it('keeps a number with an invalid custom format, in General', () => {
	expect(toExcelCell(1234.5, { fmt: 'usd2x', columnType: 'number' })).toMatchObject({
		value: 1234.5,
		numFmt: 'General'
	});
});
