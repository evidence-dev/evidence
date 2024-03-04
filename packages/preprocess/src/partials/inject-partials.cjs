const fs = require('fs');
const path = require('path');
const tracing = require("../utils/trace")

/**
 * @param {string} originalString
 * @returns {string}
 */
function injectPartials(originalString) {
	const r = /\{@partial\s+"(.*?)"\s*\}/g;

	for (const match of originalString.matchAll(r) ?? []) {
		const filename = match[1];
		// There is an error with parcel that prevents the use of the "path" library.
		const content = fs.readFileSync(`./partials/${filename}`).toString();

		originalString = originalString.replace(match[0], content);
	}

	return originalString;
}

/**
 * @type {import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
module.exports = {
	markup: ({ content, filename }) => {
		if (typeof filename === 'undefined') return;
		if (!filename.endsWith('+page.md')) return;
		console.assert(tracing.fileTraces.has(filename), "Missing file!")
		return {
			code: tracing.trace(
				"injectPartials",
				() => injectPartials(content),
				undefined,
				tracing.fileTraces.get(filename)
			)
		};
	},
	injectPartials
};
