/** @typedef {[DatasourcePackage, Datasource]} DatasourceTuple */
export class Datasources {
    /**
     * @param {DatasourcePackage} pack
     * @param {Datasource} source
     * @param {string[]} [overrides]
     */
    add(pack: DatasourcePackage, source: Datasource, overrides?: string[] | undefined): void;
    /** @param {string} packageName */
    getByPackageName(packageName: string): DatasourceTuple;
    /** @param {string} sourceName */
    getBySource(sourceName: string): DatasourceTuple;
    /** @returns {string[]} */
    getCanonicalSources(): string[];
    #private;
}
export type DatasourcePackage = import("../schemas/plugin-package.schema.js").DatasourcePackage;
export type Datasource = import("./schemas/datasourcePlugin.schema.js").Datasource;
export type DatasourceTuple = [DatasourcePackage, Datasource];
//# sourceMappingURL=Datasources.d.ts.map