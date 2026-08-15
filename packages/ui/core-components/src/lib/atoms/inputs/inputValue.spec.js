import { describe, it, expect } from 'vitest';
import { inputValuesMatch, normalizeInputValue } from './inputValue.js';

describe('inputValuesMatch', () => {
	it('matches a markdown string default against a numeric query value', () => {
		// The regression this whole fix exists for: defaultValue=2026 in markdown
		// vs. the number 2026 coming out of the query.
		expect(inputValuesMatch('2026', 2026)).toBe(true);
		expect(inputValuesMatch(2026, '2026')).toBe(true);
	});

	it('matches bigints', () => {
		expect(inputValuesMatch('2026', 2026n)).toBe(true);
		expect(inputValuesMatch(2026n, 2026)).toBe(true);
	});

	it('matches booleans written as strings', () => {
		expect(inputValuesMatch('true', true)).toBe(true);
		expect(inputValuesMatch('false', false)).toBe(true);
		expect(inputValuesMatch('true', false)).toBe(false);
	});

	it('matches dates against their string representation', () => {
		const d = new Date('2026-01-01T00:00:00.000Z');
		expect(inputValuesMatch('2026-01-01', d)).toBe(true);
		expect(inputValuesMatch(d, '2026-01-01T00:00:00.000Z')).toBe(true);
		expect(inputValuesMatch('2026-01-02', d)).toBe(false);
		expect(inputValuesMatch('not a date', d)).toBe(false);
	});

	it('does not match different values', () => {
		expect(inputValuesMatch('2026', 2025)).toBe(false);
		expect(inputValuesMatch('veghel', 'heuts')).toBe(false);
	});

	it('treats null/undefined as matching only themselves', () => {
		expect(inputValuesMatch(null, null)).toBe(true);
		expect(inputValuesMatch(undefined, undefined)).toBe(true);
		expect(inputValuesMatch(null, undefined)).toBe(false);
		// crucially: an unset value must not match "" or 0
		expect(inputValuesMatch(null, '')).toBe(false);
		expect(inputValuesMatch(undefined, 0)).toBe(false);
		expect(inputValuesMatch(null, 'null')).toBe(false);
	});

	it('does not coerce 0 / "" into each other', () => {
		expect(inputValuesMatch(0, '')).toBe(false);
		expect(inputValuesMatch(0, '0')).toBe(true);
		expect(inputValuesMatch(false, 0)).toBe(false);
	});
});

describe('normalizeInputValue', () => {
	it('stringifies by value', () => {
		expect(normalizeInputValue(2026)).toBe('2026');
		expect(normalizeInputValue(2026n)).toBe('2026');
		expect(normalizeInputValue(true)).toBe('true');
		expect(normalizeInputValue('x')).toBe('x');
	});
});
