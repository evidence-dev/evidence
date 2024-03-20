import chalk from 'chalk';
import { getAllComponents } from '../../../../plugins/components/getAllComponents.js';
import autoImport from 'sveltekit-autoimport';

/**
 * @type {() => import("svelte/types/compiler/preprocess").PreprocessorGroup}
 */
export const injectComponents = () => {
	const componentPlugins = getAllComponents();

	const packages = componentPlugins
		.then((components) => {
			/** @type {Record<string,string[]>} */
			const packs = {};
			for (const [component, data] of Object.entries(components)) {
				if (!packs[data.name]) packs[data.name] = [];
				const import_name = data.aliasOf ? `${data.aliasOf} as ${component}` : component;
				packs[data.name].push(import_name);
			}
			return packs;
		})
		.catch((e) => {
			console.warn(chalk.yellow('Failed to load component plugins'), e);
			return {};
		});

	const autoImporter = packages.then((packages) =>
		autoImport({
			include: ['**/*.(svelte|md)'],
			module: packages,
			components: [{ directory: '../../components', flat: true }]
		})
	);

	return {
		/** @type {import("svelte/types/compiler/preprocess").MarkupPreprocessor}} */
		markup: async ({ content, filename }) => {
			if (filename?.endsWith('.svelte')) return; /* Don't autoimport into svelte files */
			const components = await componentPlugins.catch((e) => {
				console.debug(e);
				return false;
			});
			if (!components) {
				return;
			}

			const { markup: autoimport_process_markup } = await autoImporter;

			return autoimport_process_markup({ content, filename });
		},
		/** @type {import("svelte/types/compiler/preprocess").Preprocessor}} */
		style: async () => {},
		/** @type {import("svelte/types/compiler/preprocess").Preprocessor}} */
		script: async () => {}
	};
};
