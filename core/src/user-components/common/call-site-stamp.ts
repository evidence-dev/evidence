import Markdoc, { type Node, type RenderableTreeNode } from '@markdoc/markdoc';

/**
 * Call-site coordinates stamped onto renderable Tags that were INLINED from
 * another file (custom component bodies, partials). Inlined nodes keep their
 * own file's parse coordinates in `lines`/`location` — those are load-bearing
 * (error attribution, html source slicing, component IDs) and must not be
 * rewritten. But the preview's cmd+click-to-source feature needs coordinates
 * in the OPEN document, so the inlining transform stamps the call-site tag's
 * position as namespaced ATTRIBUTES (post-transform passes rebuild Tag
 * instances and would drop ad-hoc object properties; attributes survive the
 * clone). Read only by ComponentWrapper's click handler.
 *
 * Stamps are applied by every inliner and the outermost transform runs last,
 * so nested inlining (component inside component, component inside partial)
 * converges on the outermost call site — which is the one that exists in the
 * document the user is actually editing.
 */
export const CALL_SITE_LINES_ATTR = '__evCallSiteLines';
export const CALL_SITE_FILE_ATTR = '__evCallSiteFile';

export function stampCallSiteOnRenderable(
	output: RenderableTreeNode | RenderableTreeNode[],
	callSiteNode: Node
): void {
	const lines = callSiteNode.lines;
	if (!lines || lines.length < 2) return;
	const file = callSiteNode.location?.file;

	const visit = (node: RenderableTreeNode | RenderableTreeNode[]): void => {
		if (Array.isArray(node)) {
			for (const child of node) visit(child);
			return;
		}
		if (!Markdoc.Tag.isTag(node)) return;
		if (!node.attributes) node.attributes = {};
		node.attributes[CALL_SITE_LINES_ATTR] = lines;
		if (file) node.attributes[CALL_SITE_FILE_ATTR] = file;
		else delete node.attributes[CALL_SITE_FILE_ATTR];
		for (const child of node.children ?? []) visit(child);
	};
	visit(output);
}

/** Read the stamped call-site position off a renderable tag, if present. */
export function readCallSiteStamp(attributes: Record<string, unknown> | undefined): {
	lines: number[];
	file: string | null;
} | null {
	const lines = attributes?.[CALL_SITE_LINES_ATTR];
	if (!Array.isArray(lines) || lines.length < 2) return null;
	const file = attributes?.[CALL_SITE_FILE_ATTR];
	return { lines: lines as number[], file: typeof file === 'string' ? file : null };
}

/**
 * Compare a node's `location.file` (partial-map key, extensionless project
 * path) with the editor's open-file path (may carry `.md` and a leading
 * slash). Null/undefined means "the open document itself".
 */
export function normalizeSourceFile(path: string | null | undefined): string | null {
	if (!path) return null;
	return path.replace(/^\/+/, '').replace(/\.md$/, '');
}
