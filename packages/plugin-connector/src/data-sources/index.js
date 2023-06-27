import { getSources, getSourcesDir } from './get-sources';
import { getDatasourcePlugins } from './get-datasource-plugins';
import { execSource } from './exec-source';

/**
 *  @param {string} outDir
 */
export async function updateDatasourceOutputs(outDir) {
	const datasourceDir = await getSourcesDir();
	if (!datasourceDir) throw new Error('missing sources directory');
	const datasources = await getSources(datasourceDir);
	const plugins = await getDatasourcePlugins();
	// TODO: Run in parallel?
	for (const source of datasources) {
		await execSource(source, plugins, outDir);
	}
}
