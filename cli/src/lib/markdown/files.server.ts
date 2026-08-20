/**
 * Markdown and SQL file discovery from CWD
 * Server-only module - uses Node.js fs
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, parse as parsePath } from 'node:path';
import { parseFrontmatter } from '@evidence/core/utils/parseFrontmatter';
import {
	projectRootPageFrontmatterSchema,
	type ParsedProjectRootFrontmatter,
	type ParsedProjectLayout
} from '@evidence/core/config/page-frontmatter-schema';
import { compareSidebarPosition } from '@evidence/core/utils/nav-tree';
import { deslugify } from '@evidence/core/utils/deslugify';
import type { PageSettings } from '@evidence/core/user-components/interfaces/project-settings';
import { loadProjectConfig } from '$cli/project-config/load-config';

/**
 * Parse and validate a page's frontmatter with the canonical schema Studio
 * uses, so the CLI honors the same `title` / `sidebar_position` / `icon` /
 * `type` fields. `safeParse` (not `parse`) because the block can parse to a
 * non-object — a bare scalar or list (`---\njust text\n---`) makes
 * `z.object()` fail; degrade to no settings rather than throw out of the walk.
 */
function parsePageFrontmatter(content: string): ParsedProjectRootFrontmatter {
	if (!content.startsWith('---')) return {};
	const endIndex = content.indexOf('---', 3);
	if (endIndex === -1) return {};
	const { frontmatter } = parseFrontmatter(content.substring(3, endIndex).trim());
	const result = projectRootPageFrontmatterSchema.safeParse(frontmatter ?? {});
	return result.success ? result.data : {};
}

/**
 * Map a page's frontmatter to the core `PageSettings` shape (layout settings
 * only). Only keys explicitly present in the frontmatter are set, so an absent
 * key inherits the default rather than overriding it — mirroring Studio's
 * `pageSettingsFromFrontmatter`. `auto_refresh` rides the schema's passthrough;
 * the core `PageSettings` type doesn't list it, hence the local cast.
 */
export function parsePageSettings(content: string): PageSettings {
	const fm = parsePageFrontmatter(content);
	const settings: PageSettings & { auto_refresh?: number } = {};
	if (fm.cards !== undefined) settings.cards = fm.cards;
	if (fm.page_width !== undefined) settings.page_width = fm.page_width;
	if (fm.table_of_contents !== undefined) settings.table_of_contents = fm.table_of_contents;
	if (fm.auto_refresh !== undefined) settings.auto_refresh = fm.auto_refresh;
	return settings;
}

/**
 * Human-readable page title: frontmatter `title` wins, else the deslugified
 * filename ('Home' for the home page). Mirrors Studio's nav display-name rule
 * (`title ?? deslugify(name)`) so the CLI tab title matches the published app.
 */
export function pageDisplayTitle(file: MarkdownFile, isHome = false): string {
	const { title } = parsePageFrontmatter(file.content);
	return title ?? (isHome ? 'Home' : deslugify(file.name));
}

/**
 * Evidence's baseline page settings — mirrors Studio's `DEFAULT_PAGE_SETTINGS`
 * (`studio/src/lib/constants/default-page-settings.ts`) so the CLI resolves the
 * same effective values.
 */
const DEFAULT_PAGE_SETTINGS: PageSettings = {
	page_width: 'article',
	cards: false,
	table_of_contents: false
};

/**
 * Effective page settings as a layered merge, identical to Studio's
 * `resolveEffectivePageSettings`:
 *
 *   defaults  <  project `layout:` defaults  <  explicit page frontmatter
 *
 * Only keys present in each layer override the one below, so absent == inherit.
 */
export function resolvePageSettings(
	content: string,
	projectLayout: ParsedProjectLayout | null | undefined
): PageSettings {
	return {
		...DEFAULT_PAGE_SETTINGS,
		...(projectLayout ?? {}),
		...parsePageSettings(content)
	};
}

