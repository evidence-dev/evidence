const mdsvex = require('mdsvex');
const { highlighter } = require('./src/utils/highlighter.cjs');
const addScriptTags = require('./src/add-script-tags.cjs');
const processQueries = require('./src/process-queries.cjs');
const addClasses = require('./src/add-classes.cjs');
// This is includes future proofing to add support for Prism highlighting
const processFrontmatter = require('./src/frontmatter/process-frontmatter.cjs');

module.exports = function evidencePreprocess(componentDevelopmentMode = false) {
	return [
		processQueries(componentDevelopmentMode),
		mdsvex.mdsvex({
			extensions: ['.md'],
			smartypants: {
				quotes: false,
				ellipses: true,
				backticks: true,
				dashes: 'oldschool'
			},
			highlight: {
				highlighter
			},
			rehypePlugins: [
				[
					addClasses,
					{
						/* 'p': 'is-md' */
					}
				]
			]
		}),
		// Add both script tags to all markdown files, if they are missing
		addScriptTags,
		processFrontmatter()
	];
};
module.exports.parseFrontmatter =
	require('./src/frontmatter/parse-frontmatter.cjs').parseFrontmatter;
const extractQueries = require('./src/extract-queries/extract-queries.cjs');
module.exports.extractQueries = extractQueries.extractQueries;
module.exports.getQueryIds = extractQueries.getQueryIds;
