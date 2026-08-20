import { describe, it, expect } from 'vitest';
import { validateDateAttributes } from './validateDateAttributes';
import type { ValidationContext } from './types';

// Simple mock helpers
const createMockTable = (columns: Record<string, { type: string; jsType?: string }>) => ({
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

describe('validateDateAttributes', () => {
	const validator = validateDateAttributes();

	describe('no validation needed scenarios', () => {
		it('should pass when no date_range or date_grain specified', () => {
			const node = createMockNode({
				data: 'test_table',
				x: 'category'
			});
			const context = createValidationContext();

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});

		it('should pass when date_range is "all time"', () => {
			const node = createMockNode({
				data: 'test_table',
				x: 'category',
				date_range: { range: 'all time' }
			});
			const context = createValidationContext();

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});

		it('should pass when metadata is loading', () => {
			const node = createMockNode({
				data: 'test_table',
				x: 'category',
				date_range: { range: 'last 30 days' }
			});
			const context = createValidationContext({ loading: true });

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});
	});

	describe('explicit date column provided', () => {
		it('should pass when date column is provided with date_range and is a date type', () => {
			const table = createMockTable({
				created_at: { type: 'DateTime', jsType: 'date' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				date: 'created_at',
				date_range: { range: 'last 30 days' }
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});

		it('should pass when date column has ::date casting even if not a date type', () => {
			const table = createMockTable({
				timestamp_col: { type: 'String', jsType: 'string' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				date: 'timestamp_col::date',
				date_range: { range: 'last 30 days' }
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});

		it('should error when date column is not a date type and has no ::date casting', () => {
			const table = createMockTable({
				timestamp_col: { type: 'String', jsType: 'string' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				date: 'timestamp_col',
				date_range: { range: 'last 30 days' }
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toHaveLength(1);
			expect(result[0].level).toBe('error');
			expect(result[0].id).toBe('invalid-date-column');
			expect(result[0].message).toContain('is not a date column');
		});

		it('should pass when date is in date_range object and is a date type', () => {
			const table = createMockTable({
				created_at: { type: 'DateTime', jsType: 'date' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				date_range: { range: 'last 30 days', date: 'created_at' }
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});

		it('should pass when date_grain has explicit date column that is a date type', () => {
			const table = createMockTable({
				created_at: { type: 'DateTime', jsType: 'date' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				date: 'created_at',
				date_grain: 'month'
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});
	});

	describe('x column as date', () => {
		it('should pass when x column is DateTime type', () => {
			const table = createMockTable({
				created_at: { type: 'DateTime', jsType: 'date' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				x: 'created_at',
				date_range: { range: 'last 30 days' }
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});

		it('should pass when x column has date in type name', () => {
			const table = createMockTable({
				event_date: { type: 'date', jsType: 'date' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				x: 'event_date',
				date_grain: 'month'
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});

		it('should pass when x column has ::date casting even if not a date type', () => {
			const table = createMockTable({
				timestamp_col: { type: 'String', jsType: 'string' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				x: 'timestamp_col::date',
				date_range: { range: 'last 30 days' }
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});

		it('should error when x column is not a date type and has no ::date casting', () => {
			const table = createMockTable({
				timestamp_col: { type: 'String', jsType: 'string' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				x: 'timestamp_col',
				date_range: { range: 'last 30 days' }
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toHaveLength(1);
			expect(result[0].level).toBe('error');
			expect(result[0].id).toBe('invalid-date-column');
			expect(result[0].message).toContain('is not a date column');
		});
	});

	describe('error scenarios', () => {
		it('should error when date_range needs validation but no date column', () => {
			const node = createMockNode({
				data: 'test_table',
				date_range: { range: 'last 30 days' }
			});
			const context = createValidationContext();

			const result = validator(node, {}, context);
			expect(result).toHaveLength(1);
			expect(result[0].level).toBe('error');
			expect(result[0].id).toBe('missing-date-in-date-range');
		});

		it('should error when date_grain specified but no date column', () => {
			const node = createMockNode({
				data: 'test_table',
				date_grain: 'month'
			});
			const context = createValidationContext();

			const result = validator(node, {}, context);
			expect(result).toHaveLength(1);
			expect(result[0].level).toBe('error');
			expect(result[0].id).toBe('missing-date-specification');
		});

		it('should error when x column is not a date type', () => {
			const table = createMockTable({
				category: { type: 'String', jsType: 'string' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				x: 'category',
				date_range: { range: 'last 30 days' }
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toHaveLength(1);
			expect(result[0].level).toBe('error');
			expect(result[0].id).toBe('invalid-date-column');
		});
	});

	describe('range calendar scenarios', () => {
		it('should not validate range_calendar components', () => {
			const node = createMockNode({
				id: 'date_filter',
				default_range: 'last 30 days'
			});
			const context = createValidationContext();

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});

		it('should not error when using all time', () => {
			const table = createMockTable({
				category: { type: 'String' }
			});
			const metadata = createMockMetadata({
				test_table: table
			});
			const node = createMockNode({
				data: 'test_table',
				x: 'category',
				date_range: { range: 'all time' }
			});
			const context = createValidationContext(metadata);

			const result = validator(node, {}, context);
			expect(result).toEqual([]);
		});
	});
});
