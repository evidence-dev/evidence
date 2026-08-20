import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { getInnerZodSchema } from './getInnerZodSchema';

describe('getInnerZodSchema', () => {
	it('should return the same schema if it is a basic Zod schema', () => {
		const schema = z.string();
		const result = getInnerZodSchema(schema);
		expect(result.schema).toBe(schema);
		expect(result.isOptional).toBe(false);
		expect(result.defaultValue).toBeUndefined();
	});

	it('should unwrap optional', () => {
		const inner = z.number();
		const schema = z.optional(inner);
		const result = getInnerZodSchema(schema);
		expect(result.schema).toBe(inner);
		expect(result.isOptional).toBe(true);
		expect(result.defaultValue).toBeUndefined();
	});

	it('should unwrap default', () => {
		const inner = z.boolean();
		const schema = inner.default(true);
		const result = getInnerZodSchema(schema);
		expect(result.schema).toBe(inner);
		expect(result.defaultValue).toBe(true);
		expect(result.isOptional).toBe(false);
	});

	it('should unwrap transform', () => {
		const inner = z.string();
		const schema = inner.transform((val) => val.toUpperCase());
		const result = getInnerZodSchema(schema);
		expect(result.schema).toBe(inner);
		expect(result.isOptional).toBe(false);
		expect(result.defaultValue).toBeUndefined();
	});

	it('should unwrap stacked default and optional', () => {
		const base = z.number();
		const schema = base.default(42).optional();
		const result = getInnerZodSchema(schema);
		expect(result.schema).toBe(base);
		expect(result.isOptional).toBe(true);
		expect(result.defaultValue).toBe(42);
	});

	it('should unwrap stacked optional, default, and transform', () => {
		const base = z.string();
		const schema = base
			.optional()
			.default('hi')
			.transform((val) => val.toUpperCase());
		const result = getInnerZodSchema(schema);
		expect(result.schema).toBe(base);
		expect(result.isOptional).toBe(true);
		expect(result.defaultValue).toBe('hi');
	});
});
