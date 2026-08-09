/**
 * Renderers that turn notebook cell outputs into Evidence markup.
 *
 * A notebook output is a mimebundle: the kernel offers the same value in
 * several representations and the front end picks the richest one it can show.
 * The ordering in `MIME_PRIORITY` is that choice, expressed for Evidence.
 */

import { EVIDENCE_MIME } from './directives.js';
import { checkDatasetName, jsString, jsValue, jsonSafe } from './serialize.js';

/**
 * Richest representation first. `text/markdown` sits near the top because it is
 * the channel a notebook uses to emit Evidence markup — components, SQL blocks
 * and prose — rather than a picture of a result.
 */
const MIME_PRIORITY = [
	EVIDENCE_MIME,
	'text/markdown',
	'image/svg+xml',
	'image/png',
	'image/jpeg',
	'image/gif',
	'image/webp',
	'text/html',
	'application/json',
	'text/latex',
	'text/plain'
];

/** Fenced-code languages Evidence's highlighter recognises. */
const PLAIN_TEXT_LANG = 'code';

/** Extensions for the image mimetypes we persist as assets. */
const IMAGE_EXTENSIONS = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/gif': 'gif',
	'image/webp': 'webp'
};

/** CSI/OSC escape sequences that colour a Jupyter traceback. */
const ANSI_PATTERN = new RegExp('\\u001b\\[[0-9;?]*[ -/]*[@-~]|\\u001b\\][^\\u0007]*\\u0007', 'g');

/**
 * @param {string} text
 * @returns {string}
 */
export const stripAnsi = (text) => text.replace(ANSI_PATTERN, '');

/**
 * Notebook `source` and `text` fields are either a string or a list of lines.
 *
 * @param {unknown} value
 * @returns {string}
 */
export const joinSource = (value) => {
	if (typeof value === 'string') return value;
	if (Array.isArray(value)) return value.join('');
	if (value == null) return '';
	return String(value);
};

/**
 * Wrap text in a fence long enough that the content cannot close it early.
 *
 * The language must be one Evidence's highlighter knows, otherwise the block is
 * reinterpreted as a query reference.
 *
 * @param {string} code
 * @param {string} lang
 * @returns {string}
 */
