/**
 * The `lang` attribute for the document shell.
 *
 * Translation keys are whatever the author typed in translations.yaml, and
 * nothing validates them — so a key is not automatically a usable language tag.
 * A wrong `lang` is worse than a missing one (a screen reader picks the wrong
 * voice, hyphenation and spell-check follow the wrong dictionary), so anything
 * that is not a plausible BCP 47 tag falls back to English rather than reaching
 * the attribute.
 */

/** `en`, `pt-BR`, `zh-Hant-TW` — subtags of 1-8 alphanumerics, at most 4 deep. */
const LANGUAGE_TAG = /^[a-z]{2,3}(-[a-z\d]{1,8}){0,3}$/i;

export const FALLBACK_HTML_LANG = 'en';

export function htmlLang(language: string | null | undefined): string {
	const tag = (language ?? '').trim();
	return LANGUAGE_TAG.test(tag) ? tag : FALLBACK_HTML_LANG;
}
