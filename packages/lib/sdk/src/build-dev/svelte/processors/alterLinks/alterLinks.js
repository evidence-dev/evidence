import { addBasePath } from '../../../../utils/svelte/addBasePath.js';
import { getEvidenceConfig } from '@evidence-dev/sdk/config';

/** @type {import("@evidence-dev/sdk/config").EvidenceConfig} */
let cfg;

/** @type {import("svelte/types/compiler/preprocess").PreprocessorGroup} */
export const alterLinks = {
	markup: ({ content, filename }) => {
		if (!filename?.endsWith('+page.md')) return;
		if (!cfg) {
			cfg = getEvidenceConfig();
		}
		let r = content;
		const hrefRegex = /href="([^"]*)"/g;
		const matches = content.matchAll(hrefRegex);
		for (const match of matches) {
			const originalContent = match[0];
			const href = match[1];
			if (href) {
				const newHref = addBasePath(href.toString(), cfg);
				r = r.replace(originalContent, originalContent.replace(href, newHref));
			}
		}

		return { code: r };
	}
};
