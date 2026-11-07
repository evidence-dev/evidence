import { afterEach, describe, expect, it } from 'vitest';
import { formatSettings, getDecimalSeparator } from './format-settings';
import { formatValue } from './formatValue';

// The store is module-global, so a test that changes it has to put it back.
afterEach(() => formatSettings.set({ decimalSeparator: '.' }));

describe('formatSettings', () => {
	it('defaults to a period', () => {
		expect(getDecimalSeparator()).toBe('.');
		expect(formatValue(1234.56, '#,##0.00')).toBe('1,234.56');
	});

	it('is what formatValue reads when no separator is passed', () => {
		formatSettings.set({ decimalSeparator: ',' });

		expect(getDecimalSeparator()).toBe(',');
		expect(formatValue(1234.56, '#,##0.00')).toBe('1.234,56');
	});

	it('yields to an explicit argument', () => {
		formatSettings.set({ decimalSeparator: ',' });

		expect(formatValue(1234.56, '#,##0.00', undefined, undefined, undefined, 'sunday', '.')).toBe(
			'1,234.56'
		);
	});
});
