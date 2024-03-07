export function loadComponentPlugins(): Promise<ComponentInfo[]>;
export type ComponentPackage = import("../schemas/plugin-package.schema.js").ComponentPackage;
export type ComponentInfo = {
    name: string;
    package: ComponentPackage & {
        dir: string;
    };
    options: NonNullable<import("../schemas/plugin-config.schema.js").PluginConfig["components"]>[string];
};
//# sourceMappingURL=loadComponentPlugins.d.ts.map