const frontmatterRegex = /^\s*---((?:.|\s)+?)---/;
/**
 * @param {string} toCheck
 * @returns {string | false}
 */
const containsFrontmatter = (toCheck) => frontmatterRegex.exec(toCheck)?.[1] ?? false;
module.exports = {
	frontmatterRegex,
	containsFrontmatter
};
