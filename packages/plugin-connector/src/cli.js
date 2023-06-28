import { getSources, getSourcesDir } from './data-sources/get-sources';
import { getDatasourcePlugins } from './data-sources/get-datasource-plugins';
import { getRootModules } from './plugin-discovery/get-root-modules';

import { Command } from 'commander';
import { loadConfig } from './plugin-discovery/resolve-evidence-config';
import { execSource } from './data-sources/exec-source';

const program = new Command();

program.name('plugin-connector-debug');
program.description('CLI to debug the evidence plugin connector');

program
	.command('print-config')
	.description('Print a parsed configuration')
	.action(async () => {
		const rootDir = await getRootModules();

		const config = await loadConfig(rootDir);
		console.log(config);
	});
program
	.command('get-sources')
	.description('Print a parsed list of sources')
	.action(async () => {
		const datasourceDir = await getSourcesDir();
		if (!datasourceDir) throw new Error('missing sources directory');
		const datasources = await getSources(datasourceDir);
		console.log(datasources);
	});
program
	.command('get-source-plugins')
	.description('Print a parsed list of datasource plugins')
	.action(async () => {
		const plugins = await getDatasourcePlugins();
		console.log(plugins);
	});

program
	.command('exec-sources')
	.description('Executes all sources')
	.action(async () => {
		const datasourceDir = await getSourcesDir();
		if (!datasourceDir) throw new Error('missing sources directory');
		const datasources = await getSources(datasourceDir);
		const plugins = await getDatasourcePlugins();
		for (const source of datasources) {
			await execSource(source, plugins, source.sourceDirectory);
		}
	});

program
	.command('root-modules-dir')
	.description('Print the detected node_modules directory path')
	.action(async () => {
		const rootModulesDir = await getRootModules();
		console.log(rootModulesDir);
	});

program.parse();
