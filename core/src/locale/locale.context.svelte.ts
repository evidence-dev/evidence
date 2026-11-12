import { getContext, setContext } from 'svelte';
import type { DateLocale } from './date-locale';
import { getLanguagePack, resolveLanguage, type LanguagePack } from './registry';
import {
	createTranslator,
	type Messages,
	type MessageVars,
	type Translate,
	type TranslationKey
} from './messages';
import {
	createLocalizedFormatValue,
	type LocalizedFormatValue
} from '../user-components/formatValue';

const LOCALE_CONTEXT_KEY = Symbol('LOCALE_CONTEXT');

/**
 * The page's active language, as selected by the existing translations
 * mechanism (`lang` cookie → `selectLanguage`). This is the ONLY input: no
 * component may set it, and the browser locale is never consulted. Shells set
 * it next to the theme context and keep it in sync on data invalidation.
 *
 * Everything language-dependent is reached from here (never from a module-level
 * setting), so two pages rendering in different languages can never leak into
 * each other, in the browser or in a shared server process.
 */
export class LocaleContext {
	#language = $state<string | null>(null);
	#resolved = $derived<string>(resolveLanguage(this.#language));
	#pack = $derived<LanguagePack>(getLanguagePack(this.#language));
	#translate = $derived<Translate>(createTranslator(this.#resolved, this.#pack.messages));
	#formatValue = $derived<LocalizedFormatValue>(createLocalizedFormatValue(this.#language));

	constructor(language: string | null | undefined) {
		this.#language = language ?? null;
	}

	updateLanguage(language: string | null | undefined) {
		this.#language = language ?? null;
	}

	get language(): string | null {
		return this.#language;
	}

	/** The registered language actually serving this page (`fr-CA` → `fr`, unknown → `en`). */
	get resolvedLanguage(): string {
		return this.#resolved;
	}

	get dateLocale(): DateLocale {
		return this.#pack.dateLocale;
	}

	get messages(): Messages {
		return this.#pack.messages;
	}

	/** Built-in UI string for the page's language. Reactive when read in a template. */
	t = (key: TranslationKey, vars?: MessageVars): string => this.#translate(key, vars);

	/** `formatValue` bound to this page's language; month and weekday names in `fmt` codes follow it. */
	get formatValue(): LocalizedFormatValue {
		return this.#formatValue;
	}
}

export function setLocaleContext(language: string | null | undefined): LocaleContext {
	const context = new LocaleContext(language);
	setContext(LOCALE_CONTEXT_KEY, context);
	return context;
}

/** Falls back to an English context so shells that never set one still render. */
export function getLocaleContext(): LocaleContext {
	return getContext<LocaleContext | undefined>(LOCALE_CONTEXT_KEY) ?? new LocaleContext(null);
}
