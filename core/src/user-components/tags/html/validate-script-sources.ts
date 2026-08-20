/**
 * Static detection of `<script src>` / ES-`import` loads in an {% html %} body
 * that point at a host NOT on the sandbox's script allowlist (SCRIPT_CDN_ORIGINS).
 *
 * Why this exists: the sandbox CSP silently blocks a script from an
 * off-allowlist CDN — the library never loads, the author's code throws a
 * ReferenceError deep inside, and the block renders BLANK. That's the single
 * most confusing failure of the html block, and unlike a normal error it has
 * no obvious cause in the visible frame. Catching the statically-visible cases
 * (a literal `src=` URL or a literal `import "https://…"`) at validate time —
 * before anything renders — turns a blank block into an actionable warning,
 * and lets the AI agent's validate pass fix it without a wasted render cycle.
 *
 * Scope, deliberately narrow to keep false-positives near zero:
 *  - Only literal, absolute http(s) URLs are checked. A computed src, a bare
 *    specifier (`import x from "d3"`), or a relative path is skipped — we can't
 *    know the host, and the runtime CSP diagnostic still backstops those.
 *  - Only SCRIPT loads (`<script src>` + `import`) are checked, NOT `fetch`/XHR
 *    targets: the connect allowlist is broader and data fetches are dynamic, so
 *    flagging them would be noisy (and a blocked fetch already surfaces its own
 *    runtime diagnostic).
 *  - A script with a mid-edit syntax error is skipped (its `src` is still
 *    checked via the tag regex) — we never surface syntax errors here, matching
 *    the block's deliberate tolerance of transient invalid JS.
 */

import * as acorn from 'acorn';
import { SCRIPT_CDN_ORIGINS } from './sandbox/html-csp';

export interface BlockedScriptSource {
	/** The literal URL as written by the author. */
	url: string;
	/** Its resolved origin (e.g. `https://cdn.skypack.dev`), which failed the allowlist. */
	host: string;
}

// Captures a script element's opening-tag attributes (group 1) and inner JS
// (group 2). `</script>` cannot legally appear inside inline script text, so
// the lazy match is safe.
const SCRIPT_TAG_REGEX = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const SRC_ATTR_REGEX = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i;

const ALLOWED_ORIGINS = new Set<string>(SCRIPT_CDN_ORIGINS);

/**
 * Resolve a URL string to its origin, or null when it isn't a concrete remote
 * http(s) load we can (and should) allowlist-check. Protocol-relative `//host`
 * is resolved as https (the sandbox is always https).
 */
function remoteOrigin(raw: string): string | null {
	const url = raw.trim();
	if (!url) return null;
	const withScheme = url.startsWith('//') ? `https:${url}` : url;
	try {
		const parsed = new URL(withScheme);
		if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
		return parsed.origin;
	} catch {
		return null;
	}
}

/** Collect literal string sources from every `import`/`export … from` in a script AST. */
function collectImportSources(tree: acorn.Node): string[] {
	const out: string[] = [];
	const visit = (node: unknown): void => {
		if (!node || typeof node !== 'object') return;
		const n = node as Record<string, unknown>;
		if (typeof n.type === 'string') {
			const type = n.type;
			if (
				type === 'ImportDeclaration' ||
				type === 'ExportNamedDeclaration' ||
				type === 'ExportAllDeclaration' ||
				type === 'ImportExpression'
			) {
				const src = n.source as { type?: string; value?: unknown } | undefined;
				if (src && src.type === 'Literal' && typeof src.value === 'string') out.push(src.value);
			}
		}
		for (const key in n) {
			const value = n[key];
			if (Array.isArray(value)) for (const item of value) visit(item);
			else if (value && typeof value === 'object') visit(value);
		}
	};
	visit(tree);
	return out;
}

/**
 * Return every off-allowlist script/module source in `htmlBody`, deduped by
 * URL. Empty when the body has no scripts, no external loads, or only
 * allowlisted ones.
 */
export function findBlockedScriptSources(htmlBody: string): BlockedScriptSource[] {
	if (!htmlBody) return [];

	const out: BlockedScriptSource[] = [];
	const seen = new Set<string>();

	const record = (url: string): void => {
		const host = remoteOrigin(url);
		if (host === null || ALLOWED_ORIGINS.has(host)) return;
		if (seen.has(url)) return;
		seen.add(url);
		out.push({ url, host });
	};

	for (const match of htmlBody.matchAll(SCRIPT_TAG_REGEX)) {
		const attrs = match[1] ?? '';
		const inner = match[2] ?? '';

		const srcMatch = attrs.match(SRC_ATTR_REGEX);
		const src = srcMatch?.[1] ?? srcMatch?.[2];
		if (src) record(src);

		// Only parse when an `import` could be present — the parse is the
		// expensive part, and most inline scripts are classic (no imports).
		if (inner.includes('import')) {
			try {
				const tree = acorn.parse(inner, {
					// Match the runtime/`extract-filter-creates` parse so a body that
					// runs in the sandbox never trips a false parse failure here.
					ecmaVersion: 'latest',
					sourceType: 'module',
					allowAwaitOutsideFunction: true,
					allowReturnOutsideFunction: true
				});
				for (const source of collectImportSources(tree)) record(source);
			} catch {
				// Transient/invalid JS — skip this script's imports (src already handled).
			}
		}
	}

	return out;
}
