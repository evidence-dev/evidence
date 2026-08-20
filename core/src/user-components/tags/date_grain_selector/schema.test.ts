import { describe, it, expect } from 'vitest';
import { schema } from './schema';

const validate = (attributes: Record<string, unknown>) =>
	schema.validate({ attributes, location: undefined } as never, {} as never, {} as never);

describe('date_grain_selector schema.validate', () => {
	it('accepts preset_values that are all real grains', () => {
		expect(validate({ preset_values: ['day', 'week', 'month'] })).toEqual([]);
	});

	// The filter only emits a grain it recognizes, so an unknown one is dropped from the
	// dropdown; without this the option just goes missing with no explanation.
	it('warns about a preset value that is not a date grain', () => {
		const errors = validate({ preset_values: ['month', 'fiscal_quarter'] });
		expect(errors).toHaveLength(1);
		expect(errors[0].level).toBe('warning');
		expect(errors[0].message).toContain('fiscal_quarter');
	});

	it('names every unknown preset value in one warning', () => {
		const errors = validate({ preset_values: ['nope', 'month', 'also_nope'] });
		expect(errors).toHaveLength(1);
		expect(errors[0].message).toContain('nope');
		expect(errors[0].message).toContain('also_nope');
	});

	// preset_values supports variables, so a value that isn't resolved yet must not be flagged.
	it('does not flag a preset value that is a variable', () => {
		expect(validate({ preset_values: ['{{ my_grain }}', 'month'] })).toEqual([]);
	});

	it('still flags a default_value that is missing from preset_values', () => {
		const errors = validate({ default_value: 'year', preset_values: ['day', 'month'] });
		expect(errors).toHaveLength(1);
		expect(errors[0].level).toBe('error');
	});
});
