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
		 * @typedef {Object} DatasourcePluginDiscovery
		 * @property {EvidencePluginPackage<EvidenceDatabasePackage>} package
		 * @property {DatabaseConnectorFactory} factory
		 * @property {DatasourceOptionsSpec} options
		 * @property {ConnectionTester} testConnection
		 */

		/**
		 * Adds a plugin to a map of EvidencePluginPackages with a corresponding DatabaseConnectorFactory,
		 * ensuring that no duplicate databases are added.
		 * @param {Promise<Record<string, DatasourcePluginDiscovery>>} _acc - A promise representing the current state of the package map
		 * @param {EvidencePluginPackage<EvidenceDatabasePackage>} v - The plugin package to be added to the map
		 * @returns {Promise<Record<string, DatasourcePluginDiscovery>>} - A promise representing the updated package map
		 */
		async (_acc, v) => {
			// TODO: Handle Overrides

			// Wait for the current state of the package map to resolve
			const acc = await _acc;
			// Build a DatabaseConnectorFactory for the plugin package's databases
			const factory = await buildConnector(
				path.join(v.path, v.package.main),
				v.package.evidence?.databases ?? [],
				v.package.name
			);
			// For each database in the plugin package...
			v.package.evidence.databases?.flat().forEach((d) => {
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
					factory: factory.getRunner,
					options: factory.options,
					testConnection: factory.testConnection
				};
			});
			// Return the updated package map as a promise
			return acc;
		},
		Promise.resolve({})
	);
}
