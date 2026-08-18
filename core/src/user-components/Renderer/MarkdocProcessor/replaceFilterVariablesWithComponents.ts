import Markdoc, { type RenderableTreeNode } from '@markdoc/markdoc';

/**
 * Transforms text nodes containing filter variable templates ({{ filter.prop }})
 * into ReactiveVariable components.
 *
 * This allows filter variables in bare markdown text to be reactive to dropdown changes
 * without re-running the entire AST parsing step.
 *
 * IMPORTANT: This ONLY processes bare markdown text. It skips:
 * - SQL fences (they have their own interpolation via interpolateQueryStrings)
 * - Component attributes (they use processVariables)
 *
 * Pattern: Matches {{ ... }} where the content does NOT start with $
 * (frontmatter variables like {{ $var }} are already handled by Markdoc's built-in system)
 */
export function replaceFilterVariablesWithComponents(
	tree: RenderableTreeNode
): RenderableTreeNode | RenderableTreeNode[] {
	if (!Markdoc.Tag.isTag(tree)) {
		// If it's a string (text node), check if it contains filter variables
		if (typeof tree === 'string') {
			return splitTextWithFilterVariables(tree);
		}
		return tree;
	}

	// SKIP fence blocks - they have their own interpolation system
	if (tree.name === 'fence') {
		return tree;
	}

	// SKIP inline query components - they handle their own interpolation
	if (tree.name === 'InlineQuery') {
		return tree;
	}

	// Recursively process children
	const newChildren: RenderableTreeNode[] = [];
	for (const child of tree.children) {
		const processed = replaceFilterVariablesWithComponents(child);

		// If processing returned an array (from text splitting), flatten it
		if (Array.isArray(processed)) {
			newChildren.push(...processed);
		} else {
			newChildren.push(processed);
		}
	}

	// Preserve location, lines, and id from the original tag for cursor context matching
	return new Markdoc.Tag(
		tree.name,
		tree.attributes,
		newChildren,
		tree.location,
		tree.lines,
		tree.id
	);
}

/**
 * Split a text string containing filter variables into multiple nodes:
 * - Plain text becomes string nodes
 * - {{ filter.prop }} becomes ReactiveVariable components
 *
 * Returns either the original string (if no variables) or an array of mixed nodes
 */
function splitTextWithFilterVariables(text: string): RenderableTreeNode | RenderableTreeNode[] {
	// Pattern matches {{ ... }} where content does NOT start with $
	// Negative lookahead (?!\s*\$) ensures we skip frontmatter variables
	// [^{}]+ prevents matching nested braces
	const pattern = /\{\{(?!\s*\$)([^{}]+)\}\}/g;

	// Check if there are any matches
	if (!pattern.test(text)) {
		return text;
	}

	// Reset regex for actual processing
	pattern.lastIndex = 0;

	const nodes: RenderableTreeNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(text)) !== null) {
		// Add text before the match
		if (match.index > lastIndex) {
			nodes.push(text.substring(lastIndex, match.index));
		}

		// Add ReactiveVariable component for the match
		const expression = match[1].trim();
		nodes.push(
			new Markdoc.Tag(
				'ReactiveVariable',
				{ expression },
				[], // ReactiveVariable is self-closing, no children
				undefined, // location - synthetic component, no source location
				undefined, // lines - synthetic component
				undefined // id - will be auto-generated
			)
		);

		lastIndex = pattern.lastIndex;
	}

	// Add remaining text after the last match
	if (lastIndex < text.length) {
		nodes.push(text.substring(lastIndex));
	}

	return nodes;
}
