import { describe, expect, it } from 'vitest';
import { FALLBACK_HTML_LANG, htmlLang } from './html-lang';

describe('htmlLang', () => {
	it.each(['en', 'it', 'fra', 'pt-BR', 'zh-Hant-TW', 'de-DE-1996'])('keeps the tag %s', (tag) => {
		expect(htmlLang(tag)).toBe(tag);
	});

	it('trims what came out of a YAML key', () => {
		expect(htmlLang('  it  ')).toBe('it');
	});

	it.each([
		undefined,
		null,
		'',
		'   ',
		'e',
		'english',
		'it_IT',
		'it IT',
		'it-',
		'123',
		'it-verylongsubtag',
		'"><script>alert(1)</script>'
	])('falls back to English for %o', (value) => {
		// A wrong `lang` is worse than a missing one: screen readers pick the wrong
		// voice, and hyphenation and spell-check follow the wrong dictionary. And a
		// translations.yaml key is unvalidated, so it can be anything at all.
		expect(htmlLang(value)).toBe(FALLBACK_HTML_LANG);
	});
});
