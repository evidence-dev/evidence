import { describe, it, expect } from 'vitest';
import { schema } from './schema';

describe('LanguageSelector Tag', () => {
	it('has valid schema attributes', () => {
		expect(schema.render).toBe('language_selector');
		expect(schema.category).toBe('input');
		expect(schema.attributes.title).toBeDefined();
		expect(schema.attributes.locales).toBeDefined();
		expect(schema.attributes.variant).toBeDefined();
		expect(schema.attributes.size).toBeDefined();
	});
});
