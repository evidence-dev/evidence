/**
 * Shared classifier for what a markdown file in a project-root project IS.
 *
 * Imported by BOTH Studio's git ingest and the CLI's disk discovery. A second
 * implementation would let the same file be a component locally and a page
 * after a commit round-trip — the drift that silently unregistered customers'
 * component tags.
 */

export type MarkdownFileKind = 'page' | 'partial' | 'component';

/** Reserved top-level directories and the kind a file inside one takes. */
const KIND_BY_TOP_LEVEL_DIR: Record<string, MarkdownFileKind> = {
	partials: 'partial',
	components: 'component'
};

/**
 * Classify a markdown file from its project-root-relative path and whatever
 * `type:` its frontmatter declared (`undefined` when it declared none).
 *
 * An explicit declaration always wins, so a component can be colocated beside
 * the page that uses it and a `type: page` file inside `components/` stays a
 * page. With no declaration the reserved folder decides; a nested folder of the
 * same name (`pages/components/`) is the user's own and carries no meaning.
 *
 * Accepts the path with or without its extension — only the leading segment is
 * read — so both call sites can pass whatever they already have.
 */
export function markdownFileKind(
	projectRootRelativePath: string,
	declaredType: string | undefined
): MarkdownFileKind {
	if (declaredType === 'partial' || declaredType === 'component') return declaredType;
	if (declaredType !== undefined) return 'page';

	const [topSegment, ...rest] = projectRootRelativePath.split('/');
	if (rest.length === 0) return 'page';
	return KIND_BY_TOP_LEVEL_DIR[topSegment] ?? 'page';
}
