import { describe, it, expect } from 'vitest';
import addBlankLines from '../src/add-blank-lines.cjs';

describe('addBlankLines Preprocessor', () => {
	
    it('should add a blank line after a component opening tag', () => {
        const input = `<Details title='Definition'>
  Here is a metric definition
</Details>`;
        const expectedOutput = `<Details title='Definition'>


  Here is a metric definition
</Details>`;
        const result = addBlankLines.markup({ content: input, filename: 'test.md' });
        expect(result.code.replace(/\s+/g, ' ').trim()).toBe(expectedOutput.replace(/\s+/g, ' ').trim());
    });


    it('should add a newline after {/each}', () => {
        const input = `{#each items as item}
{item.name}
{/each}`;
        const expectedOutput = `{#each items as item}
{item.name}
{/each}
`;

        const result = addBlankLines.markup({ content: input, filename: 'test.md' });
        expect(result.code.replace(/\s+/g, ' ').trim()).toBe(expectedOutput.replace(/\s+/g, ' ').trim());
    });

	it('should add a newline before {/each}', () => {
        const input = `{#each items as item}
{item.name}
{/each}`;
        const expectedOutput = `{#each items as item}
{item.name}

{/each}`;

        const result = addBlankLines.markup({ content: input, filename: 'test.md' });
        expect(result.code.replace(/\s+/g, ' ').trim()).toBe(expectedOutput.replace(/\s+/g, ' ').trim());
    });

    it('should add a newline before {:else}', () => {
        const input = `{#if condition}
Condition met
{:else}
Condition not met
{/if}`;
        const expectedOutput = `{#if condition}
Condition met

{:else}
Condition not met

{/if}`;

        const result = addBlankLines.markup({ content: input, filename: 'test.md' });
        expect(result.code.replace(/\s+/g, ' ').trim()).toBe(expectedOutput.replace(/\s+/g, ' ').trim());
    });

	it('should clean up excessive blank lines in attributes', () => {
		const input = `<Component
		prop1="value1"
	
		prop2="value2"
	
		prop3="value3" />`;
		const expectedOutput = `<Component
		prop1="value1"
		prop2="value2"
		prop3="value3" />`;
	
		const result = addBlankLines.markup({ content: input, filename: 'test.md' });
	
		expect(result.code.replace(/\s+/g, ' ').trim()).toEqual(expectedOutput.replace(/\s+/g, ' ').trim());
	});
	

    it('should handle a component with no attributes', () => {
        const input = `<SimpleComponent />`;
        const expectedOutput = `<SimpleComponent />`;

        const result = addBlankLines.markup({ content: input, filename: 'test.md' });
        expect(result.code.replace(/\s+/g, ' ').trim()).toBe(expectedOutput.replace(/\s+/g, ' ').trim());
    });

});
