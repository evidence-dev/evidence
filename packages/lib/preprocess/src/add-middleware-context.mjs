export const addMiddlewareContext = () => {
	/** @type {import("svelte/compiler").PreprocessorGroup} */
	return {
		script: ({ filename, content }) => {
			if (filename.endsWith('+layout.svelte')) {
				return {
					code: `
                    //// Create Middleware Context
                    import { createMiddlewareContext } from '@evidence-dev/sdk/utils';
                    createMiddlewareContext()
                    ////
                    console.log("Injected!")

                    ${content}`
				};
			}
		}
	};
};
