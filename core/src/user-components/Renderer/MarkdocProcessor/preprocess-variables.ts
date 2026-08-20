/**
 * Preprocesses markdown to automatically quote variable expressions in component attributes.
 *
 * Transforms: attr={{var}} → attr="{{var}}"
 *
 * This allows users to write the more intuitive unquoted syntax while maintaining
 * compatibility with Markdoc's parser which requires variables in strings.
 *
 * Handles both:
 * - Frontmatter variables: {{$var}} or {{var}}
 * - Filter variables: {{dropdown.selected}}, {{toggle.value}}
 */
export function preprocessVariables(markdown: string): string {
	// First, identify and skip code blocks
	const segments = splitByCodeBlocks(markdown);

	// Process each non-code-block segment
	const processed = segments.map((segment) => {
		if (segment.isCodeBlock) {
			return segment.content;
		}
		return processComponentTags(segment.content);
	});

	return processed.join('');
}

/**
 * Split markdown into code block and non-code-block segments
 */
function splitByCodeBlocks(markdown: string): Array<{ content: string; isCodeBlock: boolean }> {
	const segments: Array<{ content: string; isCodeBlock: boolean }> = [];
	const lines = markdown.split('\n');

	let currentSegment: string[] = [];
	let inCodeBlock = false;
	let codeBlockFence = '';

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const codeBlockMatch = line.match(/^(\s*)(`{3,}|~{3,})/);

		if (codeBlockMatch) {
			const fence = codeBlockMatch[2];
			if (!inCodeBlock) {
				// Starting a code block - save previous segment
				if (currentSegment.length > 0) {
					segments.push({
						content: currentSegment.join('\n') + (i < lines.length - 1 ? '\n' : ''),
						isCodeBlock: false
					});
					currentSegment = [];
				}
				inCodeBlock = true;
				codeBlockFence = fence[0];
				currentSegment.push(line);
			} else if (fence[0] === codeBlockFence) {
				// Ending a code block
				currentSegment.push(line);
				segments.push({
					content: currentSegment.join('\n') + (i < lines.length - 1 ? '\n' : ''),
					isCodeBlock: true
				});
				currentSegment = [];
				inCodeBlock = false;
				codeBlockFence = '';
			} else {
				currentSegment.push(line);
			}
		} else {
			currentSegment.push(line);
		}
	}

	// Add final segment
	if (currentSegment.length > 0) {
		segments.push({
			content: currentSegment.join('\n'),
			isCodeBlock: inCodeBlock
		});
	}

	return segments;
}

/**
 * Process text looking for component tags and adding quotes to unquoted variables
 */
function processComponentTags(text: string): string {
	// Find all component tags: {% ... %} or {% ... /%}
	// Use a simple state machine to avoid breaking on nested content
	let result = '';
	let i = 0;

	while (i < text.length) {
		// Look for start of component tag
		if (text[i] === '{' && text[i + 1] === '%') {
			// Find the matching end: %} or /%}
			const tagStart = i;
			let tagEnd = -1;
			let depth = 1;
			i += 2; // Skip {%

			while (i < text.length && depth > 0) {
				if (text[i] === '{' && text[i + 1] === '%') {
					depth++;
					i += 2;
				} else if (text[i] === '%' && text[i + 1] === '}') {
					depth--;
					if (depth === 0) {
						tagEnd = i + 2;
					}
					i += 2;
				} else if (text[i] === '/' && text[i + 1] === '%' && text[i + 2] === '}') {
					depth--;
					if (depth === 0) {
						tagEnd = i + 3;
					}
					i += 3;
				} else {
					i++;
				}
			}

			if (tagEnd !== -1) {
				// Extract and process the tag
				const tag = text.substring(tagStart, tagEnd);
				const processedTag = processTagAttributes(tag);
				result += processedTag;
			} else {
				// Malformed tag, just copy as-is
				result += text.substring(tagStart);
				break;
			}
		} else {
			// Regular character, copy as-is
			result += text[i];
			i++;
		}
	}

	return result;
}

/**
 * Process attributes within a component tag, adding quotes to unquoted {{...}} expressions
 */
function processTagAttributes(tag: string): string {
	// The regex below can only match tags with a contiguous `={{` candidate.
	if (!tag.includes('={{')) return tag;

	// Find all unquoted variable expressions: attr={{var}}
	// Convert to: attr="{{var}}"
	// This works at any nesting level (top-level or inside object literals)
	return tag.replace(/([\w-]+)=\{\{([^}]+)\}\}/g, (match, attrName, varContent, offset) => {
		// Check if this match is already inside quotes by looking backwards
		if (isInsideQuotes(tag, offset)) {
			// Already quoted, leave as-is
			return match;
		}

		// Not quoted, add quotes
		return `${attrName}="{{${varContent}}}"`;
	});
}

/**
 * Check if a position in the string is already inside quotes
 * Properly handles escaped quotes and escaped backslashes (e.g., \\" where the quote is NOT escaped)
 */
function isInsideQuotes(str: string, position: number): boolean {
	let inDoubleQuotes = false;
	let inSingleQuotes = false;

	// Scan from start to position, tracking quote state
	for (let i = 0; i < position; i++) {
		const char = str[i];

		// Count consecutive backslashes before this character
		let backslashCount = 0;
		let j = i - 1;
		while (j >= 0 && str[j] === '\\') {
			backslashCount++;
			j--;
		}

		// A character is escaped only if preceded by an odd number of backslashes
		// Examples:
		// \"  -> 1 backslash (odd)  -> escaped
		// \\" -> 2 backslashes (even) -> NOT escaped (the backslash is escaped, not the quote)
		// \\\" -> 3 backslashes (odd) -> escaped
		const isEscaped = backslashCount % 2 === 1;

		if (!isEscaped) {
			if (char === '"' && !inSingleQuotes) {
				inDoubleQuotes = !inDoubleQuotes;
			} else if (char === "'" && !inDoubleQuotes) {
				inSingleQuotes = !inSingleQuotes;
			}
		}
	}

	return inDoubleQuotes || inSingleQuotes;
}
