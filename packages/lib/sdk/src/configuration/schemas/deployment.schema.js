import { z } from 'zod';

export const DeploymentConfigSchema = z.object({
	basePath: z
		.string()
		.optional()
		.default('')
		.refine((value) => !value || value.startsWith('/'), { message: 'basePath must start with /' })
});
