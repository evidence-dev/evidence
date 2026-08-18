import type { RenderableTreeNode, Tag } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';

export function* walkTree(
	node: RenderableTreeNode,
	parent?: Tag
): Generator<{ node: RenderableTreeNode; parent: Tag | undefined }, void, unknown> {
	if (!Markdoc.Tag.isTag(node)) {
		yield { node, parent };
		return;
	}

	for (const child of node.children) {
		yield { node: child, parent: node };
		if (Markdoc.Tag.isTag(child)) {
			yield* walkTree(child, node);
		}
	}
}
