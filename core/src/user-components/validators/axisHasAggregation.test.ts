import { describe, expect, it } from 'vitest';
import { axisHasAggregation } from './axisHasAggregation';
import type { ValidationContext } from './types';
import { CubeDialect } from '../../sql-dialect';

const createValidationContext = (dialect?: ValidationContext['dialect']): ValidationContext => ({
	metadata: undefined,
	filters: undefined,
	inlineQueries: undefined,
	inlineQueryMetadata: undefined,
	trees: undefined,
	dialect
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockNode = (attributes: Record<string, unknown>): any => ({
	attributes,
	location: { start: { line: 1, character: 1 }, end: { line: 1, character: 10 } }
});

describe('axisHasAggregation', () => {
	it('accepts Cube MEASURE() on the value axis', () => {
		const node = createMockNode({
			data: 'orders',
			x: 'created_at',
			y: 'MEASURE(line_items_sum_price)'
		});

		expect(axisHasAggregation()(node, {}, createValidationContext(new CubeDialect()))).toEqual([]);
	});

	it('still warns for raw columns on a Cube connection', () => {
		const node = createMockNode({ data: 'orders', x: 'created_at', y: 'line_items_sum_price' });

		const result = axisHasAggregation()(node, {}, createValidationContext(new CubeDialect()));
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('axes-missing-aggregation');
	});

	it('accepts a standard aggregation with no dialect on the context', () => {
		const node = createMockNode({ data: 'orders', x: 'created_at', y: 'sum(total)' });

		expect(axisHasAggregation()(node, {}, createValidationContext())).toEqual([]);
	});
});