function getMarkdownType(content: string): string {
	return parsePageFrontmatter(content).type ?? 'page';
}

/**
 * Resolve the pages directory from evidence.config.yaml, falling back to the
 * default ./pages if the config is malformed. Keeps the dev-server render path
 * resilient — a broken config logs loudly but doesn't crash navigation. Run
 * `evidence validate` for strict config checking.
 */
async function resolvePagesDir(projectRoot: string): Promise<string> {
	try {
		const cfg = await loadProjectConfig(projectRoot);
		return cfg.pagesDir;
	} catch (e) {
		console.error(
			`[evidence] Failed to load evidence.config.yaml; using default pages directory.\n` +
				`  ${(e as Error).message}`
		);
		return join(projectRoot, 'pages');
	}
}

export interface SqlFiles {
	[path: string]: string;
}

export interface MarkdownFile {
	/** Absolute path to the file */
	path: string;
	/** Relative path from CWD (without extension) */
	slug: string;
	/** File name without extension */
	name: string;
	/** Raw markdown content */
	content: string;
}

/**
 * Discover all markdown files in a directory (recursive)
 * Looks inside the `pages/` subdirectory of the given dir
 */
export async function discoverMarkdownFiles(dir: string): Promise<MarkdownFile[]> {
	const pagesDir = await resolvePagesDir(dir);
	const files: MarkdownFile[] = [];

	async function walk(currentDir: string) {
		const entries = await readdir(currentDir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name);

			if (entry.isDirectory()) {
				// Skip node_modules and hidden directories
				if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
				await walk(fullPath);
			} else if (entry.isFile() && entry.name.endsWith('.md')) {
				const content = await readFile(fullPath, 'utf-8');
				const relativePath = relative(pagesDir, fullPath);
				const parsed = parsePath(relativePath);
				const slug = join(parsed.dir, parsed.name).replace(/\\/g, '/');

				files.push({
					path: fullPath,
					slug,
					name: parsed.name,
					content
				});
			}
		}
	}

	try {
		await walk(pagesDir);
	} catch {
		// pages/ directory might not exist yet
		console.warn(`Could not read directory: ${pagesDir}`);
	}

	return files;
}

export async function discoverPartials(dir: string): Promise<Record<string, string>> {
	const files = await discoverMarkdownFiles(dir);
	const partials: Record<string, string> = {};
	for (const file of files) {
		if (getMarkdownType(file.content) === 'partial') {
			partials[file.slug] = file.content;
		}
	}
	return partials;
}

/**
 * Get a single markdown file by slug
 * Looks inside the `pages/` subdirectory of the given dir
 */
export async function getMarkdownFile(dir: string, slug: string): Promise<MarkdownFile | null> {
	if (slug.replaceAll('\\', '/').split('/').includes('..')) return null;

	const pagesDir = await resolvePagesDir(dir);
	// `foo.md` wins; `foo/index.md` is the directory-page fallback (the shape
	// getNavItems already links to).
	const candidates = [join(pagesDir, `${slug}.md`), join(pagesDir, slug, 'index.md')];

	for (const filePath of candidates) {
		try {
			const stats = await stat(filePath);
			if (!stats.isFile()) continue;

			const content = await readFile(filePath, 'utf-8');
			const parsed = parsePath(slug);

			return {
				path: filePath,
				slug,
				name: parsed.name,
				content
			};
		} catch {
			continue;
		}
	}
	return null;
}

/**
 * Get the home page markdown file from the pages/ subdirectory
 * Looks for: home.md, index.md, README.md (in that order)
 */
export async function getHomeFile(dir: string): Promise<MarkdownFile | null> {
	const candidates = ['home', 'index', 'README'];

	for (const name of candidates) {
		const file = await getMarkdownFile(dir, name);
		if (file) return file;
	}

	return null;
}

