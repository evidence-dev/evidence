import type { EChartsOption } from 'echarts';

type UnknownRecord = Record<string, unknown>;

/**
 * Default grid (chart-area padding). Tighter than ECharts' built-in defaults
 * because:
 * - Title is rendered OUTSIDE the chart area (via the platform's `title`
 *   attribute → ComponentTitle), so the chart shouldn't reserve space at the
 *   top for an internal title.
 * - A legend is typically absent.
 * - The chart should fill its container, not leave space for chrome that
 *   isn't there.
 *
 * Built-in chart components (combo_chart, etc.) compute their own grid per
 * chart with awareness of axis label sizes and similar; custom_echart goes
 * straight to ECharts which would otherwise fall back to its own defaults
 * (assuming title + legend take space). The author's `grid` keys override
 * these defaults via spread, so `grid: { top: 60 }` keeps our left/right/bottom
 * defaults and just bumps top.
 *
 * containLabel: true keeps axis labels from overflowing the box regardless,
 * which means these padding values can stay small without clipping labels.
 */
const DEFAULT_GRID = {
	left: 8,
	right: 16,
	top: 16,
	bottom: 24,
	containLabel: true
} as const;

/**
 * Combines the user's raw echarts config with query results by injecting the
 * rows as the first dataset's `source`, so series reference columns via `encode`.
 *
 * Extra datasets in the user's config are preserved (after the query dataset)
 * so dataset transforms keep working, and any other key on the first dataset
 * (e.g. `dimensions`) wins over our defaults — but `source` always comes from
 * the query, since `data` is what ties the chart to filters and variables.
 */
export function buildCustomEchartOptions(
	config: UnknownRecord,
	rows: unknown[],
	columnNames: string[]
): EChartsOption {
	const { dataset: userDataset, grid: userGrid, ...rest } = config;

	const userDatasets =
		userDataset == null
			? [{}]
			: Array.isArray(userDataset)
				? (userDataset as UnknownRecord[])
				: [userDataset as UnknownRecord];

	const [first = {}, ...others] = userDatasets;

	// Explicit dimensions keep column order stable and tolerate nulls in the
	// first row, which echarts' auto-detection does not.
	const dataset = [{ dimensions: columnNames, ...first, source: rows }, ...others];

	// Merge grid: defaults supply the floor, user-provided keys win on top.
	// If the author supplied an array (multi-grid layout), they're doing
	// advanced layout and we don't second-guess them.
	const grid = Array.isArray(userGrid)
		? userGrid
		: { ...DEFAULT_GRID, ...((userGrid as UnknownRecord | undefined) ?? {}) };

	return { ...rest, grid, dataset } as EChartsOption;
}
