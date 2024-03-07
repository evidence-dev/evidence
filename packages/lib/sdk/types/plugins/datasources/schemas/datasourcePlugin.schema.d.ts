/** @typedef {z.infer<typeof DatasourceSchema>} Datasource */
export const DatasourceSchema: z.ZodUnion<[z.ZodObject<{
    options: z.ZodRecord<z.ZodType<string, z.ZodTypeDef, string>, z.ZodType<import("./datasourcePluginOptions.schema.js").IDatasourceOptionSpecSchema, z.ZodTypeDef, import("./datasourcePluginOptions.schema.js").IDatasourceOptionSpecSchema>>;
    testConnection: z.ZodFunction<z.ZodTuple<[z.ZodAny], z.ZodUnknown>, z.ZodPromise<z.ZodUnion<[z.ZodLiteral<true>, z.ZodObject<{
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reason: string;
    }, {
        reason: string;
    }>]>>>;
    getRunner: z.ZodFunction<z.ZodTuple<[z.ZodAny, z.ZodString], z.ZodUnknown>, z.ZodPromise<z.ZodFunction<z.ZodTuple<[z.ZodUnion<[z.ZodString, z.ZodNull]>, z.ZodString, z.ZodUnion<[z.ZodNumber, z.ZodNull]>], z.ZodUnknown>, z.ZodUnion<[z.ZodPromise<z.ZodUnion<[z.ZodUnion<[z.ZodObject<{
        columnTypes: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            evidenceType: z.ZodEnum<["boolean", "number", "string", "date"]>;
            typeFidelity: z.ZodUnion<[z.ZodLiteral<"precise">, z.ZodLiteral<"inferred">]>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }, {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }>, "many">;
        expectedRowCount: z.ZodOptional<z.ZodNumber>;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
    }, {
        url: string;
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
    }>, z.ZodEffects<z.ZodEffects<z.ZodObject<{
        columnTypes: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            evidenceType: z.ZodEnum<["boolean", "number", "string", "date"]>;
            typeFidelity: z.ZodUnion<[z.ZodLiteral<"precise">, z.ZodLiteral<"inferred">]>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }, {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }>, "many">;
        expectedRowCount: z.ZodOptional<z.ZodNumber>;
        rows: z.ZodUnion<[z.ZodEffects<z.ZodAny, any, any>, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>;
    }, "strip", z.ZodTypeAny, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }>, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }>, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }>]>, z.ZodNull]>>, z.ZodUnion<[z.ZodObject<{
        columnTypes: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            evidenceType: z.ZodEnum<["boolean", "number", "string", "date"]>;
            typeFidelity: z.ZodUnion<[z.ZodLiteral<"precise">, z.ZodLiteral<"inferred">]>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }, {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }>, "many">;
        expectedRowCount: z.ZodOptional<z.ZodNumber>;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
    }, {
        url: string;
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
    }>, z.ZodEffects<z.ZodEffects<z.ZodObject<{
        columnTypes: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            evidenceType: z.ZodEnum<["boolean", "number", "string", "date"]>;
            typeFidelity: z.ZodUnion<[z.ZodLiteral<"precise">, z.ZodLiteral<"inferred">]>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }, {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }>, "many">;
        expectedRowCount: z.ZodOptional<z.ZodNumber>;
        rows: z.ZodUnion<[z.ZodEffects<z.ZodAny, any, any>, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>;
    }, "strip", z.ZodTypeAny, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }>, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }>, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }, {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    }>]>]>>>>;
}, "strip", z.ZodTypeAny, {
    options: Record<string, import("./datasourcePluginOptions.schema.js").IDatasourceOptionSpecSchema>;
    testConnection: (args_0: any, ...args_1: unknown[]) => Promise<true | {
        reason: string;
    }>;
    getRunner: (args_0: any, args_1: string, ...args_2: unknown[]) => Promise<(args_0: string | null, args_1: string, args_2: number | null, ...args_3: unknown[]) => {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    } | {
        url: string;
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
    } | Promise<{
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    } | {
        url: string;
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
    } | null>>;
}, {
    options: Record<string, import("./datasourcePluginOptions.schema.js").IDatasourceOptionSpecSchema>;
    testConnection: (args_0: any, ...args_1: unknown[]) => Promise<true | {
        reason: string;
    }>;
    getRunner: (args_0: any, args_1: string, ...args_2: unknown[]) => Promise<(args_0: string | null, args_1: string, args_2: number | null, ...args_3: unknown[]) => {
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    } | {
        url: string;
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
    } | Promise<{
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
        rows?: any;
    } | {
        url: string;
        columnTypes: {
            name: string;
            evidenceType: "string" | "number" | "boolean" | "date";
            typeFidelity: "precise" | "inferred";
        }[];
        expectedRowCount?: number | undefined;
    } | null>>;
}>, z.ZodObject<{
    options: z.ZodRecord<z.ZodType<string, z.ZodTypeDef, string>, z.ZodType<import("./datasourcePluginOptions.schema.js").IDatasourceOptionSpecSchema, z.ZodTypeDef, import("./datasourcePluginOptions.schema.js").IDatasourceOptionSpecSchema>>;
    testConnection: z.ZodFunction<z.ZodTuple<[z.ZodAny], z.ZodUnknown>, z.ZodPromise<z.ZodUnion<[z.ZodLiteral<true>, z.ZodObject<{
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reason: string;
    }, {
        reason: string;
    }>]>>>;
    processSource: z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodType<any, z.ZodTypeDef, any>>;
}, "strip", z.ZodTypeAny, {
    options: Record<string, import("./datasourcePluginOptions.schema.js").IDatasourceOptionSpecSchema>;
    testConnection: (args_0: any, ...args_1: unknown[]) => Promise<true | {
        reason: string;
    }>;
    processSource: (...args: unknown[]) => any;
}, {
    options: Record<string, import("./datasourcePluginOptions.schema.js").IDatasourceOptionSpecSchema>;
    testConnection: (args_0: any, ...args_1: unknown[]) => Promise<true | {
        reason: string;
    }>;
    processSource: (...args: unknown[]) => any;
}>]>;
export type Datasource = z.infer<typeof DatasourceSchema>;
import { z } from 'zod';
//# sourceMappingURL=datasourcePlugin.schema.d.ts.map