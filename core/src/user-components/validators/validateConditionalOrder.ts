import type { Validator } from './types';

/**
 * Ensures that 'else_if' and 'else' tags only follow 'if' or 'else_if' tags within a conditional block.
 * - 'else_if' and 'else' must not be the first child.
 * - The previous sibling must be 'if' or 'else_if'.
 */
export const validateConditionalOrder: Validator = (node, _config, _context) => {
	// Only apply to 'else_if' and 'else' tags
	if (node.tag !== 'else_if' && node.tag !== 'else') return [];

	// Find the parent node (should be a 'conditional' wrapper)
	const parent = node.parent;
	if (!parent || !Array.isArray(parent.children)) return [];

	const idx = parent.children.indexOf(node);
	if (idx === -1) return [];

	// 'else_if' and 'else' must not be the first child
	const message = `'${node.tag}' must be its own block placed directly after the closed if block — not inside it: {% if data="q" %}...{% /if %}{% ${node.tag} %}...{% /${node.tag} %}`;
	if (idx === 0) {
		return [
			{
				id: 'invalid-conditional-order',
				level: 'error',
				message,
				location: node.location
			}
		];
	}

	const prev = parent.children[idx - 1];
	if (!prev || (prev.tag !== 'if' && prev.tag !== 'else_if')) {
		return [
			{
				id: 'invalid-conditional-order',
				level: 'error',
				message,
				location: node.location
			}
		];
	}

	return [];
};
