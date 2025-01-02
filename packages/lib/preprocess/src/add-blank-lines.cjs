/**
 * @type {import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
const addBlankLines = {
	markup({ content, filename }) {
		if (filename?.endsWith('.md')) {
			if (typeof content !== 'string') {
				throw new Error('Expected content to be a string');
			}

			// Array to store code blocks and inline code snippets temporarily
			/**
			 * @type {string[]}
			 */
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
			const modifiedContent = contentWithoutCode.replace(
				/(<[A-Z][\w:-]*\s*(?:".*?"|'.*?'|[^>])*?[^/]>)(\n\s*\S)/g,
				'$1\n\n$2'
			);

			// Restore placeholders with their original content
			const finalContent = modifiedContent
				.replace(/__CODE_BLOCK_(\d+)__/g, (_, i) => placeholders[i])
				.replace(/__INLINE_CODE_(\d+)__/g, (_, i) => placeholders[i]);

			return { code: finalContent };
		}
	}
};

module.exports = addBlankLines;
