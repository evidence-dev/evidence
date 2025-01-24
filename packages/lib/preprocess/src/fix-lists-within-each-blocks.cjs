/**
 * This preprocessor moves `<ul>` and `<ol>` elements outside of each blocks. This is necessary because mdsvex will
 * add a `<ul>` or `<ol>` within the each block when users create a list inside an each block.
 *
 * For example, when the user writes
 * {#each items as item}
 *   - {item}
 * {/each}
 *
 * mdsvex will generate:
 * {#each items as item}
 *   <ul>
 *     <li>{item}</li>
 *   </ul>
 * {/each}
 *
 * Which will create a new list for every element.
 *
 * This preprocessor ensures that the generated HTML is:
 * <ul>
 *   {#each items as item}
 *     <li>{item}</li>
 *   {/each}
 * </ul>
 *
 * @satisfies {import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
const fixListsWithinEachBlocks = {
	markup({ content, filename }) {
		if (!filename?.endsWith('.md')) return { code: content };

		// Array to store code blocks and inline code snippets temporarily
		/** @type {string[]} */ const placeholders = [];
		let index = 0;

		const codeBlockRegex = /(`{3,})[\s\S]*?\1/g;
		const inlineCodeRegex = /`[^`]*`/g;

		const contentWithoutCode = content
			.replace(codeBlockRegex, (match) => {
				placeholders.push(match);
				return `__CODE_BLOCK_${index++}__`;
			})
			.replace(inlineCodeRegex, (match) => {
				placeholders.push(match);
				return `__INLINE_CODE_${index++}__`;
			});

		// Scenario 1 - Text without blank line before closing each tag
		const scenario1Regex = /\{#each([^}]*)\}([\s\S]*?)\{\/each\}<\/p>/gm;
		const scenario1Replacement = `{#each$1}$2</p>\n{/each}`;

		// Scenario 2 - Lists without blank line before closing each tag
		const scenario2Regex =
			/\{#each([^}]*)\}\s*<(u|o)l([^>]*)>\s*<li([^>]*)>([\s\S]*?)\{\/each\}\s*<\/li>\s*<\/\2l>/gm;
		const scenario2Replacement = `<$2l$3>
	{#each$1}
	<li$4>$5
	</li>
	{/each}
	</$2l>`;

		// Scenario 3 - List with blank line before closing each tag
		const scenario3Regex =
			/\{#each([^}]*)\}\s*<(u|o)l([^>]*)>\s*<li([^>]*)>([\s\S]*?)<\/li>\s*<\/\2l>\s*\{\/each\}/gm;
		const scenario3Replacement = `<$2l$3>
	{#each$1}<li$4>$5
	</li>
	{/each}
	</$2l>`;

		let modifiedContent = contentWithoutCode;
		modifiedContent = modifiedContent.replace(scenario1Regex, scenario1Replacement);
		modifiedContent = modifiedContent.replace(scenario2Regex, scenario2Replacement);
		modifiedContent = modifiedContent.replace(scenario3Regex, scenario3Replacement);

		// Restore the placeholders
		const finalContent = modifiedContent
			.replace(/__CODE_BLOCK_(\d+)__/g, (_, i) => placeholders[i])
			.replace(/__INLINE_CODE_(\d+)__/g, (_, i) => placeholders[i]);

		return { code: finalContent };
	}
};

module.exports = fixListsWithinEachBlocks;
