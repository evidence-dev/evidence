import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Regression guard: the `sandbox=` attribute on an `<iframe>` element is the
 * single highest-severity invariant of the html/echart sandbox. It's the only
 * thing that gives the embedded code an opaque origin and blocks parent-DOM /
 * cookie access. Misconstruct it once — drop `allow-scripts` (frame
 * inert), add `allow-same-origin` (escape hatch open), or fail to set it at
 * all (full host access) — and the entire isolation story collapses.
 *
 * The chosen defense is centralization: every sandboxed iframe in the codebase
 * goes through `SandboxFrame.svelte`, which constructs the literal sandbox
 * attribute exactly once, tested at both source (srcdoc.test.ts) and DOM
 * (SandboxFrame.test.ts) level. This test enforces "centralization" by
 * asserting that no other file in the workspace constructs an `<iframe sandbox=…>`
 * directly — so a future "let me just spin up another sandboxed iframe here"
 * either uses SandboxFrame (and gets all its hardening) or fails this test
 * and forces the conversation.
 *
 * The companion file `IFrame.svelte` (the `{% iframe %}` user component) does
 * NOT use the sandbox attribute by design — it's a transparent embed for
 * Loom / YouTube / arbitrary URLs. That's a different feature with a
 * different threat model and is not in scope here.
 */

const REPO_ROOT = resolve(__dirname, '../../../../');
const APPROVED_PATHS = ['core/src/user-components/sandbox/SandboxFrame.svelte'];

const IFRAME_SANDBOX_PATTERN = /<iframe\b[\s\S]{0,200}?\bsandbox\s*=/;

describe('sandbox-attribute guard', () => {
	it('the `<iframe sandbox=…>` construction lives only in SandboxFrame.svelte', () => {
		// `git ls-files` enumerates tracked source files (respects .gitignore,
		// no node_modules, fast). We then filter for source files we care
		// about — tests are excluded deliberately because test files routinely
		// reference `sandbox=` as a string for assertions.
		const stdout = execSync('git ls-files', {
			cwd: REPO_ROOT,
			encoding: 'utf8',
			maxBuffer: 64 * 1024 * 1024
		});
		const files = stdout
			.split('\n')
			.map((f) => f.trim())
			.filter((f) => /\.(ts|svelte)$/.test(f))
			.filter((f) => !/\.(test|spec)\.[a-z]+$/.test(f));

		const violations: string[] = [];
		for (const relPath of files) {
			const content = readFileSync(resolve(REPO_ROOT, relPath), 'utf8');
			if (!IFRAME_SANDBOX_PATTERN.test(content)) continue;
			if (APPROVED_PATHS.includes(relPath)) continue;
			violations.push(relPath);
		}

		// If this fails: route the new iframe through `SandboxFrame.svelte` —
		// don't construct the sandbox attribute inline. If you genuinely need
		// a parallel sandbox implementation, get a security review first and
		// then add the path to APPROVED_PATHS here with a comment explaining
		// why a second implementation is justified.
		expect(violations).toEqual([]);
	});
});
