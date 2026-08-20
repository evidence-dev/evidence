import { getContext, setContext } from 'svelte';
import type { RenderableTreeNode, Tag } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';

const NODE_CONTEXT_KEY = Symbol('NODE_CONTEXT');

type NodeContext = {
	node: RenderableTreeNode;
	tag?: Tag;
};

export const setNodeContext = (node: RenderableTreeNode) => {
	const tag = Markdoc.Tag.isTag(node) ? node : undefined;
	const context: NodeContext = {
		node,
		tag
	};
	setContext(NODE_CONTEXT_KEY, context);
};

export const getNodeContext = (): NodeContext | undefined => getContext(NODE_CONTEXT_KEY);
