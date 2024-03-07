/** @type {z.ZodRecord<z.ZodType<string>, z.ZodType<IDatasourceOptionSpecSchema>>} */
export const DatasourceOptionSpecSchema: z.ZodRecord<z.ZodType<string>, z.ZodType<IDatasourceOptionSpecSchema>>;
export type Primitive = string | number | boolean;
export type IDatasourceOptionSpecSchema = {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'file';
    secret?: boolean | undefined;
    shown?: boolean | undefined;
    description?: string | undefined;
    virtual?: boolean | undefined;
    nest?: boolean | undefined;
    default?: string | number | boolean | undefined;
    children?: Record<string | number | symbol, Record<string, IDatasourceOptionSpecSchema>> | undefined;
    options?: (string | {
        value: Primitive;
        label: string;
    })[] | undefined;
    required?: boolean | undefined;
};
import { z } from 'zod';
//# sourceMappingURL=datasourcePluginOptions.schema.d.ts.map