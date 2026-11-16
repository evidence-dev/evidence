import type { DateLocale } from './date-locale';
import type { Messages } from './messages';
import { EN_DATE_LOCALE } from './languages/en';
import { FR_DATE_LOCALE } from './languages/fr';
import en from './messages/en.json';
import fr from './messages/fr.json';

// Adding a language: see README.md in this directory.
export type LanguagePack = {
	dateLocale: DateLocale;
	messages: Messages;
};

const LANGUAGES: Record<string, LanguagePack> = {
	en: { dateLocale: EN_DATE_LOCALE, messages: en },
	fr: { dateLocale: FR_DATE_LOCALE, messages: fr }
};

export const FALLBACK_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGES);

/** `fr-CA` → `fr-ca`; `pt_BR` → `pt-br`. */
function normalizeLanguageTag(language: string): string {
	return language.trim().toLowerCase().replaceAll('_', '-');
}

/**
 * The registered language that serves `language`: exact tag first, then its
 * primary subtag, then English — so `fr-CA` gets French until someone
 * contributes a Canadian entry.
 */
export function resolveLanguage(language: string | null | undefined): string {
	if (!language || typeof language !== 'string') return FALLBACK_LANGUAGE;
	const tag = normalizeLanguageTag(language);
	if (Object.hasOwn(LANGUAGES, tag)) return tag;
	const primary = tag.split('-')[0];
	return Object.hasOwn(LANGUAGES, primary) ? primary : FALLBACK_LANGUAGE;
}

export function getLanguagePack(language: string | null | undefined): LanguagePack {
	return LANGUAGES[resolveLanguage(language)];
}
