import { getPluginComponents } from '../component-resolution/get-plugin-components';
import autoImport from 'sveltekit-autoimport';

/**
 * @type {() => import("svelte/types/compiler/preprocess").PreprocessorGroup}
 */
export const evidencePlugins = () => {
	const componentPlugins = getPluginComponents();

	const packages = componentPlugins.then((components) => {
		/** @type {Record<string,string[]>} */
		const packages = {};
		for (const [component, data] of Object.entries(components)) {
			if (!packages[data.package]) packages[data.package] = [];
			const import_name = data.aliasOf ? `${data.aliasOf} as ${component}` : component;
			packages[data.package].push(import_name);
		}
		return packages;
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
			const components = await componentPlugins.catch(() => false);
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
