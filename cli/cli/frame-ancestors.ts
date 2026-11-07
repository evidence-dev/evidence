/**
 * Framing policy for serve mode.
 *
 * By default a self-hosted deployment refuses to be framed
 * (`X-Frame-Options: DENY`), which is the right default but leaves no way to
 * embed a report in an iframe on your own page — the usual workaround is a
 * reverse proxy that rewrites the response header, which not every deployment
 * has. `EVIDENCE_FRAME_ANCESTORS` names who may frame it:
 *
 *   EVIDENCE_FRAME_ANCESTORS=self                      same origin as the reports
 *   EVIDENCE_FRAME_ANCESTORS=https://intranet.example  one origin
 *   EVIDENCE_FRAME_ANCESTORS="https://a.example https://b.example"
 *   EVIDENCE_FRAME_ANCESTORS=none                      explicit default
 *
 * Unset, empty or invalid, the answer is DENY: a typo must not silently open a
 * deployment up to framing.
 *
 * `X-Frame-Options` is only emitted where it agrees with the CSP — it has no
 * multi-origin form, and per CSP Level 3 a browser that understands
 * `frame-ancestors` must ignore XFO when both are present. Shipping
 * `SAMEORIGIN` next to a cross-origin allowlist would therefore be a
 * contradiction that only affects browsers predating CSP 2.
 *
 * Lives in cli/cli/ because the adapter copies only that tree into the binary's
 * compile dir.
 */

/** What a browser is told about who may frame a response. */
export type FramingHeaders = {
	'X-Frame-Options'?: string;
	'Content-Security-Policy'?: string;
};

const DENY: FramingHeaders = { 'X-Frame-Options': 'DENY' };

/**
 * `self`, `none` and http(s) origins are the whole grammar, plus CSP's
 * subdomain wildcard (`https://*.example.com`) because a deployment framed by
 * many hosts of one domain is a real case. An origin must be exactly scheme +
 * host + optional port: a path, a query or credentials is a mistake worth
 * failing on rather than guessing at.
 *
 * A bare `*` — CSP for "anybody may frame this" — is deliberately not
 * expressible. This setting exists to name who may frame a deployment, and a
 * value that broad is far more likely to be a shortcut than an intent.
 */
function normalizeSource(raw: string): string | null {
	if (raw === 'self' || raw === "'self'") return "'self'";
	if (raw === 'none' || raw === "'none'") return "'none'";

	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		return null;
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
	if (url.username || url.password) return null;
	if (url.pathname !== '/' && url.pathname !== '') return null;
	if (url.search || url.hash) return null;
	// `new URL` accepts `*` as a hostname, so the wildcard has to be checked
	// here: a subdomain wildcard is fine, a wildcard host on its own is not.
	if (url.hostname === '*') return null;
	if (url.hostname.includes('*') && !url.hostname.startsWith('*.')) return null;
	// Compare against the origin so a trailing slash is accepted but nothing else is.
	if (raw.replace(/\/$/, '') !== url.origin) return null;
	return url.origin;
}

let warned = false;

function warnOnce(value: string, reason: string): void {
	if (warned) return;
	warned = true;
	console.warn(
		`[evidence] Ignoring EVIDENCE_FRAME_ANCESTORS="${value}": ${reason}. ` +
			'Framing stays disabled (X-Frame-Options: DENY).'
	);
}

/**
 * The framing headers for one response.
 *
 * @param value Raw `EVIDENCE_FRAME_ANCESTORS`.
 * @param contentType The response's `Content-Type`. `frame-ancestors` is only
 *   enforced on a document, so the CSP is attached to HTML responses and kept
 *   off JSON and static assets, where a header scan would only find noise.
 */
export function framingHeaders(
	value: string | undefined | null,
	contentType?: string | null
): FramingHeaders {
	// Framing is a property of a document, so anything else keeps the default and
	// a header scan of an asset or an API response looks exactly as it did before.
	if (!isDocument(contentType)) return DENY;

	const raw = (value ?? '').trim();
	if (!raw) return DENY;

	const sources: string[] = [];
	for (const token of raw.split(/[\s,]+/).filter(Boolean)) {
		const source = normalizeSource(token);
		if (!source) {
			warnOnce(raw, `"${token}" is not \`self\`, \`none\` or an http(s) origin`);
			return DENY;
		}
		sources.push(source);
	}
	if (sources.includes("'none'")) {
		if (sources.length > 1) {
			warnOnce(raw, '`none` cannot be combined with other sources');
			return DENY;
		}
		return DENY;
	}

	const headers: FramingHeaders = {
		'Content-Security-Policy': `frame-ancestors ${sources.join(' ')}`
	};
	// XFO only where it cannot contradict the CSP: exactly 'self', nothing else.
	if (sources.length === 1 && sources[0] === "'self'") {
		headers['X-Frame-Options'] = 'SAMEORIGIN';
	}
	return headers;
}

function isDocument(contentType?: string | null): boolean {
	return /^\s*text\/html\b/i.test(contentType ?? '');
}

/** Only for tests: the one-shot warning is process-wide state. */
export function resetFramingWarningForTest(): void {
	warned = false;
}
