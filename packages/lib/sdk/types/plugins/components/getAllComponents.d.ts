export function getAllComponents(): Promise<Record<string, import("./loadComponentPlugins.js").ComponentInfo & ComponentResolution>>;
export type ComponentResolution = {
    aliasOf?: string | undefined;
};
//# sourceMappingURL=getAllComponents.d.ts.map