import { describe, expect, it } from 'vitest';
import { validateValueAxisType } from './validateValueAxisType';
import type { ValidationContext } from './types';

const createMockTable = (columns: Record<string, { jsType?: string }>) => ({
	getColumn: (name: string) => columns[name] || undefined
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockMetadata = (tables: Record<string, unknown> = {}): any => ({
	loading: false,
	getTable: (name: string) => tables[name] || undefined
});

const createValidationContext = (metadata?: unknown): ValidationContext => ({
	metadata: metadata || createMockMetadata(),
	filters: undefined,
	inlineQueries: undefined,
	inlineQueryMetadata: undefined,
	trees: undefined
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockNode = (attributes: Record<string, unknown>): any => ({
	attributes,
	location: { start: { line: 1, character: 1 }, end: { line: 1, character: 10 } }
});

describe('validateValueAxisType', () => {
	it('passes when value axis points to numeric column', () => {
		const validator = validateValueAxisType('x');
		const node = createMockNode({
			data: 'test_table',
			x: 'revenue'
		});
		const context = createValidationContext(
			createMockMetadata({
				test_table: createMockTable({
					revenue: { jsType: 'number' }
				})
			})
		);

		expect(validator(node, {}, context)).toEqual([]);
	});

	it('errors when value axis points to string column', () => {
		const validator = validateValueAxisType('x');
		const node = createMockNode({
			data: 'test_table',
			x: 'category'
		});
		const context = createValidationContext(
			createMockMetadata({
				test_table: createMockTable({
					category: { jsType: 'string' }
				})
			})
		);

		const result = validator(node, {}, context);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('invalid-value-axis-type');
		expect(result[0].level).toBe('error');
		expect(result[0].message).toContain('"category" must resolve to a numeric value');
	});

	it('adds swapped-axis hint when category axis appears numeric', () => {
		const validator = validateValueAxisType('x', {
			categoryAxisAttribute: 'y',
			swappedAxesChartSuggestion: 'bar_chart'
		});
		const node = createMockNode({
			data: 'test_table',
			x: 'category',
			y: 'revenue'
		});
		const context = createValidationContext(
			createMockMetadata({
				test_table: createMockTable({
					category: { jsType: 'string' },
					revenue: { jsType: 'number' }
				})
			})
		);

		const result = validator(node, {}, context);
		expect(result).toHaveLength(1);
		expect(result[0].message).toContain('axes are reversed');
		expect(result[0].message).toContain('`bar_chart`');
	});

	it('skips validation for aggregated expressions', () => {
		const validator = validateValueAxisType('x');
		const node = createMockNode({
			data: 'test_table',
			x: 'sum(revenue)'
		});
		const context = createValidationContext(
			createMockMetadata({
				test_table: createMockTable({
					revenue: { jsType: 'number' }
				})
			})
		);

		expect(validator(node, {}, context)).toEqual([]);
	});

	it('skips validation when column type is unknown', () => {
		const validator = validateValueAxisType('x');
		const node = createMockNode({
			data: 'test_table',
			x: 'mystery_value'
		});
		const context = createValidationContext(
			createMockMetadata({
				test_table: createMockTable({
					mystery_value: { jsType: 'unknown' }
				})
			})
		);

		expect(validator(node, {}, context)).toEqual([]);
	});

	it('skips validation for non-simple expressions', () => {
		const validator = validateValueAxisType('x');
		const node = createMockNode({
			data: 'test_table',
			x: 'quantity * unit_price'
		});
		const context = createValidationContext(
			createMockMetadata({
				test_table: createMockTable({
					quantity: { jsType: 'number' },
					unit_price: { jsType: 'number' }
				})
			})
		);

		expect(validator(node, {}, context)).toEqual([]);
	});
});
