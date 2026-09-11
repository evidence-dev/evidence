import { describe, test, expect } from 'vitest';
import Markdoc, { type RenderableTreeNode, type Tag } from '@markdoc/markdoc';
import { process } from './process-markdoc';
import { InlineQueries } from '../../common/inline-queries';
import type { ValidationContext } from '../../validators/types';
import { PostgresDialect } from '../../../sql-dialect/postgres';
import { BigQueryDialect } from '../../../sql-dialect/bigquery';
import { ClickHouseDialect } from '../../../sql-dialect/clickhouse';
import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
import { hasUnresolvedTranslationSqlEscape } from '../../../translations/translation-value';

const errorIds = (errors: ReturnType<typeof process>['validationErrors']): string[] =>
	errors.map((e) => e.error?.id ?? '');

const ctx = (over: Partial<ValidationContext> = {}): ValidationContext => ({
	metadata: undefined,
	filters: undefined,
	inlineQueries: undefined,
	trees: undefined,
	...over
});

// Return the first tag matching `name` anywhere in the tree.
const findTag = (tree: RenderableTreeNode, name: string): Tag | undefined => {
	if (!Markdoc.Tag.isTag(tree)) return undefined;
	if (tree.name === name) return tree;
	for (const child of tree.children) {
		const hit = findTag(child, name);
		if (hit) return hit;
	}
	return undefined;
};

describe('validateVariables — skip-on-undefined guards', () => {
	describe('account variables ($user / $organization)', () => {
		test('skips $user references when no account is supplied', () => {
			const { validationErrors } = process('Hello {{ $user.email }}');
			expect(errorIds(validationErrors)).not.toContain('undefined-account-variable');
		});

		test('flags missing $user properties when account IS supplied', () => {
			const { validationErrors } = process(
				'Hello {{ $user.emial }}',
				undefined,
				undefined,
				undefined,
				{
					user: { email: 'x@y', first_name: 'X', last_name: 'Y' },
					organization: { name: 'Acme' }
				}
			);
			expect(errorIds(validationErrors)).toContain('undefined-account-variable');
		});
	});

	describe('translations ($translations.*)', () => {
		test('skips $translations references when no translation map is supplied', () => {
			// CI's markdown-validation check never loads translations — without
			// the skip, every $translations.* reference would fire a false positive.
			const { validationErrors } = process('{{ $translations.greeting }}');
			expect(errorIds(validationErrors)).not.toContain('undefined-translation-key');
		});

		test('still flags missing translation keys when a translation map IS supplied', () => {
			const { validationErrors } = process('{{ $translations.greeting }}', undefined, undefined, {
				farewell: 'Goodbye'
			});
			expect(errorIds(validationErrors)).toContain('undefined-translation-key');
		});

		test('does not flag translation keys that exist in the supplied map', () => {
			const { validationErrors } = process('{{ $translations.greeting }}', undefined, undefined, {
				greeting: 'Hello'
			});
			expect(errorIds(validationErrors)).not.toContain('undefined-translation-key');
		});

		test('treats an empty-but-supplied translation map as "we know what exists"', () => {
			// An empty `{}` map means the caller loaded translations and there are
			// none — unknown keys should still flag (validate against the namespace).
			const { validationErrors } = process(
				'{{ $translations.greeting }}',
				undefined,
				undefined,
				{}
			);
			expect(errorIds(validationErrors)).toContain('undefined-translation-key');
		});
	});

	describe('frontmatter variables (regression — must still be enforced)', () => {
		test('flags an undefined frontmatter variable on a page', () => {
			const { validationErrors } = process('---\ntitle: Hi\n---\n\n{{ $tile }}');
			expect(errorIds(validationErrors)).toContain('undefined-frontmatter-variable');
		});

		test('does not flag a defined frontmatter variable', () => {
			const { validationErrors } = process('---\ntitle: Hi\n---\n\n{{ $title }}');
			expect(errorIds(validationErrors)).not.toContain('undefined-frontmatter-variable');
		});

		// DECISION 1: a fallback must not silence the "undefined variable" error —
		// otherwise a typo behind a fallback ships silently.
		test('still flags an undefined frontmatter variable that has a fallback', () => {
			const { validationErrors } = process("---\ntitle: Hi\n---\n\n{{ $tile | 'Untitled' }}");
			expect(errorIds(validationErrors)).toContain('undefined-frontmatter-variable');
		});

		test('does not flag a defined frontmatter variable that has a fallback', () => {
			const { validationErrors } = process("---\ntitle: Hi\n---\n\n{{ $title | 'Untitled' }}");
			expect(errorIds(validationErrors)).not.toContain('undefined-frontmatter-variable');
		});
	});
});

