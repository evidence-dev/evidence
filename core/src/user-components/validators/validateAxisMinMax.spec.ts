import { describe, it, expect } from 'vitest';
import { validateAxisMinMax } from './validateAxisMinMax';
import type { ValidationContext } from './types';

const createValidationContext = (): ValidationContext => ({
	metadata: undefined,
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

describe('validateAxisMinMax', () => {
	const validator = validateAxisMinMax('x_axis_options');
	const context = createValidationContext();

	it('returns no errors when axis options are not provided', () => {
		const node = createMockNode({});
		expect(validator(node, {}, context)).toEqual([]);
	});

	it('returns no errors when only min is provided', () => {
		const node = createMockNode({ x_axis_options: { min: 5 } });
		expect(validator(node, {}, context)).toEqual([]);
	});

	it('returns no errors when only max is provided', () => {
		const node = createMockNode({ x_axis_options: { max: 10 } });
		expect(validator(node, {}, context)).toEqual([]);
	});

	it('returns no errors when min < max', () => {
		const node = createMockNode({ x_axis_options: { min: 0, max: 100 } });
		expect(validator(node, {}, context)).toEqual([]);
	});

	it('returns no errors with negative bounds where min < max', () => {
		const node = createMockNode({ x_axis_options: { min: -10, max: -1 } });
		expect(validator(node, {}, context)).toEqual([]);
	});

	it('returns an error when min equals max', () => {
		const node = createMockNode({ x_axis_options: { min: 5, max: 5 } });
		const errors = validator(node, {}, context);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toMatchObject({
			id: 'invalid-axis-min-max',
			level: 'error'
		});
	});

	it('returns an error when min > max', () => {
		const node = createMockNode({ x_axis_options: { min: 100, max: 0 } });
		const errors = validator(node, {}, context);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toMatchObject({
			id: 'invalid-axis-min-max',
			level: 'error',
			message: expect.stringContaining('x_axis_options')
		});
	});

	it('coerces numeric strings before comparing', () => {
		const node = createMockNode({ x_axis_options: { min: '50', max: '10' } });
		const errors = validator(node, {}, context);
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('invalid-axis-min-max');
	});

	it('skips validation when min is a variable reference', () => {
		const node = createMockNode({ x_axis_options: { min: '{{ low }}', max: 0 } });
		expect(validator(node, {}, context)).toEqual([]);
	});

	it('skips validation when max is a variable reference', () => {
		const node = createMockNode({ x_axis_options: { min: 100, max: '{{ high }}' } });
		expect(validator(node, {}, context)).toEqual([]);
	});

	it('skips validation when values are non-numeric strings (e.g. dates)', () => {
		const node = createMockNode({
			x_axis_options: { min: '2025-01-01', max: '2024-01-01' }
		});
		expect(validator(node, {}, context)).toEqual([]);
	});

	it('works for an arbitrary axis options attribute name', () => {
		const yValidator = validateAxisMinMax('y_axis_options');
		const node = createMockNode({ y_axis_options: { min: 10, max: 5 } });
		const errors = yValidator(node, {}, context);
		expect(errors).toHaveLength(1);
		expect(errors[0].message).toContain('y_axis_options');
	});
});
