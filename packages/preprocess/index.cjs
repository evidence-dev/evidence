const mdsvex = require("mdsvex");
const getPrismLangs = require('./src/utils/get-prism-langs.cjs')

const addScriptTags = require("./src/add-script-tags.cjs")
const processQueries = require('./src/process-queries.cjs')
// This is includes future proofing to add support for Prism highlighting
const processFrontmatter = require('./src/process-frontmatter/process-frontmatter.cjs')


function highlighter(code, lang) {
    code = code.replace(/'/g, "&apos;");
    code = code.replace(/"/g, "&quot;");

    // Replace curly braces or Svelte will try to evaluate as a JS expression
    code = code.replace(/{/g, "&lbrace;").replace(/}/g,"&rbrace;");
    // Ensure that "real" code blocks are rendered not run as queries
    if (getPrismLangs().has(lang.toLowerCase())) {
        return `<CodeBlock source="${code}" copyToClipboard=true></CodeBlock>`;
    }
    return `
    {#if data.${lang} }
        <QueryViewer pageQueries = {data.evidencemeta.queries} queryID = "${lang ?? 'untitled'}" queryResult = {data.${lang ?? 'untitled'}}/> 
    {/if}
    `;
}

module.exports = function evidencePreprocess(componentDevelopmentMode = false){
    return [
        processQueries(componentDevelopmentMode),
        mdsvex.mdsvex(
            {extensions: [".md"],
            smartypants: {
                quotes: false,
                ellipses: true,
                backticks: true,
                dashes: 'oldschool',
            },
            highlight: {
                highlighter
            },
        }),
        // Add both script tags to all markdown files, if they are missing 
        addScriptTags,
        processFrontmatter()
    ]
} 
