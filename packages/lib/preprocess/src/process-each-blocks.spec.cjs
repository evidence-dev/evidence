import { describe, it, expect } from 'vitest';
import processEachBlocks from '../src/process-each-blocks.cjs';

describe('processEachBlocks Preprocessor', () => {
	it('should handle text without blank line before closing each tag', () => {
		const input = `{#each something as thing}
<p>text
{/each}</p>`;
		const expectedOutput = `{#each something as thing}
<p>text
</p>
{/each}`;

		const result = processEachBlocks.markup({ content: input, filename: 'test.md' });
		expect(result.code).toEqual(expectedOutput);
	});

	it('should handle unordered lists without blank line before closing each tag', () => {
		const input = `
{#each something as thing}<ul>
<li>one
{/each}</li></ul>`;
		const expectedOutput = `
<ul>
{#each something as thing}
<li>one
</li>
{/each}
</ul>`;

		const result = processEachBlocks.markup({ content: input, filename: 'test.md' });
		expect(result.code).toBe(expectedOutput);
	});

	it('should handle ordered lists without blank line before closing each tag', () => {
		const input = `
{#each something as thing}<ol>
<li>one
{/each}</li></ol>`;
		const expectedOutput = `
<ol>
{#each something as thing}
<li>one
</li>
{/each}
</ol>`;

		const result = processEachBlocks.markup({ content: input, filename: 'test.md' });
		expect(result.code).toBe(expectedOutput);
	});

	it('should handle unordered lists contained inside each tags', () => {
		const input = `{#each something as thing}<ul>
<li>one</li>
</ul>
{/each}`;
		const expectedOutput = `<ul>
{#each something as thing}<li>one
</li>
{/each}
</ul>`;

		const result = processEachBlocks.markup({ content: input, filename: 'test.md' });
		expect(result.code).toBe(expectedOutput);
	});

	it('should handle ordered lists contained inside each tags', () => {
		const input = `{#each something as thing}<ol>
<li>one</li>
</ol>
{/each}`;
		const expectedOutput = `<ol>
{#each something as thing}<li>one
</li>
{/each}
</ol>`;

		const result = processEachBlocks.markup({ content: input, filename: 'test.md' });
		expect(result.code).toBe(expectedOutput);
	});

	it('should preserve code blocks and inline code snippets', () => {
		const input = `# Markdown with Code

\`\`\`js
console.log('Code block');
\`\`\`

Inline code: \`console.log('inline');\`

{#each items as item}
<ul>
<li>{item.name}</li>
</ul>
{/each}`;
		const expectedOutput = `# Markdown with Code

\`\`\`js
console.log('Code block');
\`\`\`

Inline code: \`console.log('inline');\`

<ul>
	{#each items as item}<li>{item.name}
    </li>
	{/each}
</ul>`;

		const result = processEachBlocks.markup({ content: input, filename: 'test.md' });
		expect(result.code).toBe(expectedOutput);
	});
});
