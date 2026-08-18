import type { Node } from '@markdoc/markdoc';

/**
 * Find usages of a component's own tag inside its own body. Direct
 * self-reference is always an authoring bug: the render-time call-stack guard
 * stops re-entry, so the nested call silently renders NOTHING past the first
 * level — the author sees a partial render with no explanation. Surfaced as a
 * validation error on the component file (editor + commit gate) instead.
 *
 * Only DIRECT self-reference is detected — indirect cycles (a → b → a) are
 * rarer and still safely truncated by the render guard.
 */
export function findSelfReferences(ast: Node, ownTagName: string): Node[] {
	const hits: Node[] = [];
	const walk = (node: Node): void => {
		if (node.type === 'tag' && node.tag === ownTagName) hits.push(node);
		if (node.children) {
			for (const child of node.children) walk(child);
		}
	};
	walk(ast);
	return hits;
}
