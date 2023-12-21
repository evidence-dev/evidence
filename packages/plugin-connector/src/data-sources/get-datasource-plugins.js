import { discoverEvidencePlugins } from '../plugin-discovery';
import { buildConnector } from './build-connector';
import chalk from 'chalk';
import path from 'path';
/**
 * @param {EvidenceConfig} [cfg]
 * @param {PackageDiscoveryResult} [discoveries] Optional: Pass in already discovered plugins
 * @returns {Promise<PluginDatasources>}
 */
export async function getDatasourcePlugins(cfg, discoveries) {
	const pluginDiscoveries = discoveries ?? (await discoverEvidencePlugins());

	return await pluginDiscoveries.datasources.reduce(
		/**
		 * Adds a plugin to a map of EvidencePluginPackages with a corresponding DatasourceConnectorFactory,
		 * ensuring that no duplicate datasources are added.
		 * @param {Promise<Record<string, PluginDatasources[string]>>} _acc - A promise representing the current state of the package map
		 * @param {EvidencePluginPackage<EvidenceDatasourcePackage>} v - The plugin package to be added to the map
		 * @returns {Promise<Record<string, PluginDatasources[string]>>} - A promise representing the updated package map
		 */
		async (_acc, v) => {
			// TODO: Handle Overrides

			// Wait for the current state of the package map to resolve
			const acc = await _acc;
			// Build a DatasourceConnectorFactory for the plugin package's datasourcess
			const factory = await buildConnector(
				path.join(v.path, v.package.main),
				v.package.evidence?.datasources ?? [],
				v.package.name
			);
			// For each datasource in the plugin package...
			v.package.evidence.datasources?.flat().forEach((d) => {
				// If a plugin with the same datasource already exists in the map, throw an error
				if (d in acc) {
					console.error(
						chalk.red(
							`[!] Multiple datasource connectors found for ${d}. Please ensure that only one is used.`
						)
					);
					throw new Error('Datasource plugin conflict found!');
				}
				// Otherwise, add the plugin package and its DatasourceConnectorFactory to the map
				acc[d] = {
					package: v,
					factory: factory.getRunner,
					options: factory.options,
					testConnection: factory.testConnection,
					processSource: /** @type {*} **/ (factory.processSource) // We can't really validate AsyncIterator output
				};
			});
			// Return the updated package map as a promise
			return acc;
		},
		Promise.resolve({})
	);
}
