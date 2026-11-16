import { createInstance } from 'i18next';
import en from './messages/en.json';

export type MessageKey = keyof typeof en;

/** A language's UI strings: every English key, plus any extra plural forms it needs. */
export type Messages = Record<MessageKey, string> & Record<string, string>;

type PluralBaseKey = MessageKey extends infer K
	? K extends `${infer Base}_other`
		? Base
		: never
	: never;

/** Keys callers may ask for: a plain key, or the base of a `_one`/`_other` plural family. */
export type TranslationKey = MessageKey | PluralBaseKey;

export type MessageVars = Record<string, string | number>;

export function hasMessage(key: string): key is MessageKey {
	return key in en;
}

/** Signature of `LocaleContext.t`, for helpers that take it as an argument. */
export type Translate = (key: TranslationKey, vars?: MessageVars) => string;

// Bundled resources make `init` synchronous, which `LocaleContext` relies on.
export function createTranslator(language: string, messages: Messages): Translate {
	const i18n = createInstance();
	i18n.init({
		lng: language,
		fallbackLng: 'en',
		resources: {
			en: { translation: en },
			[language]: { translation: messages }
		},
		// Keys are flat (`table.rows_range`), not nested objects.
		keySeparator: false,
		nsSeparator: false,
		initImmediate: false,
		showSupportNotice: false,
		interpolation: { escapeValue: false }
	});
	return (key, vars) => String(i18n.t(key, vars));
}
