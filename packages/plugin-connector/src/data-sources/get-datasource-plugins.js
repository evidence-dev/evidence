import { loadConfig } from '../plugin-discovery/resolve-evidence-config';
import { getRootModules } from '../plugin-discovery/get-root-modules';
import { discoverEvidencePlugins } from '../plugin-discovery';
import { buildConnector } from "./build-connector";
import chalk from 'chalk';
/**
 * @param {EvidenceConfig} [cfg]
 * @param {PackageDiscoveryResult} [discoveries] Optional: Pass in already discovered plugins
 * @returns {Promise<PluginDatabases>}
 */
export async function getDatasourcePlugins(cfg, discoveries) {
    const rootDir = await getRootModules();

    const config = cfg ?? (await loadConfig(rootDir));

    const pluginDiscoveries = discoveries ?? (await discoverEvidencePlugins());

    return await pluginDiscoveries.databases.reduce(
        /**
         * Adds a plugin to a map of EvidencePluginPackages with a corresponding DatabaseConnectorFactory, 
         * ensuring that no duplicate databases are added.
         * @param {Promise<Record<string, { package: EvidencePluginPackage<EvidenceDatabasePackage>, factory: DatabaseConnectorFactory }>>} _acc - A promise representing the current state of the package map
         * @param {EvidencePluginPackage<EvidenceDatabasePackage>} v - The plugin package to be added to the map
         * @returns {Promise<Record<string, { package: EvidencePluginPackage<EvidenceDatabasePackage>, factory: DatabaseConnectorFactory }>>} - A promise representing the updated package map
         */
        async (_acc, v) => {
            // Wait for the current state of the package map to resolve
            const acc = await _acc
            // Build a DatabaseConnectorFactory for the plugin package's databases
            const factory = await buildConnector(v.package.name, v.package.evidence?.databases ?? []);
            // For each database in the plugin package...
            v.package.evidence.databases?.forEach(d => {
                // Do nothing; this database type is overridden with another package.
                if (d in config.databases && v.package.name != config.databases[d]) return

                // If a plugin with the same database already exists in the map, throw an error
                if (d in acc) {
                    console.error(
                        chalk.red(
                            `[!] Multiple databases found for ${d}. Please ensure that only one is used.`
                        )
                    );
                    throw new Error('Database plugin conflict found!')
                }
                // Otherwise, add the plugin package and its DatabaseConnectorFactory to the map
                acc[d] = {
                    package: v,
                    factory: factory.getRunner
                };
            })
            // Return the updated package map as a promise
            return acc
        }, Promise.resolve({}));

    // // TODO: Load all sources
    // // TODO: Handle databases that are supported by multiple plugins
    // await Promise.all(sources.map(async (source) => {
    //     const dbType = source.type
    //     const dbPlugin = dbMap[dbType]
    //     if (!dbPlugin) {
    //         console.error(
    //             chalk.red(
    //                 `[!] No database plugin found for ${dbType}`
    //             )
    //         )
    //         throw new Error('Missing database plugin!')
    //     }
    //     const runner = await dbPlugin.factory(source.options, source.sourceDirectory)
    //     return {
    //         source, runner
    //     }
    // }))
}