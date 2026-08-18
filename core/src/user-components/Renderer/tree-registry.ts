import type { RenderableTreeNode } from '@markdoc/markdoc';

// Associates each rendered `[data-markdoc-content]` root to its Markdoc tree so
// consumers (e.g. PdfSettingsModal) can inspect the full tree — including
// content not currently mounted in the DOM (inactive tabs, conditionals) —
// without prop-drilling the tree to every modal host.
const treesByRoot = new WeakMap<HTMLElement, RenderableTreeNode>();

export function registerRendererTree(el: HTMLElement, tree: RenderableTreeNode): void {
	treesByRoot.set(el, tree);
}

export function getRendererTree(el: HTMLElement): RenderableTreeNode | undefined {
	return treesByRoot.get(el);
}
