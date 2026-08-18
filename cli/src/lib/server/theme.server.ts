/**
 * Theme resolution for the CLI dev preview.
 *
 * Mirrors Studio's resolution hierarchy (Evidence defaults → project → page),
 * minus the org tier — local dev has no org-settings source, so `theme.yaml` is
 * the project's source of truth. Invalid/absent overrides degrade to the next
 * tier up rather than blocking the render.
 */

import { parseFrontmatter } from '@evidence/core/utils/parseFrontmatter';
import { resolveTheme } from '@evidence/core/theme/resolve-theme';
import {
	themeOverridesSchema,
	type ThemeConfig,
	type ThemeOverrides
} from '@evidence/core/types/theme';
import { loadProjectTheme } from '$cli/project-config/load-config';

function parseThemeOverrides(raw: unknown): ThemeOverrides | null {
	const parsed = themeOverridesSchema.safeParse(raw ?? {});
	return parsed.success ? parsed.data : null;
}

/** Resolve the project-level theme from theme.yaml (Evidence defaults → project). */
export async function resolveProjectTheme(cwd: string): Promise<ThemeConfig> {
	const projectOverrides = parseThemeOverrides(await loadProjectTheme(cwd));
	return resolveTheme(null, null, projectOverrides, null);
}

/**
 * Resolve a page's theme: project theme.yaml merged with the page's frontmatter
 * `theme` block. Pages without an override resolve identically to the project
 * theme, so the result is always safe to apply.
 */
export async function resolvePageTheme(cwd: string, pageContent: string): Promise<ThemeConfig> {
	const projectOverrides = parseThemeOverrides(await loadProjectTheme(cwd));
	const pageOverrides = parseThemeOverrides(extractFrontmatterTheme(pageContent));
	return resolveTheme(null, null, projectOverrides, pageOverrides);
}

/** Pull the raw `theme` value from a markdown file's leading `---` frontmatter. */
function extractFrontmatterTheme(content: string): unknown {
	if (!content.startsWith('---')) return undefined;
	const endIndex = content.indexOf('---', 3);
	if (endIndex === -1) return undefined;
	const { frontmatter } = parseFrontmatter(content.substring(3, endIndex).trim());
	return frontmatter?.theme;
}
