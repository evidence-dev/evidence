const mdsvex = require('mdsvex');
const { highlighter } = require('./src/utils/highlighter.cjs');
const addScriptTags = require('./src/add-script-tags.cjs');
const processQueries = require('./src/process-queries.cjs');
const addClasses = require('./src/add-classes.cjs');
// This is includes future proofing to add support for Prism highlighting
const processFrontmatter = require('./src/frontmatter/process-frontmatter.cjs');
const injectPartials = require('./src/partials/inject-partials.cjs');

const tracing = require("./src/utils/trace");
const debounce = require('lodash.debounce');

let traceIdx = 0
module.exports = function evidencePreprocess(componentDevelopmentMode = false) {
	let [root] = tracing.start("Preprocessing", { "runIdx": traceIdx++ })
	let realStopTime = new Date()
	const stop = debounce(() => {
		tracing.stop(root, undefined)
		root = tracing.start("Preprocessing", { "runIdx": traceIdx++ })[0]
		tracing.fileTraces.reset()
	}, 3000)

	const processors = [
		/** @type {import("svelte-preprocess/dist/types").PreprocessorGroup} */
		{
			markup: ({ filename }) => {
				if (!filename) return
				if (tracing.fileTraces.has(filename)) return
				const [trace] = tracing.start(`ProcessFile`, {filename}, root)
				tracing.fileTraces.set(filename, trace)
			}
		},
		injectPartials,
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
						'*': 'markdown'
					}
				]
			]
		}),
		// Add both script tags to all markdown files, if they are missing
		addScriptTags,
		processFrontmatter(),
		{
			script: ({ filename }) => {
				if (!filename) return

				if (!tracing.fileTraces.has(filename)) {
					return
				}
				tracing.stop(tracing.fileTraces.get(filename))
				realStopTime = new Date()
				stop()
			}
		},
	];

	return processors
};
module.exports.parseFrontmatter =
	require('./src/frontmatter/parse-frontmatter.cjs').parseFrontmatter;
const extractQueries = require('./src/extract-queries/extract-queries.cjs');
module.exports.extractQueries = extractQueries.extractQueries;
module.exports.getQueryIds = extractQueries.getQueryIds;
module.exports.injectPartials = injectPartials.injectPartials;
