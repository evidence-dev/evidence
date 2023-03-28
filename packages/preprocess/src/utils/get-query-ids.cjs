const unified = require('unified')
const parse = require('remark-parse')
const visit = require('unist-util-visit')
const getPrismLangs = require('./get-prism-langs.cjs')


// Unified parser step to ignore indented code blocks. 
// Adapted from the mdsvex source, here: https://github.com/pngwn/MDsveX/blob/master/packages/mdsvex/src/parsers/index.ts
// Discussion & background here:  https://github.com/evidence-dev/evidence/issues/286
const ignoreIndentedCode = function() {
	const Parser = this.Parser;
	const block_tokenizers = Parser.prototype.blockTokenizers;
	block_tokenizers.indentedCode = () => true;
}


/**
 * @param {string} content 
 * @returns {string[]}
 */
const getQueryIds = function (content) {
    let queryIds = [];
    // Parse the markdown file content into a tree  
    let tree = unified()
        .use(parse)
        .use(ignoreIndentedCode)
        .parse(content)

    // Visit all the code blocks
    visit(tree, 'code', function(node) {
        let id = node.lang ?? 'untitled'
         // Prevent "real" code blocks from being interpreted as queries
         if (!getPrismLangs().has(id.toLowerCase())){
             queryIds.push(id)
         }
    });
    return queryIds;
}

module.exports = {getQueryIds}