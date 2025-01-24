/**
 * @satisfies {import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
const addBlankLines = {
	markup({ content, filename }) {
		if (!filename?.endsWith('.md')) return { code: content };

		// Array to store code blocks and inline code snippets temporarily
		/** @type {string[]} */
		const placeholders = [];
		let index = 0;

		// Regex for code blocks with varying backtick delimiters (``` or more)
		const codeBlockRegex = /(`{3,})[\s\S]*?\1/g;

		// Regex for inline code snippets (`...`)
		const inlineCodeRegex = /`[^`]*`/g;

		// Replace code blocks and inline snippets with placeholders
		const contentWithoutCode = content
			.replace(codeBlockRegex, (match) => {
				placeholders.push(match);
				return `__CODE_BLOCK_${index++}__`;
			})
			.replace(inlineCodeRegex, (match) => {
				placeholders.push(match);
				return `__INLINE_CODE_${index++}__`;
			});

		// Updated regex to correctly handle multiline attributes and blank lines
		const modifiedContent = contentWithoutCode
			.replace(/(<[A-Z][\w:-]*\s*(?:".*?"|'.*?'|[^>])*?[^/]>)(\n\s*\S)/g, '$1\n$2')
			.replace(/(\{\/if|\{:else(?: if [^}]+)?\})/g, `\n$1`)
			.replace(/\{\/each\}/g, `\n{/each}\n`)
			.replace(/(<[A-Z][\w:-]*)([^>]*)(\/?>)/g, (_, start, middle, slashEnd) => {
				// Remove extra blank lines in the attributes
				// e.g. replace multiple newlines or purely blank lines with a single newline
				const cleanedMiddle = middle.replace(/\n\s*\n\s*/g, '\n');
				return start + cleanedMiddle + slashEnd;
			});

		// Restore placeholders with their original content
		const finalContent = modifiedContent
			.replace(/__CODE_BLOCK_(\d+)__/g, (_, i) => placeholders[i])
			.replace(/__INLINE_CODE_(\d+)__/g, (_, i) => placeholders[i]);

		return { code: finalContent };
	}
};

module.exports = addBlankLines;
