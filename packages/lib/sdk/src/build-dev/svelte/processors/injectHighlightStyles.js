/** @type {import("svelte/types/compiler/preprocess").PreprocessorGroup} */
export const injectHighlightStyles = {
	script: ({ filename, content, attributes }) => {
		// TODO: How does this map with non-sveltekit projects?
		// Maybe we need a <Evidence/> component
		// Could we do this with Vite?
		if (filename?.endsWith('.svelte-kit/generated/root.svelte') && !attributes.context)
			return {
				code: `
import 'highlight.js/styles/hybrid.css';
${content}`
			};
	}
};
