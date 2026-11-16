import { describe, it, expect } from 'vitest';
import en from './messages/en.json';
import { createTranslator, type Messages, type MessageKey } from './messages';
import { getLanguagePack, resolveLanguage, SUPPORTED_LANGUAGES } from './registry';

const EN_KEYS = Object.keys(en) as MessageKey[];

function placeholders(template: string): string[] {
	return [...template.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();
}

// Standard localization expansion guidance: short labels may triple, long sentences grow ~30%.
function expansionAllowance(sourceLength: number): number {
	if (sourceLength <= 10) return 3;
	if (sourceLength <= 20) return 2;
	if (sourceLength <= 30) return 1.8;
	if (sourceLength <= 50) return 1.6;
	return 1.3;
}

// The table-filter date list is ~190px wide; longer presets truncate there.
const DATE_PRESET_MAX_CHARS = 24;

describe.each(SUPPORTED_LANGUAGES)('Messages contract: %s', (language) => {
	const messages: Messages = getLanguagePack(language).messages;

	it('defines every English key with a non-empty string', () => {
		for (const key of EN_KEYS) {
			expect(messages[key], key).toBeTypeOf('string');
			expect(messages[key].trim(), key).not.toBe('');
		}
	});

	it('uses the same placeholders as English for every key', () => {
		for (const key of EN_KEYS) {
			expect(placeholders(messages[key]), key).toEqual(placeholders(en[key]));
		}
	});

	it('only adds keys that are extra plural forms of an English family', () => {
		const extra = Object.keys(messages).filter((k) => !(k in en));
		for (const key of extra) {
			const base = key.replace(/_(zero|one|two|few|many|other)$/, '');
			expect(base, `${key} is not a plural form of a known key`).not.toBe(key);
			expect(`${base}_other` in en, `${key} has no English _other form`).toBe(true);
		}
	});

	it('defines every CLDR plural category of the language for each plural family', () => {
		const categories = new Intl.PluralRules(language).resolvedOptions().pluralCategories;
		const families = EN_KEYS.filter((k) => k.endsWith('_other')).map((k) =>
			k.slice(0, -'_other'.length)
		);
		const missing = families.flatMap((base) =>
			categories.map((c) => `${base}_${c}`).filter((k) => !(k in messages))
		);
		expect(missing).toEqual([]);
	});

	it('extra plural forms only use placeholders of their English family', () => {
		const violations = Object.keys(messages)
			.filter((k) => !(k in en))
			.flatMap((key) => {
				const base = key.replace(/_(zero|one|two|few|many|other)$/, '');
				const allowed = placeholders((en as Record<string, string>)[`${base}_other`] ?? '');
				return placeholders(messages[key])
					.filter((p) => !allowed.includes(p))
					.map((p) => `${key}: {{${p}}}`);
			});
		expect(violations).toEqual([]);
	});

	it('stays within the length budget of its English source', () => {
		for (const key of EN_KEYS) {
			const source = [...en[key]].length;
			const actual = [...messages[key]].length;
			const budget = Math.ceil(source * expansionAllowance(source));
			expect(
				actual,
				`${key}: "${messages[key]}" is ${actual} chars, budget ${budget}`
			).toBeLessThanOrEqual(budget);
		}
	});

	it('keeps date presets short enough for the narrow filter list', () => {
		for (const key of EN_KEYS.filter((k) => k.startsWith('date_preset.'))) {
			expect([...messages[key]].length, `${key}: "${messages[key]}"`).toBeLessThanOrEqual(
				DATE_PRESET_MAX_CHARS
			);
		}
	});

	it('every plural family selects a form for 0, 1, 2 and 5', () => {
		const families = EN_KEYS.filter((k) => k.endsWith('_other')).map((k) =>
			k.slice(0, -'_other'.length)
		);
		for (const base of families) {
			for (const count of [0, 1, 2, 5, 1_000_000]) {
				const out = createTranslator(language, messages)(base as MessageKey, { count });
				expect(out, `${base} count=${count}`).not.toContain('{{');
				expect(out).toContain(String(count));
			}
		}
	});
});

describe('createTranslator', () => {
	const fr = getLanguagePack('fr').messages;
	const tEn = createTranslator('en', en);
	const tFr = createTranslator('fr', fr);

	it('interpolates named variables and leaves unknown placeholders visible', () => {
		expect(tEn('table.page_of', { page: 2, total: 9 })).toBe('2 of 9');
		expect(tEn('table.page_of', { page: 2 })).toBe('2 of {{total}}');
	});

	it('picks the plural form from the language rules', () => {
		expect(tEn('filter.items_count', { count: 1 })).toBe('1 item');
		expect(tEn('filter.items_count', { count: 3 })).toBe('3 items');
		// French treats 0 as singular.
		expect(tFr('filter.selected_count', { count: 0 })).toBe('0 sélectionné');
		expect(tFr('filter.selected_count', { count: 2 })).toBe('2 sélectionnés');
	});

	it('falls back to English, then to the key, rather than rendering blank', () => {
		const partial = { ...fr, 'table.no_rows': '' } as Messages;
		expect(createTranslator('fr', partial)('table.no_rows')).toBe('');
		const missing = { ...fr } as Record<string, string>;
		delete missing['table.no_rows'];
		const tMissing = createTranslator('fr', missing as Messages);
		expect(tMissing('table.no_rows')).toBe('No rows found');
		expect(tMissing('nope.nothing' as MessageKey)).toBe('nope.nothing');
	});
});

describe('resolveLanguage', () => {
	it('serves regional variants from the primary subtag and unknowns from English', () => {
		expect(resolveLanguage('fr')).toBe('fr');
		expect(resolveLanguage('FR-ca')).toBe('fr');
		expect(resolveLanguage('pt-BR')).toBe('en');
		expect(resolveLanguage(null)).toBe('en');
	});

	it('never resolves an Object.prototype member to a language pack', () => {
		for (const key of ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'constructor-x']) {
			expect(resolveLanguage(key)).toBe('en');
			expect(getLanguagePack(key).dateLocale).toBeDefined();
		}
	});
});
