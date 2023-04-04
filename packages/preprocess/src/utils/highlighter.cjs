const getPrismLangs = require('./get-prism-langs.cjs');

function highlighter(code, lang) {
	code = code.replace(/'/g, '&apos;');
	code = code.replace(/"/g, '&quot;');

    // Replace curly braces or Svelte will try to evaluate as a JS expression
    code = code.replace(/{/g, "&lbrace;").replace(/}/g,"&rbrace;");
    // Ensure that "real" code blocks are rendered not run as queries
    if (getPrismLangs().has(lang?.toLowerCase() ?? "")) {
        return `<CodeBlock source="${code}" copyToClipboard=true></CodeBlock>`;
    }
    return `
    {#if data.${lang} }
        <QueryViewer pageQueries = {data.evidencemeta.queries} queryID = "${
					lang ?? 'untitled'
				}" queryResult = {data.${lang ?? 'untitled'}}/> 
    {/if}
    `;
}

module.exports = { highlighter };
