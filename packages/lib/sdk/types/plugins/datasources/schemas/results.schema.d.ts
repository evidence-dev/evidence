export const QueryResultSchema: z.ZodUnion<[z.ZodObject<{
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
}>]>;
export const QueryRunnerSchema: z.ZodFunction<z.ZodTuple<[z.ZodUnion<[z.ZodString, z.ZodNull]>, z.ZodString, z.ZodUnion<[z.ZodNumber, z.ZodNull]>], z.ZodUnknown>, z.ZodUnion<[z.ZodPromise<z.ZodUnion<[z.ZodUnion<[z.ZodObject<{
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
}>]>]>>;
import { z } from 'zod';
//# sourceMappingURL=results.schema.d.ts.map