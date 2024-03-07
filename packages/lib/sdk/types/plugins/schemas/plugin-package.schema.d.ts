/** @typedef {z.infer<typeof LayoutPluginSchema>} LayoutPackage */
/** @typedef {z.infer<typeof DatasourcePluginSchema>} DatasourcePackage */
/** @typedef {z.infer<typeof ComponentPluginSchema>} ComponentPackage */
/** @typedef {z.infer<typeof PluginPackageSchema>} PluginPackage */
export const PluginPackageSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    main: z.ZodOptional<z.ZodString>;
    evidence: z.ZodObject<{
        datasources: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, "many">>;
        layout: z.ZodOptional<z.ZodObject<{
            routes: z.ZodObject<{
                destination: z.ZodDefault<z.ZodString>;
                style: z.ZodEnum<[string, ...string[]]>;
            }, "strip", z.ZodTypeAny, {
                destination: string;
                style: string;
            }, {
                style: string;
                destination?: string | undefined;
            }>;
            components: z.ZodDefault<z.ZodObject<{
                destination: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                destination: string;
            }, {
                destination?: string | undefined;
            }>>;
            static: z.ZodDefault<z.ZodObject<{
                destination: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                destination: string;
            }, {
                destination?: string | undefined;
            }>>;
            root: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            components: {
                destination: string;
            };
            routes: {
                destination: string;
                style: string;
            };
            static: {
                destination: string;
            };
            root?: string | undefined;
        }, {
            routes: {
                style: string;
                destination?: string | undefined;
            };
            components?: {
                destination?: string | undefined;
            } | undefined;
            static?: {
                destination?: string | undefined;
            } | undefined;
            root?: string | undefined;
        }>>;
        icon: z.ZodOptional<z.ZodOptional<z.ZodEnum<[string, ...string[]]>>>;
        components: z.ZodOptional<z.ZodUnion<[z.ZodBoolean, z.ZodString]>>;
    }, "strip", z.ZodTypeAny, {
        datasources?: (string | string[])[] | undefined;
        layout?: {
            components: {
                destination: string;
            };
            routes: {
                destination: string;
                style: string;
            };
            static: {
                destination: string;
            };
            root?: string | undefined;
        } | undefined;
        icon?: string | undefined;
        components?: string | boolean | undefined;
    }, {
        datasources?: (string | string[])[] | undefined;
        layout?: {
            routes: {
                style: string;
                destination?: string | undefined;
            };
            components?: {
                destination?: string | undefined;
            } | undefined;
            static?: {
                destination?: string | undefined;
            } | undefined;
            root?: string | undefined;
        } | undefined;
        icon?: string | undefined;
        components?: string | boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    evidence: {
        datasources?: (string | string[])[] | undefined;
        layout?: {
            components: {
                destination: string;
            };
            routes: {
                destination: string;
                style: string;
            };
            static: {
                destination: string;
            };
            root?: string | undefined;
        } | undefined;
        icon?: string | undefined;
        components?: string | boolean | undefined;
    };
    name?: string | undefined;
    version?: string | undefined;
    main?: string | undefined;
}, {
    evidence: {
        datasources?: (string | string[])[] | undefined;
        layout?: {
            routes: {
                style: string;
                destination?: string | undefined;
            };
            components?: {
                destination?: string | undefined;
            } | undefined;
            static?: {
                destination?: string | undefined;
            } | undefined;
            root?: string | undefined;
        } | undefined;
        icon?: string | undefined;
        components?: string | boolean | undefined;
    };
    name?: string | undefined;
    version?: string | undefined;
    main?: string | undefined;
}>;
export function isLayoutPlugin(v: PluginPackage): v is {
    name: string;
    version: string;
    evidence: {
        layout: {
            components: {
                destination: string;
            };
            routes: {
                destination: string;
                style: string;
            };
            static: {
                destination: string;
            };
            root?: string | undefined;
        };
    };
};
export function isDatasourcePlugin(v: PluginPackage): v is {
    name: string;
    version: string;
    evidence: {
        datasources: (string | string[])[];
        icon?: string | undefined;
    };
    main: string;
};
export function isComponentPlugin(v: PluginPackage): v is {
    name: string;
    version: string;
    evidence: {
        components: string | boolean;
    };
    main: string;
};
export type LayoutPackage = z.infer<typeof LayoutPluginSchema>;
export type DatasourcePackage = z.infer<typeof DatasourcePluginSchema>;
export type ComponentPackage = z.infer<typeof ComponentPluginSchema>;
export type PluginPackage = z.infer<typeof PluginPackageSchema>;
import { z } from 'zod';
declare const LayoutPluginSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    evidence: z.ZodObject<{
        layout: z.ZodObject<{
            routes: z.ZodObject<{
                destination: z.ZodDefault<z.ZodString>;
                style: z.ZodEnum<[string, ...string[]]>;
            }, "strip", z.ZodTypeAny, {
                destination: string;
                style: string;
            }, {
                style: string;
                destination?: string | undefined;
            }>;
            components: z.ZodDefault<z.ZodObject<{
                destination: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                destination: string;
            }, {
                destination?: string | undefined;
            }>>;
            static: z.ZodDefault<z.ZodObject<{
                destination: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                destination: string;
            }, {
                destination?: string | undefined;
            }>>;
            root: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            components: {
                destination: string;
            };
            routes: {
                destination: string;
                style: string;
            };
            static: {
                destination: string;
            };
            root?: string | undefined;
        }, {
            routes: {
                style: string;
                destination?: string | undefined;
            };
            components?: {
                destination?: string | undefined;
            } | undefined;
            static?: {
                destination?: string | undefined;
            } | undefined;
            root?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        layout: {
            components: {
                destination: string;
            };
            routes: {
                destination: string;
                style: string;
            };
            static: {
                destination: string;
            };
            root?: string | undefined;
        };
    }, {
        layout: {
            routes: {
                style: string;
                destination?: string | undefined;
            };
            components?: {
                destination?: string | undefined;
            } | undefined;
            static?: {
                destination?: string | undefined;
            } | undefined;
            root?: string | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    evidence: {
        layout: {
            components: {
                destination: string;
            };
            routes: {
                destination: string;
                style: string;
            };
            static: {
                destination: string;
            };
            root?: string | undefined;
        };
    };
}, {
    name: string;
    version: string;
    evidence: {
        layout: {
            routes: {
                style: string;
                destination?: string | undefined;
            };
            components?: {
                destination?: string | undefined;
            } | undefined;
            static?: {
                destination?: string | undefined;
            } | undefined;
            root?: string | undefined;
        };
    };
}>;
declare const DatasourcePluginSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    evidence: z.ZodObject<{
        datasources: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, "many">;
        icon: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    }, "strip", z.ZodTypeAny, {
        datasources: (string | string[])[];
        icon?: string | undefined;
    }, {
        datasources: (string | string[])[];
        icon?: string | undefined;
    }>;
    main: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    evidence: {
        datasources: (string | string[])[];
        icon?: string | undefined;
    };
    main: string;
}, {
    name: string;
    version: string;
    evidence: {
        datasources: (string | string[])[];
        icon?: string | undefined;
    };
    main: string;
}>;
declare const ComponentPluginSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    evidence: z.ZodObject<{
        components: z.ZodUnion<[z.ZodBoolean, z.ZodString]>;
    }, "strip", z.ZodTypeAny, {
        components: string | boolean;
    }, {
        components: string | boolean;
    }>;
    main: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    evidence: {
        components: string | boolean;
    };
    main: string;
}, {
    name: string;
    version: string;
    evidence: {
        components: string | boolean;
    };
    main: string;
}>;
export {};
//# sourceMappingURL=plugin-package.schema.d.ts.map