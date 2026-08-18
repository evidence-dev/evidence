/**
 * Serializer: in-memory access state → canonical yaml string.
 *
 * Pure function — no DB, no IO. Mirrors `parse.ts` on the other side of the
 * pipeline. The output is guaranteed to round-trip through `parseAccessYaml`
 * back to an equivalent `AccessRuleSet`; the test suite enforces this.
 *
 * Lives in @evidence/core so both Studio (project bootstrap, access editing)
 * and the CLI (`evidence launch` scaffolding access.yaml) emit byte-identical
 * files — a launched repo's access.yaml must match what Studio would write for
 * a new project, or code-managed access drifts between the two.
 *
 * Canonical form choices (so diffs on the file are meaningful, not noise):
 * - Block style throughout (no flow `[a, b]` style), easier to read line-by-line
 * - Users sorted alphabetically by email, groups by slug, pages by path
 * - Default values (`restricted: false`, empty grants) omitted entirely
 * - A header comment marks the file as managed; admins can still edit by hand
 * - 2-space indent (matches existing repo conventions)
 */

import yaml from 'js-yaml';

/**
 * Minimal shape required to emit yaml. Intentionally NOT the same as
 * `AccessRuleSet` (which uses Map for pages keyed by path) — the exporter
 * pipeline produces the array shape directly, and using arrays keeps sort
 * order explicit and serialization-friendly.
 *
 * The reader (`reader.ts`) produces this; the serializer consumes it. Keeping
 * a separate type here lets us iterate on the reader's join shape without
 * touching the parser's output type.
 *
 * `folders` is optional so that callers producing this shape from DB state
 * (which has no folder-level rows in V1) can omit it entirely — the reader
 * currently does exactly that. Callers producing it from an in-memory
 * `AccessRuleSet` (Share popover mutation path via `ruleSetToSerializable`)
 * MUST populate it when the source rule set has folder entries; dropping
 * folders during serialize is silent data loss and would leak access on
 * publish.
 */
export type SerializableAccessState = {
	project: {
		restricted: boolean;
		grants: { users: string[]; groups: string[] };
	};
	folders?: Array<{
		path: string;
		restricted: boolean;
		grants: { users: string[]; groups: string[] };
	}>;
	pages: Array<{
		path: string;
		restricted: boolean;
		grants: { users: string[]; groups: string[] };
	}>;
};

// Boilerplate header for newly-bootstrapped files. Intentionally
// short — title + one-line description + docs link, no inline
// examples. Examples drift from the canonical docs and a bloated
// boilerplate gets in the way of admins editing the actual rules.
// The docs page has the full pattern reference.
const HEADER_COMMENT = `# Applies access permissions in projects published on Evidence Studio.
#
# Source of truth for who can see what. Changes take effect when
# this file is published to the project's default branch.
#
# Full schema, patterns, and validation rules:
# https://docs.evidence.studio/features/page-level-access-control
`;

/**
 * Build the canonical yaml representation of the given access state.
 *
 * Returns a string ready to write to disk (or to the `files.content` column).
 * Always includes the header comment regardless of state.
 */
export function serializeAccessState(state: SerializableAccessState): string {
	const body = buildBody(state);
	const yamlBody = yaml.dump(body, {
		indent: 2,
		lineWidth: -1,
		noRefs: true,
		flowLevel: -1,
		sortKeys: false
	});

	// `buildBody` always sets `body.project`, so `yamlBody` is never just
	// "{}\n". The header comment is always followed by a real body.
	return HEADER_COMMENT + '\n' + yamlBody;
}

/**
 * Build the plain JSON-y object that yaml.dump will serialize. We construct
 * this rather than emitting yaml-as-string directly so js-yaml handles all
 * the escaping / quoting concerns.
 *
 * Key order in object-literal positions is preserved by js-yaml's dump (it
 * uses the iteration order of the JS object). We define keys explicitly to
 * lock in field order: `restricted` before `grants`, `users` before `groups`.
 */
