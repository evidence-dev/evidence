/**
 * legacy Evidence → Core page transform.
 *
 * Converts legacy Evidence (Svelte-syntax) markdown pages to Core Markdoc
 * syntax. Deterministic, mechanical rules only — anything that needs judgment
 * (attribute semantics, unsupported components, source queries) is surfaced as
 * a note for the human/AI pass that follows. `evidence validate` is the
 * backstop for anything this misses.
 */

/** Core tag render names — a converted tag outside this set gets a warning. */
export const CORE_TAGS = new Set([
	'accordion',
	'accordion_body_slot',
	'accordion_item',
	'accordion_title',
	'area',
	'area_chart',
	'area_layer',
	'audio',
	'bar',
	'bar_chart',
	'benchmark_comparison',
	'big_value',
	'bubble',
	'bubble_chart',
	'button_group',
	'calendar_heatmap',
	'callout',
	'candlestick',
	'chord_chart',
	'clock',
	'combo_chart',
	'commentary',
	'comparison_selector',
	'conditional',
	'custom_echart',
	'custom_map',
	'date_grain_selector',
	'delta',
	'details',
	'dimension',
	'dimension_grid',
	'download',
	'dropdown',
	'dropdown_option',
	'else',
	'else_if',
	'fill',
	'filter_bar',
	'funnel_chart',
	'heat_grid',
	'heatmap',
	'heatmap_layer',
	'histogram',
	'horizontal_bar_chart',
	'html',
	'icon',
	'if',
	'iframe',
	'image',
	'info',
	'input_tabs',
	'line',
	'line_break',
	'line_chart',
	'link_button',
	'logo',
	'map',
	'measure',
	'modal',
	'note',
	'option',
	'page_break',
	'partial',
	'pie_chart',
	'pivot',
	'point_layer',
	'polar_chart',
	'print_group',
	'progress_bars',
	'radar_chart',
	'range_calendar',
	'reference_area',
	'reference_line',
	'reference_point',
	'repeat',
	'row',
	'sankey_chart',
	'scatter',
	'scatter_chart',
	'slider',
	'slot',
	'sparkline',
	'stack',
	'tab',
	'table',
	'table_filter',
	'tabs',
	'target_comparison',
	'text_input',
	'toggle',
	'treemap',
	'value'
]);

export interface MigrationNote {
	level: 'info' | 'warning';
	message: string;
}

export interface TransformResult {
	content: string;
	changed: boolean;
	notes: MigrationNote[];
}

export interface TransformOptions {
	/** Core tag → allowed attribute names; unknown attrs are dropped with a note. */
	tagAttrs?: Map<string, Set<string>>;
	/** legacy Evidence `source.table` refs → `{{ /queries/... }}` rewrites, applied in SQL. */
	sourceRefs?: Map<string, string>;
	/** Frontmatter-declared query files (name → project path); set per page. */
	queryFiles?: Map<string, string>;
}

export function rewriteSourceRefs(
	sql: string,
	sourceRefs: Map<string, string>,
	notes: MigrationNote[]
): string {
	let out = sql;
	for (const [ref, replacement] of sourceRefs) {
		const pattern = new RegExp(`\\b${ref.replaceAll('.', '\\.')}\\b`, 'g');
		const next = out.replaceAll(pattern, replacement);
		if (next !== out) {
			notes.push({ level: 'info', message: `source table ${ref} → ${replacement}` });
			out = next;
		}
	}
	return out;
}

interface Attr {
	name: string;
	/** Markdoc-ready value string (already quoted/literal), or null for bare flags. */
	value: string | null;
}

interface ComponentRule {
	tag?: string;
	/** legacy Evidence attr name → Core attr name (before generic snake_casing). */
	attrRenames?: Record<string, string>;
	/** Post-rename hook for structural changes (tag swap, attr synthesis). */
	transform?: (attrs: Attr[], notes: MigrationNote[]) => { tag?: string; attrs: Attr[] };
	/** Legacy attrs (camelCase) triaged as having no Core equivalent — dropped
	 * with an "unsupported in Core" warning instead of the generic drop note. */
	unsupported?: readonly string[];
	/** Remove the tag entirely (children stay in place). */
	drop?: true;
	/** Replace the tag with generated markdown instead of a markdoc tag. */
	emit?: (attrs: Attr[], notes: MigrationNote[]) => string;
}

const INPUT_RENAMES = {
	name: 'id',
	value: 'value_column',
	label: 'label_column',
	defaultValue: 'initial_value'
};

/** legacy Evidence per-axis chart props that fold into Core's {x,y,y2}_axis_options objects. */
const AXIS_OPTION_PROPS: Record<string, { axis: 'x' | 'y' | 'y2'; key: string }> = {
	xAxisLabels: { axis: 'x', key: 'labels' },
	yAxisLabels: { axis: 'y', key: 'labels' },
	y2AxisLabels: { axis: 'y2', key: 'labels' },
	xGridlines: { axis: 'x', key: 'gridlines' },
	yGridlines: { axis: 'y', key: 'gridlines' },
	y2Gridlines: { axis: 'y2', key: 'gridlines' },
	xAxisTitle: { axis: 'x', key: 'title' },
	yAxisTitle: { axis: 'y', key: 'title' },
	y2AxisTitle: { axis: 'y2', key: 'title' },
	xMin: { axis: 'x', key: 'min' },
	xMax: { axis: 'x', key: 'max' },
	yMin: { axis: 'y', key: 'min' },
	yMax: { axis: 'y', key: 'max' },
	y2Min: { axis: 'y2', key: 'min' },
	y2Max: { axis: 'y2', key: 'max' },
	xBaseline: { axis: 'x', key: 'baseline' },
	yBaseline: { axis: 'y', key: 'baseline' },
	y2Baseline: { axis: 'y2', key: 'baseline' },
	xTickMarks: { axis: 'x', key: 'ticks' },
	yTickMarks: { axis: 'y', key: 'ticks' },
	y2TickMarks: { axis: 'y2', key: 'ticks' },
	yScale: { axis: 'y', key: 'fit_to_data' },
	y2Scale: { axis: 'y2', key: 'fit_to_data' },
	xLabelWrap: { axis: 'x', key: 'label_wrap' }
};

/** legacy data-label props → keys of Core's data_labels object. */
const DATA_LABEL_PROPS: Record<string, string> = {
	labelSize: 'size',
	labelPosition: 'position',
	labelFmt: 'fmt',
	labelColor: 'color',
	showAllLabels: 'show_overlap'
};

// 'plain' = charts whose Core schema has no axis/data-label option objects
// (histogram, heatmap, calendar_heatmap, funnel, sankey) — axis folds are skipped.
type ChartKind = 'line' | 'area' | 'bar' | 'scatter' | 'bubble' | 'plain' | 'generic';

/** Fold legacy Evidence flat chart props into Core's option-object attrs. */
function chartTransform(
	attrs: Attr[],
	notes?: MigrationNote[],
	chartKind: ChartKind = 'generic'
): { attrs: Attr[] } {
	if (notes && attrs.some((a) => a.name === 'y2' || a.name === 'y2SeriesType')) {
		notes.push({
			level: 'warning',
			message:
				'chart uses a secondary y2 axis — Core models this as {% combo_chart %} with {% bar %}/{% line %} children (axis="y2" on the secondary series); restructure manually'
		});
	}
	const axisEntries: Record<'x' | 'y' | 'y2', string[]> = { x: [], y: [], y2: [] };
	const labelEntries: string[] = [];
	const lineOptEntries: Array<[string, string]> = [];
	const rest: Attr[] = [];
	const seriesColors: Attr[] = [];
	let palette: string | null = null;
	let seriesColorMap: string | null = null;
	let labelsOn = false;
	let markersOn = false;
	let markerShape: string | null = null;
	let markerSize: string | null = null;
	let stepOn = false;
	let stepPosition: string | null = null;
	for (const attr of attrs) {
		const axisProp = AXIS_OPTION_PROPS[attr.name];
		const labelProp = DATA_LABEL_PROPS[attr.name];
		if (axisProp && attr.value !== null && chartKind !== 'plain') {
			axisEntries[axisProp.axis].push(`${axisProp.key}=${bare(attr.value)}`);
		} else if (labelProp && attr.value !== null && chartKind !== 'plain') {
			let value = attr.value;
			if (attr.name === 'labelPosition' && chartKind === 'bar') {
				// legacy bar labels are outside|inside; Core positions them spatially.
				value = unquote(value) === 'inside' ? '"middle"' : '"above"';
			}
			labelEntries.push(`${labelProp}=${bare(value)}`);
		} else if (attr.name === 'yLabelFmt' && attr.value !== null) {
			labelEntries.push(`fmt=${attr.value}`);
		} else if (attr.name === 'colorPalette' && attr.value !== null) {
			palette = attr.value;
		} else if (attr.name === 'seriesColors' && attr.value !== null) {
			seriesColorMap = attr.value;
		} else if ((attr.name === 'fillColor' || attr.name === 'lineColor') && attr.value !== null) {
			seriesColors.push(attr);
		} else if (attr.name === 'sort') {
			// legacy sort=false preserved query order; Core spells that x_sort="data".
			if (attr.value === 'false') rest.push({ name: 'x_sort', value: '"data"' });
		} else if (attr.name === 'labels') {
			labelsOn = attr.value === 'true';
		} else if (attr.name === 'markers') {
			markersOn = attr.value === 'true';
		} else if (attr.name === 'markerShape') {
			markerShape = attr.value;
		} else if (attr.name === 'markerSize') {
			markerSize = attr.value;
		} else if (attr.name === 'step') {
			stepOn = attr.value === 'true';
		} else if (attr.name === 'stepPosition') {
			stepPosition = attr.value;
		} else if (
			chartKind === 'line' &&
			(attr.name === 'lineType' || attr.name === 'lineOpacity' || attr.name === 'lineWidth') &&
			attr.value !== null
		) {
			const key = { lineType: 'type', lineOpacity: 'opacity', lineWidth: 'width' }[attr.name]!;
			lineOptEntries.push([key, bare(attr.value)!]);
		} else if (chartKind === 'bar' && attr.name === 'fillOpacity' && attr.value !== null) {
			rest.push({ name: 'bar_options', value: `{opacity=${bare(attr.value)}}` });
		} else if (attr.name === 'seriesOptions') {
			rest.push({ ...attr, name: 'echarts_series_options' });
		} else if (attr.name === 'tooltipTitle') {
			rest.push({ ...attr, name: 'point_title' });
		} else if (attr.name === 'chartAreaHeight' && attr.value !== null) {
			// legacy sized only the plot area; Core height is the whole component.
			rest.push({ name: 'height', value: bare(attr.value) });
			notes?.push({
				level: 'info',
				message:
					'chartAreaHeight sized the plot area only — converted to height= (whole component); expect a slightly shorter plot'
			});
		} else if (attr.name === 'nullsZero') {
			if (attr.value === 'true') rest.push({ name: 'handle_missing', value: '"zero"' });
		} else if (attr.name === 'type') {
			// legacy Evidence type=grouped|stacked|stacked100 maps onto the `stacked` attr.
			const kind = unquote(attr.value);
			if (kind === 'grouped') rest.push({ name: 'stacked', value: 'false' });
			else if (kind === 'stacked100') rest.push({ name: 'stacked', value: '"100%"' });
			// plain "stacked" is the Core default — drop.
		} else {
			rest.push(attr);
		}
	}
	if (markersOn || markerShape || markerSize) {
		if (chartKind === 'line') {
			const entries: string[] = [];
			if (markerShape) entries.push(`shape=${markerShape}`);
			if (markerSize) entries.push(`size=${bare(markerSize)}`);
			lineOptEntries.push(['markers', entries.length ? `{${entries.join(' ')}}` : 'true']);
		} else {
			notes?.push({
				level: 'warning',
				message: `${chartKind}_chart: unsupported in Core: markers (line charts only)`
			});
		}
	}
	if (stepOn) {
		const step = stepPosition ?? '"end"';
		if (chartKind === 'line') lineOptEntries.push(['step', step]);
		else if (chartKind === 'area') rest.push({ name: 'area_options', value: `{step=${step}}` });
	}
	if (lineOptEntries.length > 0) {
		rest.push({ name: 'line_options', value: buildObjectAttr(lineOptEntries) });
	}
	if (labelsOn || labelEntries.length > 0) {
		if (!labelEntries.some((e) => e.startsWith('position='))) {
			labelEntries.unshift('position="above"');
		}
		rest.push({ name: 'data_labels', value: `{${labelEntries.join(' ')}}` });
	}
	for (const axis of ['x', 'y', 'y2'] as const) {
		if (axisEntries[axis].length > 0) {
			rest.push({ name: `${axis}_axis_options`, value: `{${axisEntries[axis].join(' ')}}` });
		}
	}
	// A single legacy Evidence series color maps onto the palette; two competing colors
	// (area fillColor + lineColor) can't both be expressed — surface for review.
	const chartOptEntries: string[] = [];
	if (palette !== null) {
		chartOptEntries.push(`color_palette=${palette}`);
		if (seriesColors.length > 0) {
			notes?.push({
				level: 'warning',
				message: `colorPalette wins over ${seriesColors.map((a) => a.name).join('/')} — dropped the latter`
			});
		}
	} else if (seriesColors.length === 1) {
		chartOptEntries.push(`color_palette=[${seriesColors[0].value}]`);
	} else if (seriesColors.length > 1) {
		notes?.push({
			level: 'warning',
			message: `chart sets both ${seriesColors
				.map((a) => `${a.name}=${a.value}`)
				.join(' and ')} — Core has one series color; set chart_options={color_palette=[<color>]} with the one to keep`
		});
	}
	if (seriesColorMap !== null) chartOptEntries.push(`series_colors=${seriesColorMap}`);
	if (chartOptEntries.length > 0) {
		rest.push({ name: 'chart_options', value: `{${chartOptEntries.join(' ')}}` });
	}
	return { attrs: rest };
}

