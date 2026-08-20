import type { RenderableTreeNode, Tag } from '@markdoc/markdoc';
import type { InlineQueries } from '../../common/inline-queries';
import Markdoc from '@markdoc/markdoc';
import { untrack } from 'svelte';
import { walkTree } from './walkTree';

export const registerInlineQueriesFromTree = (
	tree: RenderableTreeNode,
	inlineQueries: InlineQueries
): void => {
	if (!Markdoc.Tag.isTag(tree)) return;

	const currentQueryNames = new Set<string>();

	// Add/update inline queries from tree
	for (const { node } of walkTree(tree)) {
		if (isTreeNodeSqlFenceWithLanguage(node)) {
			const { meta, content } = node.attributes;
			untrack(() => inlineQueries.set(meta, content));
			currentQueryNames.add(meta);
		}
	}

	// Remove inline queries that don't exist in the tree
	for (const name of untrack(() => inlineQueries.getAllNames())) {
		if (!currentQueryNames.has(name)) {
			untrack(() => inlineQueries.remove(name));
		}
	}
};

const isTreeNodeSqlFenceWithLanguage = (node: RenderableTreeNode): node is Tag =>
	Markdoc.Tag.isTag(node) &&
	node.name === 'fence' &&
	node.attributes.language === 'sql' &&
	Boolean(node.attributes.meta);
