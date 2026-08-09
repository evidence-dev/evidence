/**
 * Serialization helpers for embedding notebook payloads into a generated
 * Evidence page.
 *
 * Everything that originates in a notebook is machine generated, so none of it
 * can be trusted to be safe for Svelte's markup parser. Strings therefore never
 * reach the markup layer directly: they are emitted as JS string literals inside
 * the page's `<script>` block and referenced from markup by identifier.
 */

/**
 * U+2028 / U+2029 are legal inside a JSON string but terminate a JavaScript
 * string literal, so they have to be re-escaped after `JSON.stringify`.
 *
 * Built from char codes rather than written literally — as characters they are
 * invisible in source and do not survive most editors.
 */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);
const LINE_SEPARATORS = new RegExp(`[${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, 'g');

/**
 * Encode a string as a JS string literal that is safe to place inside a
 * `<script>` block in a Svelte component.
 *
 * `JSON.stringify` handles quoting and control characters. On top of that we
 * escape `<` and `>` so a payload can never terminate the script element.
 *
 * @param {string} str
 * @returns {string}
 */
export const jsString = (str) =>
	JSON.stringify(str)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(LINE_SEPARATORS, (c) => (c === LINE_SEPARATOR ? '\\u2028' : '\\u2029'));

/**
 * Encode an arbitrary JSON-serializable value as an expression that reproduces
 * it at runtime.
 *
 * `JSON.parse` of a literal is both smaller and faster to evaluate than an
 * inline object literal, and it sidesteps every parser that sits between here
 * and the browser.
 *
 * @param {unknown} value
 * @returns {string}
 */
export const jsValue = (value) => `JSON.parse(${jsString(JSON.stringify(value ?? null))})`;

/**
 * Replace values JSON cannot represent so a dataset can never produce a page
 * that fails to parse.
 *
 * `NaN`/`Infinity` are the realistic offenders — they arrive from numpy via
 * notebooks that were written with a non-strict JSON encoder.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
export const jsonSafe = (value) => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (value === null || typeof value !== 'object') return value;
	if (Array.isArray(value)) return value.map(jsonSafe);
	if (value instanceof Date) return value.toISOString();
	/** @type {Record<string, unknown>} */
	const out = {};
	for (const [k, v] of Object.entries(/** @type {Record<string, unknown>} */ (value))) {
		out[k] = jsonSafe(v);
	}
	return out;
};

/** Identifiers that would shadow something Evidence injects into the page. */
const RESERVED_NAMES = new Set([
	'data',
	'props',
	'browser',
	'Query',
	'fmt',
	'profile',
	'toasts',
	'routeHash',
	'pageHasQueries',
	'hasUnsetValues',
	'setQueryFunction',
	'ensureInputContext',
	'inputs',
	'params'
]);

const VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * @param {string} name
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export const checkDatasetName = (name) => {
	if (!VALID_IDENTIFIER.test(name)) {
		return {
			ok: false,
			reason: `"${name}" is not a valid identifier — use letters, digits and underscores, starting with a letter`
		};
	}
	if (RESERVED_NAMES.has(name)) {
		return { ok: false, reason: `"${name}" is reserved by Evidence — pick another name` };
	}
	return { ok: true };
};

/**
 * Emit a YAML frontmatter block.
 *
 * Values are written as JSON, which YAML accepts: scalars stay readable and
 * correctly quoted, and anything nested becomes a JSON flow collection.
 *
 * @param {Record<string, unknown>} frontmatter
 * @returns {string} the block including delimiters, or '' when there is nothing to emit
 */
export const yamlFrontmatter = (frontmatter) => {
	const entries = Object.entries(frontmatter).filter(([, v]) => v !== undefined);
	if (entries.length === 0) return '';

	const lines = entries.map(([key, value]) => `${key}: ${JSON.stringify(jsonSafe(value))}`);
	return `---\n${lines.join('\n')}\n---\n`;
};
