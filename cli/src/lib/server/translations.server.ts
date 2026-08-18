/**
 * Resolve translations.yaml for a page render.
 *
 * Language comes from the `?lang=` query param when it names a declared
 * language, else the first language in the file (resolveTranslations always
 * falls back to English for missing keys). Never throws — a missing or broken
 * translations.yaml just yields no translations.
 */

import { loadProjectTranslations } from '$cli/project-config/load-config';
import {
	resolveTranslations,
	selectLanguage
} from '@evidence/core/translations/resolve-translations';
import type { TranslationMap, TranslationsMap } from '@evidence/core/types/translations';

/** Languages declared in translations.yaml (top-level keys), or [] if none. */
export async function getTranslationLanguages(cwd: string): Promise<string[]> {
	return Object.keys(await loadProjectTranslations(cwd));
}

export async function loadTranslations(
	cwd: string,
	requestedLang: string | null
): Promise<TranslationMap | undefined> {
	// Read translations.yaml directly so a broken evidence.config.yaml doesn't
	// suppress valid translations.
	const all = (await loadProjectTranslations(cwd)) as TranslationsMap;
	const language = selectLanguage(Object.keys(all), requestedLang);
	if (!language) return undefined;
	return resolveTranslations(all, language);
}
