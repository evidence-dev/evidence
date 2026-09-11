import type { Node } from '@markdoc/markdoc';
import { TRANSLATIONS_KEY } from '../../../constants/variable-keys';
import { wrapSqlSentinel } from '../../../translations/translation-value';
import { stripOneQuotePair } from '../../../filter-variables/frontmatter-variable';
import { parseFenceMeta } from '../../common/fence-meta';
import type { SqlDialect } from '../../../sql-dialect';

// The scanner only needs the dialect's literal-mode semantics, not the full
// surface — tests and callers can pass any dialect object.
export type LiteralScanDialect = Pick<
	SqlDialect,
	'stringLiteralEscapesBackslash' | 'dollarQuoting' | 'tripleQuotedStringDelimiters'
>;

// Group 1 = dotted path; group 2 = `| fallback` (preserved verbatim). The
// `.sql`-suffix idempotency check lives in the callback, not the regex.
const TRANSLATION_TOKEN = /\{\{\s*\$translations((?:\.[a-zA-Z0-9_-]+)+)\s*(\|[^}]*)?\}\}/g;

// Bare `{{ $translations.x }}` inside a `'…'` literal substitutes raw values, so an
// apostrophe closes the literal early — rewriting to `.sql` defers escaping to query time.
export function rewriteBareTranslationSqlAccessors(
	content: string,
	dialect: LiteralScanDialect
): string {
	if (!content.includes('{{') || !content.includes(`$${TRANSLATIONS_KEY}`)) return content;

	let out = '';
	let i = 0;
	const n = content.length;

	while (i < n) {
		const c = content[i];

		// Line comment: `--` to end of line (the newline stays outside).
		if (c === '-' && content[i + 1] === '-') {
			let j = i;
			while (j < n && content[j] !== '\n') j++;
			out += content.slice(i, j);
			i = j;
			continue;
		}

		// Block comment: `/* ... */` (non-nested).
		if (c === '/' && content[i + 1] === '*') {
			let j = i + 2;
			while (j < n && !(content[j] === '*' && content[j + 1] === '/')) j++;
			j = Math.min(j + 2, n);
			out += content.slice(i, j);
			i = j;
			continue;
		}

		// Dollar-quoted string: content is literal, so copy verbatim and leave tokens bare.
		if (c === '$' && dialect.dollarQuoting !== 'none') {
			const delim = dollarQuoteDelimiterAt(content, i, dialect.dollarQuoting);
			if (delim !== null) {
				const end = content.indexOf(delim, i + delim.length);
				if (end === -1) {
					out += content.slice(i);
					i = n;
				} else {
					out += content.slice(i, end + delim.length);
					i = end + delim.length;
				}
				continue;
			}
		}

		// Triple-quoted strings (BigQuery): content is literal, so copy verbatim.
		let tripleMatched = false;
		for (const delim of dialect.tripleQuotedStringDelimiters) {
			if (c === delim[0] && content.startsWith(delim, i)) {
				const end = content.indexOf(delim, i + delim.length);
				if (end === -1) {
					out += content.slice(i);
					i = n;
				} else {
					out += content.slice(i, end + delim.length);
					i = end + delim.length;
				}
				tripleMatched = true;
				break;
			}
		}
		if (tripleMatched) continue;

		// Double-quoted / backtick identifier: copy verbatim through its close.
		if (c === '"' || c === '`') {
			const quote = c;
			out += c;
			i++;
			while (i < n) {
				out += content[i];
				if (content[i] === quote) {
					if (content[i + 1] === quote) {
						out += content[i + 1];
						i += 2;
						continue;
					}
					i++;
					break;
				}
				i++;
			}
			continue;
		}

		// Single-quoted string literal: rewrite bare translation tokens inside.
		if (c === "'") {
			// The dialect decides whether backslash escapes apply for THIS literal
			// (`E'…'` flips on for Postgres, `r'…'` flips off for BigQuery).
			const backslashEscapes = dialect.stringLiteralEscapesBackslash(
				identifierRunBefore(content, i)
			);
			// The sentinel finalises with the ORDINARY literal escaping — unsafe in a
			// literal that ignores backslashes while the ordinary policy relies on them.
			const sentinelEscapesCorrectly =
				backslashEscapes || !dialect.stringLiteralEscapesBackslash('');
			i++;
			let literal = "'";
			while (i < n) {
				// Template tokens are opaque to SQL literal structure — an apostrophe
				// inside `{{ … }}` (e.g. a fallback) must not close the literal.
				if (content[i] === '{' && content[i + 1] === '{') {
					const tokenEnd = content.indexOf('}}', i);
					if (tokenEnd === -1) {
						literal += content.slice(i);
						i = n;
						break;
					}
					literal += content.slice(i, tokenEnd + 2);
					i = tokenEnd + 2;
					continue;
				}
				// Backslash escapes the next char, but only where the dialect honours it.
				if (backslashEscapes && content[i] === '\\') {
					literal += content[i];
					if (i + 1 < n) {
						literal += content[i + 1];
						i += 2;
					} else {
						i++;
					}
					continue;
				}
				if (content[i] === "'") {
					// Doubled quote is an escaped apostrophe and stays inside.
					if (content[i + 1] === "'") {
						literal += "''";
						i += 2;
						continue;
					}
					literal += "'";
					i++;
					break;
				}
				literal += content[i];
				i++;
			}
			out += sentinelEscapesCorrectly ? rewriteTokensInLiteral(literal) : literal;
			continue;
		}

		out += c;
		i++;
	}

	return out;
}

