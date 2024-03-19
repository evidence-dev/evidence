import { z } from 'zod';

export const ComponentManifestSchema = z.object({
	components: z.array(z.string())
});