/** legacy Evidence charts infer omitted x/y from the query columns; Core requires both. */
function warnMissingAxes(tag: string, attrs: Attr[], notes: MigrationNote[]): void {
	const has = (name: string) => attrs.some((a) => a.name === name);
	if (!has('data') || has('metric')) return;
	const missing = (['x', 'y'] as const).filter((axis) => !has(axis));
	if (missing.length > 0) {
		notes.push({
			level: 'warning',
			message: `${tag}: legacy Evidence inferred ${missing.join(' and ')} from the query columns — Core requires ${missing
				.map((m) => `${m}=`)
				.join(' and ')}; add the column name(s)`
		});
	}
}

/** Swap x↔y (and their axis options) — for swapXY → horizontal_bar_chart. */
function swapAxes(attrs: Attr[]): Attr[] {
	// Runs pre-snake_casing, so both camel (source) and snake (synthesized) forms appear.
	const swaps: Record<string, string> = {
		x: 'y',
		y: 'x',
		xFmt: 'yFmt',
		yFmt: 'xFmt',
		x_axis_options: 'y_axis_options',
		y_axis_options: 'x_axis_options'
	};
	return attrs.map((a) => {
		if (a.name === 'data_labels' && a.value?.includes('position="above"')) {
			return { ...a, value: a.value.replace('position="above"', 'position="right"') };
		}
		return swaps[a.name] ? { ...a, name: swaps[a.name] } : a;
	});
}

/**
 * legacy Evidence charts never "connect" missing points, but Core's handle_missing
 * defaults to "connect" — a migrated chart left without the attribute renders
 * differently (sparse stacked areas become diagonal sawtooth ramps). Emit the
 * value matching legacy Evidence's effective default: multi-series areas zero-fill
 * unconditionally (Area.svelte: getCompletedData + replaceNulls), everything
 * else gaps. legacy Evidence spells the enum "gap"; Core spells it "gaps".
 */
function withOssMissingDefault(kind: 'line' | 'area') {
	return (attrs: Attr[], notes: MigrationNote[]): { tag?: string; attrs: Attr[] } => {
		let out = chartTransform(attrs, notes, kind).attrs;
		out = out.map((a) =>
			a.name === 'handleMissing' && (a.value === '"gap"' || a.value === '"gaps"')
				? { ...a, value: '"gaps"' }
				: a
		);
		const hasExplicit = out.some((a) => a.name === 'handleMissing' || a.name === 'handle_missing');
		if (!hasExplicit) {
			const multiSeries =
				out.some((a) => a.name === 'series') ||
				out.some((a) => a.name === 'y' && a.value?.startsWith('['));
			const value = kind === 'area' && multiSeries ? 'zero' : 'gaps';
			out = [...out, { name: 'handle_missing', value: `"${value}"` }];
		}
		warnMissingAxes(`${kind}_chart`, out, notes);
		return { attrs: out };
	};
}

/** Strip quotes from values Core types as number/boolean (legacy accepted both). */
function bare(value: string | null): string | null {
	if (value === null) return null;
	const inner = unquote(value);
	if (inner !== null && (inner === 'true' || inner === 'false' || /^-?\d+(\.\d+)?$/.test(inner))) {
		return inner;
	}
	return value;
}

/**
 * Build a markdoc object literal from dot-path entries:
 * [['color','"red"'],['border.width','2']] → {color="red" border={width=2}}
 */
function buildObjectAttr(entries: Array<[string, string]>): string {
	const flat: string[] = [];
	const nested = new Map<string, Array<[string, string]>>();
	for (const [key, value] of entries) {
		const dot = key.indexOf('.');
		if (dot === -1) flat.push(`${key}=${value}`);
		else {
			const head = key.slice(0, dot);
			if (!nested.has(head)) nested.set(head, []);
			nested.get(head)!.push([key.slice(dot + 1), value]);
		}
	}
	for (const [head, sub] of nested) flat.push(`${head}=${buildObjectAttr(sub)}`);
	return `{${flat.join(' ')}}`;
}

/**
 * Fold flat legacy attrs into Core object attrs per a {legacyName → 'attr.path'}
 * map (append `#` to coerce quoted numbers/booleans bare). Consumed attrs are
 * removed; one merged object attr is emitted per top-level target.
 */
function foldObjectAttrs(attrs: Attr[], folds: Record<string, string>): Attr[] {
	const collected = new Map<string, Array<[string, string]>>();
	const rest: Attr[] = [];
	for (const attr of attrs) {
		const target = folds[attr.name];
		if (!target || attr.value === null) {
			rest.push(attr);
			continue;
		}
		const coerce = target.endsWith('#');
		const path = coerce ? target.slice(0, -1) : target;
		const dot = path.indexOf('.');
		const head = dot === -1 ? path : path.slice(0, dot);
		const sub = dot === -1 ? '' : path.slice(dot + 1);
		if (!collected.has(head)) collected.set(head, []);
		const value = coerce ? bare(attr.value)! : attr.value;
		if (sub) collected.get(head)!.push([sub, value]);
		else collected.get(head)!.push(['', value]);
	}
	for (const [head, entries] of collected) {
		const named = entries.filter(([k]) => k !== '');
		rest.push({ name: head, value: buildObjectAttr(named) });
	}
	return rest;
}

/** Requote a legacy camelCase enum value as Core's snake_case ("aboveEnd" → "above_end"). */
function snakeEnum(value: string | null): string | null {
	const inner = unquote(value);
	if (inner === null) return value;
	return `"${camelToSnake(inner.replaceAll('centre', 'center').replaceAll('Centre', 'Center'))}"`;
}

/** Column → dimension/measure: contentType picks the tag; flat props fold into option objects. */
function columnTransform(attrs: Attr[], notes: MigrationNote[]): { tag?: string; attrs: Attr[] } {
	const contentType = attrs.find((a) => a.name === 'contentType');
	const kind = unquote(contentType?.value ?? null);
	let out = attrs
		.filter((a) => a !== contentType)
		// legacy Evidence accepted the British spelling; Core validates against it.
		.map((a) => (a.name === 'align' && a.value === '"centre"' ? { ...a, value: '"center"' } : a));

	if (!kind || kind === 'link') {
		if (kind === 'link' && !out.some((a) => a.name === 'link')) {
			// legacy Evidence rendered the column's own value as the link href.
			const value = out.find((a) => a.name === 'value');
			if (value?.value) out = [...out, { name: 'link', value: value.value }];
		}
		return { attrs: out };
	}
	if (kind === 'html') {
		return { attrs: [...out, { name: 'html', value: 'true' }] };
	}
	if (kind === 'image') {
		const value = out.find((a) => a.name === 'value');
		// legacy image columns rendered only the image; Core also prints the
		// cell text unless hide_label is set.
		out = foldObjectAttrs([...out, { name: 'hideLabel', value: 'true' }], {
			height: 'image_options.height#',
			width: 'image_options.width#',
			alt: 'image_options.alt',
			hideLabel: 'image_options.hide_label#'
		});
		if (value?.value) out = [...out, { name: 'image', value: value.value }];
		return { attrs: out };
	}

	// Remaining contentTypes are measure viz modes.
	const vizByKind: Record<string, string> = {
		delta: 'delta',
		bar: 'bar',
		sparkline: 'sparkline',
		sparkbar: 'sparkline',
		sparkarea: 'sparkline',
		colorscale: 'color'
	};
	const viz = vizByKind[kind];
	if (!viz) {
		notes.push({
			level: 'warning',
			message: `Column contentType=${kind} has no Core equivalent — review`
		});
		return { attrs: out };
	}
	out = foldObjectAttrs(out, {
		downIsGood: 'delta_options.down_is_good#',
		deltaSymbol: 'delta_options.show_symbol#',
		barColor: 'bar_options.bar_color',
		negativeBarColor: 'bar_options.bar_color_negative',
		hideLabels: 'bar_options.hide_labels#',
		sparkColor: 'sparkline_options.color',
		sparkX: 'sparkline_options.x',
		sparkYScale: 'sparkline_options.fit_to_data#',
		colorScale: 'color_options.color_scale',
		scaleColor: 'color_options.color_scale',
		scaleColumn: 'color_options.scale_column'
	});
	const neutralMin = out.find((a) => a.name === 'neutralMin');
	const neutralMax = out.find((a) => a.name === 'neutralMax');
	if (neutralMin || neutralMax) {
		out = out.filter((a) => a !== neutralMin && a !== neutralMax);
		const range = `[${bare(neutralMin?.value ?? null) ?? 'null'}, ${bare(neutralMax?.value ?? null) ?? 'null'}]`;
		const deltaOpts = out.find((a) => a.name === 'delta_options');
		if (deltaOpts?.value) {
			out = out.map((a) =>
				a === deltaOpts ? { ...a, value: `${a.value!.slice(0, -1)} neutral_range=${range}}` } : a
			);
		} else {
			out = [...out, { name: 'delta_options', value: `{neutral_range=${range}}` }];
		}
	}
	if (kind === 'sparkbar' || kind === 'sparkarea') {
		const type = kind === 'sparkbar' ? 'bar' : 'area';
		const sparkOpts = out.find((a) => a.name === 'sparkline_options');
		out = sparkOpts?.value
			? out.map((a) =>
					a === sparkOpts ? { ...a, value: `${a.value!.slice(0, -1)} type="${type}"}` } : a
				)
			: [...out, { name: 'sparkline_options', value: `{type="${type}"}` }];
	}
	const sparkY = out.find((a) => a.name === 'sparkY');
	if (sparkY) {
		out = out.filter((a) => a !== sparkY);
		notes.push({
			level: 'info',
			message: `Column sparkY: the Core measure's value IS the sparkline series — set value=${sparkY.value} (aggregated) on the measure`
		});
	}
	if (kind === 'delta') {
		notes.push({
			level: 'info',
			message:
				'Column contentType=delta read a precomputed column in legacy Evidence; Core measures compute deltas — pair viz="delta" with comparison={...} and drop the delta SQL'
		});
	}
	const scaleDomain = out.filter((a) =>
		['colorMin', 'colorMax', 'colorMid', 'colorBreakpoints'].includes(a.name)
	);
	if (scaleDomain.length > 0) {
		out = out.filter((a) => !scaleDomain.includes(a));
		notes.push({
			level: 'warning',
			message:
				'Column color domain (colorMin/colorMid/colorMax/colorBreakpoints) has no direct Core form — pin values with color_options={color_stops=[{value=... color="..."}]}'
		});
	}
	return { tag: 'measure', attrs: [...out, { name: 'viz', value: `"${viz}"` }] };
}

