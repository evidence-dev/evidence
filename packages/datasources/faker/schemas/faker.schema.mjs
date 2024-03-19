import { faker } from '@faker-js/faker';
import { BaseColSchema, BaseTableSchema } from './base.schema.mjs';
import { z } from 'zod';

const FKColumn = BaseColSchema.extend({
	type: z.literal('fk'),
	target: z.object({
		table: z.string(),
		tablePath: z.string().optional(),
		field: z.string().optional()
	})
});

const IdColumn = z.object({
	type: z.literal('id')
});

export const FakeColumn = BaseColSchema.extend({
	category: z.enum(['number', ...Object.keys(faker)]),
	item: z.string(),
	options: z.array(z.any()).optional(), // Can't easily validate
	targetField: z.string().optional() // Can't easily validate
});

const MultiColumn = BaseColSchema.extend({
	oneof: z.array(FakeColumn)
});

export const ColumnSchema = z.union([FKColumn, IdColumn, FakeColumn, MultiColumn]);

export const FakerSchema = BaseTableSchema.extend({
	schema: z.record(z.string(), ColumnSchema)
});
