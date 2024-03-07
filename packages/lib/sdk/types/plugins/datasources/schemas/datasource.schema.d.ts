/** @typedef {z.infer<typeof DatasourceSpecFileSchema>} DatasourceSpecFile */
export const DatasourceSpecFileSchema: z.ZodObject<{
    type: z.ZodString;
    name: z.ZodEffects<z.ZodString, string, string>;
    options: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    type: string;
    name: string;
    options?: any;
}, {
    type: string;
    name: string;
    options?: any;
}>;
export type DatasourceSpecFile = z.infer<typeof DatasourceSpecFileSchema>;
import { z } from 'zod';
//# sourceMappingURL=datasource.schema.d.ts.map