/**
 * Notebook → Evidence display policy.
 *
 * A notebook is an analysis document; an Evidence page is a report. The two
 * disagree about what should be visible, so every cell is resolved against a
 * three-level policy: built-in defaults, notebook-level `metadata.evidence`,
 * then per-cell tags or `metadata.evidence`.
 */

/** The mimetype a notebook uses to hand structured payloads to Evidence. */
export const EVIDENCE_MIME = 'application/vnd.evidence.v1+json';

/**
 * Defaults chosen so that an untouched analysis notebook renders as a report:
 * prose and results are kept, the machinery that produced them is not.
 */
const DEFAULT_POLICY = {
	/** Show the python source of code cells. */
	input: false,
	/** Show rendered cell outputs (tables, plots, rich display data). */
	output: true,
	/** Show stdout/stderr streams. */
	stream: false,
	/** Show tracebacks from cells that raised. */
	errors: true,
	/** Show `In [n]:` style execution counts. */
	prompts: false
};

const TAG_PREFIX = 'evidence:';

/**
 * @typedef {object} DisplayPolicy
 * @property {boolean} input
 * @property {boolean} output
 * @property {boolean} stream
 * @property {boolean} errors
 * @property {boolean} prompts
 * @property {boolean} [skip] cell is dropped entirely
 * @property {boolean} [raw] cell content is emitted as Evidence markup verbatim
 */

/**
 * Coerce the loose truthiness notebook authors write in JSON metadata.
 *
 * @param {unknown} value
 * @param {boolean} fallback
 * @returns {boolean}
 */
const asBool = (value, fallback) => {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const v = value.trim().toLowerCase();
		if (['true', 'yes', 'show', 'on', '1'].includes(v)) return true;
		if (['false', 'no', 'hide', 'off', '0'].includes(v)) return false;
	}
	return fallback;
};

/**
 * Read the notebook-level policy from `metadata.evidence`.
 *
 * @param {Record<string, any>} notebookMetadata
 * @returns {DisplayPolicy}
 */
export const notebookPolicy = (notebookMetadata) => {
	const cfg = notebookMetadata?.evidence ?? {};
	return {
		input: asBool(cfg.show_code ?? cfg.input, DEFAULT_POLICY.input),
		output: asBool(cfg.show_output ?? cfg.output, DEFAULT_POLICY.output),
		stream: asBool(cfg.show_stdout ?? cfg.stream, DEFAULT_POLICY.stream),
		errors: asBool(cfg.show_errors ?? cfg.errors, DEFAULT_POLICY.errors),
		prompts: asBool(cfg.show_prompts ?? cfg.prompts, DEFAULT_POLICY.prompts)
	};
};

/**
 * Layer a cell's own directives over the notebook policy.
 *
 * Recognised tags (also accepted without the `evidence:` prefix, since the
 * conventions below predate this integration and are already in wide use):
 *
 *   evidence:hide           drop the cell entirely
 *   evidence:hide-input     / evidence:show-input
 *   evidence:hide-output    / evidence:show-output
 *   evidence:hide-stdout    / evidence:show-stdout
 *   evidence:raw            emit the cell as Evidence markup verbatim
 *
 * Equivalent nbconvert/jupyterbook tags (`remove-cell`, `remove-input`,
 * `remove-output`, `hide-input`, …) are honoured so existing notebooks keep the
 * behaviour their authors already declared.
 *
 * @param {Record<string, any>} cell
 * @param {DisplayPolicy} base
 * @returns {DisplayPolicy}
 */
export const cellPolicy = (cell, base) => {
	/** @type {DisplayPolicy} */
	const policy = { ...base };

	const tags = /** @type {string[]} */ (cell?.metadata?.tags ?? [])
		.filter((t) => typeof t === 'string')
		.map((t) => t.trim().toLowerCase())
		.map((t) => (t.startsWith(TAG_PREFIX) ? t.slice(TAG_PREFIX.length) : t));

	for (const tag of tags) {
		switch (tag) {
			case 'hide':
			case 'skip':
			case 'remove-cell':
				policy.skip = true;
				break;
			case 'hide-input':
			case 'remove-input':
				policy.input = false;
				break;
			case 'show-input':
				policy.input = true;
				break;
			case 'hide-output':
			case 'remove-output':
				policy.output = false;
				break;
			case 'show-output':
				policy.output = true;
				break;
			case 'hide-stdout':
			case 'remove-stdout':
				policy.stream = false;
				break;
			case 'show-stdout':
				policy.stream = true;
				break;
			case 'raw':
				policy.raw = true;
				break;
			default:
				break;
		}
	}

	// Per-cell metadata wins over tags — it is the more explicit of the two.
	const cfg = cell?.metadata?.evidence;
	if (cfg && typeof cfg === 'object') {
		policy.skip = asBool(cfg.hide ?? cfg.skip, policy.skip ?? false);
		policy.input = asBool(cfg.show_code ?? cfg.input, policy.input);
		policy.output = asBool(cfg.show_output ?? cfg.output, policy.output);
		policy.stream = asBool(cfg.show_stdout ?? cfg.stream, policy.stream);
		policy.errors = asBool(cfg.show_errors ?? cfg.errors, policy.errors);
		policy.raw = asBool(cfg.raw, policy.raw ?? false);
	}

	return policy;
};
