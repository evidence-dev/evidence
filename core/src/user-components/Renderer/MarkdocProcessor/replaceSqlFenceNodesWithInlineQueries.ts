import type { Node } from '@markdoc/markdoc';

const isSqlFenceNode = (node: Node): boolean =>
	node.type === 'fence' &&
	node.attributes.language === 'sql' &&
	typeof node.attributes.meta === 'string' &&
	node.attributes.meta.trim() !== '';

export const replaceSqlFenceNodesWithInlineQueries = (ast: Node) => {
	for (const node of ast.walk()) {
		if (isSqlFenceNode(node)) {
			node.type = 'tag';
			node.tag = 'inline_query';
		}
	}
};
