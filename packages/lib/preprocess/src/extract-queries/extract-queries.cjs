const unified = require('unified');
const remarkParse = require('remark-parse');
const visit = require('unist-util-visit');
const fs = require('fs');
const getPrismLangs = require('../utils/get-prism-langs.cjs');
const { parseFrontmatter } = require('../frontmatter/parse-frontmatter.cjs');
const chalk = require('chalk');
/** @typedef {{ id: string, compileError?: string, compiledQueryString: string, inputQueryString: string, compiled: boolean, inline: boolean }} Query */

/** @type {Record<string, boolean>} */
const warnedExternalQueries = {};

/**
 *
 * @param {string} externalQuery
 * @param {string} id
 * @returns {Query | undefined}
 */
const readFileToQuery = (externalQuery, id) => {
	try {
		const content = fs.readFileSync(`./queries/${externalQuery}`).toString().trim();
		return {
			id: id.toLowerCase(),
			compiledQueryString: content,
			inputQueryString: content,
			compiled: false,
			inline: false
		};
	} catch {
		console.warn(`Failed to load sql file ${externalQuery}`);
		return undefined;
	}
};

// Unified parser step to ignore indented code blocks.
// Adapted from the mdsvex source, here: https://github.com/pngwn/MDsveX/blob/master/packages/mdsvex/src/parsers/index.ts
// Discussion & background here:  https://github.com/evidence-dev/evidence/issues/286
/**
 * @this {import('unified').Processor}
 */
const ignoreIndentedCode = function () {
	const Parser = this.Parser;
	const block_tokenizers = Parser.prototype.blockTokenizers;
	block_tokenizers.indentedCode = () => true;
};

/**
 * @param {string} content File content
 * @param {string} [filename] File name
 * @returns {Query[]}
 */
const extractExternalQueries = (content, filename) => {
	const frontmatter = parseFrontmatter(content);
	if (!frontmatter) return [];
	if (!frontmatter.queries) return [];
	if (!Array.isArray(frontmatter.queries)) {
		if (filename) {
			console.warn(
				`Malformed frontmatter found in ${filename}. Unable to extract external queries.`
			);
		} else {
			console.warn('Malformed frontmatter found. Unable to extract external queries.');
		}
		return [];
	}
	/** @type {unknown[]} */
	const queries = frontmatter.queries;

	/**
	 *
	 * @param {string} externalQuery
	 * @returns {boolean}
	 */
	const validateExternalQuery = (externalQuery) => {
		if (!externalQuery.endsWith('.sql')) {
			if (!warnedExternalQueries[externalQuery]) {
				warnedExternalQueries[externalQuery] = true;
				console.warn(
					chalk.bold.red(`! ${externalQuery}`) +
						chalk.gray(' does not appear to be a .sql file, and will not be loaded')
				);
			}
			return false;
		}

		return true;
	};

	return queries
		.map((externalQuery) => {
			if (typeof externalQuery === 'string') {
				if (!validateExternalQuery(externalQuery)) return false;
				const id = externalQuery.split('.sql')[0].replace('/', '_').replace('\\', '_');
				return readFileToQuery(externalQuery, id);
			} else if (externalQuery && typeof externalQuery === 'object') {
				const [usedKey, value] = Object.entries(externalQuery)[0] ?? ['', undefined];

				// Note; this is to be obseleted, as the import syntax evolves, but for now only one key should be used.
				if (Object.keys(externalQuery).length > 1) {
					console.warn(
						`ExternalQuery object has more than one key, this may lead to unintended behavior. Only ${usedKey}: ${value} will be imported.`
					);
				}

				if (!validateExternalQuery(value)) return false;
				return readFileToQuery(value, usedKey);
			}
		})
		.filter((x) => !!x); // filter out queries that returned false;
};

/**
 * @param {string} content Raw File Content
 * @returns {Query[]}
 */
const extractInlineQueries = (content) => {
	/** @type {Query[]} */
	let queries = [];
	let tree = unified().use(remarkParse).use(ignoreIndentedCode).parse(content);
	const prismLangs = getPrismLangs();

	visit(tree, 'code', function (/** @type {import("mdast").Code} */ node) {
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

const strictBuild = process.env.EVIDENCE_STRICT_MODE === 'true';
const circularRefErrorMsg = 'Compiler error: circular reference';

/**
 * @param {string} content
 * @returns {Query[]}
 */
const extractQueries = (content) => {
	/** @type {Query[]} */
	const queries = [];

	// todo: second parameter is filename but we don't have that here?
	queries.push(...extractExternalQueries(content));
	queries.push(...extractInlineQueries(content));

	// Handle query chaining:
	const maxIterations = 15;
	const queryIds = new Set(queries.map((d) => d.id));
	const interpolated_variables = new Set();

	for (let i = 0; i <= maxIterations; i++) {
		queries.forEach((query) => {
			const startTemplateInterpolation = /[^\\](\$\{)/g;
			const validTemplateInterpolation = /[^\\]\$\{((?:.|\s)+?)\}/g;

			/*
				This is a somewhat naive way of looking for invalid template strings
				It currently tests for ${} and ${ cases, but is unable to detect } cases
			*/
			const hasTemplates = startTemplateInterpolation.exec(query.inputQueryString);
			const hasValidTemplates = validTemplateInterpolation.exec(query.inputQueryString);
			if (hasTemplates?.length !== hasValidTemplates?.length) {
				if (query.inputQueryString.includes('${}')) {
					query.compileError = 'Query contains an empty template literal (${})';
				} else {
					query.compileError = 'Query contains invalid template literal (unmatched ${ and }';
				}
				return;
			}

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
							if (!referencedQuery) {
								// should be unreachable
								throw new Error(`Referenced query not found. (Referenced ${referencedQueryID})`);
							}
							if (!query.inline && referencedQuery.inline) {
								throw new Error(
									`Cannot reference inline query from SQL File. (Referenced ${referencedQueryID})`
								);
							}
							const queryString = `(${referencedQuery.compiledQueryString})`;
							query.compiledQueryString = query.compiledQueryString.replace(
								reference,
								// this actually replaces each $ with $$
								// this is to avoid [this behaviour](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement)
								queryString.replaceAll('$', '$$$$')
							);
							query.compiled = true;
						}
					} catch (/** @type {any} */ _e) {
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
