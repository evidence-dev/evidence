/**
 * Utility for transforming internal links based on the current render context.
 * Shared by Link.svelte (markdoc links) and Table.svelte (dimension/row links).
 *
 * Markdown links use the format /<projectSlug>/<path> (validated by isTreePath).
 * Dimension/row links use the format /<path> (page-relative, no project slug).
 */

/**
 * Returns true if the href is an internal link (not a fully qualified URL).
 */
export function isInternalLink(href: string): boolean {
	try {
		new URL(href);
		return false;
	} catch {
		return true;
	}
}

const SAFE_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function isSafeExternalUrl(href: string): boolean {
	try {
		return SAFE_EXTERNAL_PROTOCOLS.has(new URL(href).protocol);
	} catch {
		return false;
	}
}

export function sanitizeUrl(href: string): string;
export function sanitizeUrl(href: undefined): undefined;
export function sanitizeUrl(href: string | undefined): string | undefined;
export function sanitizeUrl(href: string | undefined): string | undefined {
	if (href === undefined) return undefined;
	try {
		return SAFE_EXTERNAL_PROTOCOLS.has(new URL(href).protocol) ? href : 'about:blank';
	} catch {
		return href;
	}
}

export type TransformOptions = {
	/**
	 * Whether the href already includes the project slug as the first path segment.
	 * true for markdown links (/<projectSlug>/<path>).
	 * false for dimension/row links (/<path>).
	 * Defaults to true (markdown link format).
	 */
	hrefIncludesProjectSlug?: boolean;
};

/**
 * Transforms an internal link to the correct URL for the current render context.
 *
 * Published: resolves to /{orgId}/{projectSlug}/{path}
 * Preview: resolves to /preview/working/{orgId}/{projectSlug}/{branch}/{path}
 * Edit: sets linkPreviewPath query param to show linked page in preview pane
 *
 * External links are returned unchanged.
 */
export function transformInternalLink(
	href: string,
	context: 'edit' | 'preview' | 'published' | undefined,
	params: Record<string, string>,
	options?: TransformOptions
): string {
	// Only a rewrite is worth acting on: sanitizeUrl hands back relative paths untouched, so an
	// unchanged value still has to go through the internal-link transform below.
	const sanitizedHref = sanitizeUrl(href);
	if (sanitizedHref !== href) return sanitizedHref;
	if (!isInternalLink(href)) return href;

	const includesProjectSlug = options?.hrefIncludesProjectSlug ?? true;
	const normalizedHref = href.startsWith('/') ? href : `/${href}`;

	if (context === 'edit') {
		if (typeof window === 'undefined') return href;
		const url = new URL(window.location.href);

		// Separate path from query params — linkPreviewPath should contain
		// only the path so filesService.findOneByPath can resolve the page.
		// Any query params from the href are added as separate URL search params.
		const qIndex = normalizedHref.indexOf('?');
		const pathPart = qIndex >= 0 ? normalizedHref.substring(0, qIndex) : normalizedHref;
		const queryPart = qIndex >= 0 ? normalizedHref.substring(qIndex + 1) : undefined;

		if (includesProjectSlug) {
			url.searchParams.set('linkPreviewPath', pathPart.substring(1));
		} else {
			url.searchParams.set('linkPreviewPath', `${params.projectSlug}${pathPart}`);
		}

		if (queryPart) {
			const hrefParams = new URLSearchParams(queryPart);
			for (const [key, value] of hrefParams) {
				url.searchParams.set(key, value);
			}
		}

		return url.toString();
	}

	if (context === 'preview') {
		if (includesProjectSlug) {
			// href is /<projectSlug>/<path>(?query) — extract projectSlug and rebuild
			const qIndex = normalizedHref.indexOf('?');
			const pathPart = qIndex >= 0 ? normalizedHref.substring(1, qIndex) : normalizedHref.substring(1);
			const queryPart = qIndex >= 0 ? normalizedHref.substring(qIndex) : '';
			const segments = pathPart.split('/');
			const projectSlug = segments[0];
			const path = segments.slice(1).join('/');
			return `/preview/working/${params.organizationId}/${projectSlug}/${params.branch}/${path}${queryPart}`;
		} else {
			return `/preview/working/${params.organizationId}/${params.projectSlug}/${params.branch}${normalizedHref}`;
		}
	}

	if (context === 'published') {
		if (includesProjectSlug) {
			// href already has /<projectSlug>/<path>, just prepend /{orgId}
			return `/${params.organizationId}${normalizedHref}`;
		} else {
			return `/${params.organizationId}/${params.projectSlug}${normalizedHref}`;
		}
	}

	return href;
}

/**
 * Params that represent page-local UI state and should NOT be carried across page navigations.
 */
const INTERNAL_PARAMS = new Set(['linkPreviewPath', 'fullscreen']);

/**
 * Merges the current page's URL search params into a target link URL.
 * This enables filter persistence across page navigations.
 *
 * Called at click time (not render time) to ensure the latest filter values
 * are included — window.location.search is always fresh because filter writes
 * are synchronous via window.history.replaceState.
 *
 * - Link's explicit params take precedence over current page params
 * - Page-local UI params are excluded
 * - No-op on the server (returns targetHref unchanged)
 * - No-op if there are no new params to add
 */
export function mergeCurrentSearchParams(targetHref: string): string {
	if (typeof window === 'undefined') return targetHref;

	const currentParams = new URLSearchParams(window.location.search);
	if (currentParams.size === 0) return targetHref;

	const target = new URL(targetHref, window.location.origin);

	let changed = false;
	for (const [key, value] of currentParams) {
		if (INTERNAL_PARAMS.has(key)) continue;
		// Link's explicit params take precedence — only add if not already present
		if (!target.searchParams.has(key)) {
			target.searchParams.set(key, value);
			changed = true;
		}
	}

	if (!changed) return targetHref;

	// Preserve the original URL format: full URL for edit context, relative path for others
	try {
		new URL(targetHref); // Succeeds if targetHref is already a full URL (edit context)
		return target.toString();
	} catch {
		return target.pathname + target.search;
	}
}
