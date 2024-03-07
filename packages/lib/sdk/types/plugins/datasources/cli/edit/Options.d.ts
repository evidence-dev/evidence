export const OptionDebug: unique symbol;
export const OptionSpecMode: unique symbol;
export const OptionSecretMode: unique symbol;
export const OptionSafeMode: unique symbol;
export const OptionParentMode: unique symbol;
export const OptionGetSpec: unique symbol;
export const IsOptions: unique symbol;
export function Options(spec: import('../../Datasources.js').Datasource["options"], sourceOptions: any, opts?: OptionsOpts | undefined): any;
export function getSafeOptions(options: ReturnType<typeof Options>): any;
export function getSecretOptions(options: ReturnType<typeof Options>): any;
export function getSpecAtPath(options: any, optionPath: string[]): import('../../schemas/datasourcePluginOptions.schema.js').IDatasourceOptionSpecSchema;
export type OptionsOpts = {
    /**
     * Changes the Options object to return booleans for all fields, indicating if they are secret or not
     */
    specMode?: boolean | undefined;
    /**
     * Returns values only for secrets, non-secrets will all be undefined
     */
    secretsMode?: boolean | undefined;
    /**
     * Returns values only for non-secrets, secrets will all be undefined
     */
    optionsMode?: boolean | undefined;
    /**
     * Does not return nested options, instead always resolves to a value
     */
    parentMode?: boolean | undefined;
    /**
     * Returns values only for non-secrets, secrets will all be undefined
     */
    value?: string | undefined;
    /**
     * Parent options proxy
     */
    parent?: ReturnType<typeof Options>;
};
//# sourceMappingURL=Options.d.ts.map