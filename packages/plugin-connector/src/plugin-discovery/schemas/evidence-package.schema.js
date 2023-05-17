import { z } from 'zod';

export const GenericPackageSchema = z.object({
	name: z.string(),
	main: z.string(),
	evidence: z.undefined()
});

export const EvidencePackageSchema = GenericPackageSchema.extend({
	evidence: z.object({
		components: z.boolean().optional(),
		databases: z.array(z.string()).optional()
	})
});

export const ValidPackageSchema = z.union([GenericPackageSchema, EvidencePackageSchema]);
