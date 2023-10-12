const getPrismLangs = require('./get-prism-langs.cjs');

/**
 *
 * @param {string} code
 * @param {string} lang
 * @param {string | undefined} meta
 * @returns
 */
function highlighter(code, lang, meta) {
	code = code.replace(/'/g, '&apos;');
	code = code.replace(/"/g, '&quot;');

	// Replace curly braces or Svelte will try to evaluate as a JS expression
	code = code.replace(/{/g, '&lbrace;').replace(/}/g, '&rbrace;');
	if (
		lang &&
		((lang.toLowerCase() === 'sql' && meta) || !getPrismLangs().has(lang.toLowerCase() ?? ''))
	) {
		const queryId = lang.toLowerCase() === 'sql' && meta ? meta : lang;
		return `
        {#if data.${queryId} }
            <QueryViewer pageQueries = {data.evidencemeta.queries} queryID = "${
							queryId ?? 'untitled'
						}" queryResult = {data.${queryId ?? 'untitled'}}/> 
        {/if}
        `;
	}

	if (lang == null) {
		console.error(
			`Missing language for code block. If it was intended to be a query, please add a name. If it was intended to be a code snippet, please add a language.\nFound code:\n${code}\n`
		);
	}

	// Ensure that "real" code blocks are rendered not run as queries
	return `<CodeBlock source="${code}" copyToClipboard=true></CodeBlock>`;
}

module.exports = { highlighter };
