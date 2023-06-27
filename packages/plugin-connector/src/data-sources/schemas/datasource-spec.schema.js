import { z } from 'zod';
import { QueryResultSchema } from './query-runner.schema';

export const DatasourceQuerySchema = z.object({
	filepath: z.string(),
	content: z.string()
});

export const DatasourceSpecFileSchema = z.object({
	type: z.string(),
	name: z
		.string()
		.optional()
		.refine((s) => typeof s === 'undefined' || s?.toString().match(/^[a-zA-Z0-9_-]+$/)?.length),
	options: z.any()
});

export const DatasourceSpecSchema = DatasourceSpecFileSchema.extend({
	queries: z.array(DatasourceQuerySchema),
	sourceDirectory: z.string()
});

export const DatasourceQueryResultSchema = z.object({
	source: DatasourceQuerySchema,
	result: QueryResultSchema,
	name: z.string({ description: 'Output Table / Store name' })
});
