import { discoverEvidencePlugins } from '../plugin-discovery';
import { buildConnector } from './build-connector';
import chalk from 'chalk';
import path from 'path';
/**
 * @param {EvidenceConfig} [cfg]
 * @param {PackageDiscoveryResult} [discoveries] Optional: Pass in already discovered plugins
 * @returns {Promise<PluginDatabases>}
 */
export async function getDatasourcePlugins(cfg, discoveries) {
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
			// TODO: Handle Overrides

			// Wait for the current state of the package map to resolve
			const acc = await _acc;
			// Build a DatabaseConnectorFactory for the plugin package's databases
			const factory = await buildConnector(
				path.join(v.path, v.package.main),
				v.package.evidence?.databases ?? []
			);
			// For each database in the plugin package...
			v.package.evidence.databases?.forEach((d) => {
				// If a plugin with the same database already exists in the map, throw an error
				if (d in acc) {
					console.error(
						chalk.red(`[!] Multiple databases found for ${d}. Please ensure that only one is used.`)
					);
					throw new Error('Database plugin conflict found!');
				}
				// Otherwise, add the plugin package and its DatabaseConnectorFactory to the map
				acc[d] = {
					package: v,
					factory: factory.getRunner
				};
			});
			// Return the updated package map as a promise
			return acc;
		},
		Promise.resolve({})
	);
}
