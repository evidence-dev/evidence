/** @type {import("svelte/types/compiler/preprocess").PreprocessorGroup} */
export const initUniversalSql = {
	script: ({ filename, content, attributes }) => {
		// TODO: How does this map with non-sveltekit projects?
		if (filename?.endsWith('.svelte-kit/generated/root.svelte') && !attributes.context) {
			return {
				code: `
import "$evidence/initUsql"
import bootstrapContexts from "$evidence/bootstrapContexts.svelte.js"
bootstrapContexts()
${content}`
			};
		}
	}
};
