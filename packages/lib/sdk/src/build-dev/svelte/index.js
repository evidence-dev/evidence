import seqPreprocessor from 'svelte-sequential-preprocessor';

import { addScriptTags } from './processors/addScriptTags.js';
import { convertToHtml } from './processors/convertToHtml/convertToHtml.js';
import { extractQueries } from './processors/extractQueries/extractQueries.js';
import { initUniversalSql } from './processors/initializeUniversalSql.js';
import { injectHighlightStyles } from './processors/injectHighlightStyles.js';
import { injectQueries } from './processors/injectQueries/injectQueries.js';
import { obfuscateCode } from './processors/obfuscateCode/obfuscateCode.js';
import { transformQueries } from './processors/transformQueries/transformQueries.js';
import { highlight } from './processors/highlight/highlight.js';
import { injectComponents } from './processors/injectComponents/injectComponents.js';
import { alterLinks } from './processors/alterLinks/alterLinks.js';
/**
 * @typedef {Object} EvidencePreprocessOptions
 * @property {boolean} [escapeCode = true] If false, disables the b64 escaping of codeblock content
 * @property {boolean} [highlight = true] If false, disables the auto highlight of code blocks
 */

/**
 * @param {EvidencePreprocessOptions} opts
 * @returns {import("svelte/types/compiler/preprocess").PreprocessorGroup}
 */
export const svelte = (opts = {}) => {
	/** @type {Array<import('svelte/types/compiler/preprocess').PreprocessorGroup>} */
	const processors = [];
	processors.push(convertToHtml);
	processors.push(addScriptTags);
	processors.push(extractQueries);
	if (opts.highlight !== false) processors.push(highlight);
	if (opts.escapeCode !== false) processors.push(obfuscateCode);
	processors.push(transformQueries);
	processors.push(injectHighlightStyles);
	processors.push(injectQueries);
	processors.push(initUniversalSql);
	processors.push(injectComponents());
	processors.push(alterLinks);

	// @ts-expect-error Typescript is upset about this for some reason
	return seqPreprocessor(processors);
};

export {
	addScriptTags,
	convertToHtml,
	extractQueries,
	highlight,
	injectHighlightStyles,
	injectQueries,
	initUniversalSql,
	injectComponents,
	transformQueries,
	alterLinks as alterLinks
};
