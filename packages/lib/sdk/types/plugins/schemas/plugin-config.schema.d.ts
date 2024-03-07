/** @typedef {z.infer<typeof PluginConfigSchema>} PluginConfig */
export const PluginConfigSchema: z.ZodObject<{
    components: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        overrides: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        aliases: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        provides: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        overrides: string[];
        aliases: Record<string, string>;
        provides: string[];
    }, {
        overrides?: string[] | undefined;
        aliases?: Record<string, string> | undefined;
        provides?: string[] | undefined;
    }>>>;
    datasources: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        overrides: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        overrides?: string[] | undefined;
    }, {
        overrides?: string[] | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    components?: Record<string, {
        overrides: string[];
        aliases: Record<string, string>;
        provides: string[];
    }> | undefined;
    datasources?: Record<string, {
        overrides?: string[] | undefined;
    }> | undefined;
}, {
    components?: Record<string, {
        overrides?: string[] | undefined;
        aliases?: Record<string, string> | undefined;
        provides?: string[] | undefined;
    }> | undefined;
    datasources?: Record<string, {
        overrides?: string[] | undefined;
    }> | undefined;
}>;
export type PluginConfig = z.infer<typeof PluginConfigSchema>;
import { z } from 'zod';
//# sourceMappingURL=plugin-config.schema.d.ts.map