import { DEFAULT_THEME } from '../constants/default-theme';

/**
 * Build the starter `theme.yaml` for a new project: Evidence's default theme
 * materialized as an editable document (block-style light/dark 6-digit hex).
 */
export function buildThemeYamlContent(): string {
	const { colors, colorPalettes, colorScales } = DEFAULT_THEME;
	const colorBlock = (name: string, c: { light: string; dark: string }) =>
		`  ${name}:\n    light: "${c.light}"\n    dark: "${c.dark}"`;
	const hexArray = (values: string[]) => `[${values.map((h) => `"${h}"`).join(', ')}]`;

	const colorLines = (['base', 'card', 'cardLayoutBackground', 'positive', 'negative'] as const)
		.map((name) => {
			const c = colors[name];
			return c ? colorBlock(name, c) : null;
		})
		.filter((line): line is string => line !== null)
		.join('\n');

	return `# Theme Configuration
# Docs: https://docs.evidence.studio/features/project-settings#theme-yaml
#
# This project's theme. The values below are Evidence's defaults — edit any value
# to customise it, or delete a key to inherit it from your organization's theme.
# Colors take light/dark variants as 6-digit hex.

colors:
${colorLines}
#  # inputSurface — fill for inputs (dropdowns, button groups, text inputs).
#  # Omit to auto-derive a raised surface from your theme; set to pin it:
#  inputSurface:
#    light: "#ffffff"
#    dark: "#1c1c1c"
#  # sidebarBackground — published report sidebar. Omit to track the page bg:
#  sidebarBackground:
#    light: "#fafafa"
#    dark: "#18181b"

# Categorical palette — series colors for charts with multiple series:
colorPalettes:
  default:
    light: ${hexArray(colorPalettes.default.light)}
    dark: ${hexArray(colorPalettes.default.dark)}

# Sequential scale — heatmaps and gradient fills:
colorScales:
  default:
    light: ${hexArray(colorScales.default.light)}
    dark: ${hexArray(colorScales.default.dark)}

# Style tokens (uncomment to override; values shown are Evidence's defaults):
#
# fonts (each one of: sans-serif | serif | mono):
#   heading: ${DEFAULT_THEME.fonts.heading}
#   body: ${DEFAULT_THEME.fonts.body}
#   mono: ${DEFAULT_THEME.fonts.mono}
#
# Base font size for report text (16px = default; scales all text):
# baseFontSize: "${DEFAULT_THEME.baseFontSize}"
#
# Sidebar nav font size (published viewer; omit to follow the report size):
# sidebarFontSize: "14px"
#
# Corner radius of cards, inputs, and buttons. A bare number is rem (1 = 1rem);
# or give a CSS length like "6px":
# radius: 0.5
#
# Shadow on cards/inputs — flat | subtle | elevated:
# depth: ${DEFAULT_THEME.depth}
#
# Report spacing — flush | compact | default | comfortable
# (flush removes grid gutters entirely):
# density: ${DEFAULT_THEME.density}
#
# Chart defaults (colors take light/dark hex like the tokens above):
# chart:
#   gridlines: ${DEFAULT_THEME.chart.gridlines}
#   baselines: ${DEFAULT_THEME.chart.baselines}   # show the x-axis baseline
#   gridlineColor:
#     light: "#e4e4e7"
#     dark: "#27272a"
#   axisLabelColor:            # also drives the echarts subtitle + axis title
#     light: "#717173"
#     dark: "#9f9fa9"
#   baselineColor:           # axis baseline + ticks (defaults to the muted foreground)
#     light: "#717173"
#     dark: "#9f9fa9"
#   fontFamily: sans-serif   # sans-serif | serif | mono
#   barRadius: 0        # top-corner radius on bars, px
#   smooth: false       # line/area curve smoothing
#   areaGradient: false # color-to-transparent fill on area charts
#   animateIntro: ${DEFAULT_THEME.chart.animateIntro}    # chart draw-in on first render
#   animateUpdates: ${DEFAULT_THEME.chart.animateUpdates} # re-animate on data change
#
# Table defaults (colors take light/dark hex like the tokens above):
# table:
#   rowLines: true       # borders between rows
#   rowShading: false    # alternating row backgrounds
#   barColor:            # in-cell bars & sparklines
#     light: "#60a5fa"
#     dark: "#60a5fa"
#   subtotalBackground:  # subtotal rows (defaults to a shade of the surface)
#     light: "#f9fafb"
#     dark: "#1f2937"
#   totalBackground:     # grand-total row (defaults to a shade of the surface)
#     light: "#f3f4f6"
#     dark: "#1f2937"
#   rowBorderColor:      # row dividers (defaults to the derived border)
#     light: "#e4e4e7"
#     dark: "#27272a"
#   hoverColor:          # clickable-row hover (defaults to the derived muted)
#     light: "#f4f4f5"
#     dark: "#27272a"
#   linkColor:           # links inside cells
#     light: "#1d4ed8"
#     dark: "#93c5fd"
#   pivotBackground:     # pivot total/subtotal columns & headers (defaults to a shade of the surface)
#     light: "#eff6ff"
#     dark: "#172554"
`;
}
