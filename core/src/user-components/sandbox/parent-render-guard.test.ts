import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Companion to `sandbox-attribute-guard.test.ts`. That guard protects the
 * boundary going IN — untrusted author code stays boxed in the opaque-origin
 * iframe. This one protects the boundary going OUT — data that flows through
 * the sandbox components (author-authored bodies, `evidence.variables`,
 * filter values, anything the iframe posts back) must never be rendered as
 * raw HTML in the TRUSTED parent realm.
 *
 * `{@html}` and `innerHTML`/`outerHTML`/`insertAdjacentHTML` in a parent-realm
 * component are the XSS sinks: raw-rendering a sandbox- or filter-derived value
 * there executes in the app's own origin (cookies, session) — defeating the
 * whole point of the sandbox. These components legitimately never need raw HTML
 * rendering (author HTML is injected INSIDE the iframe by the runtime, not the
 * parent), so we forbid the sinks outright.
 *
 * Scope is deliberate. We scan only the sandbox-boundary component dirs, and
 * only `.svelte` files (the parent realm): the one legitimate `innerHTML` —
 * `inject-html.ts` writing author markup into the iframe DOM — is a `.ts`
 * runtime that executes INSIDE the opaque sandbox, so it's excluded. This is
 * NOT a codebase-wide `{@html}` ban: components like `table`, `sparkline`,
 * `commentary`, and `fence` render HTML by design under their own threat
 * models, and are correctly out of scope here.
 */

const REPO_ROOT = resolve(__dirname, '../../../../');

const SCOPED_DIRS = [
	'core/src/user-components/tags/html/',
	'core/src/user-components/tags/custom_map/',
	'core/src/user-components/tags/custom_echart/',
	'core/src/user-components/sandbox/'
];

// `{@html …}` (Svelte raw render) or an assignment to innerHTML/outerHTML, or
// insertAdjacentHTML — the DOM XSS sinks.
const RAW_HTML_SINK = /\{@html\b|\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML/;

const APPROVED_PATHS: string[] = [];

describe('parent-render guard', () => {
	it('sandbox parent components never render raw HTML ({@html} / innerHTML)', () => {
		const stdout = execSync('git ls-files', {
			cwd: REPO_ROOT,
			encoding: 'utf8',
			maxBuffer: 64 * 1024 * 1024
		});
		const files = stdout
			.split('\n')
			.map((f) => f.trim())
			// `.svelte` = parent realm. Runtime `.ts` (e.g. inject-html.ts) runs
			// inside the opaque iframe, where innerHTML is the intended mechanism.
			.filter((f) => f.endsWith('.svelte'))
			.filter((f) => SCOPED_DIRS.some((d) => f.startsWith(d)))
			.filter((f) => !/\.(test|spec)\.[a-z]+$/.test(f));

		const violations: string[] = [];
		for (const relPath of files) {
			const content = readFileSync(resolve(REPO_ROOT, relPath), 'utf8');
			if (!RAW_HTML_SINK.test(content)) continue;
			if (APPROVED_PATHS.includes(relPath)) continue;
			violations.push(relPath);
		}

		// If this fails: a sandbox parent component is raw-rendering HTML. Render
		// author/query/filter values as TEXT (Svelte escapes by default), or move
		// the HTML into the sandbox iframe (where the runtime injects it under the
		// CSP + opaque origin). Only add to APPROVED_PATHS after a security review
		// confirms the rendered value can never be attacker-influenced.
		expect(violations).toEqual([]);
	});
});
