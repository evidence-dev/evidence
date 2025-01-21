import { describe, it, expect } from 'vitest';
import addBlankLines from '../src/add-blank-lines.cjs';

describe('addBlankLines Preprocessor', () => {
    it('should not add blank lines to standard markdown', () => {
        const input = `# Hello, world!
This is a test.`;
        const expectedOutput = `# Hello, world!
This is a test.`;
        
        const result = addBlankLines.markup({ content: input, filename: 'test.md' });
        
		expect(result.code).toBe(expectedOutput);
	});

	it('should add blank lines before and after each block content', () => {
		const input = `# Hello, world!
This is a test.
\`\`\`sql orders
SELECT * FROM orders
\`\`\`

{#each orders as order}
1. {order.name}
{/each}
`;
		const expectedOutput = `# Hello, world!
This is a test.
\`\`\`sql orders
SELECT * FROM orders
\`\`\`

{#each orders as order}

1. {order.name}

{/each}
`;

		const result = addBlankLines.markup({ content: input, filename: 'test.md' });

		console.log(input);
		console.log(result.code);

		expect(result.code).toBe(expectedOutput);
	});
});
