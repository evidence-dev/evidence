import type { ThemeConfig } from '../types/theme';

/**
 * Default theme configuration - only includes tokens that are actually used
 */
export const DEFAULT_THEME: ThemeConfig = {
	colors: {
		base: {
			light: '#ffffff',
			dark: '#09090b' // rgb(9 9 11) - original Evidence default
		},
		// Card colors provide good contrast for card layouts
		card: {
			light: '#ffffff', // Match base for seamless cards
			dark: '#09090b' // Slightly lighter than base for contrast
		},
		cardLayoutBackground: {
			light: '#fafafa', // Slightly darker than base for subtle page background
			dark: '#18181b' // Match card color in dark mode (production default)
		},
		// Match the previously hardcoded delta colors (green-600 / red-500)
		positive: {
			light: '#16a34a',
			dark: '#16a34a'
		},
		negative: {
			light: '#ef4444',
			dark: '#ef4444'
		}
	},

	colorPalettes: {
		default: {
			// Same palette for both light and dark modes (matches existing default chart colors)
			light: [
				'#154886',
				'#45a1bf',
				'#a5cdee',
				'#8dacbf',
				'#85c7c6',
				'#d2c6ac',
				'#f4b548',
				'#8f3d56',
				'#71b9f4',
				'#46a485'
			],
			dark: [
				'#154886',
				'#45a1bf',
				'#a5cdee',
				'#8dacbf',
				'#85c7c6',
				'#d2c6ac',
				'#f4b548',
				'#8f3d56',
				'#71b9f4',
				'#46a485'
			]
		}
	},

	colorScales: {
		default: {
			// Two-color gradient (matches table default color scale on main)
			light: ['#dbeafe', '#1e40af'], // light blue to dark blue
			dark: ['#0f172a', '#60a5fa'] // dark to light blue
		}
	},

	fonts: {
		heading: 'sans-serif',
		body: 'sans-serif',
		mono: 'mono'
	},
	baseFontSize: '16px',
	radius: '0.5rem',
	depth: 'subtle',
	density: 'default',
	chart: {
		gridlines: true,
		// Off by default: gridlines already establish the axis, and a bottom
		// baseline in the same color reads as duplicate framing. Authors flip
		// this to `true` in the theme editor ("Baselines: Show") to get a
		// prominent axis line (defaults to muted foreground).
		baselines: false,
		// Chart animations on by default (intro draw-in + data-update re-animation)
		animateIntro: true,
		animateUpdates: true
		// gridlineColor / axisLabelColor / baselineColor / fontFamily fall back
		// to derived tokens (border, mutedForeground, gridlineColor, fonts.body)
		// in createTheme — so custom base colors flow through to chart typography.
	},
	// Table tokens default to their previously-hardcoded values at the CSS-var
	// emit / context-read layer, so an empty group leaves un-themed tables unchanged
	table: {}
};
