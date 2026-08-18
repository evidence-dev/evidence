import { describe, it, expect } from 'vitest';
import { findBlockedScriptSources } from './validate-script-sources';

const urls = (body: string) => findBlockedScriptSources(body).map((b) => b.url);

describe('findBlockedScriptSources: <script src>', () => {
	it('flags an off-allowlist CDN src', () => {
		const found = findBlockedScriptSources('<script src="https://cdn.skypack.dev/d3"></script>');
		expect(found).toEqual([{ url: 'https://cdn.skypack.dev/d3', host: 'https://cdn.skypack.dev' }]);
	});

	it('allows an allowlisted CDN src', () => {
		expect(urls('<script src="https://cdn.jsdelivr.net/npm/echarts@6"></script>')).toEqual([]);
		expect(urls('<script src="https://esm.sh/d3@7"></script>')).toEqual([]);
	});

	it('handles single quotes and extra attributes', () => {
		expect(urls(`<script defer src='https://evil.example.com/x.js' crossorigin></script>`)).toEqual(
			['https://evil.example.com/x.js']
		);
	});

	it('resolves protocol-relative src as https', () => {
		expect(urls('<script src="//cdn.skypack.dev/d3"></script>')).toEqual(['//cdn.skypack.dev/d3']);
		expect(urls('<script src="//esm.sh/d3"></script>')).toEqual([]);
	});
});

describe('findBlockedScriptSources: ES imports', () => {
	it('flags an off-allowlist static import', () => {
		expect(
			urls('<script type="module">import * as x from "https://cdn.skypack.dev/d3@7";</script>')
		).toEqual(['https://cdn.skypack.dev/d3@7']);
	});

	it('allows an allowlisted static import', () => {
		expect(
			urls('<script type="module">import * as d3 from "https://esm.sh/d3@7";</script>')
		).toEqual([]);
	});

	it('flags an off-allowlist dynamic import()', () => {
		expect(
			urls('<script type="module">const m = await import("https://foo.bar/lib.js");</script>')
		).toEqual(['https://foo.bar/lib.js']);
	});

	it('ignores bare specifiers and relative paths (no resolvable host)', () => {
		expect(
			urls('<script type="module">import x from "lodash"; import y from "./local.js";</script>')
		).toEqual([]);
	});
});

describe('findBlockedScriptSources: robustness', () => {
	it('does not throw on a syntax error, and still checks the src attribute', () => {
		const body =
			'<script src="https://cdn.skypack.dev/a.js">const oops = ;</script>' +
			'<script type="module">import "https://cdn.skypack.dev/b.js" const also = ;</script>';
		// The first script's src is checked via the tag regex; the second script
		// fails to parse (bad JS) so its import is skipped — no throw.
		expect(() => findBlockedScriptSources(body)).not.toThrow();
		expect(urls(body)).toEqual(['https://cdn.skypack.dev/a.js']);
	});

	it('dedupes a URL used more than once', () => {
		const body =
			'<script src="https://cdn.skypack.dev/d3"></script>' +
			'<script src="https://cdn.skypack.dev/d3"></script>';
		expect(urls(body)).toEqual(['https://cdn.skypack.dev/d3']);
	});

	it('returns nothing for a plain block with no external scripts', () => {
		expect(urls('<div id="viz"></div><script>const x = 1;</script>')).toEqual([]);
		expect(urls('')).toEqual([]);
	});

	it('ignores data: and blob: sources', () => {
		expect(urls('<script src="data:text/javascript,alert(1)"></script>')).toEqual([]);
	});
});
