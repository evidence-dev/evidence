/**
 * Native Jupyter notebook pages for Evidence.
 *
 * A `.ipynb` file in `pages/` is a page: it routes, hot-reloads, runs SQL,
 * renders components and builds exactly like a `.md` page, because it is
 * compiled to one before the existing pipeline ever sees it.
 *
 * This module is the whole of the notebook layer. It has no dependencies beyond
 * Node builtins, and nothing else in Evidence depends on it — a project with no
 * notebooks behaves exactly as it did before.
 */

import fs from 'fs-extra';
import path from 'path';
import { compileNotebook, compileErrorPage, NotebookParseError } from './compile.js';

export { compileNotebook, compileErrorPage, NotebookParseError };

/** The page extension this module claims. */
export const NOTEBOOK_EXTENSION = '.ipynb';

/** Directory Jupyter writes autosaves into; never a page. */
const CHECKPOINT_DIR = '.ipynb_checkpoints';

/** Where compiled notebook assets are written, relative to the template root. */
const ASSET_ROOT = path.join('static', '_notebook');

/** URL prefix those assets are served from. */
const ASSET_URL_BASE = '/_notebook';

/**
 * @param {string} filePath
 * @returns {boolean}
 */
export const isNotebook = (filePath) =>
	filePath.endsWith(NOTEBOOK_EXTENSION) && !filePath.split(/[\\/]/).includes(CHECKPOINT_DIR);

/**
 * Chokidar patterns for notebook artefacts that must never become pages.
 *
 * @type {string[]}
 */
export const NOTEBOOK_IGNORE_PATTERNS = [`**/${CHECKPOINT_DIR}/**`, `**/*-checkpoint.ipynb`];

/**
 * Map a notebook inside the template's pages directory onto the SvelteKit page
 * it compiles to — the same shape `.md` pages use.
 *
 * `pages/sales.ipynb`       -> `pages/sales/+page.md`
 * `pages/sales/index.ipynb` -> `pages/sales/+page.md`
 *
 * @param {string} targetPath path under the template's `src/pages`
 * @returns {string}
 */
export const notebookPagePath = (targetPath) => {
	const dir = path.dirname(targetPath);
	const base = path.basename(targetPath);

	if (base === `index${NOTEBOOK_EXTENSION}`) return path.join(dir, '+page.md');
	return path.join(dir, base.slice(0, -NOTEBOOK_EXTENSION.length), '+page.md');
};

/**
 * A stable, filesystem-safe key for one notebook, used to namespace its assets
 * so recompiling a notebook cannot orphan or collide with another's figures.
 *
 * @param {string} sourcePath path of the notebook within the project
 * @returns {string}
 */
const notebookSlug = (sourcePath) =>
	sourcePath
		.replace(/\\/g, '/')
		.replace(/^\.\//, '')
		.replace(/^pages\//, '')
		.replace(new RegExp(`${NOTEBOOK_EXTENSION.replace('.', '\\.')}$`), '')
		.replace(/[^A-Za-z0-9/_-]/g, '-')
		.replace(/\//g, '__') || 'notebook';

/**
 * Compile a notebook and write the page and its assets into the template.
 *
 * Compilation never throws: a notebook that cannot be parsed produces a page
 * that says so, which keeps the dev server running and puts the error in front
 * of the person editing the notebook.
 *
 * @param {object} args
 * @param {string} args.sourcePath notebook path within the project
 * @param {string} args.pagePath destination `+page.md` inside the template
 * @param {string} args.templateRoot template directory, e.g. `.evidence/template`
 * @returns {{ warnings: string[], error?: Error, datasetNames: string[] }}
 */
export const writeNotebookPage = ({ sourcePath, pagePath, templateRoot }) => {
	const slug = notebookSlug(sourcePath);
	const assetDir = path.join(templateRoot, ASSET_ROOT, slug);

	let result;
	try {
		result = compileNotebook(fs.readFileSync(sourcePath, 'utf8'), {
			assetUrlBase: ASSET_URL_BASE,
			assetDir: slug
		});
	} catch (e) {
		const error = /** @type {Error} */ (e);
		fs.outputFileSync(pagePath, compileErrorPage(sourcePath, error));
		return { warnings: [], error, datasetNames: [] };
	}

	// Rewrite the notebook's asset directory wholesale so removed figures do not
	// linger between edits.
	fs.removeSync(assetDir);
	for (const asset of result.assets) {
		fs.outputFileSync(
			path.join(templateRoot, ASSET_ROOT, asset.path),
			Buffer.from(asset.base64, 'base64')
		);
	}

	fs.outputFileSync(pagePath, result.markdown);

	return { warnings: result.warnings, datasetNames: result.datasetNames };
};

/**
 * Remove a compiled notebook page and its assets.
 *
 * @param {object} args
 * @param {string} args.sourcePath
 * @param {string} args.pagePath
 * @param {string} args.templateRoot
 */
export const removeNotebookPage = ({ sourcePath, pagePath, templateRoot }) => {
	fs.removeSync(pagePath);
	fs.removeSync(path.join(templateRoot, ASSET_ROOT, notebookSlug(sourcePath)));
};