export const fence = (code, lang = PLAIN_TEXT_LANG) => {
	const longestRun = (code.match(/`+/g) ?? []).reduce((max, run) => Math.max(max, run.length), 0);
	const ticks = '`'.repeat(Math.max(3, longestRun + 1));
	return `${ticks}${lang}\n${code.replace(/\n+$/, '')}\n${ticks}`;
};

/**
 * Pick the representation to render from a mimebundle.
 *
 * @param {Record<string, unknown>} bundle
 * @returns {string | undefined}
 */
const pickMime = (bundle) => MIME_PRIORITY.find((mime) => mime in bundle);

/**
 * HTML that carries its own scripts — plotly, bokeh, altair, folium — cannot be
 * injected with `{@html}` because Svelte will not execute the scripts. Those
 * outputs go into a same-origin `srcdoc` iframe instead, which runs them in
 * isolation and keeps their CSS from leaking into the page.
 *
 * @param {string} html
 * @returns {boolean}
 */
const needsIframe = (html) => /<script[\s>]/i.test(html);

/**
 * @typedef {object} RenderContext
 * @property {(code: string) => void} pushScript adds a statement to the page's instance script
 * @property {(base64: string, ext: string) => string} pushAsset persists a binary asset, returns its URL
 * @property {(name: string, payload: object) => void} pushDataset registers an inline dataset
 * @property {(frontmatter: Record<string, unknown>) => void} pushFrontmatter
 * @property {() => number} nextId
 * @property {(message: string) => void} warn
 * @property {boolean} needsIframeHelper set when at least one iframe was emitted
 */

/**
 * Marker a notebook uses to pass a *page variable* as a component prop rather
 * than a literal — `evidence.ref("revenue")` on the python side.
 */
const REF_KEY = '__evidence_ref__';

/**
 * @param {unknown} value
 * @returns {value is { __evidence_ref__: string }}
 */
const isRef = (value) =>
	!!value &&
	typeof value === 'object' &&
	typeof (/** @type {any} */ (value)[REF_KEY]) === 'string';

/**
 * Build the expression for a component's props.
 *
 * Literal props are serialized as JSON; refs are spliced in as identifiers so a
 * component can be handed a dataset the notebook published.
 *
 * @param {Record<string, any>} props
 * @param {RenderContext} ctx
 * @returns {string}
 */
const propsExpression = (props, ctx) => {
	/** @type {Record<string, unknown>} */
	const literals = {};
	/** @type {string[]} */
	const refs = [];

	for (const [key, value] of Object.entries(props)) {
		if (!isRef(value)) {
			literals[key] = value;
			continue;
		}
		const target = value[REF_KEY];
		const check = checkDatasetName(target);
		if (!check.ok) {
			ctx.warn(`ignoring prop "${key}" — ${check.reason}`);
			continue;
		}
		refs.push(`${JSON.stringify(key)}: ${target}`);
	}

	const literalExpression = jsValue(literals);
	return refs.length ? `Object.assign(${literalExpression}, { ${refs.join(', ')} })` : literalExpression;
};

/**
 * Render a structured Evidence payload emitted by the `evidence` python helper.
 *
 * @param {any} payload
 * @param {RenderContext} ctx
 * @returns {string}
 */
const renderEvidencePayload = (payload, ctx) => {
	if (!payload || typeof payload !== 'object') return '';

	switch (payload.kind) {
		case 'dataset': {
			const name = String(payload.name ?? '');
			const check = checkDatasetName(name);
			if (!check.ok) {
				ctx.warn(`skipping dataset — ${check.reason}`);
				return '';
			}
			ctx.pushDataset(name, {
				rows: jsonSafe(payload.rows ?? []),
				dates: Array.isArray(payload.dates) ? payload.dates : []
			});
			return '';
		}

		case 'markdown':
			// Verbatim: this is how a notebook emits Evidence components and SQL.
			return `${joinSource(payload.value)}\n`;

		case 'component': {
			const name = String(payload.name ?? '');
			if (!/^[A-Z][A-Za-z0-9_]*$/.test(name)) {
				ctx.warn(`skipping component — "${name}" is not a valid component name`);
				return '';
			}
			const id = `__nbk_props_${ctx.nextId()}`;
			ctx.pushScript(`const ${id} = ${propsExpression(payload.props ?? {}, ctx)};`);
			return `<${name} {...${id}} />\n`;
		}

		case 'frontmatter':
			ctx.pushFrontmatter(payload.value ?? {});
			return '';

		default:
			ctx.warn(`unknown Evidence payload kind "${payload.kind}"`);
			return '';
	}
};

/**
 * Render one mimebundle.
 *
 * @param {Record<string, any>} bundle
 * @param {Record<string, any>} metadata
 * @param {RenderContext} ctx
 * @returns {string}
 */
export const renderBundle = (bundle, metadata, ctx) => {
	const mime = pickMime(bundle);
	if (!mime) return '';

	const value = bundle[mime];

	if (mime === EVIDENCE_MIME) {
		return renderEvidencePayload(value, ctx);
	}

	if (mime === 'text/markdown') {
		return `${joinSource(value)}\n`;
	}

	if (mime === 'image/svg+xml') {
		const id = `__nbk_svg_${ctx.nextId()}`;
		ctx.pushScript(`const ${id} = ${jsString(joinSource(value))};`);
		return `<div class="markdown notebook-figure">{@html ${id}}</div>\n`;
	}

	if (mime in IMAGE_EXTENSIONS) {
		const ext = IMAGE_EXTENSIONS[/** @type {keyof typeof IMAGE_EXTENSIONS} */ (mime)];
		const base64 = joinSource(value).replace(/\s/g, '');
		const url = ctx.pushAsset(base64, ext);
		const size = metadata?.[mime] ?? {};
		const width = Number.isFinite(size.width) ? ` width="${size.width}"` : '';
		const height = Number.isFinite(size.height) ? ` height="${size.height}"` : '';
		return `<img src="${url}" alt="Notebook figure"${width}${height} loading="lazy" class="notebook-figure" />\n`;
	}

	if (mime === 'text/html') {
		const html = joinSource(value);
		const id = `__nbk_html_${ctx.nextId()}`;
		ctx.pushScript(`const ${id} = ${jsString(html)};`);

		if (needsIframe(html)) {
			ctx.needsIframeHelper = true;
			return (
				`<iframe title="Notebook output" class="notebook-embed" srcdoc={${id}}` +
				` on:load={__nbk_fitFrame} style="width:100%;height:420px;border:0;display:block" />\n`
			);
		}
		return `<div class="markdown notebook-html">{@html ${id}}</div>\n`;
	}

	if (mime === 'application/json') {
		return `${fence(JSON.stringify(jsonSafe(value), null, 2), 'json')}\n`;
	}

	if (mime === 'text/latex') {
		return `${fence(joinSource(value), PLAIN_TEXT_LANG)}\n`;
	}

	// text/plain
	const text = joinSource(value).trimEnd();
	return text ? `${fence(text, PLAIN_TEXT_LANG)}\n` : '';
};

/**
 * Render every output of a code cell.
 *
 * @param {any[]} outputs
 * @param {import('./directives.js').DisplayPolicy} policy
 * @param {RenderContext} ctx
 * @returns {string}
 */
export const renderOutputs = (outputs, policy, ctx) => {
	/** @type {string[]} */
	const parts = [];

	for (const output of outputs ?? []) {
		switch (output?.output_type) {
			case 'stream': {
				if (!policy.stream) break;
				const text = stripAnsi(joinSource(output.text)).trimEnd();
				if (text) parts.push(fence(text, PLAIN_TEXT_LANG));
				break;
			}

			case 'error': {
				if (!policy.errors) break;
				const traceback = stripAnsi(joinSource(output.traceback ?? []).trim());
				const summary = `${output.ename ?? 'Error'}: ${output.evalue ?? ''}`.trim();
				parts.push(fence(traceback || summary, PLAIN_TEXT_LANG));
				break;
			}

			case 'display_data':
			case 'execute_result': {
				// Evidence payloads are data, not display — they are honoured even
				// when the cell's visible output is suppressed.
				const bundle = output.data ?? {};
				if (!policy.output && !(EVIDENCE_MIME in bundle)) break;

				const rendered = !policy.output
					? renderEvidencePayload(bundle[EVIDENCE_MIME], ctx)
					: renderBundle(bundle, output.metadata ?? {}, ctx);

				if (rendered.trim()) parts.push(rendered.trimEnd());
				break;
			}

			default:
				break;
		}
	}

	return parts.join('\n\n');
};

/**
 * The helper that sizes rich-HTML iframes to their content.
 *
 * Libraries such as plotly lay out asynchronously, so the height is re-measured
 * a couple of times after load rather than once.
 */
export const IFRAME_HELPER = `
	const __nbk_fitFrame = (event) => {
		const frame = event.currentTarget;
		const fit = () => {
			try {
				const doc = frame.contentDocument;
				if (!doc) return;
				const height = Math.max(
					doc.documentElement?.scrollHeight ?? 0,
					doc.body?.scrollHeight ?? 0
				);
				if (height) frame.style.height = height + 8 + 'px';
			} catch (e) {
				// Sandboxed or cross-origin content keeps the default height.
			}
		};
		fit();
		setTimeout(fit, 250);
		setTimeout(fit, 1200);
	};
`;
