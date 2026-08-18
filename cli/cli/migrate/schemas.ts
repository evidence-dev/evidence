/**
 * Loads studio component schemas so the migrate transform can drop OSS
 * attributes that have no studio equivalent (instead of emitting attrs that
 * `evidence validate` would reject). Literal dynamic-import paths keep this
 * bundleable; a tag missing here just skips attr filtering for that tag.
 */

interface SchemaModule {
	schema: { attributes: Record<string, unknown> };
}

const SCHEMA_MODULES: Record<string, () => Promise<SchemaModule>> = {
	accordion: () => import('@evidence/core/user-components/tags/accordion/schema'),
	accordion_item: () => import('@evidence/core/user-components/tags/accordion_item/schema'),
	area_chart: () => import('@evidence/core/user-components/tags/series_charts/area_chart/schema'),
	bar_chart: () => import('@evidence/core/user-components/tags/series_charts/bar_chart/schema'),
	big_value: () => import('@evidence/core/user-components/tags/bigvalue/schema'),
	bubble_chart: () =>
		import('@evidence/core/user-components/tags/series_charts/bubble_chart/schema'),
	button_group: () => import('@evidence/core/user-components/tags/button_group/schema'),
	calendar_heatmap: () => import('@evidence/core/user-components/tags/calendar_heatmap/schema'),
	callout: () => import('@evidence/core/user-components/tags/callout/schema'),
	combo_chart: () => import('@evidence/core/user-components/tags/series_charts/combo_chart/schema'),
	delta: () => import('@evidence/core/user-components/tags/delta/schema'),
	details: () => import('@evidence/core/user-components/tags/details/schema'),
	dimension: () => import('@evidence/core/user-components/tags/table/dimension/schema'),
	dimension_grid: () => import('@evidence/core/user-components/tags/dimension_grid/schema'),
	dropdown: () => import('@evidence/core/user-components/tags/dropdown/schema'),
	dropdown_option: () => import('@evidence/core/user-components/tags/dropdown_option/schema'),
	funnel_chart: () => import('@evidence/core/user-components/tags/funnel_chart/schema'),
	heatmap: () => import('@evidence/core/user-components/tags/heatmap/schema'),
	histogram: () => import('@evidence/core/user-components/tags/histogram/schema'),
	horizontal_bar_chart: () =>
		import('@evidence/core/user-components/tags/series_charts/horizontal_bar_chart/schema'),
	iframe: () => import('@evidence/core/user-components/tags/iframe/schema'),
	image: () => import('@evidence/core/user-components/tags/image/schema'),
	info: () => import('@evidence/core/user-components/tags/info/schema'),
	line_break: () => import('@evidence/core/user-components/tags/line_break/schema'),
	line_chart: () => import('@evidence/core/user-components/tags/series_charts/line_chart/schema'),
	link_button: () => import('@evidence/core/user-components/tags/link_button/schema'),
	measure: () => import('@evidence/core/user-components/tags/table/measure/schema'),
	modal: () => import('@evidence/core/user-components/tags/modal/schema'),
	note: () => import('@evidence/core/user-components/tags/note/schema'),
	option: () => import('@evidence/core/user-components/tags/option/schema'),
	page_break: () => import('@evidence/core/user-components/tags/page_break/schema'),
	pie_chart: () => import('@evidence/core/user-components/tags/pie_chart/schema'),
	range_calendar: () => import('@evidence/core/user-components/tags/range_calendar/schema'),
	reference_area: () =>
		import('@evidence/core/user-components/tags/series_charts/combo_chart/references/reference_area/schema'),
	reference_line: () =>
		import('@evidence/core/user-components/tags/series_charts/combo_chart/references/reference_line/schema'),
	reference_point: () =>
		import('@evidence/core/user-components/tags/series_charts/combo_chart/references/reference_point/schema'),
	row: () => import('@evidence/core/user-components/tags/row/schema'),
	sankey_chart: () => import('@evidence/core/user-components/tags/sankey_chart/schema'),
	scatter_chart: () =>
		import('@evidence/core/user-components/tags/series_charts/scatter_chart/schema'),
	slider: () => import('@evidence/core/user-components/tags/slider/schema'),
	sparkline: () => import('@evidence/core/user-components/tags/sparkline/schema'),
	tab: () => import('@evidence/core/user-components/tags/tab/schema'),
	table: () => import('@evidence/core/user-components/tags/table/schema'),
	tabs: () => import('@evidence/core/user-components/tags/tabs/schema'),
	text_input: () => import('@evidence/core/user-components/tags/text_input/schema'),
	toggle: () => import('@evidence/core/user-components/tags/toggle/schema'),
	value: () => import('@evidence/core/user-components/tags/value/schema')
};

export async function loadTagAttrs(): Promise<Map<string, Set<string>>> {
	const entries = await Promise.all(
		Object.entries(SCHEMA_MODULES).map(async ([tag, load]) => {
			try {
				const mod = await load();
				return [tag, new Set(Object.keys(mod.schema.attributes))] as const;
			} catch {
				// A missing/renamed schema shouldn't break migration — that tag
				// just falls back to unfiltered attrs (validate still catches it).
				return null;
			}
		})
	);
	return new Map(entries.filter((e): e is NonNullable<typeof e> => e !== null));
}
