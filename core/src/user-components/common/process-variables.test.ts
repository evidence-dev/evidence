import { describe, it, expect, vi } from 'vitest';
import { processVariables, coerceBoolean, coerceNumber } from './process-variables';
import type { VariableProcessor } from '../../filter-variables/VariableProcessor';

/**
 * Tests for the processVariables function.
 *
 * This function is the core utility for interpolating filter variables in component props.
 * It handles strings, objects, arrays, and type coercion.
 *
 * Key behaviors:
 * - Returns value unchanged if no processor is provided
 * - Processes strings using the processor's processString method
 * - Recursively processes nested objects and arrays
 * - Supports type coercion for booleans and numbers
 * - Passes through non-string primitives unchanged
 */

// Helper to create a mock VariableProcessor
function createMockProcessor(
	processStringFn: (value: string, context: string) => string
): VariableProcessor {
	return {
		processString: vi.fn(processStringFn),
		validateString: vi.fn(() => [])
	} as unknown as VariableProcessor;
}

describe('processVariables', () => {
	describe('when no processor is provided', () => {
		it('returns strings unchanged', () => {
			const result = processVariables('{{filter}}', null, 'text');
			expect(result).toBe('{{filter}}');
		});

		it('returns objects unchanged', () => {
			const obj = { a: '{{filter}}', b: 123 };
			const result = processVariables(obj, undefined, 'text');
			expect(result).toEqual(obj);
		});

		it('returns arrays unchanged', () => {
			const arr = ['{{filter}}', 'plain text'];
			const result = processVariables(arr, null, 'text');
			expect(result).toEqual(arr);
		});

		it('returns primitives unchanged', () => {
			expect(processVariables(42, null, 'text')).toBe(42);
			expect(processVariables(true, null, 'text')).toBe(true);
			expect(processVariables(null, null, 'text')).toBe(null);
			expect(processVariables(undefined, null, 'text')).toBe(undefined);
		});
	});

	describe('string processing', () => {
		it('processes strings with variables', () => {
			const processor = createMockProcessor((value) =>
				value.replace('{{category}}', 'Electronics')
			);

			const result = processVariables('Category: {{category}}', processor, 'text');
			expect(result).toBe('Category: Electronics');
		});

		it('passes context to processString', () => {
			const processor = createMockProcessor((value, context) => `${value}[${context}]`);

			processVariables('test', processor, 'sql');
			expect(processor.processString).toHaveBeenCalledWith('test', 'sql');

			processVariables('test', processor, 'text');
			expect(processor.processString).toHaveBeenCalledWith('test', 'text');

			processVariables('test', processor, 'column');
			expect(processor.processString).toHaveBeenCalledWith('test', 'column');
		});

		it('defaults to text context when not specified', () => {
			const processor = createMockProcessor((value, context) => `${value}[${context}]`);

			processVariables('test', processor);
			expect(processor.processString).toHaveBeenCalledWith('test', 'text');
		});

		it('returns processed string unchanged when no variables present', () => {
			const processor = createMockProcessor((value) => value);

			const result = processVariables('plain text', processor, 'text');
			expect(result).toBe('plain text');
		});
	});

	describe('type coercion', () => {
		const processor = createMockProcessor((value) => {
			if (value === '{{bool_true}}') return 'true';
			if (value === '{{bool_false}}') return 'false';
			if (value === '{{number}}') return '42';
			if (value === '{{float}}') return '3.14';
			if (value === '{{string}}') return 'hello';
			if (value === '{{empty}}') return '';
			if (value === '{{spaces}}') return '   ';
			return value;
		});

		describe('boolean coercion', () => {
			it('coerces "true" string to boolean true', () => {
				const result = processVariables('{{bool_true}}', processor, 'text', { coerce: 'boolean' });
				expect(result).toBe(true);
			});

			it('coerces "false" string to boolean false', () => {
				const result = processVariables('{{bool_false}}', processor, 'text', {
					coerce: 'boolean'
				});
				expect(result).toBe(false);
			});

			it('returns non-boolean strings as-is', () => {
				const result = processVariables('{{string}}', processor, 'text', { coerce: 'boolean' });
				expect(result).toBe('hello');
			});
		});

		describe('number coercion', () => {
			it('coerces integer strings to numbers', () => {
				const result = processVariables('{{number}}', processor, 'text', { coerce: 'number' });
				expect(result).toBe(42);
			});

			it('coerces float strings to numbers', () => {
				const result = processVariables('{{float}}', processor, 'text', { coerce: 'number' });
				expect(result).toBe(3.14);
			});

			it('returns non-numeric strings as-is', () => {
				const result = processVariables('{{string}}', processor, 'text', { coerce: 'number' });
				expect(result).toBe('hello');
			});

			it('returns empty strings as-is', () => {
				const result = processVariables('{{empty}}', processor, 'text', { coerce: 'number' });
				expect(result).toBe('');
			});

			it('returns whitespace-only strings as-is', () => {
				const result = processVariables('{{spaces}}', processor, 'text', { coerce: 'number' });
				expect(result).toBe('   ');
			});
		});

		describe('auto coercion', () => {
			it('auto-detects boolean true', () => {
				const result = processVariables('{{bool_true}}', processor, 'text', { coerce: 'auto' });
				expect(result).toBe(true);
			});

			it('auto-detects boolean false', () => {
				const result = processVariables('{{bool_false}}', processor, 'text', { coerce: 'auto' });
				expect(result).toBe(false);
			});

			it('auto-detects numbers', () => {
				const result = processVariables('{{number}}', processor, 'text', { coerce: 'auto' });
				expect(result).toBe(42);
			});

			it('leaves regular strings as strings', () => {
				const result = processVariables('{{string}}', processor, 'text', { coerce: 'auto' });
				expect(result).toBe('hello');
			});
		});

		describe('no coercion (string)', () => {
			it('leaves boolean strings as strings', () => {
				const result = processVariables('{{bool_true}}', processor, 'text', { coerce: 'string' });
				expect(result).toBe('true');
			});

			it('leaves number strings as strings', () => {
				const result = processVariables('{{number}}', processor, 'text', { coerce: 'string' });
				expect(result).toBe('42');
			});
		});
	});

	describe('object processing (recursive)', () => {
		it('processes all string values in flat objects', () => {
			const processor = createMockProcessor((value) => value.replace('{{filter}}', 'resolved'));

			const result = processVariables(
				{
					title: '{{filter}}',
					count: 5,
					enabled: true
				},
				processor,
				'text'
			);

			expect(result).toEqual({
				title: 'resolved',
				count: 5,
				enabled: true
			});
		});

		it('processes deeply nested objects', () => {
			const processor = createMockProcessor((value) => value.replace('{{filter}}', 'resolved'));

			const result = processVariables(
				{
					level1: {
						level2: {
							level3: {
								value: '{{filter}}'
							}
						}
					}
				},
				processor,
				'text'
			);

			expect(result).toEqual({
				level1: {
					level2: {
						level3: {
							value: 'resolved'
						}
					}
				}
			});
		});

		it('preserves object structure with mixed types', () => {
			const processor = createMockProcessor((value) => value.replace('{{x}}', 'X'));

			const result = processVariables(
				{
					str: '{{x}}',
					num: 42,
					bool: false,
					nil: null,
					nested: {
						str2: 'prefix {{x}} suffix',
						arr: [1, 2, 3]
					}
				},
				processor,
				'text'
			);

			expect(result).toEqual({
				str: 'X',
				num: 42,
				bool: false,
				nil: null,
				nested: {
					str2: 'prefix X suffix',
					arr: [1, 2, 3]
				}
			});
		});
	});

	describe('array processing (recursive)', () => {
		it('processes string elements in arrays', () => {
			const processor = createMockProcessor((value) => value.replace('{{filter}}', 'resolved'));

			const result = processVariables(['{{filter}}', 'plain', '{{filter}}'], processor, 'text');

			expect(result).toEqual(['resolved', 'plain', 'resolved']);
		});

		it('processes objects within arrays', () => {
			const processor = createMockProcessor((value) => value.replace('{{filter}}', 'resolved'));

			const result = processVariables(
				[{ name: '{{filter}}' }, { name: 'static' }],
				processor,
				'text'
			);

			expect(result).toEqual([{ name: 'resolved' }, { name: 'static' }]);
		});

		it('processes nested arrays', () => {
			const processor = createMockProcessor((value) => value.replace('{{x}}', 'X'));

			const result = processVariables([['{{x}}', '{{x}}'], ['plain']], processor, 'text');

			expect(result).toEqual([['X', 'X'], ['plain']]);
		});
	});

	describe('real-world scenarios', () => {
		it('processes date_range object for charts', () => {
			const processor = createMockProcessor((value) => {
				if (value === '{{date_filter}}') return 'last 30 days';
				if (value === '{{date_column}}') return 'order_date';
				return value;
			});

			const result = processVariables(
				{
					range: '{{date_filter}}',
					date: '{{date_column}}'
				},
				processor,
				'text'
			);

			expect(result).toEqual({
				range: 'last 30 days',
				date: 'order_date'
			});
		});

		it('processes comparison object for BigValue', () => {
			const processor = createMockProcessor((value) => {
				if (value === '{{compare_type}}') return 'previous_period';
				if (value === '{{target_value}}') return '100';
				return value;
			});

			const result = processVariables(
				{
					compare_vs: '{{compare_type}}',
					target: '{{target_value}}',
					down_is_good: true,
					abs_fmt: 'num0'
				},
				processor,
				'text'
			);

			expect(result).toEqual({
				compare_vs: 'previous_period',
				target: '100',
				down_is_good: true,
				abs_fmt: 'num0'
			});
		});

		it('processes chart options with nested color palette', () => {
			const processor = createMockProcessor((value) => {
				if (value === '{{primary_color}}') return '#FF0000';
				return value;
			});

			const result = processVariables(
				{
					chart_options: {
						color_palette: ['{{primary_color}}', '#00FF00', '#0000FF'],
						show_legend: true
					}
				},
				processor,
				'text'
			);

			expect(result).toEqual({
				chart_options: {
					color_palette: ['#FF0000', '#00FF00', '#0000FF'],
					show_legend: true
				}
			});
		});
	});

	describe('edge cases', () => {
		it('handles empty objects', () => {
			const processor = createMockProcessor((value) => value);
			const result = processVariables({}, processor, 'text');
			expect(result).toEqual({});
		});

		it('handles empty arrays', () => {
			const processor = createMockProcessor((value) => value);
			const result = processVariables([], processor, 'text');
			expect(result).toEqual([]);
		});

		it('handles empty strings', () => {
			const processor = createMockProcessor((value) => value);
			const result = processVariables('', processor, 'text');
			expect(result).toBe('');
		});

		it('handles objects with undefined values', () => {
			const processor = createMockProcessor((value) => value);
			const result = processVariables({ a: undefined, b: 'test' }, processor, 'text');
			expect(result).toEqual({ a: undefined, b: 'test' });
		});

		it('handles objects with null values', () => {
			const processor = createMockProcessor((value) => value);
			const result = processVariables({ a: null, b: 'test' }, processor, 'text');
			expect(result).toEqual({ a: null, b: 'test' });
		});

		it('preserves type for non-string values', () => {
			const processor = createMockProcessor((value) => value);

			// Numbers should stay numbers
			const numResult = processVariables(42, processor, 'text');
			expect(typeof numResult).toBe('number');

			// Booleans should stay booleans
			const boolResult = processVariables(true, processor, 'text');
			expect(typeof boolResult).toBe('boolean');
		});
	});
});