export interface NavItem {
	/** File name without extension (slug segment) */
	name: string;
	/** URL slug (without leading slash) */
	slug: string;
	/** Whether this is the home page */
	isHome: boolean;
	/** Frontmatter `title`; overrides the deslugified filename when present. */
	title?: string;
	/** Frontmatter `sidebar_position`; lower sorts first. */
	sidebar_position?: number | null;
	/** Frontmatter `icon`; rendered in the sidebar icon column. */
	icon?: string | null;
}

/** Resolved display name used for the alphabetical tiebreak and rendered label. */
function navDisplayName(item: NavItem): string {
	return item.title ?? (item.isHome ? 'Home' : deslugify(item.name));
}

/**
 * Get navigation items for all markdown pages in the pages/ subdirectory.
 * Reads each file's frontmatter so the sidebar honors `title`, `sidebar_position`
 * and `icon`, and excludes partials — matching how Studio resolves the sidebar.
 */
export async function getNavItems(dir: string): Promise<NavItem[]> {
	const pagesDir = await resolvePagesDir(dir);
	const items: NavItem[] = [];

	async function walk(currentDir: string) {
		const entries = await readdir(currentDir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name);

			if (entry.isDirectory()) {
				// Skip node_modules and hidden directories
				if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
				await walk(fullPath);
			} else if (entry.isFile() && entry.name.endsWith('.md')) {
				let content: string;
				try {
					content = await readFile(fullPath, 'utf-8');
				} catch {
					// File vanished/unreadable between readdir and read (common while
					// editing in dev) — skip it rather than abandoning the whole walk.
					continue;
				}
				const meta = parsePageFrontmatter(content);
				if (meta.type === 'partial') continue;

				const relativePath = relative(pagesDir, fullPath);
				const parsed = parsePath(relativePath);
				const slug = join(parsed.dir, parsed.name).replace(/\\/g, '/');

				items.push({
					name: parsed.name,
					slug,
					// Set below after the whole walk so only one file wins `/`.
					isHome: false,
					title: meta.title,
					sidebar_position: meta.sidebar_position,
					icon: meta.icon
				});
			}
		}
	}

	try {
		await walk(pagesDir);
	} catch {
		// pages/ directory might not exist yet
	}

	// At most ONE file maps to `/`, using the same precedence as `getHomeFile`
	// (home → index → README) and only at the pages root. If a user has both
	// `home.md` and `index.md` at the root, `home.md` renders at `/` and
	// `index.md` stays reachable at `/index` — mirroring the actual routing.
	// Without this cap, multiple root pages would emit `href: '/'` in
	// `buildNavTreeFromFlat` and crash `PageNavTree`'s keyed `{#each}` with
	// each_key_duplicate.
	const homePrecedence = ['home', 'index', 'readme'];
	const homeItem = homePrecedence
		.map((name) => items.find((it) => it.slug.toLowerCase() === name))
		.find((it) => it !== undefined);
	if (homeItem) homeItem.isHome = true;

	// Home first, then the shared sidebar_position ordering (Studio parity).
	return items.sort((a, b) => {
		if (a.isHome && !b.isHome) return -1;
		if (!a.isHome && b.isHome) return 1;
		return compareSidebarPosition(
			a.sidebar_position,
			b.sidebar_position,
			navDisplayName(a),
			navDisplayName(b)
		);
	});
}

/**
 * Project-root config files whose edits should trigger a dev reload. They live
 * outside the walked content roots, so without these the signature never flips
 * on a theme/config/translations edit and the page stays stale until refresh.
 */
const ROOT_CONFIG_FILES = ['theme.yaml', 'evidence.config.yaml', 'translations.yaml'];