/** Flat legacy label props shared by all reference components → label_options paths. */
const REFERENCE_LABEL_FOLDS: Record<string, string> = {
	labelColor: 'label_options.color',
	labelPadding: 'label_options.padding#',
	labelBackgroundColor: 'label_options.background_color',
	labelBorderWidth: 'label_options.border.width#',
	labelBorderRadius: 'label_options.border.radius#',
	labelBorderColor: 'label_options.border.color',
	labelBorderType: 'label_options.border.type',
	fontSize: 'label_options.text.size#',
	align: 'label_options.align',
	bold: 'label_options.text.bold#',
	italic: 'label_options.text.italic#'
};

const REFERENCE_UNSUPPORTED = ['preserveWhitespace', 'emptySet', 'emptyMessage'] as const;

function referenceTransform(kind: 'line' | 'area' | 'point' | 'callout') {
	return (attrs: Attr[], notes: MigrationNote[]): { attrs: Attr[] } => {
		let out = [...attrs];
		const take = (name: string): Attr | undefined => {
			const found = out.find((a) => a.name === name);
			if (found) out = out.filter((a) => a !== found);
			return found;
		};

		const position = take('labelPosition');
		if (position?.value) {
			if (kind === 'point' || kind === 'callout') {
				// Core points accept only the four cardinals; legacy took any ECharts position.
				const inner = unquote(position.value);
				if (inner && ['top', 'right', 'bottom', 'left'].includes(inner)) {
					out.push({ name: 'labelPosition', value: position.value });
				} else {
					notes.push({
						level: 'info',
						message: `labelPosition=${position.value} has no Core equivalent (top/right/bottom/left only) — dropped, defaults to top`
					});
				}
			} else {
				out.push({ name: 'labelPosition', value: snakeEnum(position.value) });
			}
		}

		const folds: Record<string, string> = {
			...REFERENCE_LABEL_FOLDS,
			labelPosition: 'label_options.position'
		};

		if (kind === 'line') {
			// symbol/symbolSize are legacy aliases for the end symbol.
			const symbol = take('symbol');
			if (symbol && !out.some((a) => a.name === 'symbolEnd')) {
				out.push({ ...symbol, name: 'symbolEnd' });
			}
			const symbolSize = take('symbolSize');
			if (symbolSize && !out.some((a) => a.name === 'symbolEndSize')) {
				out.push({ ...symbolSize, name: 'symbolEndSize' });
			}
			// legacy lines default to dashed; Core renders solid when unset.
			if (!out.some((a) => a.name === 'lineType')) {
				out.push({ name: 'lineType', value: '"dashed"' });
			}
			Object.assign(folds, {
				hideValue: 'label_options.hide_value#',
				lineColor: 'line_options.color',
				lineWidth: 'line_options.width#',
				lineType: 'line_options.type',
				symbolStart: 'symbols.start.shape',
				symbolStartSize: 'symbols.start.size#',
				symbolEnd: 'symbols.end.shape',
				symbolEndSize: 'symbols.end.size#'
			});
		} else if (kind === 'area') {
			const border = take('border');
			if (border?.value === 'true' && !out.some((a) => a.name === 'borderWidth')) {
				out.push({ name: 'borderWidth', value: '1' });
			}
			// legacy area borders default to dashed; Core's default is solid.
			if (
				(border?.value === 'true' || out.some((a) => a.name === 'borderWidth')) &&
				!out.some((a) => a.name === 'borderType')
			) {
				out.push({ name: 'borderType', value: '"dashed"' });
			}
			Object.assign(folds, {
				opacity: 'area_options.opacity#',
				borderWidth: 'area_options.border.width#',
				borderType: 'area_options.border.type',
				borderColor: 'area_options.border.color'
			});
		} else {
			const width = take('labelWidth');
			if (width?.value) {
				if (unquote(width.value) === 'fit') {
					notes.push({
						level: 'info',
						message: 'labelWidth="fit" dropped — Core auto-sizes reference point labels'
					});
				} else {
					out.push({ name: 'labelWidth', value: width.value });
				}
			} else if (kind === 'callout') {
				// legacy Callout wrapped its text at 80px; Core's callout variant doesn't.
				out.push({ name: 'labelWidth', value: '80' });
			}
			if (kind === 'callout' && !out.some((a) => a.name === 'labelVariant')) {
				out.push({ name: 'labelVariant', value: '"callout"' });
			}
			Object.assign(folds, {
				labelWidth: 'label_options.width#',
				labelVariant: 'label_options.variant',
				symbol: 'symbol_options.shape',
				symbolSize: 'symbol_options.size#',
				symbolColor: 'symbol_options.color'
			});
		}

		return { attrs: foldObjectAttrs(out, folds) };
	};
}

/**
 * Legacy map components are one flat tag; Core splits them into {% map %}
 * (viewport/chrome) + a layer child (data/geo/styling). Map-level props are a
 * fixed set; everything else — including legacy restProps that flowed to the
 * inner layer — goes on the layer, with per-component renames.
 */
function mapEmit(layerTag: string, layerRenames: Record<string, string>) {
	return (attrs: Attr[], notes: MigrationNote[]): string => {
		const mapAttrs: Attr[] = [];
		const layerAttrs: Attr[] = [];
		const unsupported: string[] = [];
		let lat: string | null = null;
		let lng: string | null = null;
		for (const a of attrs) {
			switch (a.name) {
				case 'startingLat':
					lat = bare(a.value);
					break;
				case 'startingLong':
					lng = bare(a.value);
					break;
				case 'startingZoom':
					mapAttrs.push({ name: 'zoom', value: bare(a.value) });
					break;
				case 'height':
				case 'title':
				case 'subtitle':
				case 'legend':
					mapAttrs.push({ ...a, value: a.name === 'height' ? bare(a.value) : a.value });
					break;
				case 'legendPosition':
					mapAttrs.push({ ...a, name: 'legend_location' });
					break;
				case 'basemap':
				case 'legendType':
				case 'ignoreZoom':
				case 'attribution':
				case 'emptySet':
				case 'emptyMessage':
					unsupported.push(camelToSnake(a.name));
					break;
				default:
					layerAttrs.push(layerRenames[a.name] ? { ...a, name: layerRenames[a.name] } : a);
			}
		}
		if (lat !== null && lng !== null) {
			mapAttrs.push({ name: 'initial_position', value: `[${lat}, ${lng}]` });
		} else if (lat !== null || lng !== null) {
			notes.push({
				level: 'warning',
				message:
					'map: startingLat/startingLong must be set together for initial_position=[lat, lng] — dropped the lone one'
			});
		}
		if (unsupported.length > 0) {
			notes.push({
				level: 'warning',
				message: `map: unsupported in Core: ${unsupported.join(', ')}`
			});
		}
		const layerSnake = layerAttrs.map((a) => ({ ...a, name: camelToSnake(a.name) }));
		const layerText = renderTag(layerTag, layerSnake, true).replaceAll('\n', '\n    ');
		return `${renderTag('map', mapAttrs, false)}\n    ${layerText}\n{% /map %}`;
	};
}

/** Legacy chart props with no Core equivalent on any series chart. */
const CHART_UNSUPPORTED = [
	'xType',
	'yLog',
	'yLogBase',
	'y2SeriesType',
	'y2LabelFmt',
	'seriesLabelFmt',
	'leftPadding',
	'rightPadding',
	'renderer',
	'downloadableData',
	'downloadableImage',
	'printEchartsConfig',
	'yAxisColor',
	'y2AxisColor',
	'emptySet',
	'emptyMessage'
] as const;

