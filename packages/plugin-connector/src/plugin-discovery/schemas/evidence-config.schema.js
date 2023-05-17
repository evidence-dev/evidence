import { z } from 'zod';

export const EvidenceComponentConfigSchema = z.object({
	overrides: z.record(z.string(), z.string()).optional(),
	aliases: z
		.record(
			z.string({ description: 'Component Name' }),
			z.string({ description: 'Alias to apply' })
		)
		.optional(),

	provides: z.array(z.string()).optional()
});

export const EvidenceConfigSchema = z
	.object({
		components: z.record(z.string(), EvidenceComponentConfigSchema)
	})
	.nonstrict();
