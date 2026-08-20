/**
 * Reserved root directory (sibling of `pages/`) that configures the viewer
 * chat agent. New project-root structure only. Files here are markdown +
 * frontmatter but are NOT pages: their frontmatter answers to the skill schema
 * (`name` + `description` are required), not the page frontmatter contract.
 *
 * Lives in core so the Markdoc validators can recognise an agent path directly
 * and never hand a skill file page-shaped advice. Studio re-exports both from
 * `$lib/constants/fileType`.
 */
export const AGENT_DIR = 'agent';

/** Is this project-root-relative path inside the `agent/` tree? */
export function isAgentPath(path: string): boolean {
	return path === AGENT_DIR || path.startsWith(`${AGENT_DIR}/`);
}
