import type { ThemeDepth, ThemeDensity, ThemeFontFamily } from '../types/theme';

/**
 * The actual CSS font stack each semantic family maps to. Authors choose a
 * family (sans-serif / serif / mono); we own the stacks. Sans is Geist, serif
 * is Spectral (falling back to Source Serif 4), mono is Geist Mono — all
 * shipped as woff2. The CLI omits Spectral, so local preview lands on Source
 * Serif 4 via this same fallback.
 */
export const FONT_FAMILY_STACKS: Record<ThemeFontFamily, string> = {
	'sans-serif': "'Geist', sans-serif",
	serif: "'Spectral', 'Source Serif 4', Georgia, 'Times New Roman', serif",
	mono: "'Geist Mono', Consolas, monospace"
};

/**
 * Code-fence syntax-highlight palettes, keyed to the SURFACE the code block
 * sits on (`bg-muted`), not the app's light/dark mode — a dark themed surface
 * in light mode must still get light-on-dark syntax colors. base.css sets the
 * `--syntax-*` vars per app mode (default), and generateThemeCSS overrides them
 * by the themed surface's luminance. `text` is overridden with the theme's
 * foreground at emit time for exact contrast.
 */
export const SYNTAX_PALETTES = {
	light: {
		text: '#000000',
		tag: '#9b2c2c',
		attr: '#175899',
		string: '#008000',
		number: '#6b46c1',
		punctuation: '#9ca3af',
		keyword: '#0549b5',
		function: '#d7346b',
		link: '#0066cc'
	},
	dark: {
		text: '#ffffff',
		tag: '#79b8ff',
		attr: '#ff7b72',
		string: '#7ee787',
		number: '#d2a8ff',
		punctuation: '#8b949e',
		keyword: '#569cd6',
		function: '#ce9178',
		link: '#569cd6'
	}
} as const;

/**
 * Shadow geometry per depth level; the color is derived from the page
 * background at CSS-generation time (buildDepthShadow in theme-css-helper)
 * so shadows read as a darker tint of the surface rather than neutral gray.
 * 'subtle' matches Tailwind's default shadow-xs geometry/alpha.
 */
export const DEPTH_SHADOW_GEOMETRY: Record<ThemeDepth, { offsets: string; alpha: number }[]> = {
	flat: [],
	subtle: [{ offsets: '0 1px 2px 0', alpha: 0.05 }],
	elevated: [
		{ offsets: '0 2px 8px -1px', alpha: 0.12 },
		{ offsets: '0 1px 3px 0', alpha: 0.08 }
	]
};

/**
 * Report-surface spacing per density level: `gap` is the grid gutter inside
 * rows/stacks, `blockGap` the vertical rhythm between page-level blocks, and
 * `cardPadding` the padding inside cards. 'default' matches the previous
 * hardcoded gap-4 / p-4. 'flush' removes grid gutters entirely
 * (terminal-style tiling) but keeps a small block gap so independent
 * rows/blocks don't butt into each other.
 */
export const DENSITY_SPACING: Record<
	ThemeDensity,
	{ gap: string; blockGap: string; cardPadding: string }
> = {
	flush: { gap: '0rem', blockGap: '0.75rem', cardPadding: '0.5rem' },
	compact: { gap: '0.625rem', blockGap: '0.625rem', cardPadding: '0.625rem' },
	default: { gap: '1rem', blockGap: '1rem', cardPadding: '1rem' },
	comfortable: { gap: '1.5rem', blockGap: '1.5rem', cardPadding: '1.25rem' }
};
