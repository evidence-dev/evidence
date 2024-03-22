import { describe, expect, it } from 'vitest';
import { validateOverrides } from './validateOverrides.js';

describe('validateOverrides', () => {
	it('Should return true when given no components', () => {
		expect(validateOverrides([])).toBe(true);
	});
	it('Should return true when given components with no overrides', () => {
		expect(
			validateOverrides([
				{ name: 'plugin1', options: { overrides: [] } },
				{ name: 'plugin2', options: { overrides: [] } }
			])
		).toBe(true);
	});
	it('Should return true when given components with non-conflicting overrides', () => {
		expect(
			validateOverrides([
				{ name: 'plugin1', options: { overrides: ['a'] } },
				{ name: 'plugin2', options: { overrides: ['b'] } }
			])
		).toBe(true);
	});
	it('Should throw true when given components with conflicting overrides', () => {
		expect(() =>
			validateOverrides([
				{ name: 'plugin1', options: { overrides: ['a'] } },
				{ name: 'plugin2', options: { overrides: ['a'] } }
			])
		).toThrowError();
	});
});
