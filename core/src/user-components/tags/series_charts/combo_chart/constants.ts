export const CHART_MARGIN_PX = 2;
export const X_AXIS_FONT_SIZE = 12;

/**
 * Line pitch for two-tier month labels ("Jul" over "2019"): font size plus a
 * 4px visual gap so the year reads as a separate tier, not a cramped second
 * line. ECharts aligns single-line sibling labels with the FIRST line of a
 * multi-line label, so this only pushes the year down — the month row stays
 * on one baseline. Charts budget `grid.bottom` from this same constant so the
 * gutter grows in lockstep with the label block.
 */
export const TWO_TIER_LABEL_LINE_HEIGHT = X_AXIS_FONT_SIZE + 4;

/**
 * Extra `grid.bottom` a chart must reserve when the x-axis renders two-tier
 * labels: one additional line at the two-tier pitch, plus 4px so the year
 * line keeps the same breathing room from the container edge that single-line
 * labels get.
 */
export const TWO_TIER_LABEL_EXTRA_GRID_BOTTOM_PX = TWO_TIER_LABEL_LINE_HEIGHT + 4;

/**
 * Extra `grid.bottom` a chart reserves when the author adds a bottom slider
 * `dataZoom` via `echarts_options` but doesn't pin `grid.bottom` themselves.
 * Without this the slider lands in the same gutter as the x-axis labels (worse
 * with two-tier month/year labels) and overlaps them. The value clears the
 * slider's full footprint: its theme height (18px) + bottom offset (10px, both
 * in `echarts-themes.ts`) + a 24px gap between the labels and the slider top.
 * The gap is deliberately generous: with two-tier month/year labels an 8px gap
 * left the year row visually touching the slider, so the two read as one
 * cramped band. 24px separates them into distinct zones.
 * The container grows by the same amount so the plot area keeps its height —
 * the identical contract as TWO_TIER_LABEL_EXTRA_GRID_BOTTOM_PX.
 */
export const DATA_ZOOM_SLIDER_EXTRA_GRID_BOTTOM_PX = 18 + 10 + 24;
