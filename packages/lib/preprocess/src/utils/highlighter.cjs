const getPrismLangs = require('./get-prism-langs.cjs');

/**
 *
 * @param {string} code
 * @param {string} lang
 * @param {string} [meta]
 * @returns
 */
function highlighter(code, lang, meta) {
	code = code.replace(/'/g, '&apos;');
	code = code.replace(/"/g, '&quot;');

	// Replace curly braces or Svelte will try to evaluate as a JS expression
	code = code.replace(/{/g, '&lbrace;').replace(/}/g, '&rbrace;');
	if ((lang?.toLowerCase() === 'sql' && meta) || !getPrismLangs().has(lang?.toLowerCase() ?? '')) {
		const queryId = lang?.toLowerCase() === 'sql' && meta ? meta : lang;
		return `
        {#if ${queryId} }
            <QueryViewer
                queryID = "${queryId ?? 'untitled'}"
                queryResult = {${queryId ?? 'untitled'}}
            /> 
        {/if}
        `;
	}
	// Ensure that "real" code blocks are rendered not run as queries
	return `<CodeBlock source="${code}" copyToClipboard=true language="${lang}"/>`;
}

module.exports = { highlighter };
