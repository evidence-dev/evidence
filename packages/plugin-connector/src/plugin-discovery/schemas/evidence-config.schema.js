import { z } from 'zod';

export const EvidenceComponentConfigSchema = z.object({
	overrides: z.array(z.string()).default([]),
	aliases: z
		.record(
			z.string({ description: 'Component Name' }),
			z.string({ description: 'Alias to apply' })
		)
		.default({}),

	provides: z.array(z.string()).default([])
});

export const EvidenceDatasourceConfigSchema = z.object({
	overrides: z.array(z.string()).default([])
});

export const EvidenceConfigSchema = z
	.object({
		components: z.record(z.string(), EvidenceComponentConfigSchema),
		databases: z
			.record(z.string({ description: 'Plugin Package Name' }), EvidenceDatasourceConfigSchema)
			.default({})
	})
	.nonstrict();
