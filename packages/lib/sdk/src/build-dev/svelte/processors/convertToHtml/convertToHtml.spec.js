import { describe, it, expect } from 'vitest';
import { convertToHtml } from './convertToHtml.js';

describe('convertToHtml', () => {
	describe('Basic Elements', () => {
		it.each([
			{ label: 'h1', html: '<h1>%copy</h1>', markdown: '# %copy' },
			{ label: 'h2', html: '<h2>%copy</h2>', markdown: '## %copy' },
			{ label: 'h3', html: '<h3>%copy</h3>', markdown: '### %copy' },
			{ label: 'h4', html: '<h4>%copy</h4>', markdown: '#### %copy' },
			{ label: 'h5', html: '<h5>%copy</h5>', markdown: '##### %copy' },
			{ label: 'h6', html: '<h6>%copy</h6>', markdown: '###### %copy' },
			{ label: 'italics as <p><em>', html: '<p><em>%copy</em></p>', markdown: '_%copy_' },
			{ label: 'italics as <p><em>', html: '<p><em>%copy</em></p>', markdown: '*%copy*' },
			{
				label: 'inline italics',
				html: '<p>%copy <em>%copy</em> %copy</p>',
				markdown: '%copy _%copy_ %copy'
			},
			{
				label: 'inline italics',
				html: '<p>%copy <em>%copy</em> %copy</p>',
				markdown: '%copy *%copy* %copy'
			},
			// prettier-ignore
			{ label: 'bold as <p><strong>', html: '<p><strong>%copy</strong></p>', markdown: '__%copy__' },
			/* TODO: Inline Bold */
			// prettier-ignore
			{ label: 'bold as <p><strong>', html: '<p><strong>%copy</strong></p>', markdown: '**%copy**' },
			// prettier-ignore
			{ label: 'blockquote', html: '<blockquote>\n<p>%copy</p>\n</blockquote>', markdown: '> %copy' },
			// prettier-ignore
			{ label: 'links', html: `<p><a href="%link" rel="nofollow">%copy</a></p>`, markdown: "[%copy](%link)"},
			// prettier-ignore
			{ label: 'images', html: `<p><img src="%link" alt="%copy"></p>`, markdown: "![%copy](%link)"},
			{ label: 'paragraphs', html: '<p>%copy</p>', markdown: '%copy' },
			{ label: 'ul', html: `<ul>\n<li>Input</li>\n</ul>`, markdown: '- %copy' },
			{ label: 'ol', html: `<ol>\n<li>Input</li>\n</ol>`, markdown: '1. %copy' },
			{ label: 'hr', html: '<hr>', markdown: '---' },
			{ label: 'hr', html: '<hr>', markdown: '***' }
			/* TODO: Nested Lists */
			/* TODO: Tables */
			/* TODO: Code - this is very very important */
		])('Creates $label with $markdown', async (opts) => {
			const transform = (s) =>
				s.replaceAll('%copy', 'Input').replaceAll('%link', 'https://example.com');

			const result = await convertToHtml.markup({
				filename: '+page.md',
				content: transform(opts.markdown)
			});
			expect(result.code).toEqual(transform(opts.html));
		});
	});

	describe('Svelte', () => {
		describe('html', () => {
			it('Should leave Svelte Components untouched', async () => {
				const r = await convertToHtml.markup({
					filename: '+page.svelte',
					content: `<Query>SELECT 1</Query>`
				});
				expect(r.code).toEqual(`<Query>SELECT 1</Query>`);
			});
			it('Should leave {#if} untouched (html)', async () => {
				const r = await convertToHtml.markup({
					filename: '+page.svelte',
					content: `{#if true} <p>Hi</p> {/if}`
				});
				expect(r.code).toEqual(`{#if true} <p>Hi</p> {/if}`);
			});
			it('Should not break with on: directives', async () => {
				const r = await convertToHtml.markup({
					filename: '+page.svelte',
					content: `<button on:click={console.log}></button>`
				});
				expect(r.code).toEqual(`<button on:click={console.log}></button>`);
			});
		});
		describe('markdown', () => {
			it('Should leave Svelte Components untouched', async () => {
				const r = await convertToHtml.markup({
					filename: '+page.md',
					content: `<Query>SELECT 1</Query>`
				});
				expect(r.code).toEqual(`<Query>SELECT 1</Query>`);
			});

			it('Should leave {#if} untouched', async () => {
				const r = await convertToHtml.markup({
					filename: '+page.md',
					content: `
{#if true}
Hi
{/if}`
				});
				expect(r.code).toEqual(`{#if true}\n<p>Hi\n{/if}</p>`);
			});
		});
	});

	describe('Query Conversion', () => {
		it('Should convert queries to html', async () => {
			const r = await convertToHtml.markup({
				filename: '+page.md',
				content: `\`\`\`sql query_name
SELECT * FROM users
\`\`\`
`
			});
			expect(r.code).toBe(
				`<pre><code class="language-sql" lang="sql" evidence-query-name="query_name">SELECT * FROM users</code></pre>`
			);
		});
	});

	describe('Tables', () => {
		it('Should handle them properly', () => {});
	});
	describe('Frontmatter', () => {
		it('Should not include frontmatter in output HTML', async () => {});
	});
});
