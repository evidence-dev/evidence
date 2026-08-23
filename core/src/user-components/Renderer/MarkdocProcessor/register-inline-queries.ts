import type { RenderableTreeNode, Tag } from '@markdoc/markdoc';
import type { InlineQueries } from '../../common/inline-queries';
import Markdoc from '@markdoc/markdoc';
import { untrack } from 'svelte';
import { walkTree } from './walkTree';
import { fenceQueryName, parseFenceMeta } from '../../common/fence-meta';

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
			// `meta` is `name connection=…`; register under the parsed name with its declared connection.
			const { name, attrs } = parseFenceMeta(meta);
			untrack(() => inlineQueries.set(name, content, attrs.connection));
			currentQueryNames.add(name);
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
	fenceQueryName(node.attributes.meta) !== '';
