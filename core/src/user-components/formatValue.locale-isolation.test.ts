import ssf from 'ssf';
import { describe, expect, it, vi } from 'vitest';
import { formatValue, createLocalizedFormatValue } from './formatValue';
import { getDateLocale, EN_DATE_LOCALE } from '../locale/date-locale';
import { resolveLanguage } from '../locale/registry';

vi.spyOn(console, 'warn').mockImplementation(() => {});

const v = new Date(2026, 6, 4, 16, 5, 9);
const CODES = [
	'mmm',
	'mmmm',
	'mmmmm',
	'ddd',
	'dddd',
	'longdate',
	'fulldate',
	'shortdate',
	'hms',
	'mmm yyyy',
	'General'
];

const snapshot = () =>
	JSON.stringify({ table: (ssf as unknown as { get_table(): unknown }).get_table() });

describe('isolation', () => {
	it('SSF global table is untouched by French formatting', () => {
		const before = snapshot();
		for (const c of CODES)
			formatValue(v, c, undefined, undefined, undefined, undefined, undefined, 'fr');
		expect(snapshot()).toBe(before);
	});

	it('bare ssf.format (no opts) stays English after French calls', () => {
		formatValue(v, 'mmmm', undefined, undefined, undefined, undefined, undefined, 'fr');
		expect(ssf.format('mmmm dddd', v, { date1970: true } as never)).toBe('July Saturday');
	});

	it('interleaved en/fr per call produces deterministic output (10k random calls)', () => {
		const en = createLocalizedFormatValue('en');
		const fr = createLocalizedFormatValue('fr');
		const expectedEn = CODES.map((c) => en(v, c));
		const expectedFr = CODES.map((c) => fr(v, c));
		let seed = 42;
		const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
		for (let i = 0; i < 10_000; i++) {
			const ci = Math.floor(rnd() * CODES.length);
			if (rnd() < 0.5) expect(en(v, CODES[ci])).toBe(expectedEn[ci]);
			else expect(fr(v, CODES[ci])).toBe(expectedFr[ci]);
		}
		expect(expectedEn.slice(0, 2)).toEqual(['Jul', 'July']);
		expect(expectedFr.slice(0, 2)).toEqual(['juil.', 'juillet']);
	});

	it('Promise-concurrent renders (simulated SSR requests) do not leak', async () => {
		const render = async (lang: string) => {
			const fv = createLocalizedFormatValue(lang);
			const out: string[] = [];
			for (let i = 0; i < 200; i++) {
				out.push(fv(v, CODES[i % CODES.length]));
				if (i % 7 === 0) await new Promise((r) => setTimeout(r, 0));
			}
			return out;
		};
		const results = await Promise.all(
			Array.from({ length: 40 }, (_, i) => render(i % 2 ? 'fr' : 'en'))
		);
		const en = results.filter((_, i) => i % 2 === 0);
		const fr = results.filter((_, i) => i % 2 === 1);
		for (const r of en) expect(r).toEqual(en[0]);
		for (const r of fr) expect(r).toEqual(fr[0]);
		expect(en[0].join()).not.toMatch(/juil|samedi/);
		expect(fr[0].join()).not.toMatch(/July|Saturday/);
	});
});

describe('language robustness', () => {
	const call = (lang: unknown) => () =>
		formatValue(v, 'mmmm', undefined, undefined, undefined, undefined, undefined, lang as string);

	it.each([
		[undefined, 'July'],
		[null, 'July'],
		['', 'July'],
		['   ', 'July'],
		['xx', 'July'],
		['en', 'July'],
		['EN-gb', 'July'],
		['FR', 'juillet'],
		['fr_FR', 'juillet'],
		['fr-CA', 'juillet'],
		[' fr ', 'juillet'],
		['fr-Latn-FR', 'juillet'],
		['français', 'July']
	])('language %j -> %s', (lang, expected) => {
		expect(call(lang)()).toBe(expected);
	});

	// Regression for the `tag in LANGUAGES` prototype walk (fixed in 0e5480793 via Object.hasOwn).
	it.each(['constructor', 'Constructor', 'CONSTRUCTOR', 'constructor-CA'])(
		'prototype key %j falls back to English',
		(lang) => {
			expect(resolveLanguage(lang)).toBe('en');
			expect(call(lang)()).toBe('July');
		}
	);

	it.each(['toString', 'hasOwnProperty', 'valueOf', '__proto__'])(
		'prototype key %j is harmless (lowercased away / not reachable)',
		(lang) => {
			expect(resolveLanguage(lang)).toBe('en');
			expect(call(lang)()).toBe('July');
		}
	);

	it.each([[{}], [42], [['fr']], [true]])(
		'non-string language %j falls back to English',
		(lang) => {
			expect(call(lang)()).toBe('July');
		}
	);
});

describe('value robustness (fr)', () => {
	const fr = createLocalizedFormatValue('fr');
	it.each([
		[new Date('invalid'), 'mmm'],
		[NaN, 'mmm'],
		[Infinity, 'longdate'],
		[null, 'longdate'],
		['2026-13-45', 'longdate'],
		['not a date', 'mmm'],
		['2026-03-04', 'longdate'],
		['2026-03-04T23:30:00Z', 'longdate'],
		[1.7e12, 'longdate'],
		[-1e15, 'mmm'],
		[0, 'mmm'],
		[13, 'mmm'],
		[0, 'dddd'],
		[8, 'dddd'],
		[2.5, 'dddd'],
		[{ x: 1 }, 'mmm']
	])('%j with %s does not throw', (value, code) => {
		const out = fr(value, code);
		expect(typeof out).toBe('string');
	});
});

describe('timezone boundaries', () => {
	const fr = createLocalizedFormatValue('fr');
	it('zoneless midnight strings never shift month in any TZ', () => {
		expect(fr('2026-03-01', 'mmmm yyyy')).toBe('mars 2026');
		expect(fr('2026-03-01 00:00:00', 'mmmm yyyy')).toBe('mars 2026');
		expect(fr('2026-01-01T00:00:00Z', 'mmmm yyyy')).toBe('janvier 2026');
		expect(fr('2025-12-31T23:30:00-05:00', 'd mmmm yyyy')).toBe('31 décembre 2025');
	});
	it('Date objects at UTC midnight follow the local clock (pre-existing semantics)', () => {
		const date = new Date(Date.UTC(2026, 2, 1));
		const localDay = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
		expect(fr(date, 'd mmmm yyyy')).toBe(fr(localDay, 'd mmmm yyyy'));
	});
	it('Paris DST transitions', () => {
		expect(fr('2026-03-29 02:30:00', 'd mmm yyyy HH:MM')).toMatch(/^29 mars 2026/);
		expect(fr('2026-10-25 02:30:00', 'd mmm yyyy HH:MM')).toMatch(/^25 oct\. 2026/);
		process.stdout.write(
			`\n[TZ=${process.env.TZ}] DST gap 02:30 -> ${fr('2026-03-29 02:30:00', 'd mmm yyyy HH:MM')}, overlap -> ${fr('2026-10-25 02:30:00', 'd mmm yyyy HH:MM')}\n`
		);
	});
	it('EN locale objects are distinct & stable', () => {
		expect(getDateLocale('zz')).toBe(EN_DATE_LOCALE);
	});
});
