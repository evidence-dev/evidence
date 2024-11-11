import { z } from 'zod';

export const DeploymentConfigSchema = z.object({
	basePath: z.string().startsWith('/').optional().default('/')
});
