import { describe, test, expect } from 'vitest';
import chroma from 'chroma-js';
import { generateThemeCSS, fontScaleFromBaseFontSize, buildDepthShadow } from './theme-css-helper';
import { resolveThemeOverrides } from './resolve-theme';
import { DEFAULT_THEME } from '../constants/default-theme';
import { FONT_FAMILY_STACKS } from '../constants/theme-style-maps';
import { normalizeRadius, themeOverridesSchema, type ThemeOverrides } from '../types/theme';

describe('fontScaleFromBaseFontSize', () => {
	test('px is normalized against the 16px root', () => {
		expect(fontScaleFromBaseFontSize('16px')).toBe(1);
		expect(fontScaleFromBaseFontSize('12px')).toBe(0.75);
		expect(fontScaleFromBaseFontSize('20px')).toBe(1.25);
	});

	test('rem/em are already root-relative and used as the multiplier directly', () => {
		expect(fontScaleFromBaseFontSize('1rem')).toBe(1);
		expect(fontScaleFromBaseFontSize('1.25em')).toBe(1.25);
	});

	test('invalid / non-positive values fall back to 1 (identity)', () => {
		expect(fontScaleFromBaseFontSize('abc')).toBe(1);
		expect(fontScaleFromBaseFontSize('0px')).toBe(1);
		expect(fontScaleFromBaseFontSize('-5px')).toBe(1);
		expect(fontScaleFromBaseFontSize('')).toBe(1);
	});
});

describe('buildDepthShadow', () => {
	test('flat emits the transparent sentinel (no shadow)', () => {
		expect(buildDepthShadow('flat', '#ffffff')).toBe('0 0 #0000');
	});

	test('subtle is a single layer matching the shadow-xs geometry', () => {
		const shadow = buildDepthShadow('subtle', '#ffffff');
		expect(shadow).toContain('0 1px 2px 0');
		// no second layer
		expect(shadow).not.toContain('0 1px 3px 0');
	});

	test('elevated emits two layers', () => {
		const shadow = buildDepthShadow('elevated', '#ffffff');
		expect(shadow).toContain('0 2px 8px -1px');
		expect(shadow).toContain('0 1px 3px 0');
	});

	test('shadow tint is per-surface: light vs dark backgrounds differ', () => {
		// light surface -> a darker tint of the surface; dark surface -> boosted-alpha
		// black. Same depth, different background must not produce the same shadow.
		expect(buildDepthShadow('subtle', '#ffffff')).not.toBe(buildDepthShadow('subtle', '#000000'));
	});
});

