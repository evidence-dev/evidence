const mdsvex = require('mdsvex');
const { highlighter } = require('./src/utils/highlighter.cjs');
const addScriptTags = require('./src/add-script-tags.cjs');
const addBlankLines = require('./src/add-blank-lines.cjs');
const processQueries = require('./src/process-queries.cjs');
const addClasses = require('./src/add-classes.cjs');
// This is includes future proofing to add support for Prism highlighting
const processFrontmatter = require('./src/frontmatter/process-frontmatter.cjs');
const injectPartials = require('./src/partials/inject-partials.cjs');
const rehypeSlug = require('rehype-slug');
const rehypeAutolinkHeadings = require('rehype-autolink-headings');

module.exports = function evidencePreprocess(componentDevelopmentMode = false) {
	return [
		injectPartials,
		addScriptTags,
		processQueries.processQueries(componentDevelopmentMode),
		addBlankLines,
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
						'*': 'markdown'
					}
				],
				[rehypeSlug],
				[
					rehypeAutolinkHeadings,
					{
						behavior: 'wrap',
						properties: {}
					}
				]
			]
		}),

		// Add both script tags to all markdown files, if they are missing
		processFrontmatter()
	];
};
module.exports.parseFrontmatter =
	require('./src/frontmatter/parse-frontmatter.cjs').parseFrontmatter;
const extractQueries = require('./src/extract-queries/extract-queries.cjs');
module.exports.extractQueries = extractQueries.extractQueries;
module.exports.getQueryIds = extractQueries.getQueryIds;
module.exports.injectPartials = injectPartials.injectPartials;
module.exports.processQueries = processQueries.processQueries;
module.exports.injectedEvidenceImports = processQueries.injectedEvidenceImports;
