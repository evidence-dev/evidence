export const ComponentManifestSchema: z.ZodObject<{
    components: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    components: string[];
}, {
    components: string[];
}>;
import { z } from 'zod';
//# sourceMappingURL=component-manifest.schema.d.ts.map