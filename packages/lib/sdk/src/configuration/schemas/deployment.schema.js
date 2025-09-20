import { z } from 'zod';

export const DeploymentConfigSchema = z.object({
	basePath: z
		.string()
		.optional()
		.default(process.env.EVIDENCE_BASE_PATH || '')
		.refine((value) => !value || value.startsWith('/'), { message: 'basePath must start with /' })
});
