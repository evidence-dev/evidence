const yaml = require('yaml');
const { containsFrontmatter } = require('./frontmatter.regex.cjs');
/**
 * @param {string} content File Content
 * @returns {any}
 */
const parseFrontmatter = (content) => {
	// Run against regex
	const frontmatter = containsFrontmatter(content);
	if (frontmatter) {
		return yaml.parse(frontmatter) ?? {};
	}

	// No match for frontmatter
	return undefined;
};

module.exports = { parseFrontmatter };
