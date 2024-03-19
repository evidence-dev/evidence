import { cp, mkdir, readdir, rm } from 'fs/promises';
import { loadLayoutPlugin } from './loadLayoutPlugin.js';
import path from 'path';
import { EvidenceError } from '../../lib/EvidenceError.js';
import { copyMethods } from './copyMethods/index.js';
import { forceLink } from '../../lib/forceLink.js';
import { projectRoot } from '../../lib/projectRoot.js';
import chalk from 'chalk';

/**
 * @returns {Promise<boolean>} If a layout was found and applied.
 */
export const copyToLayout = async () => {
	const plugin = await loadLayoutPlugin();
	if (!plugin) return false;

	const templateDir = path.join(projectRoot, '.evidence', 'template');
	await mkdir(templateDir, { recursive: true });

	// Copy the template over
	const pluginRoot = plugin.evidence.layout.root
		? path.join(plugin.dir, plugin.evidence.layout.root)
		: plugin.dir;

	// Get a fresh copy of the template. TODO: This might only be needed in dev mode
	await rm(templateDir, { recursive: true });
	await cp(pluginRoot, templateDir, {
		recursive: true,
		dereference: true,
		filter: (from) => !from.endsWith('node_modules')
	});

	// TODO: Check to see if this is valid on windows, might need to copy there
	// We use a link here to try and cut down on disk space usage (node modules can really blow up)

	// Link plugin's node_modules to the template's node_modules
	await forceLink(
		path.join(plugin.dir, 'node_modules'),
		path.join(templateDir, 'node_modules')
	).catch((e) => {
		console.debug(
			chalk.dim.yellow(
				'Failed to link template modules to .evidence/template/node_modules; this is expected with certain package managers'
			)
		);
		console.debug(chalk.dim.yellow(e));
	});

	// TODO: Is this a hack?
	// Virtual modules import from the context of the _project_, not the _package_. That approach may need revisiting
	// to scope it to more specific things. Vite will climb the project structure (starting in .evidence/template/node_modules) to look
	// for missing deps. In this case, anything that isn't provided by the template will fall back to what the sdk provides.
	await forceLink(
		path.join(projectRoot, 'node_modules', '@evidence-dev', 'sdk', 'node_modules'),
		path.join('.evidence', 'node_modules')
	).catch((e) => {
		console.debug(
			chalk.dim.yellow(
				'Failed to link sdk modules to .evidence/node_modules; this is expected with certain package managers; this is expected with certain package managers'
			)
		);
		console.debug(chalk.dim.yellow(e));
	});

	const pwd = await readdir(projectRoot, { withFileTypes: true });
	if (!pwd.some((item) => item.name === 'pages' && item.isDirectory())) {
		throw new EvidenceError('Project does not contain a `pages` directory, please create one');
	}

	// Copy the routes into the template
	const splitPluginPath = plugin.evidence.layout.routes.destination.split(/[/\\]/);
	const rootTargetDir = path.join('.evidence', 'template', ...splitPluginPath);
	await copyMethods[plugin.evidence.layout.routes.style].copyAll('pages', rootTargetDir);
	// TODO: Apply changes to svelte config to allow markdown files

	console.debug(
		chalk.dim(
			`Using "${plugin.evidence.layout.routes.style}" style to move pages to ${rootTargetDir}`
		)
	);

	const componentsTargetDir = path.join(
		'.evidence',
		'template',
		...plugin.evidence.layout.components.destination.split(/[/\\]/)
	);

	if (pwd.some((item) => item.name === 'components' && item.isDirectory())) {
		await mkdir(componentsTargetDir, { recursive: true });
		await cp(path.join(projectRoot, 'components'), componentsTargetDir, { recursive: true });
	}

	const staticTargetDir = path.join(
		'.evidence',
		'template',
		...plugin.evidence.layout.static.destination.split(/[/\\]/)
	);
	if (pwd.some((item) => item.name === 'static' && item.isDirectory())) {
		await mkdir(staticTargetDir, { recursive: true });
		await cp(path.join(projectRoot, 'static'), staticTargetDir, { recursive: true });
	}

	// TODO: Merge changes to svelte configuration, tailwind configuration, and possibly vite configuration

	return true;
};