// EVI-3152: French translation values with apostrophes broke fence SQL that referenced
// them from inside a string literal. `.sql` resolves at query time with the dialect's escaping.
describe('$translations.foo.sql — dialect-aware SQL-safe accessor (EVI-3152)', () => {
	describe('on a tag attribute (if where=)', () => {
		const source = () =>
			`{% if data="orders" where="section = '{{ $translations.name.sql }}'" %}C{% /if %}`;

		test('markdoc transform leaves a sentinel in place — dialect resolves it later', () => {
			const { tree } = process(source(), undefined, undefined, { name: "Offre d'adhérents" });
			const where = findTag(tree, 'if')!.attributes.where as string;
			expect(hasUnresolvedTranslationSqlEscape(where)).toBe(true);
		});

		test('Postgres (ANSI): doubles the apostrophe when processString runs', () => {
			const { tree } = process(source(), undefined, undefined, { name: "Offre d'adhérents" });
			const where = findTag(tree, 'if')!.attributes.where as string;
			const vp = new VariableProcessor(undefined, undefined, undefined, new PostgresDialect());
			expect(vp.processString(where, 'sql')).toBe("section = 'Offre d''adhérents'");
		});

		test("BigQuery (backslash): uses `\\'` instead of `''`", () => {
			const { tree } = process(source(), undefined, undefined, { name: "Offre d'adhérents" });
			const where = findTag(tree, 'if')!.attributes.where as string;
			const vp = new VariableProcessor(undefined, undefined, undefined, new BigQueryDialect());
			expect(vp.processString(where, 'sql')).toBe("section = 'Offre d\\'adhérents'");
		});

		test('no dialect → safety-net ANSI escape (never a raw sentinel to warehouse)', () => {
			const { tree } = process(source(), undefined, undefined, { name: "Offre d'adhérents" });
			const where = findTag(tree, 'if')!.attributes.where as string;
			const vp = new VariableProcessor(undefined, undefined, undefined);
			expect(vp.processString(where, 'sql')).toBe("section = 'Offre d''adhérents'");
		});

		test('bare {{ $translations.foo }} still emits raw text — no escape, no sentinel', () => {
			const bare = `{% if data="orders" where="section = '{{ $translations.name }}'" %}C{% /if %}`;
			const { tree } = process(bare, undefined, undefined, { name: 'Member Paid Offerings' });
			expect(findTag(tree, 'if')!.attributes.where).toBe("section = 'Member Paid Offerings'");
		});
	});

	describe('inside a named fence (registers as an inline query)', () => {
		test('sentinel survives fence-body registration; getInterpolated resolves per dialect', () => {
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				"```sql member_paid_offerings\nselect count(*) from t where section = '{{ $translations.name.sql }}'\n```",
				ctx({ inlineQueries }),
				undefined,
				{ name: "Offre d'adhérents" }
			);
			const stored = inlineQueries.getRaw('member_paid_offerings') ?? '';
			expect(hasUnresolvedTranslationSqlEscape(stored)).toBe(true);

			const pg = inlineQueries.getInterpolated('member_paid_offerings', new PostgresDialect());
			expect(pg).toContain("section = 'Offre d''adhérents'");
			expect(hasUnresolvedTranslationSqlEscape(pg ?? '')).toBe(false);

			const bq = inlineQueries.getInterpolated('member_paid_offerings', new BigQueryDialect());
			expect(bq).toContain("section = 'Offre d\\'adhérents'");
			expect(hasUnresolvedTranslationSqlEscape(bq ?? '')).toBe(false);
		});
	});

	// The production failure (EVI-3152 follow-up): bare tokens inside SQL `'…'`
	// literals interpolated raw apostrophes that closed the literal early.
	describe('bare {{ $translations.foo }} inside a SQL string literal auto-escapes (parse-time rewrite)', () => {
		test('bare token in a fence string literal becomes a sentinel and resolves per dialect', () => {
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				"```sql member_paid_offerings\nselect count(*) from t where section = '{{ $translations.name }}'\n```",
				ctx({ inlineQueries }),
				undefined,
				{ name: "Offre d'adhérents" }
			);
			const stored = inlineQueries.getRaw('member_paid_offerings') ?? '';
			expect(hasUnresolvedTranslationSqlEscape(stored)).toBe(true);

			const pg = inlineQueries.getInterpolated('member_paid_offerings', new PostgresDialect());
			expect(pg).toContain("section = 'Offre d''adhérents'");
			expect(hasUnresolvedTranslationSqlEscape(pg ?? '')).toBe(false);

			const bq = inlineQueries.getInterpolated('member_paid_offerings', new BigQueryDialect());
			expect(bq).toContain("section = 'Offre d\\'adhérents'");
			expect(hasUnresolvedTranslationSqlEscape(bq ?? '')).toBe(false);
		});

		test('bare token in identifier concatenation stays raw (no sentinel, no escape)', () => {
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				'```sql localized_labels\nselect label_{{ $translations.langcode }} as local_label from t\n```',
				ctx({ inlineQueries }),
				undefined,
				{ langcode: 'fr' }
			);
			// Outside a string literal the token is NOT rewritten — the raw value
			// substitutes at registration time, so no sentinel survives.
			const stored = inlineQueries.getRaw('localized_labels') ?? '';
			expect(hasUnresolvedTranslationSqlEscape(stored)).toBe(false);
			expect(stored).toContain('label_fr');

			const pg = inlineQueries.getInterpolated('localized_labels', new PostgresDialect());
			expect(pg).toContain('label_fr');
		});

		test('bare token with a fallback escapes the resolved value (key exists)', () => {
			// The fallback only applies when the key is missing — with the key
			// present the raw value used to close the literal early.
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				'```sql with_fallback\nselect count(*) from t where section = \'{{ $translations.name | "Other" }}\'\n```',
				ctx({ inlineQueries }),
				undefined,
				{ name: "Offre d'adhérents" }
			);
			const pg = inlineQueries.getInterpolated('with_fallback', new PostgresDialect());
			expect(pg).toContain("section = 'Offre d''adhérents'");
			expect(hasUnresolvedTranslationSqlEscape(pg ?? '')).toBe(false);

			const bq = inlineQueries.getInterpolated('with_fallback', new BigQueryDialect());
			expect(bq).toContain("section = 'Offre d\\'adhérents'");
		});

		test('bare token with a fallback uses the fallback when the key is missing', () => {
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				'```sql fallback_used\nselect count(*) from t where section = \'{{ $translations.missing | "Other" }}\'\n```',
				ctx({ inlineQueries }),
				undefined,
				{ name: 'unrelated' }
			);
			const pg = inlineQueries.getInterpolated('fallback_used', new PostgresDialect());
			expect(pg).toContain("section = 'Other'");
			expect(hasUnresolvedTranslationSqlEscape(pg ?? '')).toBe(false);
		});

		test('a fallback containing an apostrophe escapes per dialect too', () => {
			// The fallback is substituted raw when the key is missing — without
			// the sentinel wrap its apostrophe would close the literal early.
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				"```sql fallback_apostrophe\nselect count(*) from t where section = '{{ $translations.missing | \"L'offre\" }}'\n```",
				ctx({ inlineQueries }),
				undefined,
				{ name: 'unrelated' }
			);
			const pg = inlineQueries.getInterpolated('fallback_apostrophe', new PostgresDialect());
			expect(pg).toContain("section = 'L''offre'");
			expect(hasUnresolvedTranslationSqlEscape(pg ?? '')).toBe(false);

			const bq = inlineQueries.getInterpolated('fallback_apostrophe', new BigQueryDialect());
			expect(bq).toContain("section = 'L\\'offre'");
			expect(hasUnresolvedTranslationSqlEscape(bq ?? '')).toBe(false);
		});

		test("an explicit .sql accessor's fallback escapes per dialect when the key is missing", () => {
			// The parse-time rewrite must sentinel-wrap an explicit accessor's
			// fallback too, not just the bare form's.
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				"```sql explicit_sql_fallback\nselect count(*) from t where section = '{{ $translations.missing.sql | \"L'offre\" }}'\n```",
				ctx({ inlineQueries }),
				undefined,
				{ name: 'unrelated' }
			);
			const pg = inlineQueries.getInterpolated('explicit_sql_fallback', new PostgresDialect());
			expect(pg).toContain("section = 'L''offre'");
			expect(hasUnresolvedTranslationSqlEscape(pg ?? '')).toBe(false);

			const bq = inlineQueries.getInterpolated('explicit_sql_fallback', new BigQueryDialect());
			expect(bq).toContain("section = 'L\\'offre'");
			expect(hasUnresolvedTranslationSqlEscape(bq ?? '')).toBe(false);
		});

		test("a PostgreSQL E'…' escape string still escapes the token inside", () => {
			// E'd\'aide …' honours backslash escapes even though ordinary Postgres
			// literals do not — the token is INSIDE and must be rewritten.
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				"```sql pg_escape_string\nselect E'd\\'aide {{ $translations.name }}' as v\n```",
				ctx({ inlineQueries, dialect: new PostgresDialect() }),
				undefined,
				{ name: "Offre d'adhérents" }
			);
			const pg = inlineQueries.getInterpolated('pg_escape_string', new PostgresDialect());
			expect(pg).toContain("'d\\'aide Offre d''adhérents'");
			expect(hasUnresolvedTranslationSqlEscape(pg ?? '')).toBe(false);
		});

		test('bare token after a backslash-escaped apostrophe still escapes (backslash dialect)', () => {
			// Backslash dialects write `\'` inside literals — the token after
			// it is inside the literal and must be rewritten.
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				"```sql backslash_literal\nselect 'd\\'aide {{ $translations.name }}' as v\n```",
				ctx({ inlineQueries, dialect: new ClickHouseDialect() }),
				undefined,
				{ name: "Offre d'adhérents" }
			);
			const pg = inlineQueries.getInterpolated('backslash_literal', new PostgresDialect());
			expect(pg).toContain("'d\\'aide Offre d''adhérents'");
			expect(hasUnresolvedTranslationSqlEscape(pg ?? '')).toBe(false);
		});

		test('ANSI dialect: a quote after a backslash closes the literal — token stays bare', () => {
			// Postgres/DuckDB treat `\` as ordinary, so `'a\'` is the complete literal
			// `a\` and the token after it is OUTSIDE — rewriting would corrupt the query.
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				"```sql ansi_backslash\nselect 'a\\' || {{ $translations.langcode }} as v\n```",
				ctx({ inlineQueries, dialect: new PostgresDialect() }),
				undefined,
				{ langcode: 'fr' }
			);
			const stored = inlineQueries.getRaw('ansi_backslash') ?? '';
			// The token was NOT rewritten, so the transform substitutes the
			// raw value — no sentinel survives.
			expect(hasUnresolvedTranslationSqlEscape(stored)).toBe(false);
			expect(stored).toContain("'a\\' || fr");
		});

		test('nested translation path in a fence string literal escapes too', () => {
			const inlineQueries = new InlineQueries({ filterContexts: undefined });
			process(
				"```sql programs\ncase when source_program = 'eap' then '{{ $translations.member_paid.eap }}' end\n```",
				ctx({ inlineQueries }),
				undefined,
				{ member_paid: { eap: "Programme d'aide aux employés (PAE)" } }
			);
			const pg = inlineQueries.getInterpolated('programs', new PostgresDialect());
			expect(pg).toContain("'Programme d''aide aux employés (PAE)'");
			expect(hasUnresolvedTranslationSqlEscape(pg ?? '')).toBe(false);
		});
	});

	describe('SQL console path (frontmatterVariables → VariableProcessor)', () => {
		// The editor SQL console builds its own VariableProcessor from
		// interpolationVariables — it must carry TranslationValue wrappers.
		test('with wrapped translations + dialect, .sql resolves in the compiled SQL', async () => {
			const { wrapTranslationsForSql } = await import('../../../translations/translation-value');
			const vars = { translations: wrapTranslationsForSql({ name: "Offre d'adhérents" }) };
			const vp = new VariableProcessor(undefined, undefined, vars, new PostgresDialect());
			expect(vp.processString("section = '{{ $translations.name.sql }}'", 'sql')).toBe(
				"section = 'Offre d''adhérents'"
			);
			const vpBq = new VariableProcessor(undefined, undefined, vars, new BigQueryDialect());
			expect(vpBq.processString("section = '{{ $translations.name.sql }}'", 'sql')).toBe(
				"section = 'Offre d\\'adhérents'"
			);
		});
	});

	describe('validation', () => {
		test('does not flag a known key accessed via .sql', () => {
			const { validationErrors } = process('{{ $translations.name.sql }}', undefined, undefined, {
				name: 'anything'
			});
			expect(errorIds(validationErrors)).not.toContain('undefined-translation-key');
		});

		test('still flags an undefined key when accessed via .sql', () => {
			const { validationErrors } = process(
				'{{ $translations.missing.sql }}',
				undefined,
				undefined,
				{ name: 'x' }
			);
			expect(errorIds(validationErrors)).toContain('undefined-translation-key');
		});
	});
});
