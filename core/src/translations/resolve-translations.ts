import type { TranslationMap, TranslationsMap } from '../types/translations';
import { createInstance } from 'i18next';
import merge from 'lodash/merge';

const FALLBACK_LANGUAGE = 'en';

function normalizeTag(language: string): string {
	return language.trim().toLowerCase().replaceAll('_', '-');
}

/**
 * Pick the active language for a render: the declared language matching the
 * request (exactly, then case/separator-insensitively, then by primary subtag
 * so `fr-FR` finds `fr`), else the first declared language, else null.
 * (Individual missing keys still fall back to English inside `resolveTranslations`.)
 */
export function selectLanguage(languages: string[], requestedLang: string | null): string | null {
	if (requestedLang && typeof requestedLang === 'string') {
		if (languages.includes(requestedLang)) return requestedLang;
		const requested = normalizeTag(requestedLang);
		const primary = requested.split('-')[0];
		const match =
			languages.find((lang) => normalizeTag(lang) === requested) ??
			languages.find((lang) => normalizeTag(lang) === primary) ??
			languages.find((lang) => normalizeTag(lang).split('-')[0] === primary);
		if (match) return match;
	}
	return languages[0] ?? null;
}

/**
 * Resolve translations for a specific language with fallback to English.
 * Handles $t() references and interpolation via i18next.
 */
export async function resolveTranslations(
	allTranslations: TranslationsMap,
	language: string
): Promise<TranslationMap> {
	const languages = Object.keys(allTranslations);
	if (languages.length === 0) return {};

	const mergedTranslations = merge(
		{},
		allTranslations[FALLBACK_LANGUAGE] ?? {},
		allTranslations[language] ?? {}
	);

	return processTranslationsThroughI18next(mergedTranslations, language);
}

/**
 * Process translations through i18next to resolve $t() references and interpolation.
 */
export async function processTranslationsThroughI18next(
	translations: TranslationMap,
	language: string
): Promise<TranslationMap> {
	// Create a new i18next instance for this request
	const i18n = createInstance();

	await i18n.init({
		lng: language,
		resources: {
			[language]: {
				translation: translations
			}
		},
		interpolation: {
			escapeValue: false // not needed for svelte as it escapes by default
		}
	});

	// Recursively resolve all string values through i18next while keeping nested structure
	return resolveNestedTranslations(translations, i18n);
}

/**
 * Recursively traverse nested object and resolve string values through i18next.
 * Preserves nested structure for Markdoc access.
 */
function resolveNestedTranslations(
	obj: TranslationMap,
	i18n: ReturnType<typeof createInstance>,
	prefix = ''
): TranslationMap {
	const result: TranslationMap = {};

	for (const [key, value] of Object.entries(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;

		if (typeof value === 'string') {
			// Resolve through i18next to handle $t() references and interpolation
			result[key] = i18n.t(fullKey);
		} else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			// Recurse into nested objects
			result[key] = resolveNestedTranslations(value, i18n, fullKey);
		} else {
			// Keep other values as-is
			result[key] = value;
		}
	}

	return result;
}
