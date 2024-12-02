import chalk from 'chalk';
import { getEvidenceConfig } from '../../configuration/getEvidenceConfig.js';
import { isDatasourcePlugin } from '../schemas/plugin-package.schema.js';
import { Datasources } from './Datasources.js';
import { DatasourceSchema } from './schemas/datasourcePlugin.schema.js';
import { loadPluginPackage } from '../loadPluginPackage.js';
import path from 'path';

/**
 * @returns {Promise<Datasources>}
 */
export const loadSourcePlugins = async () => {
	const { plugins } = getEvidenceConfig();

	const datasources = new Datasources();
	for (const [name, spec] of Object.entries(plugins.datasources ?? {})) {
		const pack = await loadPluginPackage(name);
		if (pack === null) continue;
		// First, locate the package
		if (!isDatasourcePlugin(pack)) {
			console.warn(
				chalk.yellow(
					`Datasource package ${chalk.bold(`"${name}"`)} is an invalid Datasource plugin`
				)
			);
			continue;
		}

		const packageMainpath = path.join(pack.dir.replace('package.json', ''), pack.main);

		const plugin = await import(new URL('file://' + packageMainpath).toString());
		const source = DatasourceSchema.safeParse(plugin);
		if (!source.success) {
			console.warn(
				chalk.yellow(
					`Datasource package ${chalk.bold(
						`"${name}"`
					)} is an invalid Datasource plugin, run again with --debug for more information`
				)
			);
			console.debug(source.error.format());
			continue;
		}

		datasources.add(pack, source.data, spec?.overrides);
	}

	return datasources;
};
