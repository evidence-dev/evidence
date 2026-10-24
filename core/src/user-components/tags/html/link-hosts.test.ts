import { describe, it, expect } from 'vitest';
import {
	extractLinkHostsFromSource,
	parseLinkHostsAttribute,
	isLinkHostAllowed,
	linkHostOf,
	blockedLinkHostMessage
} from './link-hosts';

describe('extractLinkHostsFromSource', () => {
	it('finds hosts in hrefs, template strings, and plain text — the zero-config case', () => {
		const source = `
<a href="https://support.example.com/tickets/42">Open</a>
<script>
	card.addEventListener("click", () => {
		evidence.openUrl(\`https://crm.example.com/accounts/\${r.id}\`);
	});
	// see http://docs.example.com:8080/guide
</script>`;
		expect(extractLinkHostsFromSource(source)).toEqual(
			new Set(['support.example.com', 'crm.example.com', 'docs.example.com:8080'])
		);
	});

	it('lowercases hosts and stops at path, query, quote, or whitespace', () => {
		expect(extractLinkHostsFromSource('HTTPS://Support.Example.COM/x?y')).toEqual(
			new Set(['support.example.com'])
		);
		expect(extractLinkHostsFromSource("openUrl('https://a.example')")).toEqual(
			new Set(['a.example'])
		);
		expect(extractLinkHostsFromSource('https://a.example https://b.example')).toEqual(
			new Set(['a.example', 'b.example'])
		);
	});

	it('normalizes like a destination: default ports dropped, Unicode → punycode, IPv6 kept', () => {
		// `URL.host` on the destination drops :443/:80, so the allowlist must too
		// or `https://example.com:443/path` would block its own named host.
		expect(extractLinkHostsFromSource('https://example.com:443/path http://a.example:80/')).toEqual(
			new Set(['example.com', 'a.example'])
		);
		expect(extractLinkHostsFromSource('https://bücher.example/x')).toEqual(
			new Set(['xn--bcher-kva.example'])
		);
		expect(extractLinkHostsFromSource('http://[::1]:8080/x')).toEqual(new Set(['[::1]:8080']));
		expect(extractLinkHostsFromSource('https://user:pw@a.example/x')).toEqual(
			new Set(['a.example'])
		);
	});

	it('stops at a template substitution right after the host', () => {
		// `https://support.example.com${row.path}` — the host is literal even
		// though the path is not; it must not be read as `…com${row.path}`.
		const allowed = extractLinkHostsFromSource(
			'evidence.openUrl(`https://support.example.com${row.path}`)'
		);
		expect(allowed).toEqual(new Set(['support.example.com']));
		expect(isLinkHostAllowed('https://support.example.com/tickets/42', allowed)).toBe(true);
		expect(extractLinkHostsFromSource('`https://a.example:${port}/x`')).toEqual(
			new Set(['a.example'])
		);
		// A bare `$` is not a substitution — literal credentials still resolve.
		expect(
			extractLinkHostsFromSource('https://reader:pa$$word@support.example.com/tickets/42')
		).toEqual(new Set(['support.example.com']));
	});

	it('does not swallow prose punctuation after a URL', () => {
		expect(extractLinkHostsFromSource('see https://a.example, then https://b.example; ok')).toEqual(
			new Set(['a.example', 'b.example'])
		);
	});

	it('does not pick up a host assembled at runtime (the dynamic case needs linkHosts)', () => {
		const source = `evidence.openUrl("https://" + host + "/x"); evidence.openUrl(row.url);`;
		expect(extractLinkHostsFromSource(source)).toEqual(new Set());
	});

	it('ignores non-http schemes and protocol-relative URLs', () => {
		expect(
			extractLinkHostsFromSource('mailto:x@evil.com //evil.com javascript:alert(1) ftp://evil.com')
		).toEqual(new Set());
	});
});