const COMPONENT_RULES: Record<string, ComponentRule> = {
	DataTable: {
		tag: 'table',
		attrRenames: {
			rows: 'page_size',
			totalRow: 'show_total_row',
			showLinkCol: 'show_link_column',
			formatColumnTitles: 'format_titles'
		},
		unsupported: [
			'rowNumbers',
			'accordionRowColor',
			'groupNamePosition',
			'subtotalRowColor',
			'subtotalFontColor',
			'totalRowColor',
			'totalFontColor',
			'headerColor',
			'headerFontColor',
			'backgroundColor',
			'compact',
			'sortable',
			'downloadable',
			'generateMarkdown',
			'isFullPage',
			'emptySet',
			'emptyMessage'
		],
		transform: (attrs, notes) => {
			let out = attrs;
			// legacy Evidence rows=all disables pagination; Core page_size is numeric-only.
			const pageSize = out.find((a) => a.name === 'page_size');
			if (pageSize && !/^\d+$/.test(unquote(pageSize.value) ?? '')) {
				notes.push({
					level: 'warning',
					message: `DataTable rows=${unquote(pageSize.value) ?? '?'} has no Core equivalent (page_size is numeric) — dropped, default pagination applies`
				});
				out = out.filter((a) => a !== pageSize);
			}
			const sort = out.find((a) => a.name === 'sort');
			if (sort) {
				out = out.filter((a) => a !== sort);
				notes.push({
					level: 'warning',
					message: `DataTable sort=${sort.value} is per-column in Core — set sort="asc"/"desc" on the matching {% dimension %}/{% measure %} child`
				});
			}
			const groupType = out.find((a) => a.name === 'groupType');
			const collapsible = groupType && unquote(groupType.value) === 'accordion';
			if (groupType) {
				out = out.filter((a) => a !== groupType);
				// accordion → collapsible groups; section = Core's default merged rendering.
				if (collapsible) out = [...out, { name: 'collapsible', value: 'true' }];
			}
			const groupsOpen = out.find((a) => a.name === 'groupsOpen');
			if (groupsOpen) out = out.filter((a) => a !== groupsOpen);
			if (collapsible && groupsOpen?.value !== 'false') {
				// legacy groups started open by default; Core collapsible defaults collapsed.
				out = [...out, { name: 'collapsed', value: 'false' }];
			}
			const groupBy = out.find((a) => a.name === 'groupBy');
			if (groupBy) {
				out = out.filter((a) => a !== groupBy);
				notes.push({
					level: 'warning',
					message: `DataTable groupBy=${groupBy.value}: Core groups by dimension order — make this column the first {% dimension %} child`
				});
				// legacy subtotals default off, Core default on — preserve the legacy look.
				// Collapsible groups NEED subtotals (they are the clickable headers).
				if (!collapsible && !out.some((a) => a.name === 'subtotals')) {
					out = [...out, { name: 'subtotals', value: 'false' }];
					notes.push({
						level: 'info',
						message:
							'Core shows subtotals on grouped tables by default — emitted subtotals=false to match legacy; remove to enable them'
					});
				}
			}
			return { attrs: out };
		}
	},
	Column: {
		tag: 'dimension',
		attrRenames: {
			id: 'value',
			linkLabel: 'link_label',
			description: 'info',
			colGroup: 'column_group',
			openInNewTab: 'link_new_tab'
		},
		unsupported: [
			'wrapTitle',
			'totalAgg',
			'totalFmt',
			'subtotalFmt',
			'weightCol',
			'chip',
			'showValue',
			'sparkWidth',
			'sparkHeight',
			'backgroundColor'
		],
		transform: columnTransform
	},
	BigValue: {
		tag: 'big_value',
		attrRenames: { description: 'info' },
		unsupported: ['downIsGood', 'neutralMin', 'neutralMax'],
		transform: (attrs, notes) => {
			// legacy Evidence points comparison at a precomputed column; Core computes the
			// comparison itself via the `comparison={...}` object.
			if (attrs.some((a) => a.name.startsWith('comparison'))) {
				notes.push({
					level: 'warning',
					message:
						'BigValue comparison columns are precomputed in legacy Evidence; Core computes them — replace with comparison={compare_vs="prior period"} (plus a date_range) and delete the comparison SQL'
				});
			}
			let out = attrs.filter((a) => !a.name.startsWith('comparison'));
			// legacy Evidence flat sparkline* props → Core's sparkline={...} object.
			const sparkKeys: Record<string, string> = {
				sparkline: 'x',
				sparklineType: 'type',
				sparklineColor: 'color',
				sparklineValueFmt: 'y_fmt',
				sparklineDateFmt: 'x_fmt',
				sparklineYScale: 'fit_to_data',
				connectGroup: 'connect_group'
			};
			const sparkAttrs = out.filter((a) => sparkKeys[a.name] && a.value !== null);
			if (sparkAttrs.some((a) => a.name === 'sparkline' || a.name === 'sparklineType')) {
				out = out.filter((a) => !sparkAttrs.includes(a));
				const entries = sparkAttrs.map((a) => `${sparkKeys[a.name]}=${a.value}`);
				out.push({ name: 'sparkline', value: `{${entries.join(' ')}}` });
			}
			return { attrs: out };
		}
	},
	BigLink: { tag: 'link_button', attrRenames: { href: 'url' } },
	LineChart: {
		tag: 'line_chart',
		transform: withOssMissingDefault('line'),
		unsupported: CHART_UNSUPPORTED
	},
	AreaChart: {
		tag: 'area_chart',
		transform: withOssMissingDefault('area'),
		unsupported: [...CHART_UNSUPPORTED, 'fillOpacity', 'line']
	},
	Histogram: {
		tag: 'histogram',
		attrRenames: { x: 'value', xFmt: 'fmt' },
		transform: (attrs, notes) => chartTransform(attrs, notes, 'plain'),
		unsupported: [
			...CHART_UNSUPPORTED,
			'fillOpacity',
			// histogram has no axis/data-label option objects at all in Core.
			...Object.keys(AXIS_OPTION_PROPS),
			...Object.keys(DATA_LABEL_PROPS)
		]
	},
	AreaMap: {
		emit: mapEmit('area_layer', {
			geoJsonUrl: 'geojson_url',
			geoId: 'geojson_id',
			areaCol: 'area_id'
		})
	},
	PointMap: { emit: mapEmit('point_layer', { long: 'lng' }) },
	BubbleMap: { emit: mapEmit('point_layer', { long: 'lng', size: 'size_value' }) },
	Hist: {
		tag: 'histogram',
		attrRenames: { x: 'value', xFmt: 'fmt' },
		transform: (attrs, notes) => chartTransform(attrs, notes, 'plain')
	},
	DownloadData: { tag: 'download' },
	Heatmap: {
		tag: 'heatmap',
		// colorScale is the gradient palette; chartTransform folds colorPalette.
		attrRenames: { colorScale: 'colorPalette' },
		unsupported: [
			'valueLabels',
			'mobileValueLabels',
			'xAxisPosition',
			'xTickMarks',
			'yTickMarks',
			'filter',
			'min',
			'max',
			'xLabelRotation',
			'cellHeight',
			'zeroDisplay',
			'leftPadding',
			'rightPadding',
			'renderer',
			'downloadableData',
			'downloadableImage',
			'printEchartsConfig',
			'emptySet',
			'emptyMessage'
		],
		transform: (attrs, notes) => {
			// legacy splits sort into enable (xSort) + direction (xSortOrder);
			// Core's x_sort/y_sort is just the direction.
			let out = [...attrs];
			for (const axis of ['x', 'y'] as const) {
				const enable = out.find((a) => a.name === `${axis}Sort`);
				const order = out.find((a) => a.name === `${axis}SortOrder`);
				out = out.filter((a) => a !== enable && a !== order);
				if (enable?.value !== 'false') {
					const direction = order?.value ?? (enable ? '"asc"' : null);
					if (direction) out.push({ name: `${axis}_sort`, value: direction });
				}
			}
			return chartTransform(out, notes, 'plain');
		}
	},
	CalendarHeatmap: {
		tag: 'calendar_heatmap',
		attrRenames: { colorScale: 'colorPalette' },
		unsupported: [
			'yearLabel',
			'monthLabel',
			'dayLabel',
			'height',
			'filter',
			'min',
			'max',
			'renderer',
			'downloadableData',
			'downloadableImage',
			'printEchartsConfig',
			'emptySet',
			'emptyMessage'
		],
		transform: (attrs, notes) => chartTransform(attrs, notes, 'plain')
	},
	BubbleChart: {
		tag: 'bubble_chart',
		transform: (attrs, notes) => chartTransform(attrs, notes, 'bubble'),
		unsupported: [...CHART_UNSUPPORTED, 'outlineColor', 'outlineWidth', 'pointSize', 'shape', 'scaleTo']
	},
	FunnelChart: {
		tag: 'funnel_chart',
		attrRenames: { nameCol: 'category', valueCol: 'value', funnelAlign: 'align' },
		unsupported: [
			'outlineColor',
			'outlineWidth',
			'funnelSort',
			'dataLabels',
			'renderer',
			'printEchartsConfig',
			'emptySet',
			'emptyMessage'
		],
		transform: (attrs, notes) => chartTransform(attrs, notes, 'plain')
	},
	SankeyDiagram: {
		tag: 'sankey_chart',
		attrRenames: {
			sourceCol: 'source',
			targetCol: 'target',
			valueCol: 'value',
			percentCol: 'percent'
		},
		unsupported: [
			'percentFmt',
			'depthOverride',
			'renderer',
			'printEchartsConfig',
			'emptySet',
			'emptyMessage'
		],
		transform: (attrs, notes) => chartTransform(attrs, notes, 'plain')
	},
	ScatterPlot: {
		tag: 'scatter_chart',
		transform: (attrs, notes) => chartTransform(attrs, notes, 'scatter'),
		unsupported: [...CHART_UNSUPPORTED, 'outlineColor', 'outlineWidth', 'pointSize', 'shape']
	},
	ScatterChart: {
		tag: 'scatter_chart',
		transform: (attrs, notes) => chartTransform(attrs, notes, 'scatter'),
		unsupported: [...CHART_UNSUPPORTED, 'outlineColor', 'outlineWidth', 'pointSize', 'shape']
	},
	BarChart: {
		tag: 'bar_chart',
		unsupported: [
			...CHART_UNSUPPORTED,
			'outlineColor',
			'outlineWidth',
			'showAllXAxisLabels',
			'stackTotalLabel',
			'seriesLabels'
		],
		transform: (attrs, notes) => {
			const folded = chartTransform(attrs, notes, 'bar').attrs;
			// swapXY has no Core attr — the horizontal orientation is its own
			// tag, whose x is the value axis, so x/y (and axis options) swap too.
			const swap = folded.find((a) => a.name === 'swapXY');
			if (swap && swap.value !== 'false') {
				let attrs = swapAxes(folded.filter((a) => a !== swap));
				// horizontal_bar_chart's stacked is Boolean-only — no 100% mode.
				const pctStacked = attrs.find((a) => a.name === 'stacked' && a.value === '"100%"');
				if (pctStacked) {
					attrs = attrs.map((a) => (a === pctStacked ? { ...a, value: 'true' } : a));
					notes.push({
						level: 'warning',
						message:
							'horizontal 100% stacked bars are not supported in Core — converted to a regular stacked horizontal_bar_chart'
					});
				}
				warnMissingAxes('horizontal_bar_chart', attrs, notes);
				return { tag: 'horizontal_bar_chart', attrs };
			}
			warnMissingAxes('bar_chart', folded, notes);
			return { attrs: folded };
		}
	},
	Value: {
		tag: 'value',
		attrRenames: { column: 'value', description: 'info' },
		unsupported: ['row', 'placeholder'],
		transform: (attrs, notes) => {
			// legacy agg=sum + column=x → Core's SQL-expression form value="sum(x)".
			const agg = attrs.find((a) => a.name === 'agg');
			const value = attrs.find((a) => a.name === 'value');
			let out = attrs;
			if (agg?.value && value?.value) {
				const fn = unquote(agg.value);
				const col = unquote(value.value);
				out = out
					.filter((a) => a !== agg)
					.map((a) => (a === value ? { ...a, value: `"${fn}(${col})"` } : a));
				notes.push({
					level: 'info',
					message: `Value agg=${agg.value} folded into the SQL expression value="${fn}(${col})"`
				});
			}
			// legacy Evidence defaulted to the query's first column; Core requires value=.
			if (out.some((a) => a.name === 'data') && !out.some((a) => a.name === 'value')) {
				notes.push({
					level: 'warning',
					message:
						'value: legacy Evidence showed the first query column when column= was omitted — Core requires it; add value=<column>'
				});
			}
			return { attrs: out };
		}
	},
	Delta: {
		tag: 'delta',
		attrRenames: { column: 'value' },
		unsupported: ['row', 'downIsGood', 'formatObject', 'columnUnitSummary', 'align', 'fontClass'],
		transform: (attrs, notes) => {
			let out = attrs;
			const neutralMin = out.find((a) => a.name === 'neutralMin');
			const neutralMax = out.find((a) => a.name === 'neutralMax');
			if (neutralMin || neutralMax) {
				out = out.filter((a) => a !== neutralMin && a !== neutralMax);
				out = [
					...out,
					{
						name: 'neutral_range',
						value: `[${bare(neutralMin?.value ?? null) ?? 'null'}, ${bare(neutralMax?.value ?? null) ?? 'null'}]`
					}
				];
			}
			if (attrs.some((a) => a.name === 'downIsGood')) {
				notes.push({
					level: 'info',
					message: 'Delta downIsGood lives inside comparison={down_is_good=true} in Core'
				});
			}
			return { attrs: out };
		}
	},
	Sparkline: {
		tag: 'sparkline',
		unsupported: ['config', 'height'],
		attrRenames: {
			dateCol: 'x',
			valueCol: 'y',
			valueFmt: 'y_fmt',
			dateFmt: 'x_fmt',
			yScale: 'fit_to_data'
		}
	},
	Dropdown: {
		tag: 'dropdown',
		attrRenames: { ...INPUT_RENAMES, description: 'info' },
		unsupported: ['hideDuringPrint', 'disableSelectAll', 'selectAllByDefault'],
		transform: (attrs, notes) => {
			const noDefault = attrs.find((a) => a.name === 'noDefault');
			if (!noDefault) return { attrs };
			notes.push({
				level: 'info',
				message: 'Dropdown noDefault converted to select_first=false — verify nothing is preselected'
			});
			return {
				attrs: attrs.map((a) =>
					a === noDefault
						? { name: 'select_first', value: a.value === 'true' ? 'false' : 'true' }
						: a
				)
			};
		}
	},
	DropdownOption: { tag: 'dropdown_option', attrRenames: { valueLabel: 'label' } },
	ButtonGroup: {
		tag: 'button_group',
		attrRenames: { ...INPUT_RENAMES, description: 'info' },
		unsupported: ['hideDuringPrint', 'preset', 'display', 'color']
	},
	ButtonGroupItem: {
		tag: 'option',
		attrRenames: { valueLabel: 'label' },
		unsupported: ['color'],
		transform: (attrs, notes) => {
			const def = attrs.find((a) => a.name === 'defaultValue');
			if (!def) return { attrs };
			notes.push({
				level: 'warning',
				message:
					'ButtonGroupItem defaultValue: Core sets the default on the parent — add initial_value=<value> to the {% button_group %}'
			});
			return { attrs: attrs.filter((a) => a !== def) };
		}
	},
	Slider: {
		tag: 'slider',
		attrRenames: { name: 'id', defaultValue: 'initial_value', description: 'info' },
		unsupported: [
			'hideDuringPrint',
			'showMaxMin',
			'size',
			'debounceDelay',
			'minColumn',
			'maxColumn'
		],
		transform: (attrs) => {
			// legacy Evidence `range=<column>` names the column driving min/max; Core's
			// `range` is a boolean and the column goes in value_column.
			const range = attrs.find((a) => a.name === 'range');
			const rangeValue = unquote(range?.value ?? null);
			if (range && rangeValue && rangeValue !== 'true' && rangeValue !== 'false') {
				return {
					attrs: attrs.map((a) => (a === range ? { ...a, name: 'value_column' } : a))
				};
			}
			return { attrs };
		}
	},
	TextInput: {
		tag: 'text_input',
		attrRenames: { name: 'id', defaultValue: 'initial_value', description: 'info' },
		unsupported: ['hideDuringPrint', 'unsafe']
	},
	Checkbox: {
		tag: 'toggle',
		attrRenames: { name: 'id', title: 'label', defaultValue: 'initial_value', description: 'info' },
		unsupported: ['hideDuringPrint'],
		transform: (attrs) => {
			// checked is a legacy alias of defaultValue; the rename above wins when both set.
			const checked = attrs.find((a) => a.name === 'checked');
			if (!checked) return { attrs };
			return {
				attrs: attrs.some((a) => a.name === 'initial_value')
					? attrs.filter((a) => a !== checked)
					: attrs.map((a) => (a === checked ? { ...a, name: 'initial_value' } : a))
			};
		}
	},
	Tabs: { tag: 'tabs', unsupported: ['id', 'printShowAll', 'background'] },
	Tab: {
		tag: 'tab',
		attrRenames: { label: 'title', selected: 'default' },
		unsupported: ['id', 'description']
	},
	Accordion: { tag: 'accordion' },
	AccordionItem: { tag: 'accordion_item', unsupported: ['compact', 'description'] },
	Details: { tag: 'details', unsupported: ['printShowAll'] },
	Modal: { tag: 'modal', unsupported: ['open', 'innerText'] },
	Alert: {
		tag: 'callout',
		transform: (attrs) => {
			// legacy Evidence statuses: default|info|danger|success|warning (plus legacy
			// positive/negative/none); Core types: info|success|warning|error.
			const statusToType: Record<string, string> = {
				info: 'info',
				success: 'success',
				positive: 'success',
				warning: 'warning',
				danger: 'error',
				negative: 'error',
				error: 'error'
			};
			const out: Attr[] = [];
			for (const a of attrs) {
				if (a.name !== 'status') {
					out.push(a);
					continue;
				}
				const mapped = statusToType[unquote(a.value) ?? ''];
				// default/none/unknown → omit; Core falls back to its info default.
				if (mapped) out.push({ name: 'type', value: `"${mapped}"` });
			}
			return { attrs: out };
		}
	},
	// Handled structurally by convertDocTabs (→ {% tabs %}); drop is the
	// fallback for any stray unpaired tag it couldn't restructure.
	DocTab: { drop: true },
	PropListing: {
		emit: (attrs) => {
			const get = (n: string) => {
				const raw = unquote(attrs.find((a) => a.name === n)?.value ?? null);
				return raw === null ? null : convertInlineHtml(raw, ' ');
			};
			const required = attrs.find((a) => a.name === 'required')?.value === 'true';
			const parts = [`- **${get('name') ?? ''}**${required ? ' (required)' : ''}`];
			const description = get('description');
			const options = get('options');
			const defaultValue = get('defaultValue');
			if (description) parts.push(`— ${description}`);
			if (options) parts.push(`Options: ${options}.`);
			if (defaultValue) parts.push(`Default: ${defaultValue}.`);
			return parts.join(' ');
		}
	},
	// legacy Evidence Callout is a chart annotation (x/y + body text), not an alert box.
	Callout: {
		tag: 'reference_point',
		unsupported: [
			...REFERENCE_UNSUPPORTED,
			'symbolOpacity',
			'symbolBorderWidth',
			'symbolBorderColor'
		],
		transform: (attrs, notes) => {
			notes.push({
				level: 'warning',
				message:
					'Callout is a chart annotation — converted to {% reference_point %}; move the body text into the label attribute and make the tag self-closing'
			});
			return referenceTransform('callout')(attrs, notes);
		}
	},
	Info: { tag: 'info', attrRenames: { description: 'text' }, unsupported: ['size'] },
	Note: { tag: 'note' },
	LinkButton: { tag: 'link_button', attrRenames: { href: 'url' } },
	LineBreak: { tag: 'line_break' },
	PageBreak: { tag: 'page_break' },
	Grid: { tag: 'row', unsupported: ['cols', 'gapSize'] },
	// legacy Group is a bare div wrapper — grouping stacked children into one
	// layout cell; Core's vertical-stack tag plays the same role.
	Group: { tag: 'stack' },
	Image: { tag: 'image', unsupported: ['height'] },
	Embed: {
		tag: 'iframe',
		attrRenames: { url: 'src' },
		unsupported: ['align', 'border'],
		transform: (attrs) => {
			// iframe passes raw element attributes through attrs={...}.
			const title = attrs.find((a) => a.name === 'title');
			if (!title?.value) return { attrs };
			return {
				attrs: attrs.map((a) => (a === title ? { name: 'attrs', value: `{title=${a.value}}` } : a))
			};
		}
	},
	// legacy Evidence ECharts takes a nested JS config object attr the parser can't
	// mechanically translate; Core's custom_echart puts config in the body.
	ECharts: {
		tag: 'custom_echart',
		transform: (attrs, notes) => {
			notes.push({
				level: 'warning',
				message:
					'ECharts config objects cannot be converted mechanically — move the config into the {% custom_echart %} body (see the custom_echart docs)'
			});
			return { attrs };
		}
	},
	DimensionGrid: { tag: 'dimension_grid', attrRenames: { name: 'id' } },
	DateRange: {
		tag: 'range_calendar',
		attrRenames: { name: 'id', dates: 'value_column', defaultValue: 'default_range' }
	},
	ReferenceLine: {
		tag: 'reference_line',
		unsupported: REFERENCE_UNSUPPORTED,
		transform: (attrs, notes) => {
			// legacy Evidence sloped lines use x/y + x2/y2; Core wants x1/y1 + x2/y2.
			const sloped = attrs.some((a) => a.name === 'x2' || a.name === 'y2');
			const renamed = sloped
				? attrs.map((a) =>
						a.name === 'x' ? { ...a, name: 'x1' } : a.name === 'y' ? { ...a, name: 'y1' } : a
					)
				: attrs;
			return referenceTransform('line')(renamed, notes);
		}
	},
	ReferenceArea: {
		tag: 'reference_area',
		unsupported: REFERENCE_UNSUPPORTED,
		transform: (attrs, notes) => {
			// areaColor is the legacy fill color; color wins when both are set.
			let renamed = attrs;
			if (attrs.some((a) => a.name === 'color')) {
				const areaColor = attrs.find((a) => a.name === 'areaColor');
				if (areaColor) {
					renamed = attrs.filter((a) => a !== areaColor);
					notes.push({
						level: 'info',
						message: 'ReferenceArea sets both color and areaColor — kept color, dropped areaColor'
					});
				}
			} else {
				renamed = attrs.map((a) => (a.name === 'areaColor' ? { ...a, name: 'color' } : a));
			}
			return referenceTransform('area')(renamed, notes);
		}
	},
	ReferencePoint: {
		tag: 'reference_point',
		unsupported: [
			...REFERENCE_UNSUPPORTED,
			'symbolOpacity',
			'symbolBorderWidth',
			'symbolBorderColor'
		],
		transform: referenceTransform('point')
	}
};

