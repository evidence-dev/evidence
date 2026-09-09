import type { TranslationMap } from '../types/translations';
import type { SqlDialect } from '../sql-dialect';
import { escapeAnsiStringLiteral } from '../sql-dialect/common';

// Length prefix lets a value containing CLOSE round-trip without escaping.
const OPEN = '\uE000ev-tsql\uE001';
const CLOSE = '\uE002ev-tsql\uE003';

// Dialect isn't known when Markdoc substitutes variables, so `.sql` defers
// escaping via a sentinel that `applyTranslationSqlEscapes` finalises later.
export class TranslationValue extends String {
	get sql(): string {
		const raw = this.toString();
		return `${OPEN}${raw.length}:${raw}${CLOSE}`;
	}
}

export function wrapTranslationsForSql(map: TranslationMap): TranslationMap {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(map)) {
		// `Object.entries(new String('ab'))` yields indexed characters, so a
		// re-wrap would descend into `[['0','a'],['1','b']]` without this branch.
		if (typeof value === 'string' || value instanceof String) {
			out[key] = new TranslationValue(value.toString());
		} else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			out[key] = wrapTranslationsForSql(value as TranslationMap);
		} else {
			out[key] = value;
		}
	}
	return out as TranslationMap;
}

// ANSI fallback when no dialect is passed keeps a stray sentinel from ever
// reaching the warehouse verbatim.
export function applyTranslationSqlEscapes(
	sql: string,
	dialect?: Pick<SqlDialect, 'escapeStringLiteral'>
): string {
	if (!sql.includes(OPEN)) return sql;
	const escape = dialect ? (v: string) => dialect.escapeStringLiteral(v) : escapeAnsiStringLiteral;
	let out = '';
	let i = 0;
	while (i < sql.length) {
		const openIdx = sql.indexOf(OPEN, i);
		if (openIdx === -1) {
			out += sql.slice(i);
			break;
		}
		out += sql.slice(i, openIdx);
		const lenStart = openIdx + OPEN.length;
		const colonIdx = sql.indexOf(':', lenStart);
		if (colonIdx === -1) {
			out += sql.slice(openIdx);
			break;
		}
		const len = Number.parseInt(sql.slice(lenStart, colonIdx), 10);
		const valStart = colonIdx + 1;
		const valEnd = valStart + len;
		if (
			!Number.isFinite(len) ||
			len < 0 ||
			valEnd > sql.length ||
			sql.slice(valEnd, valEnd + CLOSE.length) !== CLOSE
		) {
			// Skip past the marker so a partial one in real text doesn't loop.
			out += sql.slice(openIdx, openIdx + OPEN.length);
			i = openIdx + OPEN.length;
			continue;
		}
		out += escape(sql.slice(valStart, valEnd));
		i = valEnd + CLOSE.length;
	}
	return out;
}

export function hasUnresolvedTranslationSqlEscape(sql: string): boolean {
	return sql.includes(OPEN);
}