function buildBody(state: SerializableAccessState): Record<string, unknown> {
	const body: Record<string, unknown> = {};

	// Always emit the project block — even for admins-only projects with
	// no grants. The file is the user's first encounter with the access
	// model, and a missing `project:` block reads as "did someone forget
	// to declare anything?" rather than the intended "no audience yet."
	//
	// `$org` is injected into groups when the internal state says
	// `restricted: false` — that's how the parser recovers "open to org"
	// vs. "admins-only" on round-trip. It then gets merged into the
	// unified viewers list below.
	const projectGroupsWithBuiltins = state.project.restricted
		? state.project.grants.groups
		: ['$org', ...state.project.grants.groups];
	const projectGrants = formatGrants({
		users: state.project.grants.users,
		groups: projectGroupsWithBuiltins
	});
	// Admins-only fallback: no users, no groups, no $org. Emit an
	// explicit empty `viewers: []` (rather than `grants: {}`) so the
	// block reads as a template the user can fill in — "here's where
	// the audience goes" — instead of cryptic config-speak. The shape
	// matches what someone writing this by hand would naturally produce.
	body.project = {
		grants: projectGrants ?? { viewers: [] }
	};

	// Folders emitted BEFORE pages so the file reads in cascade order:
	// project → folder → page (top-down, matches how the runtime walks
	// the chain). Skips folders with pure defaults (inherit=true + no
	// grants) the same way pages does — a degenerate entry adds no
	// semantic information vs. omission.
	const folderEntries = [...(state.folders ?? [])].sort((a, b) => a.path.localeCompare(b.path));
	const foldersObj: Record<string, unknown> = {};
	for (const folder of folderEntries) {
		const folderObj: Record<string, unknown> = {};
		if (folder.restricted) {
			folderObj.inherit = false;
		}
		const folderGrants = formatGrants(folder.grants);
		if (folderGrants !== undefined) {
			folderObj.grants = folderGrants;
		}
		if (Object.keys(folderObj).length > 0) {
			foldersObj[folder.path] = folderObj;
		}
	}
	if (Object.keys(foldersObj).length > 0) {
		body.folders = foldersObj;
	}

	const pageEntries = [...state.pages].sort((a, b) => a.path.localeCompare(b.path));
	const pagesObj: Record<string, unknown> = {};
	for (const page of pageEntries) {
		const pageObj: Record<string, unknown> = {};
		if (page.restricted) {
			pageObj.inherit = false;
		}
		const pageGrants = formatGrants(page.grants);
		if (pageGrants !== undefined) {
			pageObj.grants = pageGrants;
		}

		// Skip pages that are pure defaults (inherit=true + no grants). They
		// add no semantic information vs. omission. Avoids noisy yaml.
		if (Object.keys(pageObj).length > 0) {
			pagesObj[page.path] = pageObj;
		}
	}

	if (Object.keys(pagesObj).length > 0) {
		body.pages = pagesObj;
	}

	return body;
}

/**
 * Returns `undefined` if grants are entirely empty (lets caller omit
 * the `grants:` key); otherwise returns a normalized, sorted unified
 * `viewers:` list.
 *
 * Sort order: case-insensitive alphabetical across the merged list.
 * Built-in tokens (`$org`) sort with the rest by their literal string
 * — `$` is below `0-9` in ASCII, so `$org` lands at the top, which
 * happens to match the most useful reading order ("everyone, plus
 * these specific extras"). Stable canonical form means re-exporting
 * unchanged state produces byte-identical yaml — important for
 * round-tripping and meaningful PR diffs.
 */
function formatGrants(grants: {
	users: string[];
	groups: string[];
}): { viewers?: string[] } | undefined {
	const merged = sortDedupe([...grants.users, ...grants.groups]);

	if (merged.length === 0) {
		return undefined;
	}

	return { viewers: merged };
}

function sortDedupe(arr: string[]): string[] {
	const set = new Set(arr.map((s) => s.toLowerCase()));
	return [...set].sort();
}
