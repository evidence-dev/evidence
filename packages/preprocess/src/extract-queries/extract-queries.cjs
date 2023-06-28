const unified = require('unified');
const remarkParse = require('remark-parse');
const visit = require('unist-util-visit');
const fs = require('fs');
const getPrismLangs = require('../utils/get-prism-langs.cjs');
const { parseFrontmatter } = require('../frontmatter/parse-frontmatter.cjs');
const chalk = require('chalk');
/** @typedef {{id: string, compiledQueryString: string, inputQueryString: string, compiled: boolean, inline: boolean}} Query */

const warnedSources = {};

/**
 *
 * @param {string} source
 * @param {string} id
 * @returns Query
 */
const readFileToQuery = (source, id) => {
	try {
		const content = fs.readFileSync(`./sources/${source}`).toString().trim();
		return {
			id: id.toLowerCase(),
			compiledQueryString: content,
			inputQueryString: content,
			compiled: false,
			inline: false
		};
	} catch {
		console.warn(`Failed to load sql file ${source}`);
	}
};

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
		console.warn(`Malformed frontmatter found in ${filename}. Unable to extract external queries.`);
		return [];
	}

	/**
	 *
	 * @param {string} source
	 * @returns {boolean}
	 */
	const validateSource = (source) => {
		if (!source.endsWith('.sql')) {
			if (!warnedSources[source]) {
				warnedSources[source] = true;
				console.warn(
					chalk.bold.red(`! ${source}`) +
						chalk.gray(' does not appear to be a .sql file, and will not be loaded')
				);
			}
			return false;
		}

		return true;
	};

	/**
	 * @type Query[]
	 */
	return frontmatter.sources
		.map((source) => {
			if (typeof source === 'string') {
				if (!validateSource(source)) return false;
				const id = source.split('.sql')[0].replace('/', '_').replace('\\', '_');
				return readFileToQuery(source, id);
			} else if (typeof source === 'object') {
				const usedKey = Object.keys(source)?.[0] ?? '';

				const value = source[usedKey];
				// Note; this is to be obseleted, as the import syntax evolves, but for now only one key should be used.
				if (Object.keys(source).length > 1) {
					console.warn(
						`Source object has more than one key, this may lead to unintended behavior. Only ${usedKey}: ${value} will be imported.`
					);
				}

				if (!validateSource(value)) return false;
				return readFileToQuery(value, usedKey);
			}
		})
		.filter(Boolean); // filter out queries that returned false;
};

/**
 * @param {string} content Raw File Content
 * @returns {Query[]}
 */
const extractInlineQueries = (content) => {
	let queries = [];
	let tree = unified().use(remarkParse).use(ignoreIndentedCode).parse(content);
	const prismLangs = getPrismLangs();

	visit(tree, 'code', function (node) {
		let id = node.lang ?? 'untitled';
		if (id.toLowerCase() === 'sql' && node.meta) {
			id = node.meta;
		}
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

const strictBuild = process.env.VITE_BUILD_STRICT === 'true';
const circularRefErrorMsg = 'Compiler error: circular reference';

/**
 * @param {string} filename
 * @returns {Query[]}
 */
const extractQueries = (content) => {
	const queries = [];

	queries.push(...extractExternalQueries(content));
	queries.push(...extractInlineQueries(content));

	// Handle query chaining:
	const maxIterations = 15;
	const queryIds = new Set(queries.map((d) => d.id));
	const interpolated_variables = new Set();

	for (let i = 0; i <= maxIterations; i++) {
		queries.forEach((query) => {
			const references = query.compiledQueryString.match(/\${.*?\}/gi);
			if (references && references.some((d) => !interpolated_variables.has(d))) {
				references.forEach((reference) => {
					try {
						const referencedQueryID = reference.replace('${', '').replace('}', '').trim();
						if (!queryIds.has(referencedQueryID)) {
							interpolated_variables.add(reference);
						} else if (i >= maxIterations) {
							throw new Error(circularRefErrorMsg);
						} else {
							const referencedQuery = queries.find((d) => d.id === referencedQueryID);
							if (!query.inline && referencedQuery.inline) {
								throw new Error(
									`Cannot reference inline query from SQL File. (Referenced ${referencedQueryID})`
								);
							}
							const queryString = `(${referencedQuery.compiledQueryString})`;
							query.compiledQueryString = query.compiledQueryString.replace(reference, queryString);
							query.compiled = true;
						}
					} catch (_e) {
						// if error is unknown use default circular ref. error
						const e =
							_e.message === undefined || _e.message === null ? Error(circularRefErrorMsg) : _e;
						query.compileError = e.message;
						query.compiledQueryString = e.message;
						// if build is strict and we detect an error, force a failure
						if (strictBuild) {
							throw new Error(e.message);
						}
					}
				});
			}
		});
	}

	return queries;
};

/**
 *
 * @param {string} content File Content
 *
 * @param {string} content File Content
 * @returns {string[]}
 */
const getQueryIds = (content) => {
	return extractQueries(content).map((q) => q.id);
};

module.exports = {
	extractQueries,
	getQueryIds
};
