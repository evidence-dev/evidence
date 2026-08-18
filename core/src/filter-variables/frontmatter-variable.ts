// Canonical grammar for frontmatter variable references ({{ $var }}) and their
// optional fallback ({{ $var | fallback }}).
//
// This MUST stay byte-for-byte identical to @hughess/markdoc's `interpolateString`
// (the fork's {{ }} engine, evidence.29+). Markdoc resolves text/heading/attribute
// references with that function; the sites below mirror it for the query/SQL,
// validation, and custom_echart surfaces. If the fork's grammar changes, change it
// here too or surfaces will silently disagree.
//
//   Group 1 = variable path (inner path alternation is non-capturing)
//   Group 2 = raw fallback text (optional). `[^}]*?` stops at the first `}`, so a
//             fallback cannot contain `}` or a nested `{{ }}` — flat literals only.
export const createFrontmatterVariablePattern = (): RegExp =>
	/\{\{\s*\$([a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]*|\[[0-9]+\])*)\s*(?:\|\s*([^}]*?)\s*)?\}\}/g;

// Mirror of the fork's stripOneQuotePair: strip exactly one matching outer quote
// pair (' or "), otherwise return the value untouched. Keeps a fallback rendering
// the same shape as a defined value ('total_attendance' -> total_attendance).
export function stripOneQuotePair(value: string): string {
	if (
		value.length >= 2 &&
		(value[0] === "'" || value[0] === '"') &&
		value[value.length - 1] === value[0]
	) {
		return value.slice(1, -1);
	}
	return value;
}

// Split a variable path into segments, splitting on `.` and treating `[n]` as an
// index segment (`"[0]"`). Mirrors @hughess/markdoc's interpolateString so the
// query/SQL resolver reaches the same values the fork resolves in text.
export function parseVariablePath(path: string): string[] {
	const parts: string[] = [];
	let current = '';
	let inBrackets = false;
	let bracket = '';
	for (const char of path) {
		if (char === '[' && !inBrackets) {
			if (current) parts.push(current);
			current = '';
			inBrackets = true;
			bracket = '';
		} else if (char === ']' && inBrackets) {
			parts.push(`[${bracket}]`);
			inBrackets = false;
			bracket = '';
		} else if (char === '.' && !inBrackets) {
			if (current) parts.push(current);
			current = '';
		} else if (inBrackets) {
			bracket += char;
		} else {
			current += char;
		}
	}
	if (current) parts.push(current);
	return parts;
}

// Resolve a variable path against a variables object, honouring `[n]` array
// indexing. `resolved: false` means the path could not be reached (missing key,
// out-of-range/ non-array index, or a non-object mid-path) — the caller decides
// whether to fall back. Mirrors the fork's interpolateString walk.
export function resolveVariablePath(
	variables: Record<string, unknown>,
	path: string
): { resolved: boolean; value: unknown } {
	let current: unknown = variables;
	for (const part of parseVariablePath(path)) {
		if (!current || typeof current !== 'object') return { resolved: false, value: undefined };
		if (part.startsWith('[') && part.endsWith(']')) {
			const index = parseInt(part.slice(1, -1), 10);
			if (Array.isArray(current) && index >= 0 && index < current.length) {
				current = current[index];
			} else {
				return { resolved: false, value: undefined };
			}
		} else if (part in current) {
			current = (current as Record<string, unknown>)[part];
		} else {
			return { resolved: false, value: undefined };
		}
	}
	return { resolved: true, value: current };
}