describe('generateThemeCSS — config-level tokens', () => {
	test('default theme emits the same values base.css falls back to', () => {
		const css = generateThemeCSS(DEFAULT_THEME);
		expect(css).toContain('--radius: 0.5rem !important;');
		expect(css).toContain("--theme-font-body: 'Geist', sans-serif !important;");
		// shadow color is derived from the background (tinted), geometry matches shadow-xs
		expect(css).toMatch(/--theme-shadow-xs: 0 1px 2px 0 rgba?\(/);
		expect(css).toContain('--theme-report-gap: 1rem !important;');
		expect(css).toContain('--theme-block-gap: 1rem !important;');
		expect(css).toContain('--theme-card-padding: 1rem !important;');
	});

	test('flush zeroes the grid gutter but keeps a block gap', () => {
		const css = generateThemeCSS(resolveThemeOverrides(DEFAULT_THEME, { density: 'flush' }));
		expect(css).toContain('--theme-report-gap: 0rem !important;');
		expect(css).toContain('--theme-block-gap: 0.75rem !important;');
	});

	test('overridden tokens flow through to the emitted vars', () => {
		const config = resolveThemeOverrides(DEFAULT_THEME, {
			fonts: { heading: 'serif' },
			radius: '0.125rem',
			depth: 'flat',
			density: 'compact'
		});
		const css = generateThemeCSS(config);
		// family enum maps to the bundled serif stack
		expect(css).toContain(`--theme-font-heading: ${FONT_FAMILY_STACKS.serif} !important;`);
		// body not overridden -> still default (sans → Geist)
		expect(css).toContain(`--theme-font-body: ${FONT_FAMILY_STACKS['sans-serif']} !important;`);
		expect(css).toContain('--radius: 0.125rem !important;');
		expect(css).toContain('--theme-shadow-xs: 0 0 #0000 !important;');
		expect(css).toContain('--theme-report-gap: 0.625rem !important;');
	});

	test('scoped CSS carries config tokens inside the scope selector', () => {
		const css = generateThemeCSS(DEFAULT_THEME, { scopeSelector: '.editor-preview-pane' });
		const scopedBlock = css.slice(css.indexOf('.editor-preview-pane'));
		expect(scopedBlock).toContain('--radius: 0.5rem !important;');
		expect(css).not.toMatch(/^\s*:root\s*{/m);
	});

	test('baseFontSize emits the unitless scale (16px = 1)', () => {
		expect(generateThemeCSS(DEFAULT_THEME)).toContain('--theme-font-scale: 1 !important;');
		const css = generateThemeCSS(resolveThemeOverrides(DEFAULT_THEME, { baseFontSize: '14px' }));
		expect(css).toContain('--theme-font-scale: 0.875 !important;');
	});

	test('syntax palette follows the themed surface, not the app mode', () => {
		// A dark base in LIGHT mode (e.g. terminal preset viewed in light app mode):
		// the code-fence palette must be the light-on-dark one so text isn't black-on-black.
		const darkSurface = resolveThemeOverrides(DEFAULT_THEME, {
			colors: { base: { light: '#000000', dark: '#000000' } }
		});
		const css = generateThemeCSS(darkSurface);
		const lightBlock = css.slice(css.indexOf(':root'), css.indexOf('.dark'));
		// base text = themed foreground (light on the dark surface), keyword = dark-surface hue
		expect(lightBlock).toContain('--syntax-keyword: #569cd6 !important;');
		expect(lightBlock).toContain('--syntax-text:');
		// a light base keeps the light-surface palette
		const lightCss = generateThemeCSS(DEFAULT_THEME);
		expect(lightCss.slice(0, lightCss.indexOf('.dark'))).toContain(
			'--syntax-keyword: #0549b5 !important;'
		);
	});

	test('inline code color tracks the themed surface, not the prose default', () => {
		// Report content is `.prose dark:prose-invert`, so on a near-black surface
		// viewed in LIGHT app mode the prose-invert palette never engages and
		// inline `code` would fall back to --tw-prose-code (dark) -> black-on-black.
		// The surface foreground override must cover `code` too.
		const darkSurface = resolveThemeOverrides(DEFAULT_THEME, {
			colors: {
				base: { light: '#0a0a0a', dark: '#0a0a0a' },
				card: { light: '#0a0a0a', dark: '#0a0a0a' },
				cardLayoutBackground: { light: '#000000', dark: '#000000' }
			}
		});
		const css = generateThemeCSS(darkSurface);
		// First `.prose code` is the light-mode page-surface rule.
		const idx = css.indexOf('.prose code');
		expect(idx).toBeGreaterThan(-1);
		const color = css.slice(idx).match(/color:\s*(#[0-9a-fA-F]{6})/)?.[1];
		expect(color).toBeTruthy();
		// On a black surface in light mode the inline code must be light/readable.
		expect(chroma(color!).luminance()).toBeGreaterThan(0.5);
	});

	test('input surface defaults to the surface (white) in light mode, overridable', () => {
		const css = generateThemeCSS(DEFAULT_THEME);
		expect(css).toMatch(/--input-surface:\s*hsl\(/);
		// Light default = the white surface itself (not a derived gray) — inputs
		// read via their border + shadow. The first occurrence is the light block.
		const firstIdx = css.indexOf('--input-surface:');
		const lightValue = css.slice(firstIdx).match(/--input-surface:\s*hsl\(([^)]+)\)/)?.[1];
		expect(lightValue).toBe('0 0% 100%');
		// An explicit inputSurface override flows straight through.
		const pinned = generateThemeCSS(
			resolveThemeOverrides(DEFAULT_THEME, {
				colors: { inputSurface: { light: '#abcdef', dark: '#abcdef' } }
			})
		);
		// #abcdef -> hsl ~ 210 68% 80%
		expect(pinned).toMatch(/--input-surface:\s*hsl\(210 6[0-9]% 8[0-9]%\)/);
	});

	test('card context redefines the input surface so inputs inside cards still pop', () => {
		// DEFAULT_THEME enables card mode, so the card selector block must carry
		// its own --input-surface (derived from the card background).
		const css = generateThemeCSS(DEFAULT_THEME);
		const cardBlock = css.slice(css.indexOf('.bg-card-mode-background .bg-card'));
		expect(cardBlock).toMatch(/--input-surface:\s*hsl\(/);
	});

	test('table special-row backgrounds derive from the surface, not a fixed gray', () => {
		// A dark themed surface (terminal-style) viewed in light app mode: the
		// subtotal/total/pivot rows must darken with the surface rather than fall
		// back to the old fixed light grays (which looked wrong on every dark setup).
		const darkSurface = resolveThemeOverrides(DEFAULT_THEME, {
			colors: {
				base: { light: '#0a0a0a', dark: '#0a0a0a' },
				card: { light: '#0a0a0a', dark: '#0a0a0a' },
				cardLayoutBackground: { light: '#000000', dark: '#000000' }
			}
		});
		const css = generateThemeCSS(darkSurface);
		const sub = css.match(/--theme-table-subtotal-bg:\s*(#[0-9a-fA-F]{6})/)?.[1];
		const total = css.match(/--theme-table-total-bg:\s*(#[0-9a-fA-F]{6})/)?.[1];
		expect(sub).toBeTruthy();
		// Tracks the dark surface, nowhere near the old #f9fafb gray-50 default.
		expect(chroma(sub!).luminance()).toBeLessThan(0.2);
		// Grand total reads as more prominent than subtotal (lifted further off a dark bg).
		expect(chroma(total!).luminance()).toBeGreaterThan(chroma(sub!).luminance());
	});

	test('explicit table background override wins over the derived default', () => {
		const pinned = generateThemeCSS(
			resolveThemeOverrides(DEFAULT_THEME, {
				table: { totalBackground: { light: '#abcdef', dark: '#abcdef' } }
			})
		);
		expect(pinned).toContain('--theme-table-total-bg: #abcdef !important;');
	});

	test('up/down colors emit per-mode vars', () => {
		const config = resolveThemeOverrides(DEFAULT_THEME, {
			colors: { positive: { light: '#4af6c3', dark: '#00ff00' } }
		});
		const css = generateThemeCSS(config);
		expect(css).toContain('--theme-positive: #4af6c3 !important;');
		expect(css).toContain('--theme-positive: #00ff00 !important;');
		expect(css).toContain(`--theme-negative: ${DEFAULT_THEME.colors.negative.light} !important;`);
	});

	test('scoped CSS mirrors theme vars onto marked report-surface overlays only', () => {
		const css = generateThemeCSS(DEFAULT_THEME, { scopeSelector: '.editor-preview-pane' });
		expect(css).toContain('.evidence-page-theme {');
		expect(css).toContain('.dark .evidence-page-theme {');
		// never target the shared shadcn hooks — that leaks into studio chrome
		expect(css).not.toContain('data-slot');
		// unscoped (published) portals inherit :root vars; no mirror needed
		expect(generateThemeCSS(DEFAULT_THEME)).not.toContain('evidence-page-theme');
	});

	test('contrast pairs are emitted together', () => {
		const css = generateThemeCSS(DEFAULT_THEME);
		expect(css).toContain('--primary:');
		expect(css).toContain('--primary-foreground:');
		expect(css).toContain('--secondary-foreground:');
	});

	test('the theme never emits a report-surface CSS animation/transition kill rule', () => {
		// Chart animation tokens moved under chart.animateIntro/animateUpdates and now
		// drive ONLY ECharts options — the theme must never touch CSS animations or
		// transitions (so skeleton .animate-pulse loaders etc. are left alone).
		expect(generateThemeCSS(DEFAULT_THEME)).not.toContain('animation-duration: 0s');
		const css = generateThemeCSS(
			resolveThemeOverrides(DEFAULT_THEME, {
				chart: { animateIntro: false, animateUpdates: false }
			}),
			{ scopeSelector: '.editor-preview-pane' }
		);
		expect(css).not.toContain('*:not(.animate-spin)');
		expect(css).not.toContain('animation-duration: 0s');
	});
});

describe('radius token (unit-free, rem-default)', () => {
	test('normalizeRadius: unitless number/string → rem; explicit length passes through', () => {
		expect(normalizeRadius(1)).toBe('1rem');
		expect(normalizeRadius(0.5)).toBe('0.5rem');
		expect(normalizeRadius('1')).toBe('1rem');
		expect(normalizeRadius('0.25')).toBe('0.25rem');
		expect(normalizeRadius('6px')).toBe('6px');
		expect(normalizeRadius('0.5rem')).toBe('0.5rem');
	});

	test('schema parses a unitless number as rem, keeps explicit lengths, inherits garbage', () => {
		expect(themeOverridesSchema.parse({ radius: 1 }).radius).toBe('1rem');
		expect(themeOverridesSchema.parse({ radius: '0.25' }).radius).toBe('0.25rem');
		expect(themeOverridesSchema.parse({ radius: '6px' }).radius).toBe('6px');
		// Invalid degrades to inherit (undefined) rather than throwing.
		expect(themeOverridesSchema.parse({ radius: 'abc' }).radius).toBeUndefined();
	});

	test('emission tolerates a raw unitless radius from an unparsed theme.yaml', () => {
		// readProjectTheme casts hand-edited YAML without running the schema, so a raw
		// number can reach emission; the chokepoint must still produce a valid length.
		const raw = resolveThemeOverrides(DEFAULT_THEME, { radius: 3 } as unknown as ThemeOverrides);
		expect(generateThemeCSS(raw)).toContain('--radius: 3rem !important;');
	});
});