const HTML_ENTITIES: Record<string, string> = {
	'&rarr;': '→',
	'&larr;': '←',
	'&uarr;': '↑',
	'&darr;': '↓',
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&nbsp;': ' ',
	'&mdash;': '—',
	'&ndash;': '–'
};

function decodeEntities(text: string): string {
	return text.replace(/&[a-z]+;/g, (m) => HTML_ENTITIES[m] ?? m);
}

function unquote(value: string | null): string | null {
	if (value === null) return null;
	if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
	return value;
}

function pascalToSnake(name: string): string {
	return name
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
		.toLowerCase();
}

function camelToSnake(name: string): string {
	return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/** Index of the closing quote of the string starting at `start`, or -1. */
function scanString(text: string, start: number): number {
	const quote = text[start];
	for (let i = start + 1; i < text.length; i++) {
		if (text[i] === '\\') i++;
		else if (text[i] === quote) return i;
	}
	return -1;
}

/**
 * Index just past a balanced `{...}` starting at `start`, skipping quoted and
 * template strings (so a `}` inside `'...'` or `` `...${}` `` doesn't close
 * it). Returns -1 when unbalanced.
 */
function scanBraceExpression(text: string, start: number): number {
	let depth = 0;
	for (let i = start; i < text.length; i++) {
		const ch = text[i];
		if (ch === '"' || ch === "'" || ch === '`') {
			const end = scanString(text, i);
			if (end === -1) return -1;
			i = end;
		} else if (ch === '{') depth++;
		else if (ch === '}') {
			depth--;
			if (depth === 0) return i + 1;
		}
	}
	return -1;
}

/** Parse a legacy Evidence attribute string into markdoc-ready attrs. Props
 * whose expression values can't be converted come back as `todos` (verbatim
 * source) instead of attrs — honest omission beats plausible-looking junk. */
function parseAttrs(raw: string): { attrs: Attr[]; todos: string[] } {
	const attrs: Attr[] = [];
	const todos: string[] = [];
	const nameRe = /[A-Za-z_][\w-]*/y;
	let i = 0;
	while (i < raw.length) {
		if (/[\s/>]/.test(raw[i])) {
			i++;
			continue;
		}
		nameRe.lastIndex = i;
		const nameMatch = nameRe.exec(raw);
		if (!nameMatch) {
			i++;
			continue;
		}
		const name = nameMatch[0];
		i = nameRe.lastIndex;
		const eq = /^\s*=\s*/.exec(raw.slice(i));
		if (!eq) {
			// Bare flag: <BarChart labels /> means true.
			attrs.push({ name, value: 'true' });
			continue;
		}
		i += eq[0].length;
		let rawValue: string;
		const ch = raw[i];
		if (ch === '"' || ch === "'") {
			const end = scanString(raw, i);
			rawValue = raw.slice(i, end === -1 ? raw.length : end + 1);
			i = end === -1 ? raw.length : end + 1;
		} else if (ch === '{') {
			const end = scanBraceExpression(raw, i);
			if (end === -1) {
				todos.push(`${name}=${raw.slice(i)}`);
				break;
			}
			rawValue = raw.slice(i, end);
			i = end;
		} else {
			const end = raw.slice(i).search(/[\s/>]/);
			rawValue = end === -1 ? raw.slice(i) : raw.slice(i, i + end);
			i += rawValue.length;
		}
		const value = convertValue(rawValue);
		if (value === null) todos.push(`${name}=${rawValue}`);
		else attrs.push({ name, value });
	}
	return { attrs, todos };
}

/** null = the value is a JS expression with no mechanical conversion — the
 * caller drops the attr and leaves a MIGRATE-TODO comment instead. */
function convertValue(raw: string): string | null {
	let inner: string;
	if (raw.startsWith('"') || raw.startsWith("'")) {
		inner = raw.slice(1, -1);
	} else if (raw.startsWith('{')) {
		inner = raw.slice(1, -1).trim();
		// {['a', 'b']} array literals carry over as markdoc arrays.
		if (inner.startsWith('[') && inner.endsWith(']')) {
			const items = inner
				.slice(1, -1)
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
			if (items.every((s) => /^'[^']*'$/.test(s) || /^"[^"]*"$/.test(s) || isLiteral(s))) {
				return `[${items.map((s) => (isLiteral(s) ? s : `"${s.slice(1, -1)}"`)).join(', ')}]`;
			}
			return null;
		}
		// {{key: 'value'}} flat object literals become markdoc objects.
		if (inner.startsWith('{') && inner.endsWith('}')) {
			const converted = convertFlatObject(inner);
			if (converted !== null) return converted;
			return null;
		}
		// {queryName} / {row.col} references become plain string names in Core.
		if (!/^[A-Za-z_][\w.]*$/.test(inner) && !isLiteral(inner)) {
			return null;
		}
	} else {
		inner = raw;
	}
	if (isLiteral(inner)) return inner;
	return `"${decodeEntities(inner).replaceAll('"', '\\"')}"`;
}

/** `{key: 'val', "other": 2}` → `{key="val" other=2}`, or null if not flat/literal. */
function convertFlatObject(source: string): string | null {
	const body = source.slice(1, -1).trim();
	if (body === '') return null;
	if (/[{}[\]`]/.test(body)) return null;
	const entries: string[] = [];
	for (const part of body.split(',')) {
		const m = /^\s*(?:'([^']*)'|"([^"]*)"|([A-Za-z_]\w*))\s*:\s*(.+?)\s*$/.exec(part);
		if (!m) return null;
		const key = m[1] ?? m[2] ?? m[3];
		if (!/^[A-Za-z_]\w*$/.test(key)) return null;
		const rawVal = m[4];
		let value: string;
		if (isLiteral(rawVal)) value = rawVal;
		else if (/^'[^']*'$/.test(rawVal) || /^"[^"]*"$/.test(rawVal)) {
			value = `"${rawVal.slice(1, -1)}"`;
		} else return null;
		entries.push(`${key}=${value}`);
	}
	return `{${entries.join(' ')}}`;
}

function isLiteral(value: string): boolean {
	return value === 'true' || value === 'false' || /^-?\d+(\.\d+)?$/.test(value);
}

function renderTag(tag: string, attrs: Attr[], selfClosing: boolean): string {
	const attrText = attrs.map((a) => (a.value === null ? a.name : `${a.name}=${a.value}`));
	const oneLine = `{% ${tag}${attrText.length ? ' ' + attrText.join(' ') : ''}${selfClosing ? ' /%}' : ' %}'}`;
	if (oneLine.length <= 100) return oneLine;
	return `{% ${tag}\n${attrText.map((t) => `    ${t}`).join('\n')}\n${selfClosing ? '/%}' : '%}'}`;
}

/** Convert one matched legacy Evidence component tag (opening or self-closing). */
function convertComponent(
	name: string,
	attrRaw: string,
	selfClosing: boolean,
	notes: MigrationNote[],
	options: TransformOptions
): { text: string; tag: string | null } {
	const rule = COMPONENT_RULES[name];
	if (rule?.drop) return { text: '', tag: null };
	let tag = rule?.tag ?? pascalToSnake(name);
	const parsed = parseAttrs(attrRaw);
	let attrs = parsed.attrs;
	for (const todo of parsed.todos) {
		notes.push({
			level: 'warning',
			message: `${name} ${todo.split('=')[0]}= is a JS expression with no Core equivalent — dropped, left a MIGRATE-TODO comment`
		});
	}
	if (rule?.emit) {
		let text = rule.emit(attrs, notes);
		for (const todo of parsed.todos) {
			text += `\n<!-- MIGRATE-TODO: could not convert expression prop: ${todo} -->`;
		}
		return { text, tag: null };
	}

	if (rule?.attrRenames) {
		attrs = attrs.map((a) =>
			rule.attrRenames![a.name] ? { ...a, name: rule.attrRenames![a.name] } : a
		);
	}
	if (rule?.transform) {
		const result = rule.transform(attrs, notes);
		attrs = result.attrs;
		if (result.tag) tag = result.tag;
	}
	// A few Core schemas keep camelCase attr names (redNegatives, buttonText,
	// className) — snake-case only when the schema doesn't take the camel form.
	const tagAllowed = options.tagAttrs?.get(tag);
	attrs = attrs.map((a) => {
		const snake = camelToSnake(a.name);
		if (tagAllowed && !tagAllowed.has(snake) && tagAllowed.has(a.name)) return a;
		return { ...a, name: snake };
	});

	if (rule?.unsupported?.length) {
		const unsupported = new Set(rule.unsupported.map(camelToSnake));
		const flagged = attrs.filter((a) => unsupported.has(a.name));
		if (flagged.length > 0) {
			attrs = attrs.filter((a) => !unsupported.has(a.name));
			notes.push({
				level: 'warning',
				message: `${tag}: unsupported in Core: ${flagged.map((a) => a.name).join(', ')}`
			});
		}
	}

	// data= pointing at a frontmatter-declared SQL file resolves by path in Core.
	if (options.queryFiles?.size) {
		attrs = attrs.map((a) => {
			const bare = unquote(a.value);
			const file = a.name === 'data' && bare ? options.queryFiles!.get(bare) : undefined;
			return file ? { ...a, value: `"/${file}"` } : a;
		});
	}

	const allowed = tagAllowed;
	if (allowed) {
		const dropped = attrs.filter((a) => !allowed.has(a.name));
		if (dropped.length > 0) {
			attrs = attrs.filter((a) => allowed.has(a.name));
			notes.push({
				level: 'warning',
				message: `${tag}: dropped attribute(s) with no Core equivalent: ${dropped.map((a) => a.name).join(', ')}`
			});
		}
	}

	if (!CORE_TAGS.has(tag)) {
		notes.push({
			level: 'warning',
			message: `<${name}> has no known Core component (converted to {% ${tag} %}) — review or replace`
		});
	}
	let text = renderTag(tag, attrs, selfClosing);
	for (const todo of parsed.todos) {
		text += `\n<!-- MIGRATE-TODO: could not convert expression prop: ${todo} -->`;
	}
	return { text, tag };
}

function convertClosing(name: string, openTag?: string): string {
	const rule = COMPONENT_RULES[name];
	if (rule?.drop || rule?.emit) return '';
	// A transform can pick a different tag per-instance (BarChart swapXY →
	// horizontal_bar_chart), so close what the matching open actually emitted.
	return `{% /${openTag ?? rule?.tag ?? pascalToSnake(name)} %}`;
}

/**
 * legacy Evidence `${...}` interpolation → Core `{{...}}` variables:
 * `'${inputs.category.value}'` → `{{category}}`, `${params.user}` → `{{user}}`
 * (templated-page param — pair with an input of the same id), and query
 * references `${my_query}` → `{{my_query}}`.
 *
 * `context: 'sql-file'` marks a standalone project .sql file, where Core
 * inlines the text verbatim and never interpolates `{{...}}` — the rewrite is
 * still the right shape, but it only runs once the query moves into a page.
 */
export function convertInputRefs(
	sql: string,
	notes: MigrationNote[],
	queryFiles: Map<string, string> = new Map(),
	context: 'page' | 'sql-file' = 'page'
): string {
	const inSqlFile = context === 'sql-file';
	// One note per file is enough; the per-reference notes carry the detail.
	let flaggedSqlFileVariables = false;
	const flagSqlFileVariables = () => {
		if (inSqlFile && !flaggedSqlFileVariables) {
			flaggedSqlFileVariables = true;
			notes.push({
				level: 'warning',
				message:
					'Core inlines project .sql files verbatim and never interpolates {{...}} in them, so the references converted below will not resolve here — move this query into a ```sql fence on the page that uses it.'
			});
		}
	};

	let out = sql.replace(
		/'?\$\{inputs\.([A-Za-z_]\w*)((?:\.[A-Za-z_]\w*)*)\}'?/g,
		(_m, name: string, props: string) => {
			// `.value`/`.raw` are implicit in Core; real properties (.start, .end,
			// .label, …) carry over. Core variables emit their own quoting.
			const kept = props.replace(/\.(?:value|raw)(?=\.|$)/g, '');
			flagSqlFileVariables();
			notes.push({
				level: inSqlFile ? 'warning' : 'info',
				message: `input reference \${inputs.${name}${props}} → {{${name}${kept}}}`
			});
			return `{{${name}${kept}}}`;
		}
	);
	out = out.replace(/'?\$\{params\.([A-Za-z_]\w*)\}'?/g, (_m, name: string) => {
		flagSqlFileVariables();
		notes.push({
			level: 'warning',
			message: `page param \${params.${name}} → {{${name}}} — templated pages are not supported, add an input (e.g. a dropdown) with id="${name}"`
		});
		return `{{${name}}}`;
	});
	out = out.replace(/\$\{([A-Za-z_]\w*)\}/g, (_m, name: string) => {
		// Core inlines a .sql file verbatim, so a nested query reference is left
		// literal there too — same non-interpolation caveat as inputs.
		flagSqlFileVariables();
		// Frontmatter-declared SQL files resolve by project path in Core.
		const file = queryFiles.get(name);
		if (file) {
			notes.push({
				level: inSqlFile ? 'warning' : 'info',
				message: `query file reference \${${name}} → {{ /${file} }}`
			});
			return `{{ /${file} }}`;
		}
		notes.push({
			level: inSqlFile ? 'warning' : 'info',
			message: `query reference \${${name}} → {{${name}}}`
		});
		return `{{${name}}}`;
	});
	return out;
}

/**
 * legacy Evidence pages declare external SQL files in frontmatter:
 *   queries:
 *     - funnel_by_split: funnel_by_split.sql
 * Returns name → project path ('queries/funnel_by_split'); bare entries
 * (`- funnel_by_split.sql`) key on the filename stem.
 */
export function parseFrontmatterQueries(frontmatter: string): Map<string, string> {
	const map = new Map<string, string>();
	const section = /^queries:\s*\n((?:[ \t]*-[^\n]*\n?)+)/m.exec(frontmatter);
	if (!section) return map;
	for (const line of section[1].split('\n')) {
		const named = /^[ \t]*-\s+([A-Za-z_]\w*):\s*(\S+)/.exec(line);
		const bare = /^[ \t]*-\s+(\S+\.sql)\s*$/.exec(line);
		const [name, file] = named ? [named[1], named[2]] : bare ? [null, bare[1]] : [null, null];
		if (!file) continue;
		const stem = file.replace(/\.sql$/, '');
		map.set(name ?? stem.split('/').pop()!, `queries/${stem}`);
	}
	return map;
}

const VOID_HTML_TAGS = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'embed']);