/** Path+mtime signature of all render inputs; flips on any change so the dev poll catches shared deps (partials/sql/config) a per-page check misses. */
export async function getProjectSignature(projectRoot: string): Promise<string> {
	const pagesDir = await resolvePagesDir(projectRoot);
	// Per-root allowed extensions — metrics/ needs .yaml/.yml but they must NOT
	// be picked up universally (would flip on unrelated .yaml files nested
	// anywhere in pages/queries). Include metrics/*.yaml because editing a
	// metric definition MUST invalidate render output the same way editing
	// a partial or sql source does; without it, `evd dev` renders stale
	// metrics until manual refresh.
	const roots: Array<{ dir: string; exts: readonly string[] }> = [
		{ dir: pagesDir, exts: ['.md', '.sql'] },
		{ dir: join(projectRoot, 'queries'), exts: ['.md', '.sql'] },
		{ dir: join(projectRoot, 'partials'), exts: ['.md', '.sql'] },
		{ dir: join(projectRoot, 'metrics'), exts: ['.yaml', '.yml'] }
	];
	const parts = new Set<string>();

	async function walk(currentDir: string, exts: readonly string[]) {
		let entries;
		try {
			entries = await readdir(currentDir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
				await walk(fullPath, exts);
			} else if (entry.isFile() && exts.some((ext) => entry.name.endsWith(ext))) {
				try {
					const s = await stat(fullPath);
					parts.add(`${relative(projectRoot, fullPath)}:${s.mtimeMs}`);
				} catch {
					// File vanished between readdir and stat — treat as gone
				}
			}
		}
	}

	for (const root of roots) {
		await walk(root.dir, root.exts);
	}

	for (const name of ROOT_CONFIG_FILES) {
		try {
			const s = await stat(join(projectRoot, name));
			parts.add(`${name}:${s.mtimeMs}`);
		} catch {
			// Missing config file — simply omit it from the signature
		}
	}

	return [...parts].sort().join('\n');
}

/**
 * Project-root-relative path of an absolute file, without extension, using
 * forward slashes. Mirrors the full-path keys used by `discoverProject*` below
 * and the `basePath` the new reference model resolves against.
 */
export function projectRootRelativePath(projectRoot: string, absPath: string): string {
	const rel = relative(projectRoot, absPath);
	const parsed = parsePath(rel);
	return join(parsed.dir, parsed.name).replace(/\\/g, '/');
}

/**
 * Recursively collect files matching any of `exts` under `rootDir`, keyed by
 * their project-root-relative path (no extension). Skips hidden dirs and
 * node_modules. Missing roots are ignored. Single walk per root, so a directory
 * that legitimately accepts multiple extensions (e.g. `metrics/` with
 * `.yaml`/`.yml`) can't have one call silently overwrite the other's keys.
 */
async function collectFilesByExt(
	rootDir: string,
	projectRoot: string,
	exts: readonly string[],
	onFile: (key: string, content: string) => void
): Promise<void> {
	async function walk(currentDir: string) {
		let entries;
		try {
			entries = await readdir(currentDir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
				await walk(fullPath);
			} else if (entry.isFile() && exts.some((ext) => entry.name.endsWith(ext))) {
				const content = await readFile(fullPath, 'utf-8');
				onFile(projectRootRelativePath(projectRoot, fullPath), content);
			}
		}
	}
	await walk(rootDir);
}

/**
 * New project-root model: discover SQL files across the project's top-level
 * `pages/` and `queries/` directories, keyed by their project-root-relative
 * path (e.g. `pages/orders`, `queries/revenue`). References resolve against
 * these full paths "from here / from root".
 */
export async function discoverProjectSqlFiles(projectRoot: string): Promise<SqlFiles> {
	const pagesDir = await resolvePagesDir(projectRoot);
	const out: SqlFiles = {};
	for (const root of [pagesDir, join(projectRoot, 'queries')]) {
		await collectFilesByExt(root, projectRoot, ['.sql'], (key, content) => {
			out[key] = content;
		});
	}
	return out;
}

/**
 * New project-root model: discover partial markdown files across the project's
 * top-level `pages/` and `partials/` directories, keyed by their
 * project-root-relative path (e.g. `pages/footer`, `partials/header`).
 */
