import { z } from 'zod';

const PackageExportSchema = z.union([
	z.object({ main: z.string() }, { description: 'Use the main field of the package.json' }),
	z.object(
		{ exports: z.object({ '.': z.string() }) },
		{ description: 'Use the exports field of the package.json' }
	),
	z
		.object({ svelte: z.string() }, { description: 'Use the svelte field of the package.json' })
		.optional()
]);

const BasePackageSchema = z.object({
	name: z.string(),
	evidence: z.undefined()
});

export const GenericPackageSchema = z.intersection(BasePackageSchema, PackageExportSchema);

export const EvidencePackageSchema = z.intersection(
	BasePackageSchema.extend({
		evidence: z.object({
			components: z.boolean().optional(),
			databases: z.array(z.string()).optional()
		})
	}),
	PackageExportSchema
);

export const ValidPackageSchema = z.union([GenericPackageSchema, EvidencePackageSchema]);
