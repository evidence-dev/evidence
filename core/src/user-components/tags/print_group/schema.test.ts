import { describe, it, expect } from 'vitest';
import { schema } from './schema';

const validate = (attributes: Record<string, unknown>) =>
	schema.validate({ attributes, location: undefined } as never);

describe('print_group schema.validate', () => {
	it('rejects hide and print_only together, since the content would never show', () => {
		const errors = validate({ hide: true, print_only: true });
		expect(errors).toHaveLength(1);
		expect(errors[0].level).toBe('error');
	});

	it('accepts print_only on its own', () => {
		expect(validate({ print_only: true })).toEqual([]);
	});

	it('accepts hide on its own', () => {
		expect(validate({ hide: true })).toEqual([]);
	});

	it('does not flag variable values that resolve at runtime', () => {
		expect(validate({ hide: '{{ is_draft }}', print_only: true })).toEqual([]);
	});
});
