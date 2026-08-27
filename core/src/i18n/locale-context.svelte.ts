import { getContext, setContext } from 'svelte';
import { translations, type TranslationDict } from './translations';

const LOCALE_CONTEXT_KEY = Symbol('EVIDENCE_LOCALE_CONTEXT');

export class LocaleState {
	locale: string = $state('en-US');

	constructor(initialLocale: string = 'en-US') {
		this.locale = initialLocale;
	}

	get dict(): TranslationDict {
		const lang = this.locale.split('-')[0].toLowerCase();
		return translations[this.locale] || translations[lang] || translations.en;
	}

	t(key: keyof TranslationDict, params?: Record<string, string | number>): string {
		let text = this.dict[key] || translations.en[key] || String(key);
		if (params) {
			for (const [k, v] of Object.entries(params)) {
				text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
			}
		}
		return text;
	}

	formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
		const d = date instanceof Date ? date : new Date(date);
		if (isNaN(d.getTime())) return String(date);
		return new Intl.DateTimeFormat(this.locale, options).format(d);
	}

	formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
		if (typeof num !== 'number' || isNaN(num)) return String(num);
		return new Intl.NumberFormat(this.locale, options).format(num);
	}
}

export function setLocaleContext(initialLocale: string = 'en-US'): LocaleState {
	const state = new LocaleState(initialLocale);
	setContext(LOCALE_CONTEXT_KEY, state);
	return state;
}

export function getLocaleContext(): LocaleState | undefined {
	return getContext<LocaleState | undefined>(LOCALE_CONTEXT_KEY);
}
