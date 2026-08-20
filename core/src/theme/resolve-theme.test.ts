import { describe, test, expect } from 'vitest';
import { resolveTheme, resolveThemeOverrides, diffThemeOverrides } from './resolve-theme';
import { DEFAULT_THEME } from '../constants/default-theme';

const defaultLight = DEFAULT_THEME.colorPalettes.default.light;
const defaultDark = DEFAULT_THEME.colorPalettes.default.dark;
const defaultScaleLight = DEFAULT_THEME.colorScales.default.light;
const defaultScaleDark = DEFAULT_THEME.colorScales.default.dark;

describe('resolveThemeOverrides', () => {
	test('no overrides returns the base unchanged', () => {
		expect(resolveThemeOverrides(DEFAULT_THEME, undefined)).toEqual(DEFAULT_THEME);
		expect(resolveThemeOverrides(DEFAULT_THEME, null)).toEqual(DEFAULT_THEME);
	});

	test('partial palette light override fills the first slots, base fills the rest', () => {
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			colorPalettes: { default: { light: ['#b51a00', '#45a1bf'] } }
		});
		expect(resolved.colorPalettes.default.light).toEqual([
			'#b51a00',
			'#45a1bf',
			...defaultLight.slice(2)
		]);
		// dark mode was not specified -> inherited from base
		expect(resolved.colorPalettes.default.dark).toEqual(defaultDark);
	});

	test('an override longer than the base replaces it entirely', () => {
		const long = Array.from(
			{ length: defaultLight.length + 2 },
			(_, i) => `#${i.toString(16).padStart(6, '0')}`
		);
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			colorPalettes: { default: { light: long } }
		});
		expect(resolved.colorPalettes.default.light).toEqual(long);
	});

	test('color token merges per-mode (light-only override keeps base dark)', () => {
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			colors: { base: { light: '#abcdef' } }
		});
		expect(resolved.colors.base).toEqual({
			light: '#abcdef',
			dark: DEFAULT_THEME.colors.base.dark
		});
	});

	test('a pre-PR base config (no fonts/chart/positive) resolves without throwing', () => {
		// A ThemeConfig serialized before the new token groups existed
		const legacyBase = {
			colors: { base: { light: '#ffffff', dark: '#000000' } },
			colorPalettes: { default: { light: ['#111111'], dark: ['#eeeeee'] } },
			colorScales: { default: { light: ['#dbeafe'], dark: ['#0f172a'] } }
		} as unknown as typeof DEFAULT_THEME;

		const resolved = resolveThemeOverrides(legacyBase, { radius: '0.25rem' });
		// new groups backfilled from DEFAULT_THEME, override still applied
		expect(resolved.fonts).toEqual(DEFAULT_THEME.fonts);
		expect(resolved.chart.gridlines).toBe(DEFAULT_THEME.chart.gridlines);
		expect(resolved.chart.animateIntro).toBe(DEFAULT_THEME.chart.animateIntro);
		expect(resolved.colors.positive).toEqual(DEFAULT_THEME.colors.positive);
		expect(resolved.radius).toBe('0.25rem');
		// differ against the same legacy base must not throw either
		expect(() => diffThemeOverrides({ depth: 'flat' }, legacyBase)).not.toThrow();
	});

	test('null token inherits from base', () => {
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			colors: { base: null }
		});
		expect(resolved.colors.base).toEqual(DEFAULT_THEME.colors.base);
	});

	test('fonts merge per-key (heading-only override keeps base body/mono)', () => {
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			fonts: { heading: 'serif' }
		});
		expect(resolved.fonts).toEqual({
			heading: 'serif',
			body: DEFAULT_THEME.fonts.body,
			mono: DEFAULT_THEME.fonts.mono
		});
	});

	test('scalar tokens override and null/omitted inherit', () => {
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			radius: '0.125rem',
			depth: 'flat',
			density: null
		});
		expect(resolved.radius).toBe('0.125rem');
		expect(resolved.depth).toBe('flat');
		expect(resolved.density).toBe(DEFAULT_THEME.density);
	});

	test('chart merges per-key; optional color adopted only when fully specified', () => {
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			chart: {
				gridlines: false,
				gridlineColor: { light: '#eeeeee', dark: '#222222' },
				// light-only on a token with no base value -> not adopted
				axisLabelColor: { light: '#666666' }
			}
		});
		expect(resolved.chart.gridlines).toBe(false);
		expect(resolved.chart.gridlineColor).toEqual({ light: '#eeeeee', dark: '#222222' });
		expect(resolved.chart.axisLabelColor).toBeUndefined();
	});

	test('chart override layers on a parent that already set chart tokens', () => {
		const parent = resolveThemeOverrides(DEFAULT_THEME, {
			chart: { gridlineColor: { light: '#eeeeee', dark: '#222222' } }
		});
		const resolved = resolveThemeOverrides(parent, {
			chart: { gridlineColor: { light: '#cccccc' }, gridlines: false }
		});
		expect(resolved.chart.gridlineColor).toEqual({ light: '#cccccc', dark: '#222222' });
		expect(resolved.chart.gridlines).toBe(false);
	});

	test('semantic up/down colors merge per-mode like other color tokens', () => {
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			colors: { positive: { light: '#4af6c3' }, negative: null }
		});
		expect(resolved.colors.positive).toEqual({
			light: '#4af6c3',
			dark: DEFAULT_THEME.colors.positive.dark
		});
		expect(resolved.colors.negative).toEqual(DEFAULT_THEME.colors.negative);
	});

	test('inputSurface is an optional token: adopted when fully specified, diffed when changed', () => {
		// Optional (no base value) → adopted only when both modes are given.
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			colors: { inputSurface: { light: '#101010', dark: '#202020' } }
		});
		expect(resolved.colors.inputSurface).toEqual({ light: '#101010', dark: '#202020' });
		// Round-trips through diff against a base that already carries it.
		const diff = diffThemeOverrides(
			{ colors: { inputSurface: { light: '#ffffff', dark: '#202020' } } },
			resolved
		);
		expect(diff?.colors?.inputSurface).toEqual({ light: '#ffffff' });
	});

	test('baseFontSize and chart style scalars (incl. animation toggles) merge per-key', () => {
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			baseFontSize: '13px',
			chart: { barRadius: 4, smooth: true, baselines: false, animateIntro: false }
		});
		expect(resolved.baseFontSize).toBe('13px');
		expect(resolved.chart.barRadius).toBe(4);
		expect(resolved.chart.smooth).toBe(true);
		expect(resolved.chart.areaGradient).toBeUndefined();
		// gridlines untouched (default true), baselines overridden off
		expect(resolved.chart.gridlines).toBe(true);
		expect(resolved.chart.baselines).toBe(false);
		// animateIntro overridden off, animateUpdates inherits the default (true)
		expect(resolved.chart.animateIntro).toBe(false);
		expect(resolved.chart.animateUpdates).toBe(true);
	});

	test('table merges per-key; colors per-mode, booleans pass through', () => {
		const resolved = resolveThemeOverrides(DEFAULT_THEME, {
			table: {
				rowLines: false,
				rowShading: true,
				barColor: { light: '#123456', dark: '#654321' },
				// light-only on a token with no base value -> not adopted
				subtotalBackground: { light: '#abcabc' }
			}
		});
		expect(resolved.table.rowLines).toBe(false);
		expect(resolved.table.rowShading).toBe(true);
		expect(resolved.table.barColor).toEqual({ light: '#123456', dark: '#654321' });
		expect(resolved.table.subtotalBackground).toBeUndefined();
	});

	test('table override layers on a parent that already set table tokens', () => {
		const parent = resolveThemeOverrides(DEFAULT_THEME, {
			table: { totalBackground: { light: '#eeeeee', dark: '#222222' } }
		});
		const resolved = resolveThemeOverrides(parent, {
			table: { totalBackground: { light: '#cccccc' }, rowLines: false }
		});
		expect(resolved.table.totalBackground).toEqual({ light: '#cccccc', dark: '#222222' });
		expect(resolved.table.rowLines).toBe(false);
	});
});

