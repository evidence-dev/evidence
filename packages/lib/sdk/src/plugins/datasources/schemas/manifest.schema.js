import { z } from 'zod';

export const ManifestSchema = z.object({
	// TODO: Refactor to tables instead of files
	renderedFiles: z.record(z.array(z.string())),
	locatedFiles: z.record(z.array(z.string())).optional(),
	locatedSchemas: z.array(z.string()).optional()
});
