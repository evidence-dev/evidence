import { parseFrontmatter } from './parseFrontmatter';

/**
 * The display name for a page/partial, materialized from its frontmatter.
 *
 * Prefers the `title` field, falling back to the deprecated `name`. Returns
 * `undefined` when neither is present (the caller falls back to the filename).
 *
 * This is the single source of truth for the `files.name` materialization.
 * Project-root projects keep `files.name` equal to the frontmatter title so the
 * published navigation — which reads the `files.name` column rather than
 * parsing YAML for every page on every request — shows the title. Every write
 * path that sets `files.name` (savePage, the AI apply-changes endpoint, git
 * ingest) must use this rule; when one of them didn't, AI-created pages showed
 * their filename in the published sidebar until a manual save re-synced them.
 */
export function frontmatterDisplayName(content: string): string | undefined {
	let fmYaml: string | undefined;
	if (content.startsWith('---')) {
		const endIdx = content.indexOf('---', 3);
		if (endIdx !== -1) fmYaml = content.substring(3, endIdx).trim();
	}
	const { frontmatter } = parseFrontmatter(fmYaml);
	const fm = (frontmatter ?? {}) as Record<string, unknown>;
	if (typeof fm.title === 'string' && fm.title.trim()) return fm.title;
	if (typeof fm.name === 'string' && fm.name.trim()) return fm.name;
	return undefined;
}
