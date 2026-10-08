/**
 * Normalized navigation tree shared by the Studio published viewer and the
 * CLI dev-server preview. Both surfaces map their own data shapes into a
 * `NavTree` and hand it to `PageNavTree.svelte`, which renders the shadcn
 * sidebar markup. This keeps the tree presentation in one place while letting
 * each caller build hrefs however it needs (branch-aware in Studio, plain
 * slugs in the CLI).
 */

import { deslugify } from './deslugify';

/**
 * Canonical sidebar ordering: pages with an explicit `sidebar_position` sort
 * first (ascending), ties and unpositioned pages fall back to name order. Shared
 * by the Studio published/preview viewers and the CLI dev server so the sidebar
 * orders identically everywhere a `sidebar_position` frontmatter value is read.
 */
export function compareSidebarPosition(
	aPos: number | null | undefined,
	bPos: number | null | undefined,
	aName: string,
	bName: string
): number {
	if (aPos !== null && aPos !== undefined && bPos !== null && bPos !== undefined) {
		return aPos === bPos ? aName.localeCompare(bName) : aPos - bPos;
	}
	if (aPos !== null && aPos !== undefined) return -1;
	if (bPos !== null && bPos !== undefined) return 1;
	return aName.localeCompare(bName);
}

export interface NavPage {
	name: string;
	href: string;
	icon?: string | null;
}

export interface NavDirectory {
	id: string;
	name: string;
	/**
	 * The folder's own page (`<folder>/index.md`), opened by clicking the folder
	 * name. Folders without one are toggle-only.
	 */
	href?: string | null;
	icon?: string | null;
	pages: NavPage[];
	/** Sub-folders, rendered after `pages` and collapsible like their parent. */
	directories?: NavDirectory[];
}

export interface NavTree {
	rootPages: NavPage[];
	directories: NavDirectory[];
}

// --- Studio mapping ---------------------------------------------------------

interface SidebarProjectPage {
	name: string;
	slug: string | null;
	directoryId?: number;
	settings?: { icon?: string | null } | null;
}

interface SidebarDirectory {
	id: number | string;
	name: string;
	slug: string;
}

export interface SidebarProjectInput {
	rootPages: SidebarProjectPage[];
	secondLevelDirectories: SidebarDirectory[];
	secondLevelPages: SidebarProjectPage[];
}

/**
 * Map a Studio project (root pages + second-level directories/pages) into a
 * `NavTree`. `hrefFor` receives a project-relative slug path (e.g. `"orders"`
 * or `"sales/regional"`) and returns the full URL, so the caller owns
 * branch encoding and org/project prefixing.
 */
export function toNavTreeFromProject(
	project: SidebarProjectInput,
	hrefFor: (relSlug: string) => string
): NavTree {
	const rootPages: NavPage[] = project.rootPages
		.filter((p) => p.slug !== null)
		.map((p) => ({
			name: p.name,
			href: hrefFor(p.slug as string),
			icon: p.settings?.icon ?? null
		}));

	const directories: NavDirectory[] = project.secondLevelDirectories
		.map((dir) => ({
			id: String(dir.id),
			name: dir.name,
			pages: project.secondLevelPages
				.filter((p) => String(p.directoryId) === String(dir.id) && p.slug !== null)
				.map((p) => ({
					name: p.name,
					href: hrefFor(`${dir.slug}/${p.slug}`),
					icon: p.settings?.icon ?? null
				}))
		}))
		.filter((dir) => dir.pages.length > 0);

	return { rootPages, directories };
}

// --- CLI mapping ------------------------------------------------------------

export interface FlatNavItem {
	name: string;
	slug: string;
	isHome: boolean;
	/** Frontmatter `title`; overrides the deslugified filename when present. */
	title?: string;
	/** Frontmatter `icon`; rendered in the sidebar icon column. */
	icon?: string | null;
}

/**
 * Build a `NavTree` from the CLI's flat list of discovered pages. Slugs
 * without a `/` become root pages; slugs nested under folders become pages of
 * those folders, nested to any depth. A folder's `index.md` (served at the
 * folder's own URL) is not listed as a child: it becomes the folder's link, and
 * its `title`/`icon` label the folder. Items are emitted in the order given, so
 * the caller is responsible for sorting (e.g. by `sidebar_position`) first; a
 * folder takes the position of the first item found in it.
 */
export function buildNavTreeFromFlat(items: FlatNavItem[]): NavTree {
	const rootPages: NavPage[] = [];
	const rootDirectories: NavDirectory[] = [];
	const dirsByPath = new Map<string, NavDirectory>();
	// PageNavTree keys its `{#each}` on `href`, so duplicates crash hydration
	// with each_key_duplicate. Callers *should* dedupe upstream, but keep the
	// sidebar defensive so a malformed input degrades to a first-wins nav
	// instead of taking the client down.
	const seenHrefs = new Set<string>();

	function directoryFor(segments: string[]): NavDirectory {
		const path = segments.join('/');
		let dir = dirsByPath.get(path);
		if (dir) return dir;
		dir = {
			id: path,
			name: deslugify(segments[segments.length - 1]),
			pages: [],
			directories: []
		};
		dirsByPath.set(path, dir);
		if (segments.length === 1) rootDirectories.push(dir);
		else directoryFor(segments.slice(0, -1)).directories?.push(dir);
		return dir;
	}

	for (const item of items) {
		const segments = item.slug.split('/');
		const isFolderIndex =
			!item.isHome && segments.length > 1 && segments[segments.length - 1] === 'index';
		const href = item.isHome
			? '/'
			: isFolderIndex
				? `/${segments.slice(0, -1).join('/')}`
				: `/${item.slug}`;
		if (seenHrefs.has(href)) continue;
		seenHrefs.add(href);
		const displayName = item.title ?? (item.isHome ? 'Home' : deslugify(item.name));

		if (item.isHome || segments.length === 1) {
			rootPages.push({ name: displayName, href, icon: item.icon ?? null });
			continue;
		}

		if (isFolderIndex) {
			const dir = directoryFor(segments.slice(0, -1));
			dir.href = href;
			if (item.title) dir.name = item.title;
			dir.icon = item.icon ?? null;
			continue;
		}

		directoryFor(segments.slice(0, -1)).pages.push({
			name: displayName,
			href,
			icon: item.icon ?? null
		});
	}

	return { rootPages, directories: rootDirectories };
}