export async function discoverProjectPartials(
	projectRoot: string
): Promise<Record<string, string>> {
	const pagesDir = await resolvePagesDir(projectRoot);
	const out: Record<string, string> = {};
	for (const root of [pagesDir, join(projectRoot, 'partials')]) {
		await collectFilesByExt(root, projectRoot, ['.md'], (key, content) => {
			if (getMarkdownType(content) === 'partial') out[key] = content;
		});
	}
	return out;
}

/**
 * New project-root model: discover custom-component markdown files across
 * the project's top-level `components/` directory (also checked under
 * `pages/` so an author can colocate a component with the page that owns
 * it), keyed by their project-root-relative path (e.g.
 * `components/my_bar`). Detected by frontmatter `type: component` — a file
 * sitting in `components/` without that frontmatter is ignored, mirroring
 * how `discoverProjectPartials` requires `type: partial`.
 */
export async function discoverProjectComponents(
	projectRoot: string
): Promise<Record<string, string>> {
	const pagesDir = await resolvePagesDir(projectRoot);
	const out: Record<string, string> = {};
	for (const root of [pagesDir, join(projectRoot, 'components')]) {
		await collectFilesByExt(root, projectRoot, ['.md'], (key, content) => {
			if (getMarkdownType(content) === 'component') out[key] = content;
		});
	}
	return out;
}

/**
 * Discover semantic-metric definition files (`metrics/*.yaml`) from the
 * project root, keyed by full project-root-relative path (matching Studio's
 * `getMetricFilesForProject` shape so the same `MetricsCatalog` builder
 * consumes both). Recursive so nested metric files (`metrics/marketing/...`)
 * are picked up too. Returns `{}` when the folder doesn't exist — a project
 * without metrics is legitimate.
 */
export async function discoverProjectMetricFiles(
	projectRoot: string
): Promise<Record<string, string>> {
	const out: Record<string, string> = {};
	// Single walk over both extensions — matches the cleaner shape used by
	// `getProjectSignature`. (If a project has both `foo.yaml` and `foo.yml`
	// at the same path they still collide on the extension-stripped key, but
	// that's an authoring bug we don't try to disambiguate.)
	await collectFilesByExt(
		join(projectRoot, 'metrics'),
		projectRoot,
		['.yaml', '.yml'],
		(key, content) => {
			out[key] = content;
		}
	);
	return out;
}

/**
 * Does the project have any `metrics/*.yaml` files at any depth? Recursive to
 * match `discoverProjectMetricFiles` — a shallow `readdir` misses a project
 * that only defines nested metrics (`metrics/marketing/revenue.yaml`) and
 * would false-negative the catalog gate, leaving valid references unresolved.
 */
export async function hasProjectMetricFiles(projectRoot: string): Promise<boolean> {
	try {
		const files = await discoverProjectMetricFiles(projectRoot);
		return Object.keys(files).length > 0;
	} catch {
		return false;
	}
}

/**
 * Discover all SQL files inside pages/ (recursive)
 * Returns an object where keys are paths relative to pages/ without extension
 * (e.g., "queries/orders"), matching Studio's behavior where references like
 * data="queries/query-name" resolve to pages/queries/query-name.sql
 */
export async function discoverSqlFiles(dir: string): Promise<SqlFiles> {
	const pagesDir = await resolvePagesDir(dir);
	const sqlFiles: SqlFiles = {};

	async function walk(currentDir: string) {
		const entries = await readdir(currentDir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name);

			if (entry.isDirectory()) {
				if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
				await walk(fullPath);
			} else if (entry.isFile() && entry.name.endsWith('.sql')) {
				const content = await readFile(fullPath, 'utf-8');
				const relativePath = relative(pagesDir, fullPath);
				const parsed = parsePath(relativePath);
				const sqlPath = join(parsed.dir, parsed.name).replace(/\\/g, '/');
				sqlFiles[sqlPath] = content;
			}
		}
	}

	try {
		await walk(pagesDir);
	} catch {
		// pages/ directory might not exist yet
	}

	return sqlFiles;
}