// The maximal `[A-Za-z]` run immediately before `idx` ('' when none) — the
// literal-prefix token (`E`, `r`, `SOME`, …) the dialect classifies.
function identifierRunBefore(content: string, idx: number): string {
	let start = idx;
	while (start > 0 && /[A-Za-z]/.test(content[start - 1])) start--;
	return content.slice(start, idx);
}

// The dollar-quote delimiter opening at `idx` ($$ or $tag$), or null. 'double'
// accepts only $$; 'tagged' also accepts $tag$ (tag = identifier, not $1).
function dollarQuoteDelimiterAt(
	content: string,
	idx: number,
	mode: 'double' | 'tagged'
): string | null {
	if (content[idx + 1] === '$') return '$$';
	if (mode !== 'tagged') return null;
	const m = /^\$([A-Za-z_][A-Za-z0-9_]*)\$/.exec(content.slice(idx));
	return m ? m[0] : null;
}

// Runs at parse time so Markdoc's transform resolves the `.sql` accessor to
// its sentinel instead of substituting the raw value into the fence content.
export function rewriteSqlFenceTranslationTokens(
	ast: Node,
	dialect: LiteralScanDialect,
	// Resolves a fence's `connection=` attr to that connection's dialect.
	resolveConnectionDialect?: (connection: string) => LiteralScanDialect | undefined
): void {
	for (const node of ast.walk()) {
		if (
			node.type === 'fence' &&
			node.attributes?.language === 'sql' &&
			typeof node.attributes?.content === 'string'
		) {
			const connection = parseFenceMeta(node.attributes.meta).attrs.connection;
			const effective = (connection && resolveConnectionDialect?.(connection)) || dialect;
			const rewritten = rewriteBareTranslationSqlAccessors(node.attributes.content, effective);
			if (rewritten !== node.attributes.content) node.attributes.content = rewritten;
		}
	}
}

function rewriteTokensInLiteral(literal: string): string {
	return literal.replace(TRANSLATION_TOKEN, (match, path: string, fallback: string) => {
		// The accessor form is `<key>.sql` — a bare `.sql` is a key named "sql".
		const isSqlAccessor = path.endsWith('.sql') && path !== '.sql';
		// An explicit `.sql` accessor with no fallback is already correct.
		if (isSqlAccessor && fallback === undefined) return match;
		// The fallback is substituted raw — sentinel it so an apostrophe in it is
		// escaped at query time too, including for explicit `.sql` accessors.
		if (fallback === undefined) {
			return `{{ $${TRANSLATIONS_KEY}${path}.sql }}`;
		}
		const fallbackValue = stripOneQuotePair(fallback.slice(1).trim());
		// A path already carrying `.sql` must not gain a second accessor suffix.
		return `{{ $${TRANSLATIONS_KEY}${path}${isSqlAccessor ? '' : '.sql'} | ${wrapSqlSentinel(fallbackValue)} }}`;
	});
}