/**
 * Tests for coerceBoolean helper.
 *
 * This helper is used to coerce boolean/string values from nested objects
 * (Zod schemas) after variable interpolation. Variable interpolation returns
 * strings like "true"/"false" which need to be converted to actual booleans.
 */
describe('coerceBoolean', () => {
	describe('boolean inputs', () => {
		it('returns true for boolean true', () => {
			expect(coerceBoolean(true)).toBe(true);
		});

		it('returns false for boolean false', () => {
			expect(coerceBoolean(false)).toBe(false);
		});
	});

	describe('string inputs', () => {
		it('coerces "true" to boolean true', () => {
			expect(coerceBoolean('true')).toBe(true);
		});

		it('coerces "false" to boolean false', () => {
			expect(coerceBoolean('false')).toBe(false);
		});

		it('returns undefined for other strings', () => {
			expect(coerceBoolean('yes')).toBeUndefined();
			expect(coerceBoolean('no')).toBeUndefined();
			expect(coerceBoolean('1')).toBeUndefined();
			expect(coerceBoolean('0')).toBeUndefined();
			expect(coerceBoolean('')).toBeUndefined();
			expect(coerceBoolean('hello')).toBeUndefined();
		});
	});

	describe('other inputs', () => {
		it('returns undefined for undefined', () => {
			expect(coerceBoolean(undefined)).toBeUndefined();
		});

		it('returns undefined for null', () => {
			expect(coerceBoolean(null)).toBeUndefined();
		});

		it('returns undefined for numbers', () => {
			expect(coerceBoolean(0)).toBeUndefined();
			expect(coerceBoolean(1)).toBeUndefined();
			expect(coerceBoolean(42)).toBeUndefined();
		});

		it('returns undefined for objects', () => {
			expect(coerceBoolean({})).toBeUndefined();
			expect(coerceBoolean([])).toBeUndefined();
		});
	});

	describe('usage pattern with nullish coalescing', () => {
		it('works with ?? for default values', () => {
			expect(coerceBoolean('true') ?? false).toBe(true);
			expect(coerceBoolean('false') ?? true).toBe(false);
			expect(coerceBoolean('invalid') ?? true).toBe(true);
			expect(coerceBoolean(undefined) ?? false).toBe(false);
		});
	});
});

