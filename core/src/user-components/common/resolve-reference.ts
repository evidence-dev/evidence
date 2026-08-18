/**
 * Reference resolution for the new project-root directory structure.
 *
 * A query or partial reference resolves one of two ways:
 *   - **Leading slash** (`/queries/orders`) -> from the project root: the slash
 *     is stripped and the rest is the full project-root-relative path.
 *   - **No slash** (`new-query`, `sub/x`) -> "from here", relative to the
 *     directory of the file that contains the reference.
 *
 * There is intentionally NO `./` or `../` handling — the model is deliberately
 * limited to "from here" and "from root" for predictability.
 *
 * This resolution is gated to new-structure projects. Legacy projects (and the
 * CLI/OSS on older versions) never call it; they keep exact-key/pages-scoped
 * lookups.
 */

/**
 * The directory portion of a project-root-relative path.
 * `pages/reports/q4` -> `pages/reports`; `pages/home` -> `pages`; `home` -> ''.
 * Leading slashes are ignored.
 */
export function dirOfPath(fullPath: string): string {
	const normalized = fullPath.trim().replace(/^\/+/, '');
	const lastSlash = normalized.lastIndexOf('/');
	return lastSlash === -1 ? '' : normalized.slice(0, lastSlash);
}

/**
 * Resolve a reference to a full project-root-relative path.
 *
 * @param ref      The raw reference as written by the user (e.g. `new-query`,
 *                 `/queries/orders`).
 * @param baseDir  The project-root-relative directory of the referencing file
 *                 (e.g. `pages/reports` for a page at `pages/reports/q4`).
 */
export function resolveProjectReference(ref: string, baseDir: string): string {
	const trimmed = ref.trim();
	if (trimmed.startsWith('/')) {
		// From the project root: strip leading slash(es).
		return trimmed.replace(/^\/+/, '');
	}
	const base = baseDir.trim().replace(/^\/+|\/+$/g, '');
	return base ? `${base}/${trimmed}` : trimmed;
}

/**
 * Markdoc config carrying the new project-root reference model flags.
 * `process-markdoc` copies these from the validation context into the markdoc
 * config so the partial transform/validators can resolve references.
 */
export interface ReferenceResolutionConfig {
	evidenceUseRelativeResolution?: boolean;
	evidenceBasePath?: string;
}

/** Minimal shape of the bits of a Markdoc node we read for resolution. */
type ResolvableNode = { location?: { file?: string } } | undefined;

/**
 * Resolve a partial `file` reference to the full-path key used in the partials
 * map. Legacy (gate-off): returns the reference unchanged (exact-key lookup).
 * New model: resolves "from here" against the referencing file's directory
 * (`node.location.file` for nested partials, else the page `evidenceBasePath`),
 * or "from root" for leading-slash refs.
 *
 * `config` is typed `unknown` because callers pass the Markdoc `Config` (which
 * does not declare the `evidence*` fields in its type, though they are present
 * at runtime); we narrow to the fields we need here.
 */
export function resolvePartialFile(file: string, node: ResolvableNode, config: unknown): string {
	const cfg = (config ?? undefined) as ReferenceResolutionConfig | undefined;
	if (!cfg?.evidenceUseRelativeResolution) return file;
	const referencingFile = node?.location?.file ?? cfg.evidenceBasePath;
	return resolveProjectReference(file, dirOfPath(referencingFile ?? ''));
}
