import { describe, it, expect } from 'vitest';
import { highlight } from './highlight.js';

describe('highlight', () => {
	it('Should highlight javascript', () => {
		const c = highlight.markup({
			content: '<code lang="javascript">console.log(`Hello World!`)</code>'
		});
		expect(c.code).toEqual(
			`<pre><code class="language-javascript"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`Hello World!\`</span>)</code></pre>`
		);
	});
	it('Should highlight SQL', () => {
		const c = highlight.markup({ content: '<code lang="sql">SELECT * FROM world</code>' });
		expect(c.code).toEqual(
			`<pre><code lang="sql" class="language-sql"><span class="hljs-keyword">SELECT</span> <span class="hljs-operator">*</span> <span class="hljs-keyword">FROM</span> world</code></pre>`
		);
	});
	it('Should not add a pre to a code block already wrapped in pre', () => {
		const c = highlight.markup({
			content: '<pre><code lang="sql">SELECT * FROM world</code></pre>'
		});
		expect(c.code).toEqual(
			`<pre><code lang="sql" class="language-sql"><span class="hljs-keyword">SELECT</span> <span class="hljs-operator">*</span> <span class="hljs-keyword">FROM</span> world</code></pre>`
		);
	});
	it('Should not highlight code blocks without a language', () => {
		const c = highlight.markup({ content: '<code>SELECT * FROM world</code>' });
		expect(c.code).toEqual(`<code>SELECT * FROM world</code>`);
	});
});
