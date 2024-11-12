import { getEvidenceConfig } from '../../../../configuration/getEvidenceConfig.js';
import { addBasePath } from '../../../../utils/svelte/addBasePath.js';

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

		const regex = /(href|src)="([^"]*)"/g;
		const matches = content.matchAll(regex);
		for (const match of matches) {
			const originalContent = match[0];
			const path = match[2];
			if (path) {
				const newPath = addBasePath(path, cfg);
				r = r.replace(originalContent, originalContent.replace(path, newPath));
			}
		}

		return { code: r };
	}
};
