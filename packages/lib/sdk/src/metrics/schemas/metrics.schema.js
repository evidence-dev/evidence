import { z } from 'zod';

export const MetricTimeGrainsSchema = z.enum(['day', 'week', 'month', 'quarter', 'year']);

export const MetricDefSchema = z.object({
	name: z.string(),
	description: z.string(),
	source: z.union([
		z.object({ datasource: z.string(), table: z.string() }),
		z.object({ query: z.string() }),
	]),
	expression: z.string(),
	dimensions: z.array(z.string()),
	time_grains: z.array(MetricTimeGrainsSchema),
	time_expression: z.string(),
	aggregation: z.string(),
});

export const MetricFileSchema = z.array(MetricDefSchema);
