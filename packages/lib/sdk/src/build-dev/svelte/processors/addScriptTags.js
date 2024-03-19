/**
 * @type {import("svelte/types/compiler/preprocess").PreprocessorGroup}
 */
export const addScriptTags = {
	markup({ content }) {
		// Make sure that we have script tags; without this we won't be able to preprocess them
		if (!content.match(/<script(.*)>/)) {
			return { code: '<script context="module"> </script>' + '<script> </script>' + content };
		}
		if (!content.match(/<script(.*)context="module"(.*)>/)) {
			return { code: '<script context="module"> </script>' + content };
		}
		if (!content.match(/<script(.*)>/)) {
			return { code: '<script> </script>' + content };
		}
	}
};
