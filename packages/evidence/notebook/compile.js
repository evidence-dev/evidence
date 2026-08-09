/**
 * Compile a Jupyter notebook into an Evidence page.
 *
 * The output is ordinary Evidence markdown, so a notebook page is not a second
 * class of page: it is routed, preprocessed, queried, prerendered and themed by
 * exactly the same pipeline as a hand-written `.md` file. Everything Evidence
 * can do on a `.md` page, it can do on an `.ipynb` page.
 */

import { createHash } from 'node:crypto';
import { cellPolicy, notebookPolicy, EVIDENCE_MIME } from './directives.js';
import { IFRAME_HELPER, joinSource, fence, renderOutputs } from './outputs.js';
import { jsValue, yamlFrontmatter } from './serialize.js';

/** Keys in `metadata.evidence` that configure rendering rather than the page. */
const POLICY_KEYS = new Set([
	'show_code',
	'input',
	'show_output',
	'output',
	'show_stdout',
	'stream',
	'show_errors',
	'errors',
	'show_prompts',
	'prompts'
]);

/** Matches the query ids Evidence will declare for the page's SQL blocks. */
const SQL_QUERY_ID = /^[ \t]*```sql\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;

/** A `<script>` that is not the module script — Svelte allows only one. */
const INSTANCE_SCRIPT_OPEN = /<script(?![^>]*context\s*=\s*["']module["'])[^>]*>/;

/** Raised when a file cannot be read as a notebook. */
export class NotebookParseError extends Error {}

/**
 * @param {string} source raw `.ipynb` file contents
 * @returns {any}
 */
const parseNotebook = (source) => {
	let notebook;
	try {
		notebook = JSON.parse(source);
	} catch (e) {
		throw new NotebookParseError(`not valid JSON — ${/** @type {Error} */ (e).message}`);
	}

	if (!notebook || typeof notebook !== 'object') {
		throw new NotebookParseError('notebook is empty');
	}
	if (!Array.isArray(notebook.cells)) {
		throw new NotebookParseError(
			'no "cells" array — nbformat 3 and earlier are not supported, re-save the notebook in Jupyter'
		);
	}
	return notebook;
};

/**
 * The language used for fenced source blocks, taken from the notebook kernel.
 *
 * Falls back to `code`, which Evidence's highlighter accepts, because an
 * unrecognised language would be reinterpreted as a query reference.
 *
 * @param {any} notebook
 * @returns {string}
 */
const sourceLanguage = (notebook) => {
	const raw = notebook?.metadata?.language_info?.name ?? notebook?.metadata?.kernelspec?.language;
	const lang = typeof raw === 'string' ? raw.toLowerCase() : '';
	const known = ['python', 'sql', 'r', 'javascript', 'typescript', 'julia', 'bash', 'shell'];
	// `sql` is deliberately excluded: a fenced sql block would be captured by
	// Evidence as a query rather than displayed as source.
	if (lang === 'sql') return 'code';
	return known.includes(lang) ? lang : 'code';
};

/**
 * Notebook-level `metadata.evidence`, minus the rendering policy, becomes the
 * page's frontmatter — so `title`, `description`, `og`, `sidebar` and every
 * other Evidence frontmatter key work from a notebook.
 *
 * @param {any} notebook
 * @returns {Record<string, unknown>}
 */
const baseFrontmatter = (notebook) => {
	const cfg = notebook?.metadata?.evidence;
	if (!cfg || typeof cfg !== 'object') return {};

	/** @type {Record<string, unknown>} */
	const frontmatter = {};
	for (const [key, value] of Object.entries(cfg)) {
		if (!POLICY_KEYS.has(key)) frontmatter[key] = value;
	}
	return frontmatter;
};

/**
 * Build the page's instance script.
 *
 * @param {object} args
 * @param {Map<string, object>} args.datasets
 * @param {string[]} args.statements
 * @param {boolean} args.needsIframeHelper
 * @returns {string}
 */
const buildScript = ({ datasets, statements, needsIframeHelper }) => {
	/** @type {string[]} */
	const lines = [];

	if (datasets.size > 0) {
		lines.push(
			'// Datasets published from the notebook with evidence.data(...).',
			`const __nbk_datasets = ${jsValue(Object.fromEntries(datasets))};`,
			'/** Revive ISO date columns so time-series components get real Dates. */',
			'const __nbk_revive = (name) => {',
			'\tconst { rows, dates } = __nbk_datasets[name];',
			'\tif (dates?.length) {',
			'\t\tfor (const row of rows) {',
			'\t\t\tfor (const key of dates) {',
			'\t\t\t\tconst value = row[key];',
			"\t\t\t\tif (typeof value === 'string' || typeof value === 'number') {",
			'\t\t\t\t\trow[key] = new Date(value);',
			'\t\t\t\t}',
			'\t\t\t}',
			'\t\t}',
			'\t}',
			'\treturn rows;',
			'};'
		);
		for (const name of datasets.keys()) {
			lines.push(`const ${name} = __nbk_revive(${JSON.stringify(name)});`);
		}
	}

	lines.push(...statements);
	if (needsIframeHelper) lines.push(IFRAME_HELPER.trim());

	return lines.join('\n');
};

/** Styling for generated figures and embedded HTML results. */
const NOTEBOOK_STYLES = `
<style>
	img.notebook-figure {
		display: block;
		height: auto;
	}
	.notebook-figure,
	.notebook-html {
		margin: 1rem 0;
		max-width: 100%;
		overflow-x: auto;
	}
	.notebook-html :global(table) {
		border-collapse: collapse;
		font-size: 0.8125rem;
		width: auto;
	}
	.notebook-html :global(th),
	.notebook-html :global(td) {
		border-bottom: 1px solid var(--grey-200, #e5e7eb);
		padding: 0.25rem 0.75rem;
		text-align: right;
		white-space: nowrap;
	}
	.notebook-html :global(th) {
		font-weight: 600;
		text-align: left;
	}
	.notebook-embed {
		margin: 1rem 0;
	}
</style>
`.trim();

/**
 * Splice generated declarations into a `<script>` the notebook author already
 * wrote, so a page never ends up with two instance scripts.
 *
 * @param {string} body
 * @param {string} script
 * @returns {string | null} the merged body, or null when there is no such script
 */
const mergeIntoExistingScript = (body, script) => {
	const match = INSTANCE_SCRIPT_OPEN.exec(body);
	if (!match) return null;
	const insertAt = match.index + match[0].length;
	return `${body.slice(0, insertAt)}\n${script}\n${body.slice(insertAt)}`;
};

/**
 * @typedef {object} CompileOptions
 * @property {string} [assetUrlBase] URL prefix the generated asset links use
 * @property {string} [assetDir] path fragment assets are written under, relative to the asset root
 *
 * @typedef {object} CompileResult
 * @property {string} markdown the Evidence page
 * @property {{ path: string, base64: string }[]} assets binary outputs to persist
 * @property {string[]} datasetNames datasets published by the notebook
 * @property {string[]} warnings non-fatal problems worth surfacing
 */

/**
 * @param {string} source raw `.ipynb` contents
 * @param {CompileOptions} [options]
 * @returns {CompileResult}
 */
export const compileNotebook = (source, options = {}) => {
	const { assetUrlBase = '/_notebook', assetDir = '' } = options;

	const notebook = parseNotebook(source);
	const basePolicy = notebookPolicy(notebook.metadata ?? {});
	const language = sourceLanguage(notebook);

	/** @type {Record<string, unknown>} */
	let frontmatter = baseFrontmatter(notebook);

	/** @type {Map<string, object>} */
	const datasets = new Map();
	/** @type {string[]} */
	const statements = [];
	/** @type {{ path: string, base64: string }[]} */
	const assets = [];
	/** @type {string[]} */
	const warnings = [];

	let counter = 0;

	/** @type {import('./outputs.js').RenderContext} */
	const ctx = {
		nextId: () => counter++,
		pushScript: (code) => statements.push(code),
		pushDataset: (name, payload) => {
			if (datasets.has(name)) {
				warnings.push(`dataset "${name}" was published more than once — the last one wins`);
			}
			datasets.set(name, payload);
		},
		pushFrontmatter: (extra) => {
			frontmatter = { ...frontmatter, ...extra };
		},
		pushAsset: (base64, ext) => {
			const hash = createHash('sha1').update(base64).digest('hex').slice(0, 16);
			const fileName = `${hash}.${ext}`;
			const assetPath = assetDir ? `${assetDir}/${fileName}` : fileName;
			if (!assets.some((a) => a.path === assetPath)) assets.push({ path: assetPath, base64 });
			return `${assetUrlBase.replace(/\/$/, '')}/${assetPath}`;
		},
		warn: (message) => warnings.push(message),
		needsIframeHelper: false
	};

	/** @type {string[]} */
	const blocks = [];

	for (const cell of notebook.cells) {
		const policy = cellPolicy(cell, basePolicy);
		if (policy.skip) continue;

		const content = joinSource(cell?.source);

		if (cell?.cell_type === 'markdown') {
			if (content.trim()) blocks.push(content.trimEnd());
			continue;
		}

		if (cell?.cell_type === 'raw') {
			// Raw cells are the escape hatch to hand-written Evidence markup.
			if (content.trim()) blocks.push(content.trimEnd());
			continue;
		}

		if (cell?.cell_type !== 'code') continue;

		if (policy.input && content.trim()) {
			const prompt =
				policy.prompts && cell.execution_count != null ? `In [${cell.execution_count}]:\n\n` : '';
			blocks.push(`${prompt}${fence(content.trimEnd(), language)}`);
		}

		const rendered = renderOutputs(cell.outputs ?? [], policy, ctx);
		if (rendered.trim()) blocks.push(rendered.trimEnd());
	}

	let body = blocks.join('\n\n');

	// A dataset that shares a name with a SQL query would be declared twice in
	// the same script and fail to compile — catch it here where we can explain.
	const queryIds = new Set(Array.from(body.matchAll(SQL_QUERY_ID), (m) => m[1]));
	for (const name of datasets.keys()) {
		if (queryIds.has(name)) {
			warnings.push(
				`dataset "${name}" collides with the SQL query of the same name — rename one of them`
			);
		}
	}

	const script = buildScript({
		datasets,
		statements,
		needsIframeHelper: ctx.needsIframeHelper
	});

	if (script.trim()) {
		const merged = mergeIntoExistingScript(body, script);
		body = merged ?? `${body}\n\n<script>\n${script}\n</script>\n`;
	}

	// Svelte permits a single top-level <style>; defer to the author's if present.
	if (!/<style[\s>]/.test(body)) {
		body = `${body}\n\n${NOTEBOOK_STYLES}\n`;
	}

	const header = yamlFrontmatter(frontmatter);

	return {
		markdown: `${header}${header ? '\n' : ''}${body}\n`,
		assets,
		datasetNames: [...datasets.keys()],
		warnings
	};
};

/**
 * A page that reports why a notebook could not be compiled.
 *
 * Rendering the failure keeps the dev server up and puts the error where the
 * author is already looking, instead of only in the terminal.
 *
 * @param {string} notebookPath
 * @param {Error} error
 * @returns {string}
 */
export const compileErrorPage = (notebookPath, error) => {
	const detail = `${error.name === 'NotebookParseError' ? '' : `${error.name}: `}${error.message}`;
	return [
		yamlFrontmatter({ title: 'Notebook could not be rendered' }),
		'',
		`Evidence could not compile \`${notebookPath}\`.`,
		'',
		fence(detail, 'code'),
		''
	].join('\n');
};

export { EVIDENCE_MIME };
