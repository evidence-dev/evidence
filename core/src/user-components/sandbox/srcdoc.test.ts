import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildSandboxSrcdoc, buildDefaultSandboxCsp } from './srcdoc';

const ORIGIN = 'https://app.example.com';
const RUNTIME_URL = `${ORIGIN}/sandbox/echart-runtime.js?v=2`;

describe('buildSandboxSrcdoc', () => {
	const srcdoc = buildSandboxSrcdoc({
		origin: ORIGIN,
		runtimeUrl: RUNTIME_URL,
		bodyHtml: '<div id="mount"></div>'
	});
	const csp = srcdoc.match(/content="([^"]*)"/)?.[1] ?? '';

	it('loads the runtime as a classic script from the consumer-provided URL', () => {
		expect(srcdoc).toContain(`<script src="${RUNTIME_URL}"></script>`);
	});

	it('embeds the consumer-provided body markup before the runtime script', () => {
		expect(srcdoc).toMatch(/<div id="mount"><\/div>\s*<script src=/);
	});

	it('names the explicit origin in script-src (CSP self does not match an opaque origin)', () => {
		expect(csp).toContain(`script-src ${ORIGIN} 'unsafe-eval'`);
		expect(csp).not.toContain(`script-src 'self'`);
	});

	it('locks network egress: connect-src none and no remote img/script schemes', () => {
		expect(csp).toContain(`default-src 'none'`);
		expect(csp).toContain(`connect-src 'none'`);
		// img beacons are a real exfiltration channel — data:/blob: only, never remote.
		expect(csp).toContain(`img-src data: blob:`);
		expect(csp).not.toMatch(/img-src[^;]*https?:/);
		expect(csp).not.toMatch(/script-src[^;]*\bhttps?:(?!\/\/app\.example\.com)/);
	});

	it('blocks workers, nested frames, and base/form hijacking', () => {
		expect(csp).toContain(`worker-src 'none'`);
		expect(csp).toContain(`child-src 'none'`);
		expect(csp).toContain(`frame-src 'none'`);
		expect(csp).toContain(`base-uri 'none'`);
		expect(csp).toContain(`form-action 'none'`);
	});

	it('uses the locked-down default CSP when none is passed', () => {
		// The default path must remain byte-identical to buildDefaultSandboxCsp
		// — that's the security baseline every consumer inherits unless it
		// explicitly opts into a different policy.
		expect(csp).toBe(buildDefaultSandboxCsp(ORIGIN));
	});

	it('embeds a consumer-provided CSP verbatim instead of the default', () => {
		// The html block needs allowlisted CDN scripts; this is the seam it
		// uses. The override must land in the meta tag unchanged — and crucially
		// the default's connect-src none is NOT silently re-added.
		const custom = `default-src 'none'; script-src ${ORIGIN} https://cdn.jsdelivr.net; connect-src 'none'`;
		const withCustom = buildSandboxSrcdoc({
			origin: ORIGIN,
			runtimeUrl: RUNTIME_URL,
			bodyHtml: '<div id="mount"></div>',
			csp: custom
		});
		const embedded = withCustom.match(/content="([^"]*)"/)?.[1] ?? '';
		expect(embedded).toBe(custom);
		expect(embedded).not.toContain(`worker-src 'none'`);
	});
});

// The single highest-severity invariant: the iframe must be allow-scripts
// WITHOUT allow-same-origin. Combining them lets the frame strip its own
// sandbox and reach parent cookies/DOM — a one-token foot-gun. Guard it at
// the source level since core tests run in node (no DOM to render the
// component into). Lives here (alongside the CSP tests) because the iframe
// element is now defined inside the shared SandboxFrame, not per-consumer.
describe('SandboxFrame iframe isolation invariant', () => {
	const source = readFileSync(new URL('./SandboxFrame.svelte', import.meta.url), 'utf8');

	it('sandboxes with exactly allow-scripts', () => {
		expect(source).toContain('sandbox="allow-scripts"');
	});

	it('never grants allow-same-origin (would collapse the sandbox)', () => {
		expect(source).not.toContain('allow-same-origin');
	});
});
