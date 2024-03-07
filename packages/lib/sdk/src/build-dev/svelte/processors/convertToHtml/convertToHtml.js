import { processMarkdown } from './processMarkdown.js';

/**
 * @type {import("svelte/types/compiler/preprocess").PreprocessorGroup}
 */
export const convertToHtml = {
	markup: async ({ filename, content }) => {
		/** @type {string} */
		let htmlContent = content;

		if (filename?.endsWith('.md')) {
			htmlContent = await processMarkdown(content, filename);
		}

		// TODO: Other languages?

		return { code: htmlContent };
	}
};
