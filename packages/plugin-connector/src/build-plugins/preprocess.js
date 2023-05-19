import { getPluginComponents } from '../component-resolution/get-plugin-components';

/**
 * TODO: Can we do this all in one processor, or do we need multiple?
 * @type {() => import("svelte/types/compiler/preprocess").PreprocessorGroup}
 */
export const evidencePlugins = () => {
	const componentPlugins = getPluginComponents();
	return {
		/** @type {import("svelte/types/compiler/preprocess").MarkupPreprocessor}} */
		markup: async () => {
			await componentPlugins.catch();
			// TODO: Dynamically import components 😎
		},
		/** @type {import("svelte/types/compiler/preprocess").Preprocessor}} */
		style: async () => {},
		/** @type {import("svelte/types/compiler/preprocess").Preprocessor}} */
		script: async () => {
			await componentPlugins.catch();
		}
	};
};
