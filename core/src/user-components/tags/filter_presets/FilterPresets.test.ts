import { describe, it, expect } from 'vitest';
import { schema } from './schema';

describe('FilterPresets tag', () => {
	it('has valid schema attributes', () => {
		expect(schema.render).toBe('filter_presets');
		expect(schema.attributes.presets).toBeDefined();
		expect(schema.attributes.presets.required).toBe(true);
		expect(schema.attributes.title).toBeDefined();
		expect(schema.attributes.default_preset).toBeDefined();
		expect(schema.attributes.variant).toBeDefined();
		expect(schema.attributes.size).toBeDefined();
		expect(schema.attributes.align).toBeDefined();
	});
});
