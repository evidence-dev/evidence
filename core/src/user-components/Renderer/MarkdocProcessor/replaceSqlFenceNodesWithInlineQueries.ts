import type { Node } from '@markdoc/markdoc';
import { fenceQueryName } from '../../common/fence-meta';

const isSqlFenceNode = (node: Node): boolean =>
	node.type === 'fence' &&
	node.attributes.language === 'sql' &&
	fenceQueryName(node.attributes.meta) !== '';

export const replaceSqlFenceNodesWithInlineQueries = (ast: Node) => {
	for (const node of ast.walk()) {
		if (isSqlFenceNode(node)) {
			node.type = 'tag';
			node.tag = 'inline_query';
		}
	}
};
