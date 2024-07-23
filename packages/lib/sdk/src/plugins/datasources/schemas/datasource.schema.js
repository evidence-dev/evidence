import { z } from 'zod';

/** @typedef {z.infer<typeof DatasourceSpecFileSchema>} DatasourceSpecFile */

export const DatasourceSpecFileSchema = z.object({
	type: z.string(),
	name: z.string().refine((s) => s?.toString().match(/^[a-zA-Z0-9_-]+$/)?.length),
	options: z.any(),
	buildOptions: z
		.object({
			batchSize: z
				.number()
				.min(1)
				.optional()
				.default(1000 * 1000)
		})
		.optional()
		.default({})
});