/**
 * Tests for coerceNumber helper.
 *
 * This helper is used to coerce number/string values from nested objects
 * (Zod schemas) after variable interpolation. Variable interpolation returns
 * strings like "42" which need to be converted to actual numbers.
 */
describe('coerceNumber', () => {
	describe('number inputs', () => {
		it('returns the number for integer inputs', () => {
			expect(coerceNumber(42)).toBe(42);
			expect(coerceNumber(0)).toBe(0);
			expect(coerceNumber(-10)).toBe(-10);
		});

		it('returns the number for float inputs', () => {
			expect(coerceNumber(3.14)).toBe(3.14);
			expect(coerceNumber(-0.5)).toBe(-0.5);
		});
	});

	describe('string inputs', () => {
		it('coerces integer strings to numbers', () => {
			expect(coerceNumber('42')).toBe(42);
			expect(coerceNumber('0')).toBe(0);
			expect(coerceNumber('-10')).toBe(-10);
		});

		it('coerces float strings to numbers', () => {
			expect(coerceNumber('3.14')).toBe(3.14);
			expect(coerceNumber('-0.5')).toBe(-0.5);
		});

		it('handles strings with whitespace', () => {
			expect(coerceNumber(' 42 ')).toBe(42);
			expect(coerceNumber('  3.14  ')).toBe(3.14);
		});

		it('returns undefined for non-numeric strings', () => {
			expect(coerceNumber('hello')).toBeUndefined();
			expect(coerceNumber('42abc')).toBeUndefined();
			expect(coerceNumber('abc42')).toBeUndefined();
		});

		it('returns undefined for empty strings', () => {
			expect(coerceNumber('')).toBeUndefined();
		});

		it('returns undefined for whitespace-only strings', () => {
			expect(coerceNumber('   ')).toBeUndefined();
		});
	});

	describe('other inputs', () => {
		it('returns undefined for undefined', () => {
			expect(coerceNumber(undefined)).toBeUndefined();
		});

		it('returns undefined for null', () => {
			expect(coerceNumber(null)).toBeUndefined();
		});

		it('returns undefined for booleans', () => {
			expect(coerceNumber(true)).toBeUndefined();
			expect(coerceNumber(false)).toBeUndefined();
		});

		it('returns undefined for objects', () => {
			expect(coerceNumber({})).toBeUndefined();
			expect(coerceNumber([])).toBeUndefined();
		});
	});

	describe('usage pattern with nullish coalescing', () => {
		it('works with ?? for default values', () => {
			expect(coerceNumber('42') ?? 0).toBe(42);
			expect(coerceNumber('invalid') ?? 100).toBe(100);
			expect(coerceNumber(undefined) ?? 50).toBe(50);
		});
	});
});
