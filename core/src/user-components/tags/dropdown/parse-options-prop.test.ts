import { describe, expect, it } from 'vitest';
import { parseOptionsProp } from './parse-options-prop';

describe('parseOptionsProp', () => {
	it('parses numeric primitive options as string values', () => {
		const parsed = parseOptionsProp([1, 2, '3']);

		expect(parsed).toHaveLength(3);
		expect(parsed.map((option) => option.value)).toEqual(['1', '2', '3']);
	});

	it('parses object options with numeric value and optional label', () => {
		const parsed = parseOptionsProp([
			{ value: 1, label: 'One' },
			{ value: 2 },
			{ value: '3', label: 'Three' }
		]);

		expect(parsed).toHaveLength(3);
		expect(parsed).toMatchObject([
			{ value: '1', label: 'One' },
			{ value: '2' },
			{ value: '3', label: 'Three' }
		]);
	});
});
