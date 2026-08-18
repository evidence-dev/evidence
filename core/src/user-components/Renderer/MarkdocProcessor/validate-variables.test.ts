import { describe, test, expect } from 'vitest';
import { process } from './process-markdoc';

const errorIds = (errors: ReturnType<typeof process>['validationErrors']): string[] =>
	errors.map((e) => e.error?.id ?? '');

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
