import { z } from 'zod';
export const BaseTableSchema = z.object({
	rows: z.number(),
	fuzz: z.number().optional(),

	filters: z
		.array(
			z.object({
				type: z.string(),
				fields: z.array(z.string())
			})
		)
		.optional()
});

export const BaseColSchema = z.object({
	withBias: z.boolean().default(false)
});
