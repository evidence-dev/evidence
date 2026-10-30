/**
 * Fills the `%evidence.lang%` placeholder in the document shell.
 *
 * The shell is emitted before any load runs, so the language the layout resolves
 * (`?lang=` → `lang` cookie → first language in translations.yaml) is not
 * available to it. Resolving it again here is cheap: the same inputs, and the
 * language list is read once per project — translations.yaml is immutable in
 * serve mode, and in dev a language added to the file arrives on the restart
 * that a new translation needs anyway.
 */

import { getTranslationLanguages } from '$lib/server/translations.server';
import { selectLanguage } from '@evidence/core/translations/resolve-translations';
import { htmlLang } from '@evidence/core/translations/html-lang';

/** Languages per project root. Cleared only by a restart, like the file itself. */
const languagesByCwd = new Map<string, Promise<string[]>>();

function languagesFor(cwd: string): Promise<string[]> {
	const cached = languagesByCwd.get(cwd);
	if (cached) return cached;
	// Cache the promise, not the result: two concurrent first requests then share
	// one read instead of racing.
	const languages = getTranslationLanguages(cwd).catch(() => []);
	languagesByCwd.set(cwd, languages);
	return languages;
}

/**
 * The `lang` for one request: the requested language when it is one the project
 * declares, else the project's first, else English.
 */
export async function resolveHtmlLang(
	cwd: string,
	requested: string | null | undefined
): Promise<string> {
	const languages = await languagesFor(cwd);
	return htmlLang(selectLanguage(languages, requested ?? null));
}

/** Only for tests: the cache lives for the process. */
export function resetHtmlLangCacheForTest(): void {
	languagesByCwd.clear();
}

/**
 * `transformPageChunk` for SvelteKit's `resolve`. Substitutes the placeholder in
 * the chunk that carries the `<html>` element; SvelteKit leaves unknown `%…%`
 * placeholders verbatim, so an untransformed response would ship the literal
 * text — hence the transform is installed for every page render, not only when
 * a project has translations.
 */
export function replaceHtmlLangPlaceholder(html: string, lang: string): string {
	return html.replace('%evidence.lang%', lang);
}