const KNOWN_FENCE_LANGS = new Set([
	'sql',
	'markdown',
	'md',
	'html',
	'svelte',
	'jsx',
	'js',
	'javascript',
	'ts',
	'typescript',
	'python',
	'bash',
	'sh',
	'shell',
	'yaml',
	'yml',
	'json',
	'css',
	'liquid',
	'text',
	'plaintext',
	'code',
	'r',
	'diff',
	'console',
	'shellscript'
]);

/**
 * Convert simple inline HTML to its markdown equivalent. Runs on prose lines
 * and generated text — raw HTML fails Core validation and only these
 * text-level tags translate losslessly.
 */
function convertInlineHtml(text: string, brReplacement = '\n'): string {
	return text
		.replace(/<br\s*\/?>/gi, brReplacement)
		.replace(
			/<a\b[^>]*href=["']?([^"'\s>]+)["']?[^>]*>(.*?)<\/?a\s*\/?>/gi,
			(_m, href: string, label: string) => `[${label.trim()}](${href})`
		)
		.replace(/<code\b[^>]*>\{?`?(.*?)`?\}?<\/code>/gi, '`$1`')
		.replace(/<(?:b|strong)\b[^>]*>(.*?)<\/(?:b|strong)>/gi, '**$1**')
		.replace(/<(?:i|em)\b[^>]*>(.*?)<\/(?:i|em)>/gi, '*$1*');
}