describe('diffThemeOverrides', () => {
	test('drops tokens identical to the base, keeps genuine overrides', () => {
		const page = {
			// identical to base -> dropped
			colorScales: { default: { light: defaultScaleLight, dark: defaultScaleDark } },
			// differs -> kept
			colorPalettes: { default: { light: ['#b51a00', '#45a1bf'] } }
		};
		const diff = diffThemeOverrides(page, DEFAULT_THEME);
		expect(diff).toEqual({ colorPalettes: { default: { light: ['#b51a00', '#45a1bf'] } } });
	});

	test('keeps only the differing mode of a color token', () => {
		const page = { colors: { base: { light: '#abcdef', dark: DEFAULT_THEME.colors.base.dark } } };
		const diff = diffThemeOverrides(page, DEFAULT_THEME);
		expect(diff).toEqual({ colors: { base: { light: '#abcdef' } } });
	});

	test('returns undefined when nothing differs', () => {
		const page = { colorPalettes: { default: { light: defaultLight, dark: defaultDark } } };
		expect(diffThemeOverrides(page, DEFAULT_THEME)).toBeUndefined();
	});

	test('a diffed override re-resolves back to the original page theme', () => {
		const page = { colorPalettes: { default: { light: ['#b51a00', '#45a1bf'] } } };
		const diff = diffThemeOverrides(page, DEFAULT_THEME);
		// Applying the minimal diff over the base yields the same result as applying
		// the full page override over the base.
		expect(resolveThemeOverrides(DEFAULT_THEME, diff)).toEqual(
			resolveThemeOverrides(DEFAULT_THEME, page)
		);
	});

	test('drops fonts/scalars/chart identical to the base, keeps genuine overrides', () => {
		const page = {
			fonts: { heading: 'serif', body: DEFAULT_THEME.fonts.body },
			radius: DEFAULT_THEME.radius,
			depth: 'flat',
			density: DEFAULT_THEME.density,
			chart: { gridlines: DEFAULT_THEME.chart.gridlines, axisLabelColor: { light: '#666666' } }
		} as const;
		const diff = diffThemeOverrides(page, DEFAULT_THEME);
		expect(diff).toEqual({
			fonts: { heading: 'serif' },
			depth: 'flat',
			chart: { axisLabelColor: { light: '#666666' } }
		});
	});

	test('new-token diff re-resolves back to the original page theme', () => {
		const page = {
			fonts: { mono: 'serif' },
			radius: '0.25rem',
			density: 'compact',
			chart: { gridlines: false, gridlineColor: { light: '#eeeeee', dark: '#222222' } }
		} as const;
		const diff = diffThemeOverrides(page, DEFAULT_THEME);
		expect(resolveThemeOverrides(DEFAULT_THEME, diff)).toEqual(
			resolveThemeOverrides(DEFAULT_THEME, page)
		);
	});

	test('round-2 tokens diff and re-resolve (up/down, baseFontSize, chart style + animation)', () => {
		const page = {
			colors: { positive: { light: '#4af6c3', dark: '#4af6c3' } },
			baseFontSize: '13px',
			density: 'flush',
			chart: {
				barRadius: 4,
				smooth: true,
				areaGradient: true,
				animateIntro: false,
				animateUpdates: DEFAULT_THEME.chart.animateUpdates
			}
		} as const;
		const diff = diffThemeOverrides(page, DEFAULT_THEME);
		// animateIntro differs -> kept; animateUpdates matches the base -> dropped
		expect(diff?.chart?.animateIntro).toBe(false);
		expect(diff?.chart?.animateUpdates).toBeUndefined();
		expect(resolveThemeOverrides(DEFAULT_THEME, diff)).toEqual(
			resolveThemeOverrides(DEFAULT_THEME, page)
		);
	});

	test('table diff drops base-identical tokens, keeps real overrides and round-trips', () => {
		const page = {
			table: {
				rowShading: true,
				barColor: { light: '#123456', dark: '#654321' }
			}
		} as const;
		const diff = diffThemeOverrides(page, DEFAULT_THEME);
		expect(diff).toEqual({
			table: { rowShading: true, barColor: { light: '#123456', dark: '#654321' } }
		});
		expect(resolveThemeOverrides(DEFAULT_THEME, diff)).toEqual(
			resolveThemeOverrides(DEFAULT_THEME, page)
		);
	});
});

describe('resolveTheme — layered org -> project -> page', () => {
	test('page colors come first, then project, then org/base for the rest', () => {
		const org = { colorPalettes: { default: { light: ['#111111', '#222222', '#333333'] } } };
		const project = { colorPalettes: { default: { light: ['#aaaaaa'] } } };
		const page = { colorPalettes: { default: { light: ['#ffffff'] } } };

		const resolved = resolveTheme(DEFAULT_THEME, org, project, page);

		expect(resolved.colorPalettes.default.light).toEqual([
			'#ffffff', // page slot 0
			'#222222', // org slot 1 (project didn't override it)
			'#333333', // org slot 2
			...defaultLight.slice(3) // base fills the rest
		]);
		// no dark specified anywhere -> base dark
		expect(resolved.colorPalettes.default.dark).toEqual(defaultDark);
	});
});
