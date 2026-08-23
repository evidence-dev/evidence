// Parses the text after a fence's language (`` ```sql name connection=snowflake ``) into name +
// attrs. `rest` is kept verbatim, not rebuilt from `attrs`, so a rename round-trips losslessly
// (see `withFenceName`) even for attributes this parser doesn't model.

export type FenceMeta = {
	/** The query name. Empty when the fence is unnamed (so it registers no query). */
	name: string;
	/** Parsed `key=value` pairs following the name. */
	attrs: Record<string, string>;
	/** Raw text after the name, preserved exactly so renames round-trip. */
	rest: string;
};

const EMPTY: FenceMeta = { name: '', attrs: {}, rest: '' };

/** A leading token of the form `key=` means the fence has attributes but no name. */
const STARTS_WITH_ATTRIBUTE = /^[^=\s]+=/;

/** `key=value`, `key="value"`, or `key='value'`. */
const ATTRIBUTE = /([^=\s]+)=(?:"([^"]*)"|'([^']*)'|([^\s]*))/g;

/**
 * Split `meta` into the query name and everything after it.
 *
 * Unnamed-but-attributed fences (`` ```sql connection=snowflake ``) yield an
 * empty `name`, matching the existing rule that a fence only registers a query
 * when its name is non-empty.
 */
export function parseFenceMeta(meta: string | undefined | null): FenceMeta {
	if (typeof meta !== 'string') return EMPTY;
	const trimmed = meta.trim();
	if (!trimmed) return EMPTY;

	const firstSpace = trimmed.search(/\s/);
	const startsWithAttribute = STARTS_WITH_ATTRIBUTE.test(trimmed);

	if (firstSpace === -1) {
		return startsWithAttribute
			? { name: '', attrs: parseAttributes(trimmed), rest: trimmed }
			: { name: trimmed, attrs: {}, rest: '' };
	}

	if (startsWithAttribute) {
		return { name: '', attrs: parseAttributes(trimmed), rest: trimmed };
	}

	const name = trimmed.slice(0, firstSpace);
	const rest = trimmed.slice(firstSpace + 1).trim();
	return { name, attrs: parseAttributes(rest), rest };
}

function parseAttributes(source: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	// `matchAll` on a /g regex is safe here; the literal is not shared across calls.
	for (const match of source.matchAll(ATTRIBUTE)) {
		const [, key, doubleQuoted, singleQuoted, bare] = match;
		attrs[key] = doubleQuoted ?? singleQuoted ?? bare ?? '';
	}
	return attrs;
}

/** Rebuild the meta string. `parse` → `serialize` is lossless for any input. */
export function serializeFenceMeta(meta: FenceMeta): string {
	if (!meta.name) return meta.rest;
	return meta.rest ? `${meta.name} ${meta.rest}` : meta.name;
}

// Rename a fence while preserving its attributes. The namespacing pass renames fences in place;
// assigning the bare name back would drop `connection=` and silently re-point the query at the default.
export function withFenceName(meta: string | undefined | null, name: string): string {
	return serializeFenceMeta({ ...parseFenceMeta(meta), name });
}

/** The query name a fence defines, or `''` when it defines none. */
export function fenceQueryName(meta: string | undefined | null): string {
	return parseFenceMeta(meta).name;
}
