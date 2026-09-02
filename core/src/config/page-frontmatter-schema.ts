import { z } from 'zod';
import { themeOverridesSchema } from '../types/theme';
import { availableIconNames } from '../user-components/common/icon-names';
import { workflowSchema } from './workflow-frontmatter';

/**
 * Frontmatter schema for the new structure — identity + page settings. Lenient
 * (every field optional, settings coerced) so hand-edited frontmatter ingests
 * without throwing. Distinct from the legacy `pageFrontmatterSchema` (identity
 * only), which is left untouched.
 *
 * Lives in `@evidence/core` so both Studio (editor autocomplete + server
 * ingest/render) and the CLI dev server resolve page settings through one
 * canonical schema. Imports only `zod` + the core theme schema — no DB or
 * server-only deps. Mirrors the same client/server split used by
 * `evidence-config-schema.ts`.
 *
 * `.catch(undefined)` on every field (identity included) so a single malformed
 * hand-edited value (e.g. `title: 2024`, a non-UUID `assetId`, an unknown
 * `type`) is dropped individually rather than failing the whole parse and
 * silently wiping the page's settings. assetId/name/type are deprecated and
 * no longer consumed for anything but a name fallback / partial detection.
 */
export const projectRootPageFrontmatterSchema = z.object({
	title: z
		.string()
		.optional()
		.catch(undefined)
		.describe('Human-friendly page title shown in navigation and tabs.'),
	name: z.string().optional().catch(undefined).describe('Deprecated — use `title` instead.'),
	assetId: z
		.string()
		.uuid()
		.optional()
		.catch(undefined)
		.describe('Deprecated — generated server-side.'),
	type: z
		.enum(['page', 'partial', 'yaml', 'component'])
		.optional()
		.catch(undefined)
		.describe(
			'File kind. Set `partial` for a reusable markdown fragment, `component` for a custom Markdoc tag whose attributes are declared in this frontmatter; omit for a regular page.'
		),
	description: z
		.string()
		.optional()
		.catch(undefined)
		.describe(
			'One-line summary of this custom component, surfaced in editor autocomplete. Only meaningful when `type: component`.'
		),
	attributes: z
		.record(z.unknown())
		.optional()
		.catch(undefined)
		.describe(
			'Attribute schema for a custom component (`type: component`). Each key declares an attribute the tag accepts; values are either a shorthand type string (`string` | `number` | `boolean` | `column` | `query` | `format`) or a longhand object with `{ type, required?, default?, description? }`.'
		),
	page_width: z
		.enum(['article', 'full'])
		.optional()
		.catch(undefined)
		.describe(
			"Page content width. 'article' is a centered narrow column; 'full' spans the viewport."
		),
	cards: z.coerce
		.boolean()
		.optional()
		.catch(undefined)
		.describe('Wrap top-level page content in cards.'),
	table_of_contents: z.coerce
		.boolean()
		.optional()
		.catch(undefined)
		.describe('Show the on-page table of contents.'),
	sidebar_position: z
		.number()
		.nullable()
		.optional()
		.catch(undefined)
		.describe('Ordering of this page in the sidebar (lower sorts first).'),
	icon: z
		// Normalize the same way the runtime resolver (`loadLucideIcon`) does so a
		// hand-typed `Calendar`/`my_icon` still matches the canonical lowercase-dash
		// names — the enum then drives editor autocomplete + rejects real typos.
		.preprocess(
			(v) => (typeof v === 'string' ? v.toLowerCase().replace(/[_\s]/g, '-') : v),
			z.enum(availableIconNames as unknown as [string, ...string[]])
		)
		.nullable()
		.optional()
		.catch(undefined)
		.describe('Sidebar icon name for this page.'),
	auto_refresh: z
		.number()
		.optional()
		.catch(undefined)
		.describe('Auto-refresh interval in seconds (0 disables auto-refresh).'),
	theme: themeOverridesSchema
		.optional()
		.catch(undefined)
		.describe('Per-page theme overrides, layered on top of the project theme.'),
	workflow: workflowSchema
		.optional()
		.catch(undefined)
		.describe('Workflow reporting settings — see `workflow.period` to make this a periodic report.')
});

export type ParsedProjectRootFrontmatter = z.infer<typeof projectRootPageFrontmatterSchema>;

/**
 * Project-level layout defaults from `evidence.config.yaml`'s `layout:` block —
 * the per-page settings a project can default for every page (a page overrides
 * any of them in its own frontmatter). Same field shape and copy as the
 * matching page-frontmatter fields above, so the two stay in lockstep.
 *
 * Canonical here in `@evidence/core` so Studio's `evidenceConfigSchema` (editor
 * validation + YAML completions) and the CLI dev server (`loadProjectConfig`)
 * resolve project layout through one definition. `.passthrough()` keeps
 * unknown/future keys rather than stripping them.
 */
export const projectLayoutSchema = z
	.object({
		page_width: z
			.enum(['article', 'full'])
			.optional()
			.describe(
				"Page content width. 'article' is a centered narrow column; 'full' spans the viewport."
			),
		cards: z.boolean().optional().describe('Wrap top-level page content in cards.'),
		table_of_contents: z.boolean().optional().describe('Show the on-page table of contents.'),
		auto_refresh: z
			.number()
			.optional()
			.describe('Auto-refresh interval in seconds (0 disables auto-refresh).')
	})
	.passthrough();

export type ParsedProjectLayout = z.infer<typeof projectLayoutSchema>;

/**
 * Project-level date defaults from `evidence.config.yaml`'s `date:` block —
 * the first day of the week and the default end of relative date ranges, used
 * by date pickers and calendars across the project.
 *
 * Canonical here so Studio's `evidenceConfigSchema` and the CLI dev server
 * (`loadProjectConfig`) resolve date config through one definition. The config
 * uses `days_ago` (snake_case YAML); consumers map it to the runtime
 * `daysAgo`. `.passthrough()` keeps unknown/future keys.
 */
export const projectDateSchema = z
	.object({
		first_day_of_week: z
			.enum(['sunday', 'monday'])
			.optional()
			.describe('First day of the week used by date pickers and calendars.'),
		default_date_range_end: z
			.union([
				z.object({ type: z.literal('today') }).passthrough(),
				z
					.object({
						type: z.literal('relative'),
						days_ago: z
							.number()
							.int()
							.min(0)
							.describe('Number of days before today to use as the range end.')
					})
					.passthrough(),
				z
					.object({
						type: z.literal('custom_sql'),
						sql: z.string().describe('SQL expression evaluating to the range end date.')
					})
					.passthrough()
			])
			.optional()
			.describe('Default end of relative date ranges across the project.')
	})
	.passthrough();

export type ParsedProjectDate = z.infer<typeof projectDateSchema>;
