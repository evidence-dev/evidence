/**
 * @type {(componentDevelopmentMode: boolean) => import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
module.exports = () => {
	/**
	 * This ensures that we don't read ./handle-og.svelte more than once
	 * @type {string}
	 */
	let handleOgContent;
	return {
		markup: ({ content, filename }) => {
			if (typeof filename === 'undefined') return;
			if (!filename.endsWith('+page.md')) return;
			if (!handleOgContent) handleOgContent = require('./handle-og.cjs');
			return {
				code: handleOgContent + content
			};
		},
		script: ({ content, filename, attributes }) => {
			if (!filename?.endsWith('+page.md')) return;
			if (attributes.context === 'module') {
				if (!content.includes('export const metadata =')) {
					// There is no frontmatter, and we want to make sure that it as at least defined.
					// Technically this won't _break_ things, just spam the logs with a vite warning.
					return { code: content + ';const metadata = undefined;' };
				} else {
					// exporting makes tailwind break HMR
					return { code: content.replace('export const metadata =', 'const metadata =') };
				}
			} else {
				return { code: 'import { addBasePath } from "@evidence-dev/sdk/utils/svelte";' + content };
			}
		}
	};
};