/** Legacy legacy Evidence fences put the query name where the language goes: ```my_query */
function isLegacyQueryFence(lang: string | undefined): lang is string {
	return !!lang && !KNOWN_FENCE_LANGS.has(lang.toLowerCase()) && /^[A-Za-z_]\w*$/.test(lang);
}

const IMG_ATTR_RE = /([a-z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s/>]+)/g;

function htmlAttrMap(tag: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const m of tag.matchAll(IMG_ATTR_RE)) {
		out[m[1]] = m[2].startsWith('"') || m[2].startsWith("'") ? m[2].slice(1, -1) : m[2];
	}
	return out;
}

/**
 * Convert an all-links-and-images HTML block to native markdown. Images inside
 * `{% html %}` are CSP-blocked (sandbox img-src allowlist) and links are
 * iframe-isolated, so `<a href><img></a>` badge rows must become markdown
 * `[![alt](src)](href)` — rendered on the page itself — not sandboxed HTML.
 * Returns null when the block contains anything beyond a plain wrapper div,
 * links, and images (caller falls back to the {% html %} wrap).
 */
function tryConvertLinkedImageBlock(block: string[]): string | null {
	const parts: string[] = [];
	for (const rawLine of block) {
		let line = rawLine.trim();
		if (line === '') continue;
		// A plain wrapper (div/span/p) contributes nothing but layout.
		line = line.replace(/^<(?:div|span|p)\b[^>]*>/, '').replace(/<\/(?:div|span|p)>$/, '');
		line = line.trim();
		if (line === '') continue;
		let matched = false;
		let rest = line;
		while (rest.length > 0) {
			const linkedImg = /^<a\s+[^>]*>\s*<img\s[^>]*>\s*<\/a>\s*/.exec(rest);
			const bareImg = /^<img\s[^>]*>\s*/.exec(rest);
			const bareLink = /^<a\s+[^>]*>([^<]*)<\/a>\s*/.exec(rest);
			if (linkedImg) {
				const a = htmlAttrMap(/^<a\s+[^>]*>/.exec(linkedImg[0])![0]);
				const img = htmlAttrMap(/<img\s[^>]*>/.exec(linkedImg[0])![0]);
				if (!a.href || !img.src) return null;
				parts.push(`[![${img.alt ?? ''}](${img.src})](${a.href})`);
				rest = rest.slice(linkedImg[0].length);
				matched = true;
			} else if (bareImg) {
				const img = htmlAttrMap(bareImg[0]);
				if (!img.src) return null;
				parts.push(`![${img.alt ?? ''}](${img.src})`);
				rest = rest.slice(bareImg[0].length);
				matched = true;
			} else if (bareLink) {
				const a = htmlAttrMap(/^<a\s+[^>]*>/.exec(bareLink[0])![0]);
				if (!a.href) return null;
				parts.push(`[${bareLink[1].trim()}](${a.href})`);
				rest = rest.slice(bareLink[0].length);
				matched = true;
			} else {
				return null;
			}
		}
		if (!matched) return null;
	}
	return parts.length > 0 ? parts.join(' ') : null;
}

/** `<img src alt class>` → `{% image url description class /%}`. */
function convertImg(imgTag: string): string {
	const attrs: Attr[] = [];
	const re = /([a-z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s/>]+)/g;
	const renames: Record<string, string> = { src: 'url', alt: 'description' };
	for (const m of imgTag.matchAll(re)) {
		let name = renames[m[1]] ?? m[1];
		let inner = m[2].startsWith('"') || m[2].startsWith("'") ? m[2].slice(1, -1) : m[2];
		// HTML width is pixels; Core's image `width` is a percentage — the
		// pixel cap lives in `max_width`.
		if (name === 'width') {
			name = 'max_width';
			inner = inner.replace(/px$/i, '');
		}
		if (name === 'height') continue; // no Core equivalent; aspect is preserved
		attrs.push({ name, value: isLiteral(inner) ? inner : `"${inner}"` });
	}
	// description (alt text) is required by the image schema.
	if (!attrs.some((a) => a.name === 'description')) {
		attrs.push({ name: 'description', value: '"image"' });
	}
	return renderTag('image', attrs, true);
}

/**
 * Wrap raw HTML in the text with `{% html %}` — Core markdown does not
 * render arbitrary HTML. Standalone `<img>` becomes `{% image /%}` instead
 * (the html sandbox has a strict image-origin CSP). Operates line-block-wise:
 * a block is consecutive non-blank lines starting with a lowercase HTML tag.
 */
function wrapHtmlBlocks(text: string, notes: MigrationNote[]): string {
	const lines = text.split('\n');
	const out: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		const brOnly = /^(?:<br\s*\/?>\s*)+$/i.test(trimmed);
		if (brOnly) {
			const count = (trimmed.match(/<br/gi) ?? []).length;
			out.push(count > 1 ? `{% line_break lines=${count} /%}` : '{% line_break /%}');
			continue;
		}

		const imgOnly = /^<img\b[^>]*>$/i.exec(trimmed);
		if (imgOnly) {
			out.push(convertImg(trimmed));
			notes.push({ level: 'info', message: '<img> → {% image %}' });
			continue;
		}

		const htmlStart = /^<([a-z][\w-]*)(\s|>|\/)/.exec(trimmed);
		if (htmlStart && !VOID_HTML_TAGS.has(htmlStart[1])) {
			// Collect the block. A blank line ends it only once every opened tag
			// has closed — wrappers legally span blank lines around markdown.
			const block: string[] = [];
			let depth = 0;
			while (i < lines.length) {
				const current = lines[i];
				if (current.trim() === '' && depth <= 0) break;
				block.push(current);
				for (const m of current.matchAll(/<(\/?)([a-z][\w-]*)(?:\s[^>]*)?(\/?)>/gi)) {
					if (VOID_HTML_TAGS.has(m[2].toLowerCase()) || m[3] === '/') continue;
					depth += m[1] === '/' ? -1 : 1;
				}
				i++;
			}
			i--;
			// Blocks holding Evidence components or markdown content must NOT be
			// sandboxed — {% html %} renders raw HTML only, so both would stop
			// rendering. Strip the HTML wrapper lines and keep the content
			// (raw HTML outside {% html %} fails validation anyway).
			const hasComponents = block.some((l) => l.includes('{%'));
			const hasMarkdownContent = block.some(
				(l) => l.trim() === '' || /^(#{1,6}\s|[-*]\s|\d+\.\s|>\s)/.test(l.trim())
			);
			if (hasComponents || hasMarkdownContent || depth !== 0) {
				let residualHtml = false;
				for (const blockLine of block) {
					// Images inside the wrapper are content, not layout — convert
					// them (linked or bare) instead of stripping them away.
					const lineTrimmed = blockLine.trim();
					if (/^<img\b[^>]*>$/i.test(lineTrimmed)) {
						out.push(convertImg(lineTrimmed));
						continue;
					}
					const asImage = /<img/i.test(lineTrimmed)
						? tryConvertLinkedImageBlock([blockLine])
						: null;
					if (asImage !== null) {
						out.push(asImage);
						continue;
					}
					const stripped = blockLine.replace(/<\/?[a-z][\w-]*(?:\s[^>]*)?\/?>/gi, '');
					if (stripped.trim() === '' && lineTrimmed !== '') continue; // pure wrapper line
					if (stripped !== blockLine) residualHtml = true;
					out.push(stripped === blockLine ? blockLine : stripped);
				}
				notes.push({
					level: residualHtml ? 'warning' : 'info',
					message: `<${htmlStart[1]}> wrapper around ${hasComponents ? 'Evidence components' : 'markdown content'} removed (it can't render inside {% html %})${residualHtml ? ' — some HTML was mixed with content, review the block' : '; use {% row %}/{% stack %} if layout mattered'}`
				});
				continue;
			}
			const asMarkdown = tryConvertLinkedImageBlock(block);
			if (asMarkdown !== null) {
				out.push(asMarkdown);
				notes.push({
					level: 'info',
					message:
						'link/image HTML block converted to markdown (the {% html %} sandbox blocks external images and isolates links)'
				});
				continue;
			}
			out.push('{% html %}');
			out.push(...block);
			out.push('{% /html %}');
			notes.push({
				level: 'warning',
				message: `raw <${htmlStart[1]}> block wrapped in {% html %} — note the sandbox CSP blocks off-allowlist external images, and links open inside the sandboxed iframe; replace with a Core component if one exists`
			});
			continue;
		}
		out.push(convertInlineHtml(line));
	}
	return out.join('\n');
}

