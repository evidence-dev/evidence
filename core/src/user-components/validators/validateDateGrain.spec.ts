import { describe, it, expect } from 'vitest';
import { validateDateGrain } from './validateDateGrain';
import type { ValidationContext } from './types';

const createMockTable = (columns: Record<string, { type: string; jsType?: string }>) => ({
	getColumn: (name: string) => columns[name] || undefined
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockMetadata = (tables: Record<string, unknown> = {}): any => ({
	loading: false,
	tables: [],
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

const ordersContext = () =>
	createValidationContext(
		createMockMetadata({
			orders: createMockTable({
				order_date: { type: 'Date', jsType: 'date' },
				category: { type: 'String', jsType: 'string' }
			})
		})
	);

describe('validateDateGrain', () => {
	const validator = validateDateGrain();

	it('passes when date_grain is not set', () => {
		const node = createMockNode({ data: 'orders', x: 'category' });
		expect(validator(node, {}, ordersContext())).toEqual([]);
	});

	it('ignores date_range without a date column', () => {
		const node = createMockNode({
			data: 'orders',
			x: 'category',
			date_range: { range: 'last 30 days' }
		});
		expect(validator(node, {}, ordersContext())).toEqual([]);
	});

	it('passes when x is a date column', () => {
		const node = createMockNode({ data: 'orders', x: 'order_date', date_grain: 'month' });
		expect(validator(node, {}, ordersContext())).toEqual([]);
	});

	it('passes when x is cast with ::date', () => {
		const node = createMockNode({ data: 'orders', x: 'category::date', date_grain: 'month' });
		expect(validator(node, {}, ordersContext())).toEqual([]);
	});

	it('errors when x is not a date column', () => {
		const node = createMockNode({ data: 'orders', x: 'category', date_grain: 'month' });
		const result = validator(node, {}, ordersContext());
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('invalid-date-grain-column');
		expect(result[0].message).not.toContain("'date' attribute");
	});

	it('errors when there is no x to bucket', () => {
		const node = createMockNode({ data: 'orders', date_grain: 'month' });
		const result = validator(node, {}, ordersContext());
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('missing-date-grain-column');
	});

	it('passes when the table has no metadata to check against', () => {
		const node = createMockNode({ data: 'unknown_table', x: 'date', date_grain: 'month' });
		expect(validator(node, {}, createValidationContext())).toEqual([]);
	});

	it('skips variable column references', () => {
		const node = createMockNode({ data: 'orders', x: '{{col.literal}}', date_grain: 'month' });
		expect(validator(node, {}, ordersContext())).toEqual([]);
	});

	it('skips metric mode', () => {
		const node = createMockNode({ metric: 'revenue', date_grain: 'month' });
		expect(validator(node, {}, ordersContext())).toEqual([]);
	});

	it('checks the configured column attribute', () => {
		const node = createMockNode({
			data: 'orders',
			x: 'order_date',
			y: 'category',
			date_grain: 'month'
		});
		const result = validateDateGrain('y')(node, {}, ordersContext());
		expect(result[0].id).toBe('invalid-date-grain-column');
	});
});
