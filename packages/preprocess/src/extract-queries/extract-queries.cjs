const unified = require("unified");
const remarkParse = require("remark-parse");
const visit = require("unist-util-visit");
const fs = require("fs");
const getPrismLangs = require('../utils/get-prism-langs.cjs')
const {
  parseFrontmatter,
} = require("../process-frontmatter/parse-frontmatter.cjs");

/** @typedef {{id: string, compiledQueryString: string, inputQueryString: string, compiled: boolean, inline: boolean}} Query */


// Unified parser step to ignore indented code blocks.
// Adapted from the mdsvex source, here: https://github.com/pngwn/MDsveX/blob/master/packages/mdsvex/src/parsers/index.ts
// Discussion & background here:  https://github.com/evidence-dev/evidence/issues/286
const ignoreIndentedCode = function () {
  const Parser = this.Parser;
  const block_tokenizers = Parser.prototype.blockTokenizers;
  block_tokenizers.indentedCode = () => true;
};

/**
 * @param {string} content File content
 * @param {string} filename File name
 * @returns {Query[]}
 */
const extractExternalQueries = (content, filename) => {
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) return [];
  if (!frontmatter.sources) return [];
  if (!Array.isArray(frontmatter.sources)) {
    console.warn(
      `Malformed frontmatter found in ${filename}. Unable to extract external queries.`
    );
  }

  /**
   * @type Query[]
   */
  return frontmatter.sources.map((source) => {
    if (typeof source === "string") {
      const id = source.split(".sql")[0].replace("/", "_").replace("\\", "_");
      const content = fs.readFileSync(`./sources/${source}`).toString().trim();
      return {
        id,
        compiledQueryString: content,
        inputQueryString: content,
        compiled: false,
        inline: false,
      };
    }
  });
};

/**
 * @param {string} content Raw File Content
 * @returns {Query[]}
 */
const extractInlineQueries = (content) => {
  let queries = [];
  let tree = unified().use(remarkParse).use(ignoreIndentedCode).parse(content);
  const prismLangs = getPrismLangs()

  visit(tree, "code", function (node) {
    let id = node.lang ?? "untitled";
    if (!prismLangs.has(id.toLowerCase()) && id.toLowerCase() !== 'plaintext') {
      // Prevent prism code blocks from being interpreted as queries
      let compiledQueryString = node.value.trim(); // refs get compiled and sent to db orchestrator
      let inputQueryString = compiledQueryString; // original, as written
      let compiled = false; // default flag, switched to true if query is compiled
      queries.push({
        id,
        compiledQueryString,
        inputQueryString,
        compiled,
        inline: true
      });
    }
  });
  return queries;
};

/**
 * @param {string} filename
 * @returns {Query[]}
 */
const extractQueries = (content) => {
  const queries = [];

  queries.push(...extractExternalQueries(content));
  queries.push(...extractInlineQueries(content));
  return queries;
};

/**
 * 
 * @param {string} content File Content 
 * @returns {string[]}
 */
const getQueryIds = (content) => {
  return extractQueries(content).map((q) => q.id);
};

module.exports = {
  extractQueries,
  getQueryIds,
};