/** Convert legacy Evidence component tags (Pascal-case) in a text segment. */
function convertComponents(
	text: string,
	notes: MigrationNote[],
	options: TransformOptions
): string {
	// One ordered pass, tracking open tags per component so a closing tag emits
	// whatever its own opening tag resolved to. Attr regions are scanned with
	// brace/quote awareness so `}`/`>` inside expression props don't end the tag.
	const openTags = new Map<string, string[]>();
	const tagStart = /<(\/?)([A-Z]\w*)/g;
	let result = '';
	let pos = 0;
	let m: RegExpExecArray | null;
	while ((m = tagStart.exec(text)) !== null) {
		if (m.index < pos) continue;
		const isClose = m[1] === '/';
		const name = m[2];
		const i = m.index + m[0].length;
		if (isClose) {
			const close = /^\s*>/.exec(text.slice(i));
			if (!close) continue;
			result += text.slice(pos, m.index) + convertClosing(name, openTags.get(name)?.pop());
			pos = i + close[0].length;
			continue;
		}
		// Scan the attr region for the tag's real `>`.
		let end = -1;
		let selfClosing = false;
		let scan = i;
		while (scan < text.length) {
			const ch = text[scan];
			if (ch === '"' || ch === "'") {
				const strEnd = scanString(text, scan);
				if (strEnd === -1) break;
				scan = strEnd + 1;
			} else if (ch === '{') {
				const exprEnd = scanBraceExpression(text, scan);
				if (exprEnd === -1) break;
				scan = exprEnd;
			} else if (ch === '>') {
				end = scan;
				selfClosing = text[scan - 1] === '/';
				break;
			} else if (ch === '<') {
				break;
			} else {
				scan++;
			}
		}
		if (end === -1) {
			// Malformed/unclosed tag — leave it untouched rather than guessing.
			notes.push({
				level: 'warning',
				message: `<${name}> tag could not be parsed (unbalanced attribute expression?) — left unconverted`
			});
			continue;
		}
		const attrRaw = text.slice(i, selfClosing ? end - 1 : end);
		const converted = convertComponent(name, attrRaw, selfClosing, notes, options);
		if (!selfClosing && converted.tag) {
			const stack = openTags.get(name) ?? [];
			stack.push(converted.tag);
			openTags.set(name, stack);
		}
		result += text.slice(pos, m.index) + converted.text;
		pos = end + 1;
	}
	result += text.slice(pos);
	// link_button is self-closing in Core (title attribute), but legacy Evidence
	// LinkButton wrapped its label as children — hoist simple text bodies.
	result = result.replace(
		/\{% link_button\s([\s\S]*?)%\}([\s\S]*?)\{% \/link_button %\}/g,
		(m, attrs: string, label: string) => {
			const text = label.trim();
			// Only hoist plain single-label bodies; anything structured stays.
			if (text === '' || /[{<>]/.test(text) || attrs.includes('title=')) return m;
			return `{% link_button ${attrs.trim().replace(/\s+/g, ' ')} title="${text.replace(/\s+/g, ' ')}" /%}`;
		}
	);
	return result;
}

interface Segment {
	type: 'frontmatter' | 'fence' | 'text';
	text: string;
	lang?: string;
}

function segment(source: string): Segment[] {
	const segments: Segment[] = [];
	let rest = source;

	const fm = /^---\n[\s\S]*?\n---\n/.exec(rest);
	if (fm) {
		segments.push({ type: 'frontmatter', text: fm[0] });
		rest = rest.slice(fm[0].length);
	}

	// Existing {% html %} bodies are protected like fences so a re-run doesn't
	// re-wrap or re-convert markup that is already inside the sandbox.
	// CommonMark allows fences (openers and closers) indented up to 3 spaces,
	// and longer fences (````) legally contain shorter ones — the exact-length
	// backreference keeps a ````-fence from closing on an inner ``` line.
	const fenceRe =
		/^[ \t]{0,7}(```+)([^\n]*)\n[\s\S]*?\n[ \t]{0,7}\1\s*$|^\{%\s*html\s*%\}\n[\s\S]*?\n\{%\s*\/html\s*%\}/gm;
	let last = 0;
	for (const m of rest.matchAll(fenceRe)) {
		if (m.index! > last) segments.push({ type: 'text', text: rest.slice(last, m.index) });
		const isFence = m[1] !== undefined;
		segments.push({
			type: 'fence',
			text: m[0],
			lang: isFence ? (m[2].trim().split(/\s+/)[0] ?? '') : 'html-tag'
		});
		last = m.index! + m[0].length;
	}
	if (last < rest.length) segments.push({ type: 'text', text: rest.slice(last) });
	return segments;
}

/**
 * legacy Evidence rendered the frontmatter `title` as the page h1 (unless
 * `hide_title: true`); Core does not. Returns the `# title` line to insert
 * when the body doesn't already open with an h1, else null.
 */
function titleHeading(frontmatter: string, body: string): string | null {
	if (/^hide_title:\s*true\s*$/m.test(frontmatter)) return null;
	const titleMatch = /^title:\s*(.+?)\s*$/m.exec(frontmatter);
	if (!titleMatch) return null;
	let title = titleMatch[1];
	if (
		(title.startsWith('"') && title.endsWith('"')) ||
		(title.startsWith("'") && title.endsWith("'"))
	) {
		title = title.slice(1, -1);
	}
	const firstLine = body.split('\n').find((l) => l.trim() !== '');
	if (firstLine?.trim().startsWith('# ')) return null;
	return `# ${title}`;
}

/**
 * legacy Evidence DocTab (tabbed preview/code wrapper) → Core {% tabs %}. The
 * `slot='preview'` div becomes a Preview tab and each top-level code fence a
 * Code tab. Runs on the raw source, before segmentation, so the inserted tab
 * tags land outside the fence bodies.
 */
export function convertDocTabs(source: string, notes: MigrationNote[]): string {
	if (!source.includes('<DocTab')) return source;
	const lines = source.split('\n');
	const out: string[] = [];
	let converted = 0;
	let fenceMarker: string | null = null;

	const closesFence = (trimmed: string): boolean =>
		fenceMarker !== null && trimmed.startsWith(fenceMarker) && trimmed.replace(/`/g, '') === '';

	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trim();

		// Track fences outside DocTabs so a <DocTab> inside example code is ignored.
		if (fenceMarker !== null) {
			out.push(lines[i]);
			if (closesFence(trimmed)) fenceMarker = null;
			continue;
		}
		const fenceOpen = /^(`{3,})/.exec(trimmed);
		if (fenceOpen) {
			fenceMarker = fenceOpen[1];
			out.push(lines[i]);
			continue;
		}
		if (!/^<DocTab\b[^>]*>$/.test(trimmed)) {
			out.push(lines[i]);
			continue;
		}

		// Collect the DocTab region.
		const region: string[] = [];
		let j = i + 1;
		let regionFence: string | null = null;
		for (; j < lines.length; j++) {
			const t = lines[j].trim();
			if (regionFence !== null) {
				if (t.startsWith(regionFence) && t.replace(/`/g, '') === '') regionFence = null;
			} else if (/^(`{3,})/.test(t)) {
				regionFence = /^(`{3,})/.exec(t)![1];
			} else if (t === '</DocTab>') {
				break;
			}
			region.push(lines[j]);
		}
		if (j >= lines.length) {
			// Unclosed — leave for the drop-rule fallback.
			out.push(lines[i]);
			continue;
		}

		// Partition the region. Tabs may only contain tab children, and inline
		// queries must be top-level, so: sql/query fences hoist above the tabs,
		// the preview div becomes a Preview tab, other fences become Code tabs,
		// and any loose commentary moves below the tabs.
		const hoisted: string[] = [];
		const body: string[] = [];
		const trailing: string[] = [];
		let previewDepth = -1;
		let fence: string[] | null = null;
		let fenceMark = '';
		let fenceIsSql = false;
		let fenceInPreview = false;
		for (const raw of region) {
			const t = raw.trim();
			if (fence) {
				fence.push(raw);
				if (t.startsWith(fenceMark) && t.replace(/`/g, '') === '') {
					if (fenceIsSql) hoisted.push(...fence, '');
					else if (fenceInPreview) body.push(...fence);
					else body.push('{% tab title="Code" %}', ...fence, '{% /tab %}');
					fence = null;
				}
				continue;
			}
			const open = /^(`{3,})[ \t]*(\S*)/.exec(t);
			if (open) {
				fence = [raw];
				fenceMark = open[1];
				const lang = open[2];
				fenceIsSql = lang === 'sql' || isLegacyQueryFence(lang);
				fenceInPreview = previewDepth >= 0;
				continue;
			}
			const slotDiv = /^<div\s+slot=['"](\w+)['"][^>]*>$/.exec(t);
			if (slotDiv && previewDepth < 0) {
				previewDepth = 0;
				const title = slotDiv[1].charAt(0).toUpperCase() + slotDiv[1].slice(1);
				body.push(`{% tab title="${title}" %}`);
				continue;
			}
			if (previewDepth >= 0) {
				if (/^<div\b/.test(t)) previewDepth++;
				if (t === '</div>') {
					if (previewDepth === 0) {
						previewDepth = -1;
						body.push('{% /tab %}');
						continue;
					}
					previewDepth--;
				}
				body.push(raw);
				continue;
			}
			// Outside any tab unit: blanks keep the tab spacing; anything else
			// is commentary that can't live directly inside {% tabs %}.
			if (t === '') body.push(raw);
			else trailing.push(raw);
		}

		converted++;
		out.push(...hoisted, '{% tabs %}', ...body, '{% /tabs %}');
		if (trailing.length > 0) out.push('', ...trailing);
		i = j; // skip past </DocTab>
	}

	if (converted > 0) {
		notes.push({
			level: 'info',
			message: `${converted} DocTab wrapper(s) converted to {% tabs %} with Preview/Code tabs`
		});
	}
	return out.join('\n');
}

/** Svelte template blocks Markdoc can't parse — they'd render as literal page text. */
const SVELTE_BLOCKS: Array<[RegExp, string, string]> = [
	[
		/\{#each\b/,
		'{#each}',
		'Core has no loops — repeat the component per value, or drive it from a query/component that accepts the whole result set'
	],
	[
		/\{#if\b|\{:else/,
		'{#if}',
		'rewrite as {% if %}/{% else_if %}/{% else %} — Core conditions are config-shaped, not JS expressions'
	],
	[/\{#await\b/, '{#await}', 'Core has no async blocks — remove it and render the data directly'],
	[/\{#key\b/, '{#key}', 'Core has no key blocks — remove the wrapper'],
	[/\{@html\b/, '{@html}', 'move the markup into an {% html %} block instead'],
	[
		/\{@const\b/,
		'{@const}',
		'Core does not execute JS — inline the value or compute it in the SQL query'
	],
	[/\{@debug\b/, '{@debug}', 'remove it']
];

/** One warning per construct kind per page — the blocks pass through otherwise untouched. */
function warnSvelteBlocks(text: string, notes: MigrationNote[], seen: Set<string>): void {
	for (const [pattern, label, fix] of SVELTE_BLOCKS) {
		if (seen.has(label) || !pattern.test(text)) continue;
		seen.add(label);
		notes.push({
			level: 'warning',
			message: `${label} has no Core equivalent and is left as-is (renders as literal text) — ${fix}`
		});
	}
}

export function transformPage(source: string, options: TransformOptions = {}): TransformResult {
	const notes: MigrationNote[] = [];
	const segments = segment(convertDocTabs(source, notes));
	const frontmatter = segments.find((s) => s.type === 'frontmatter')?.text ?? '';
	// Frontmatter-declared entries take precedence over project-wide discovery.
	const queryFiles = new Map([
		...(options.queryFiles ?? new Map<string, string>()),
		...parseFrontmatterQueries(frontmatter)
	]);

	const svelteBlocksSeen = new Set<string>();
	const heading = titleHeading(
		frontmatter,
		segments
			.filter((s) => s.type !== 'frontmatter')
			.map((s) => s.text)
			.join('')
	);
	if (heading) {
		notes.push({
			level: 'info',
			message: `frontmatter title rendered as h1 in legacy Evidence — inserted \`${heading}\` at the top of the page`
		});
	}

	let content = segments
		.map((seg) => {
			if (seg.type === 'frontmatter') return seg.text;
			if (seg.type === 'fence') {
				if (seg.lang === 'sql' || isLegacyQueryFence(seg.lang)) {
					let sql = seg.text;
					if (seg.lang !== 'sql') {
						// Legacy legacy Evidence query fences name the query where the language
						// goes (```my_query); Core needs ```sql my_query.
						sql = sql.replace(/^([ \t]{0,7}```+)[ \t]*/, `$1sql `);
						notes.push({
							level: 'info',
							message: `legacy query fence \`\`\`${seg.lang} → \`\`\`sql ${seg.lang}`
						});
					}
					sql = convertInputRefs(sql, notes, queryFiles);
					if (options.sourceRefs) sql = rewriteSourceRefs(sql, options.sourceRefs, notes);
					return sql;
				}
				// Example fences documenting legacy Evidence component syntax get converted
				// too, so documented examples match what the page teaches.
				let text = seg.text;
				// Docusaurus-style fence metas (```js title="index.js") collide with
				// Core's fence meta, which names inline queries — drop them.
				const openerMeta = /^([ \t]{0,7}```+[ \t]*\S+)([ \t]+[^\n{][^\n]*)/.exec(text);
				if (openerMeta) {
					text = text.replace(openerMeta[0], openerMeta[1]);
					notes.push({
						level: 'info',
						message: `fence meta \`${openerMeta[2].trim()}\` removed (Core reads fence metas as query names)`
					});
				}
				if (
					['markdown', 'md', 'html', 'svelte', 'jsx'].includes(seg.lang ?? '') &&
					/<[A-Z]/.test(text)
				) {
					const converted = convertComponents(text, notes, { ...options, queryFiles });
					if (converted !== text) {
						notes.push({
							level: 'info',
							message: `\`\`\`${seg.lang} example fence converted to Core syntax`
						});
						text = converted;
					}
				}
				return text;
			}
			warnSvelteBlocks(seg.text, notes, svelteBlocksSeen);
			let text = convertComponents(seg.text, notes, { ...options, queryFiles });
			text = convertInputRefs(text, notes, queryFiles);
			text = wrapHtmlBlocks(text, notes);
			return text;
		})
		.join('');

	if (heading) {
		content = frontmatter + `\n${heading}\n` + content.slice(frontmatter.length);
	}

	return { content, changed: content !== source, notes };
}
