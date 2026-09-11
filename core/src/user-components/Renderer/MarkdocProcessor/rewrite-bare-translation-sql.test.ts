import { describe, expect, it } from 'vitest';
import Markdoc, { type Node } from '@markdoc/markdoc';
import {
	rewriteBareTranslationSqlAccessors,
	rewriteSqlFenceTranslationTokens
} from './rewrite-bare-translation-sql';
import { wrapSqlSentinel } from '../../../translations/translation-value';
import { PostgresDialect } from '../../../sql-dialect/postgres';
import { BigQueryDialect } from '../../../sql-dialect/bigquery';
import { ClickHouseDialect } from '../../../sql-dialect/clickhouse';
import { SnowflakeDialect } from '../../../sql-dialect/snowflake';
import { DatabricksDialect } from '../../../sql-dialect/databricks';

// Tests pass real dialects so literal-mode semantics (E/r prefixes, dollar/
// triple-quoting) come from the dialect, not a boolean.
const bq = new BigQueryDialect();
const pg = new PostgresDialect();
const ch = new ClickHouseDialect();
const sf = new SnowflakeDialect();

describe('rewriteBareTranslationSqlAccessors', () => {
	it('rewrites a bare token inside a single-quoted string literal', () => {
		const sql = "select * from t where section = '{{ $translations.name }}'";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(
			"select * from t where section = '{{ $translations.name.sql }}'"
		);
	});

	it('rewrites nested paths (member_paid.eap)', () => {
		const sql = "case when source_program = 'eap' then '{{ $translations.member_paid.eap }}' end";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(
			"case when source_program = 'eap' then '{{ $translations.member_paid.eap.sql }}' end"
		);
	});

	it('leaves identifier concatenation outside string literals bare', () => {
		const sql = 'select label_{{ $translations.langcode }} as local_label from t';
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('is idempotent on tokens already carrying .sql', () => {
		const sql = "select * from t where section = '{{ $translations.name.sql }}'";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('still rewrites a translation key literally named "sql" (single-segment path)', () => {
		// `.sql` alone is a key named "sql", not the accessor form `<key>.sql`.
		const sql = "select * from t where section = '{{ $translations.sql }}'";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(
			"select * from t where section = '{{ $translations.sql.sql }}'"
		);
	});

	it('rewrites tokens with a fallback, wrapping the fallback in a sentinel', () => {
		const sql = `select * from t where section = '{{ $translations.name | "Other" }}'`;
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(
			`select * from t where section = '{{ $translations.name.sql | ${wrapSqlSentinel('Other')} }}'`
		);
	});

	it('wraps an apostrophe-bearing fallback in a sentinel so it escapes at query time', () => {
		const sql = `select * from t where section = '{{ $translations.missing | "L'offre" }}'`;
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(
			`select * from t where section = '{{ $translations.missing.sql | ${wrapSqlSentinel("L'offre")} }}'`
		);
	});

	it('wraps an explicit .sql accessor fallback in a sentinel too (not just the bare form)', () => {
		// The accessor's fallback is substituted raw — without the sentinel wrap
		// its apostrophe would close the literal early.
		const sql = `select * from t where section = '{{ $translations.missing.sql | "L'offre" }}'`;
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(
			`select * from t where section = '{{ $translations.missing.sql | ${wrapSqlSentinel("L'offre")} }}'`
		);
	});

	it('is idempotent on an explicit .sql accessor with no fallback', () => {
		const sql = `select * from t where section = '{{ $translations.name.sql }}'`;
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('does not rewrite inside a line comment', () => {
		const sql = '-- see {{ $translations.name }}\nselect 1';
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('does not rewrite inside a block comment', () => {
		const sql = '/* refs {{ $translations.name }} */ select 1';
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('does not let a quote inside a comment toggle literal state', () => {
		// The apostrophe in the comment must not open a literal that swallows
		// the real query's tokens.
		const sql = "-- don't {{ $translations.name }}\nselect 1";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('does not rewrite inside double-quoted identifiers', () => {
		const sql = 'select "{{ $translations.name }}" from t';
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('does not rewrite inside backtick identifiers', () => {
		const sql = 'select `{{ $translations.name }}` from t';
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('treats a doubled quote inside a literal as an escaped apostrophe, not a close', () => {
		// The literal is 'it''s {{ $translations.name }}' — the token is INSIDE
		// the literal (the '' is an escape), so it must be rewritten.
		const sql = "select 'it''s {{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(
			"select 'it''s {{ $translations.name.sql }}' as v"
		);
	});

	it('treats a backslash-escaped apostrophe as part of the literal (backslash dialect)', () => {
		// Backslash dialects (BigQuery/ClickHouse/Snowflake/Databricks) write
		// `\'` — the token after it is still inside the literal.
		const sql = "select 'd\\'aide {{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(
			"select 'd\\'aide {{ $translations.name.sql }}' as v"
		);
	});

	it('does not let an escaped backslash (\\\\) hide the closing quote (backslash dialect)', () => {
		// `'a\\'` is the string `a\` — the token after the close is OUTSIDE.
		const sql = "select 'a\\\\' || {{ $translations.name }} as v";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('treats backslash as ordinary in ANSI dialects — a quote after it closes the literal', () => {
		// Postgres: `'a\'` is the complete literal `a\`, so the token after it is
		// OUTSIDE and must stay bare (rewriting would corrupt identifier concat).
		const sql = "select 'a\\' || {{ $translations.langcode }} as v";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(sql);
	});

	it('still rewrites tokens in ANSI literals that contain no backslash', () => {
		const sql = "select * from t where section = '{{ $translations.name }}'";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(
			"select * from t where section = '{{ $translations.name.sql }}'"
		);
	});

	it('resumes literal state correctly after a doubled quote', () => {
		// 'it''s' closes at the third quote; the token after it is OUTSIDE any
		// literal, so it stays bare.
		const sql = "select 'it''s' || {{ $translations.name }} as v";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('handles multiple tokens across literals and non-literals in one query', () => {
		const sql =
			"select 'a {{ $translations.one }} b' as x, col_{{ $translations.two }} as y from t where c = '{{ $translations.three }}'";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(
			"select 'a {{ $translations.one.sql }} b' as x, col_{{ $translations.two }} as y from t where c = '{{ $translations.three.sql }}'"
		);
	});

	it('rewrites inside an unterminated literal too (the query is invalid either way)', () => {
		// An unterminated literal never reaches the warehouse as a valid query,
		// so rewriting inside it is harmless and keeps the scanner simple.
		const sql = "select 'open {{ $translations.name }}";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(
			"select 'open {{ $translations.name.sql }}"
		);
	});

	it('returns content unchanged when no translation tokens exist', () => {
		const sql = "select * from t where section = 'x' -- no tokens";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});

	it('leaves a whole-map $translations reference alone', () => {
		// `{{ $translations }}` (no path) has no string value to escape.
		const sql = "select '{{ $translations }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});
});

describe('literal-prefix modes (dialect-driven)', () => {
	it("treats a Postgres E'…' escape string as backslash-escaping even though the dialect default is off", () => {
		// E'd\'aide …' — the \' is an escaped apostrophe, so the token is INSIDE
		// the literal and must be rewritten.
		const sql = "select E'd\\'aide {{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(
			"select E'd\\'aide {{ $translations.name.sql }}' as v"
		);
	});

	it("treats a lowercase e'…' escape string the same (Postgres)", () => {
		const sql = "select e'd\\'aide {{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(
			"select e'd\\'aide {{ $translations.name.sql }}' as v"
		);
	});

	it('does not treat E as an escape prefix when it is the tail of an identifier (Postgres)', () => {
		// SOME'…' — the E in SOME is not a standalone prefix token, so the
		// ANSI policy applies and the quote after the backslash closes.
		const sql = "select SOME'd\\'aide {{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(sql);
	});

	it("treats a BigQuery r'…' raw string as non-escaping even though the dialect default is on", () => {
		// r'd\'aide …' — raw strings do not honour backslash escapes, so the
		// quote after the backslash CLOSES the literal and the token is OUTSIDE.
		const sql = "select r'd\\'aide {{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, bq)).toBe(sql);
	});

	it("leaves a token INSIDE a BigQuery r'…' raw literal bare (sentinel would escape wrongly)", () => {
		// Raw literals treat backslash as text — the sentinel's `\'` would
		// corrupt the query, so the token must stay bare.
		const sql = "select r'{{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, bq)).toBe(sql);
	});

	it("leaves a token INSIDE a Databricks r'…' raw literal bare", () => {
		const dbx = new DatabricksDialect();
		const sql = "select r'{{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, dbx)).toBe(sql);
	});

	it("still rewrites a token inside a Postgres E'…' literal (ordinary '' escaping is valid there)", () => {
		const sql = "select E'{{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(
			"select E'{{ $translations.name.sql }}' as v"
		);
	});

	it('does not treat r as a raw prefix in a dialect without raw strings (Postgres)', () => {
		// Postgres has no r'…' form; the ordinary (non-escaping) policy applies
		// either way, so the token after \' is outside the literal.
		const sql = "select r'd\\'aide {{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(sql);
	});

	it('does not treat E as an escape prefix in a dialect without escape strings (BigQuery)', () => {
		// BigQuery has no E'…' form; the ordinary (escaping) policy applies,
		// so the token after \' is inside the literal and IS rewritten.
		const sql = "select E'd\\'aide {{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, bq)).toBe(
			"select E'd\\'aide {{ $translations.name.sql }}' as v"
		);
	});
});

describe('verbatim literal forms (dialect-driven)', () => {
	it('leaves a token inside a $$…$$ dollar-quoted string bare (Snowflake)', () => {
		// Dollar-quoted content is literal — apostrophes need no escaping, so
		// raw substitution is correct and the token must NOT be rewritten.
		const sql = "select $$d'aide {{ $translations.name }}$$ as v";
		expect(rewriteBareTranslationSqlAccessors(sql, sf)).toBe(sql);
	});

	it('does not let an odd apostrophe inside $$…$$ open a phantom literal (Snowflake)', () => {
		// Without dollar-quote awareness the scanner would read it's as opening
		// a literal and wrongly rewrite the token inside it.
		const sql = "select $$it's {{ $translations.name }}$$ as v";
		expect(rewriteBareTranslationSqlAccessors(sql, sf)).toBe(sql);
	});

	it('leaves a token inside a $$…$$ dollar-quoted string bare (Postgres)', () => {
		const sql = "select $$d'aide {{ $translations.name }}$$ as v";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(sql);
	});

	it('leaves a token inside a $tag$…$tag$ tagged dollar-quoted string bare (Postgres)', () => {
		const sql = "select $body$d'aide {{ $translations.name }}$body$ as v";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(sql);
	});

	it('does not let an odd apostrophe inside $tag$…$tag$ open a phantom literal (Postgres)', () => {
		const sql = "select $body$it's {{ $translations.name }}$body$ as v";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(sql);
	});

	it('does not treat $tag$ as dollar-quoting in a double-only dialect (Snowflake)', () => {
		// Snowflake dollar-quoting is $$…$$ only — $body$ is not a delimiter,
		// so the scanner falls through to normal literal scanning.
		const sql = "select $body$d'aide {{ $translations.name }}$body$ as v";
		expect(rewriteBareTranslationSqlAccessors(sql, sf)).toBe(
			"select $body$d'aide {{ $translations.name.sql }}$body$ as v"
		);
	});

	it('does not treat $1 positional params as dollar-quoting (Postgres)', () => {
		// $1 has no closing $, so it falls through as ordinary text.
		const sql = "select $1, '{{ $translations.name }}' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, pg)).toBe(
			"select $1, '{{ $translations.name.sql }}' as v"
		);
	});

	it('does not treat $$ as dollar-quoting in a dialect without it (BigQuery)', () => {
		// BigQuery has no dollar-quoting — the $ chars are ordinary and the
		// scanner falls through to normal literal scanning.
		const sql = "select $$d'aide {{ $translations.name }}$$ as v";
		expect(rewriteBareTranslationSqlAccessors(sql, bq)).toBe(
			"select $$d'aide {{ $translations.name.sql }}$$ as v"
		);
	});

	it("leaves a token inside a '''…''' triple-quoted string bare (BigQuery)", () => {
		const sql = "select '''d'aide {{ $translations.name }}''' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, bq)).toBe(sql);
	});

	it('leaves a token inside a """…""" triple-quoted string bare (BigQuery)', () => {
		const sql = 'select """d\'aide {{ $translations.name }}""" as v';
		expect(rewriteBareTranslationSqlAccessors(sql, bq)).toBe(sql);
	});

	it("does not treat ''' as triple-quoting in a dialect without it (ClickHouse)", () => {
		// No triple-quoting: ''' scans as an open literal closing at the quote
		// before `aide`, so the token lands OUTSIDE any literal and stays bare.
		const sql = "select '''d'aide {{ $translations.name }}''' as v";
		expect(rewriteBareTranslationSqlAccessors(sql, ch)).toBe(sql);
	});
});

describe('rewriteSqlFenceTranslationTokens — per-fence connection dialect', () => {
	const tokenizer = new Markdoc.Tokenizer({ allowComments: true, allowIndentation: true });

	function parseFences(markdown: string): Node {
		return Markdoc.parse(tokenizer.tokenize(markdown));
	}

	function fenceContent(ast: Node): string {
		for (const node of ast.walk()) {
			if (node.type === 'fence' && node.attributes?.language === 'sql') {
				return node.attributes.content as string;
			}
		}
		return '';
	}

	it('scans a connection= fence with that connection dialect, not the ambient one', () => {
		// Ambient Postgres + a backslash-escaping connection: the fence must be
		// scanned with the connection's rules, so the token after \' is INSIDE.
		const md =
			"```sql q connection=warehouse\nselect 'd\\'aide {{ $translations.name }}' as v\n```";
		const ast = parseFences(md);
		rewriteSqlFenceTranslationTokens(ast, pg, () => ch);
		expect(fenceContent(ast)).toBe("select 'd\\'aide {{ $translations.name.sql }}' as v\n");
	});

	it('falls back to the ambient dialect when the fence declares no connection', () => {
		const md = "```sql q\nselect 'd\\'aide {{ $translations.name }}' as v\n```";
		const ast = parseFences(md);
		rewriteSqlFenceTranslationTokens(ast, pg, () => ch);
		// Postgres ambient: \' closes the literal, token stays bare.
		expect(fenceContent(ast)).toBe("select 'd\\'aide {{ $translations.name }}' as v\n");
	});

	it('falls back to the ambient dialect when the resolver returns undefined', () => {
		const md = "```sql q connection=missing\nselect 'd\\'aide {{ $translations.name }}' as v\n```";
		const ast = parseFences(md);
		rewriteSqlFenceTranslationTokens(ast, pg, () => undefined);
		expect(fenceContent(ast)).toBe("select 'd\\'aide {{ $translations.name }}' as v\n");
	});

	it('uses the ambient dialect when no resolver is passed', () => {
		const md =
			"```sql q connection=warehouse\nselect 'd\\'aide {{ $translations.name }}' as v\n```";
		const ast = parseFences(md);
		rewriteSqlFenceTranslationTokens(ast, pg);
		expect(fenceContent(ast)).toBe("select 'd\\'aide {{ $translations.name }}' as v\n");
	});
});
