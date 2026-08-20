// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { injectAndRun, htmlHasScript } from './inject-html';

describe('htmlHasScript', () => {
	it('detects script tags (any casing/attributes/self-spacing)', () => {
		expect(htmlHasScript('<div></div><script>foo()</script>')).toBe(true);
		expect(htmlHasScript('<SCRIPT src="x"></SCRIPT>')).toBe(true);
		expect(htmlHasScript('<script type="module">import "x"</script>')).toBe(true);
	});

	it('is false for purely declarative markup', () => {
		expect(htmlHasScript('<div class="chart"><p>hi</p></div>')).toBe(false);
		expect(htmlHasScript('')).toBe(false);
		// "script" as plain text (not a tag) must not match — no blank-frame risk.
		expect(htmlHasScript('<p>the script said hi</p>')).toBe(false);
	});
});

const root = () => document.getElementById('evidence-html-root');

beforeEach(() => {
	document.body.innerHTML = '';
});

describe('injectAndRun', () => {
	it('mounts static markup into the root element', async () => {
		await injectAndRun('<div id="viz" class="chart">hello</div><p>more</p>');
		expect(root()).not.toBeNull();
		expect(root()!.querySelector('#viz')?.textContent).toBe('hello');
		expect(root()!.querySelectorAll('p')).toHaveLength(1);
	});

	it('replaces previous content on a second call (no accumulation)', async () => {
		await injectAndRun('<span class="a">1</span>');
		await injectAndRun('<span class="b">2</span>');
		expect(root()!.querySelectorAll('.a')).toHaveLength(0);
		expect(root()!.querySelectorAll('.b')).toHaveLength(1);
	});

	it('wraps a classic inline script in an async IIFE (the transformation)', async () => {
		await injectAndRun(`<div></div><script>const v = await Promise.resolve(42);</script>`);
		const script = root()!.querySelector('script');
		expect(script).not.toBeNull();
		expect(script!.getAttribute('type')).toBeNull();
		// The wrapper is what makes `await` legal at the top level of an inline
		// classic script, and what scopes the author's `const` away from globals.
		expect(script!.textContent).toContain('(async () =>');
		expect(script!.textContent).toContain('await Promise.resolve(42)');
		expect(script!.textContent).toContain('.catch(');
	});

	it('leaves a module script untouched (native top-level await + import)', async () => {
		const code = `const x = 1; void x;`;
		await injectAndRun(`<script type="module">${code}</script>`);
		const script = root()!.querySelector('script');
		expect(script!.getAttribute('type')).toBe('module');
		expect(script!.textContent).toBe(code);
		expect(script!.textContent).not.toContain('(async () =>');
	});
});
