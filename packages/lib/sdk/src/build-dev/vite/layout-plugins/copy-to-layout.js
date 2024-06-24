import chokidar from 'chokidar';
import { loadLayoutPlugin } from '../../../plugins/layouts/loadLayoutPlugin.js';
import path from 'path';
import { projectRoot } from '../../../lib/projectRoot.js';
import { copyMethods } from '../../../plugins/layouts/copyMethods/index.js';
import fs from 'fs/promises';
import { EvidenceError } from '../../../lib/EvidenceError.js';
import chalk from 'chalk';

export const copyToLayout = async () => {
	const plugin = await loadLayoutPlugin();
	if (!plugin) return false;

	const routesDestination = plugin.evidence.layout.routes.destination.split(/[/\\]/);
	const templateRoot = path.join(projectRoot, '.evidence', 'template');
	const rootTargetDir = path.join(templateRoot, ...routesDestination);
	const rootSourceDir = path.join(projectRoot, 'pages');

	const method = copyMethods[plugin.evidence.layout.routes.style];
	const pageWatcher = chokidar.watch(rootSourceDir, { alwaysStat: true });

	/**
	 * @param {string} filepath
	 */
	const copyToLayout = async (filepath) => {
		const parsedPath = path.parse(filepath);
		const dirEntries = await fs.readdir(parsedPath.dir, { withFileTypes: true });
		const dirEnt = dirEntries.find((ent) => ent.name === parsedPath.base);
		if (!dirEnt)
			throw new EvidenceError('Error Copying page to layout', [
				'dirEnt could not be found, this should not happen.'
			]);
		method.copyFile(rootSourceDir, rootTargetDir, dirEnt);
	};

	// TODO: Handle moved files, deleted files, etc
	pageWatcher.on('add', copyToLayout);
	pageWatcher.on('change', copyToLayout);

	const componentsDestination = plugin.evidence.layout.components.destination.split(/[/\\]/);
	const componentsSource = path.join(projectRoot, 'components');
	const componentWatcher = chokidar.watch(componentsSource);
	/**
	 
	 * @param {string} filepath 
	 */
	const copyComponent = async (filepath) => {
		const relPath = path.relative(componentsSource, filepath);
		const destination = path.join(templateRoot, ...componentsDestination, relPath);
		console.debug(chalk.dim(`Copied ${filepath} -> ${destination}`));
		await fs.cp(filepath, destination);
	};
	componentWatcher.on('add', copyComponent);
	componentWatcher.on('change', copyComponent);

	const staticDestination = plugin.evidence.layout.static.destination.split(/[/\\]/);
	const staticSource = path.join(projectRoot, 'static');
	const staticWatcher = chokidar.watch(staticSource);
	/**
	 
	 * @param {string} filepath 
	 */
	const copyStatic = async (filepath) => {
		const relPath = path.relative(staticSource, filepath);
		const destination = path.join(templateRoot, ...staticDestination, relPath);
		console.debug(chalk.dim(`Copied ${filepath} -> ${destination}`));
		await fs.cp(filepath, destination);
	};
	staticWatcher.on('add', copyStatic);
	staticWatcher.on('change', copyStatic);
};
