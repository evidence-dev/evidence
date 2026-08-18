/**
 * Pure helpers for reserving footer space when an author adds a bottom slider
 * `dataZoom` through the raw `echarts_options` escape hatch. A horizontal
 * slider sits in the same gutter as the x-axis labels; our computed
 * `grid.bottom` only budgets labels/title, so without extra room the slider
 * overlaps them (worst with two-tier month/year labels). ComboChart reserves
 * the slider's footprint when — and only when — the author hasn't pinned
 * `grid.bottom` themselves (a hand-tuned grid means they own the layout).
 *
 * Both work off `props.echarts_options`, a plain author-provided object, so
 * detection is a pure synchronous derivation — never live chart state.
 */

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
	!!value && typeof value === 'object';

/** Normalize an option that ECharts accepts as an object OR an array of them. */
function toEntries(value: unknown): PlainObject[] {
	if (Array.isArray(value)) return value.filter(isPlainObject);
	if (isPlainObject(value)) return [value];
	return [];
}

/**
 * A horizontal slider pinned to the bottom — the only `dataZoom` shape that
 * shares the footer with the x-axis labels. Excludes:
 *   - `type: 'inside'` (no visual footprint),
 *   - vertical sliders (`orient: 'vertical'`, or a y-only zoom which defaults
 *     to vertical), which live on a side gutter,
 *   - sliders pinned to the top (`top` set).
 * A missing `type` counts as a slider (ECharts' default).
 */
function isBottomHorizontalSlider(dz: PlainObject): boolean {
	if (dz.type != null && dz.type !== 'slider') return false;
	if (dz.orient === 'vertical') return false;
	if (dz.yAxisIndex != null && dz.xAxisIndex == null) return false;
	if (dz.top != null) return false;
	return true;
}

export function hasBottomSliderDataZoom(echartsOptions: PlainObject | undefined): boolean {
	if (!echartsOptions) return false;
	return toEntries(echartsOptions.dataZoom).some(isBottomHorizontalSlider);
}

export function authorPinnedGridBottom(echartsOptions: PlainObject | undefined): boolean {
	if (!echartsOptions) return false;
	return toEntries(echartsOptions.grid).some((grid) => grid.bottom != null);
}