describe('parseLinkHostsAttribute', () => {
	it('splits on commas and whitespace, lowercases, and keeps non-default ports', () => {
		const hosts = parseLinkHostsAttribute(
			'Support.Example.com, crm.example.com  tools.example.com:8443'
		);
		expect(hosts).toEqual(
			expect.arrayContaining(['support.example.com', 'crm.example.com', 'tools.example.com:8443'])
		);
	});

	it('normalizes default ports so a.example:443 matches an https destination', () => {
		const hosts = parseLinkHostsAttribute('a.example:443 b.example:80');
		expect(hosts).toContain('a.example');
		expect(hosts).toContain('b.example');
		expect(isLinkHostAllowed('https://a.example/x', new Set(hosts))).toBe(true);
		expect(isLinkHostAllowed('http://b.example/x', new Set(hosts))).toBe(true);
	});

	it('tolerates an accidental scheme or path', () => {
		expect(parseLinkHostsAttribute('https://support.example.com/tickets/')).toEqual([
			'support.example.com'
		]);
	});

	it('allows https://example.com:443/path when the block names example.com (round trip)', () => {
		const allowed = extractLinkHostsFromSource('<a href="https://example.com:443/path">x</a>');
		expect(isLinkHostAllowed('https://example.com:443/path', allowed)).toBe(true);
		expect(isLinkHostAllowed('https://example.com/other', allowed)).toBe(true);
	});

	it('returns nothing for empty or non-string input', () => {
		expect(parseLinkHostsAttribute('')).toEqual([]);
		expect(parseLinkHostsAttribute(' , ')).toEqual([]);
		expect(parseLinkHostsAttribute(undefined)).toEqual([]);
		expect(parseLinkHostsAttribute(42)).toEqual([]);
	});
});

describe('isLinkHostAllowed', () => {
	const allowed = new Set(['support.example.com', 'tools.example.com:8443']);

	it('allows a URL whose host (incl. port) is named', () => {
		expect(isLinkHostAllowed('https://support.example.com/tickets/42?x=1', allowed)).toBe(true);
		expect(isLinkHostAllowed('https://SUPPORT.example.com/', allowed)).toBe(true);
		expect(isLinkHostAllowed('https://tools.example.com:8443/a', allowed)).toBe(true);
	});

	it('blocks hosts that are not named — including lookalikes, subdomains, and port mismatches', () => {
		// The exfiltration case: data stuffed into a URL to a host the author never wrote.
		expect(isLinkHostAllowed('https://attacker.example/?d=rows', allowed)).toBe(false);
		expect(isLinkHostAllowed('https://support.example.com.evil.net/', allowed)).toBe(false);
		expect(isLinkHostAllowed('https://evil.net/support.example.com', allowed)).toBe(false);
		expect(isLinkHostAllowed('https://api.support.example.com/', allowed)).toBe(false);
		expect(isLinkHostAllowed('https://tools.example.com/', allowed)).toBe(false);
		// userinfo trick: the host is actually evil.net.
		expect(isLinkHostAllowed('https://support.example.com@evil.net/', allowed)).toBe(false);
	});

	it('blocks unparseable input and an empty allowlist', () => {
		expect(isLinkHostAllowed('not a url', allowed)).toBe(false);
		expect(isLinkHostAllowed('https://support.example.com/', new Set())).toBe(false);
	});
});

describe('linkHostOf', () => {
	it('returns host:port lowercased, or null when unparseable', () => {
		expect(linkHostOf('https://A.Example:8080/p')).toBe('a.example:8080');
		expect(linkHostOf('https://a.example/p')).toBe('a.example');
		expect(linkHostOf('nope')).toBeNull();
	});
});

describe('blockedLinkHostMessage', () => {
	it('names the blocked host and hands over the exact linkHosts line to add', () => {
		const message = blockedLinkHostMessage('https://support.example.com/tickets/42');
		expect(message).toContain('"https://support.example.com/tickets/42"');
		expect(message).toContain('linkHosts="support.example.com"');
		expect(message).toContain('{% html %}');
	});
});
