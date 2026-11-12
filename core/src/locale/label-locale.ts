import {
	createLocalizedFormatValue,
	type LocalizedFormatValue
} from '../user-components/formatValue';
import type { DateLocale } from './date-locale';
import { createTranslator, type Translate } from './messages';
import { getLanguagePack, resolveLanguage } from './registry';

/** What date-label builders need from a language. `LocaleContext` satisfies it structurally. */
export type LabelLocale = {
	dateLocale: DateLocale;
	t: Translate;
	formatValue: LocalizedFormatValue;
};

// Keyed by language and immutable, so pages in different languages never share state.
const LABEL_LOCALES = new Map<string, LabelLocale>();

/** A `LabelLocale` for code with no component context, e.g. filters. */
export function getLabelLocale(language: string | null | undefined): LabelLocale {
	const resolved = resolveLanguage(language);
	let labelLocale = LABEL_LOCALES.get(resolved);
	if (!labelLocale) {
		const pack = getLanguagePack(resolved);
		labelLocale = {
			dateLocale: pack.dateLocale,
			t: createTranslator(resolved, pack.messages),
			formatValue: createLocalizedFormatValue(resolved)
		};
		LABEL_LOCALES.set(resolved, labelLocale);
	}
	return labelLocale;
}
