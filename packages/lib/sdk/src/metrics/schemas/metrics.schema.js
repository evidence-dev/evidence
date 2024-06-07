import { z } from 'zod';

export const MetricTimeGrainsSchema = z.enum(['day', 'week', 'month', 'quarter', 'year']);

export const MetricDefSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	expression: z.string(),
	dimensions: z.array(z.string()),
	time_grains: z.array(MetricTimeGrainsSchema),
	time_expression: z.string(),
	aggregation: z.string(),
	fmt: z.string().optional()
});

export const MetricSourceSchema = z.union([
	z.object({ datasource: z.string(), table: z.string() }),
	z.object({ query: z.string() })
]);

export const MetricFileSchema = z.object({
	metrics: z.array(MetricDefSchema),
	source: MetricSourceSchema
});

export const MetricSpecSchema = MetricDefSchema.extend({
	source: MetricSourceSchema
});
