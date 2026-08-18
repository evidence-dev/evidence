import { CUSTOM_COMPONENT_ATTRIBUTE_TYPES } from './attribute-types';

/** A top-level frontmatter key that looks like a mis-indented attribute. */
export type MisnestedAttribute = { key: string; type: string };

// Legitimate top-level component frontmatter keys — anything else that looks
// like an attribute declaration is a misnest. Keep in sync with the component
// frontmatter shape (see `parseCustomComponentMeta`).
const KNOWN_TOP_LEVEL_KEYS = new Set(['type', 'description', 'attributes', 'preview']);

/**
 * Detect the YAML-indentation footgun: an author writes
 *
 *   attributes:
 *     data: query
 *   color:            ← at column 0, not nested
 *     type: string
 *
 * and YAML parses `color` as a top-level frontmatter key, so the component
 * never sees it and renders without it — with no error to explain why. Returns
 * one entry per top-level key that carries a STRONG signal of being a
 * misplaced attribute (its value names a known type, or is an object with a
 * `type:` naming a known type). Weak signals (arbitrary top-level strings,
 * legal as partial-style body defaults) are ignored.
 *
 * Shared by the editor (`MarkdocProcessor`) and the commit gate
 * (`validate-markdown-files`) so both derive "misnested" identically — adding
 * a reserved top-level key here updates both at once.
 */
export function detectMisnestedAttributeDeclarations(
	frontmatter: Record<string, unknown>
): MisnestedAttribute[] {
	const knownTypes = new Set<string>(CUSTOM_COMPONENT_ATTRIBUTE_TYPES);
	const out: MisnestedAttribute[] = [];

	for (const [key, value] of Object.entries(frontmatter)) {
		if (KNOWN_TOP_LEVEL_KEYS.has(key)) continue;

		const looksLikeShorthand = typeof value === 'string' && knownTypes.has(value);
		const looksLikeLonghand =
			value !== null &&
			value !== undefined &&
			typeof value === 'object' &&
			!Array.isArray(value) &&
			typeof (value as Record<string, unknown>).type === 'string' &&
			knownTypes.has((value as Record<string, unknown>).type as string);

		if (!looksLikeShorthand && !looksLikeLonghand) continue;

		out.push({
			key,
			type: typeof value === 'string' ? value : ((value as Record<string, unknown>).type as string)
		});
	}

	return out;
}
