import { z } from 'zod';
import { BaseTableSchema } from './base.schema.mjs';
import { FakeColumn } from './faker.schema.mjs';

const BaseXSchema = z.object({
	name: z.string().default('x'),
	gaps: z.union([z.boolean(), z.number().min(0).max(0.95)]).default(false)
});

export const NumericSeriesSchema = z.object({
	type: z.literal('numeric'),
	columns: z.object({
		x: z.union([
			BaseXSchema.extend({
				type: z.literal('date'),
				period: z.enum(['day', 'week', 'month'])
			}),
			BaseXSchema.extend({
				type: z.literal('number'),
				maxOffset: z
					.number()
					.default(0)
					.transform((v) => Math.abs(v))
			})
		]),
		y: z.object({
			withBias: z.boolean().optional(),
			category: z.enum(['number']),
			item: z.string(),
			name: z.string().default('y'),
			options: z.array(z.any()).optional(),
			nulls: z.union([z.boolean(), z.number().min(0).max(0.95)]).default(false)
		}),
		series: z.object({
			withBias: z.boolean().optional(),
			category: z.string().default('color'),
			item: z.string().default('human'),
			name: z.string().default('series'),
			options: z.array(z.any()).optional(),
			count: z.number().min(1).default(1),
			alwaysExists: z.union([z.boolean(), z.number().min(0).max(0.95)]).default(true)
		})
	})
});
const CategoricalSeriesSchema = z.object({
	type: z.literal('categorical'),
	length: z.number()
});

export const SeriesSchema = BaseTableSchema.extend({
	series: z.union([NumericSeriesSchema, CategoricalSeriesSchema])
});
