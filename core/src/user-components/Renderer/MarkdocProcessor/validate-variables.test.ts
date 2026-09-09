import { describe, test, expect } from 'vitest';
import Markdoc, { type RenderableTreeNode, type Tag } from '@markdoc/markdoc';
import { process } from './process-markdoc';
import { InlineQueries } from '../../common/inline-queries';
import type { ValidationContext } from '../../validators/types';
import { PostgresDialect } from '../../../sql-dialect/postgres';
import { BigQueryDialect } from '../../../sql-dialect/bigquery';
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
			// CI's markdown-validation check is the canonical caller that hits this
			// path: it never loads the project's translations, and without the skip
			// every $translations.* reference would fire a false positive.
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
			// An empty `{}` map is meaningfully different from `undefined`: it means
			// the caller loaded translations and there are none. Unknown keys should
			// still flag in that case (caller is asking us to validate against an
			// empty namespace).
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

// EVI-3152: French translation values with ASCII apostrophes (d'affaires,
// l'offre) broke fence SQL that referenced them from inside a string literal
// — the raw substitution closed the literal early and the warehouse rejected
// the query. `.sql` on translations resolves at query time using the target
// dialect's `escapeStringLiteral`, so the same source works on `''` warehouses
// (Postgres/DuckDB/CH/Snowflake) and `\'` ones (BigQuery/Databricks) alike.
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

		test('BigQuery (backslash): uses `\\\'` instead of `\'\'`', () => {
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
			const bare =
				`{% if data="orders" where="section = '{{ $translations.name }}'" %}C{% /if %}`;
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

	describe('SQL console path (frontmatterVariables → VariableProcessor)', () => {
		// The compiled-query view in the editor SQL console builds its own
		// VariableProcessor from MarkdocProcessor.interpolationVariables — that
		// map must carry TranslationValue wrappers or `.sql` reads undefined
		// and the sentinel-emitting token leaks into the console's output.
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
			const { validationErrors } = process(
				'{{ $translations.name.sql }}',
				undefined,
				undefined,
				{ name: 'anything' }
			);
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
