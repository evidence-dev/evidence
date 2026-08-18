import { getContext, setContext } from 'svelte';

// ECharts hardcodes its DOM tooltip at z-index 9999999 and (with
// `appendToBody: true`) renders it as a direct child of <body>, escaping every
// stacking context. The floating chat pane must sit *above* that so page-chart
// tooltips don't bleed over it — but that same bump buries the tooltips of
// charts rendered *inside* the pane. The pane is the only surface in the app
// deliberately placed above the tooltip layer; it opts its own charts back on
// top via this context. Absent the context, charts keep ECharts' default, so
// page/editor tooltips stay below the pane (the behavior we want).
export const ECHARTS_DEFAULT_TOOLTIP_Z_INDEX = 9999999;
export const FLOATING_CHAT_PANE_Z_INDEX = 10000000;
export const FLOATING_CHAT_CHART_TOOLTIP_Z_INDEX = 10000001;

const KEY = Symbol('elevated-chart-tooltip-z');

/**
 * Mark this subtree as an always-on-top surface: charts rendered within it
 * raise their DOM tooltip to `zIndex` so it isn't buried by the surface itself.
 */
export const setElevatedChartTooltips = (zIndex: number) => setContext(KEY, zIndex);

/**
 * Tooltip `extraCssText` for a chart. Returns a `z-index` override when inside
 * an elevated surface, otherwise `''` (ECharts keeps its default 9999999).
 * ECharts appends `extraCssText` last in the tooltip's inline style, so this
 * wins without `!important`.
 */
export function getElevatedChartTooltipCss(): string {
	const zIndex = getContext<number | undefined>(KEY);
	return zIndex == null ? '' : `z-index: ${zIndex};`;
}
