/**
 * OSS → Studio page transform.
 *
 * Converts Evidence OSS (Svelte-syntax) markdown pages to Studio Markdoc
 * syntax. Deterministic, mechanical rules only — anything that needs judgment
 * (attribute semantics, unsupported components, source queries) is surfaced as
 * a note for the human/AI pass that follows. `evidence validate` is the
 * backstop for anything this misses.
 */

/** Studio tag render names — a converted tag outside this set gets a warning. */
export const STUDIO_TAGS = new Set([
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
	/** Studio tag → allowed attribute names; unknown attrs are dropped with a note. */
	tagAttrs?: Map<string, Set<string>>;
	/** OSS `source.table` refs → `{{ /queries/... }}` rewrites, applied in SQL. */
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
	/** OSS attr name → studio attr name (before generic snake_casing). */
	attrRenames?: Record<string, string>;
	/** Post-rename hook for structural changes (tag swap, attr synthesis). */
	transform?: (attrs: Attr[], notes: MigrationNote[]) => { tag?: string; attrs: Attr[] };
	/** Remove the tag entirely (children stay in place). */
	drop?: true;
	/** Replace the tag with generated markdown instead of a markdoc tag. */
	emit?: (attrs: Attr[]) => string;
}

const INPUT_RENAMES = {
	name: 'id',
	value: 'value_column',
	label: 'label_column',
	defaultValue: 'initial_value'
};

/** OSS per-axis chart props that fold into studio's {x,y}_axis_options objects. */
const AXIS_OPTION_PROPS: Record<string, { axis: 'x' | 'y'; key: string }> = {
	xAxisLabels: { axis: 'x', key: 'labels' },
	yAxisLabels: { axis: 'y', key: 'labels' },
	xGridlines: { axis: 'x', key: 'gridlines' },
	yGridlines: { axis: 'y', key: 'gridlines' },
	xAxisTitle: { axis: 'x', key: 'title' },
	yAxisTitle: { axis: 'y', key: 'title' },
	xMin: { axis: 'x', key: 'min' },
	xMax: { axis: 'x', key: 'max' },
	yMin: { axis: 'y', key: 'min' },
	yMax: { axis: 'y', key: 'max' }
};

/** Fold OSS axis props into `x_axis_options`/`y_axis_options` and rename `labels`. */
function chartTransform(attrs: Attr[], notes?: MigrationNote[]): { attrs: Attr[] } {
	if (notes && attrs.some((a) => a.name.startsWith('y2'))) {
		notes.push({
			level: 'warning',
			message:
				'chart uses a secondary y2 axis — studio models this as {% combo_chart %} with {% bar %}/{% line %} children (axis="y2" on the secondary series); restructure manually'
		});
	}
	const axisEntries: Record<'x' | 'y', string[]> = { x: [], y: [] };
	const rest: Attr[] = [];
	for (const attr of attrs) {
		const axisProp = AXIS_OPTION_PROPS[attr.name];
		if (axisProp && attr.value !== null) {
			axisEntries[axisProp.axis].push(`${axisProp.key}=${attr.value}`);
		} else if (attr.name === 'labels') {
			// OSS boolean → studio object form; false just means the default (off).
			if (attr.value === 'true') rest.push({ name: 'data_labels', value: '{position="above"}' });
		} else if (attr.name === 'nullsZero') {
			if (attr.value === 'true') rest.push({ name: 'handle_missing', value: '"zero"' });
		} else if (attr.name === 'type') {
			// OSS type=grouped|stacked|stacked100 maps onto the `stacked` attr.
			const kind = unquote(attr.value);
			if (kind === 'grouped') rest.push({ name: 'stacked', value: 'false' });
			else if (kind === 'stacked100') rest.push({ name: 'stacked', value: '"100%"' });
			// plain "stacked" is the studio default — drop.
		} else {
			rest.push(attr);
		}
	}
	for (const axis of ['x', 'y'] as const) {
		if (axisEntries[axis].length > 0) {
			rest.push({ name: `${axis}_axis_options`, value: `{${axisEntries[axis].join(' ')}}` });
		}
	}
	return { attrs: rest };
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
		if (a.name === 'data_labels' && a.value === '{position="above"}') {
			return { ...a, value: '{position="right"}' };
		}
		return swaps[a.name] ? { ...a, name: swaps[a.name] } : a;
	});
}

/**
 * OSS charts never "connect" missing points, but studio's handle_missing
 * defaults to "connect" — a migrated chart left without the attribute renders
 * differently (sparse stacked areas become diagonal sawtooth ramps). Emit the
 * value matching OSS's effective default: multi-series areas zero-fill
 * unconditionally (Area.svelte: getCompletedData + replaceNulls), everything
 * else gaps. OSS spells the enum "gap"; studio spells it "gaps".
 */
function withOssMissingDefault(kind: 'line' | 'area') {
	return (attrs: Attr[], notes: MigrationNote[]): { tag?: string; attrs: Attr[] } => {
		let out = chartTransform(attrs, notes).attrs;
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
		return { attrs: out };
	};
}

const COMPONENT_RULES: Record<string, ComponentRule> = {
	DataTable: {
		tag: 'table',
		attrRenames: { rows: 'page_size', totalRow: 'show_total_row' },
		transform: (attrs, notes) => {
			// OSS rows=all disables pagination; studio page_size is numeric-only.
			const pageSize = attrs.find((a) => a.name === 'page_size');
			if (pageSize && !/^\d+$/.test(unquote(pageSize.value) ?? '')) {
				notes.push({
					level: 'warning',
					message: `DataTable rows=${unquote(pageSize.value) ?? '?'} has no studio equivalent (page_size is numeric) — dropped, default pagination applies`
				});
				return { attrs: attrs.filter((a) => a !== pageSize) };
			}
			return { attrs };
		}
	},
	Column: {
		tag: 'dimension',
		attrRenames: { id: 'value', linkLabel: 'link_label' },
		transform: (attrs, notes) => {
			const contentType = attrs.find((a) => a.name === 'contentType');
			let out = attrs
				.filter((a) => a.name !== 'contentType')
				// OSS accepted the British spelling; studio validates against it.
				.map((a) =>
					a.name === 'align' && a.value === '"centre"' ? { ...a, value: '"center"' } : a
				);
			if (contentType) {
				if (unquote(contentType.value) === 'link') {
					// OSS rendered the column's own value as the link href.
					if (!out.some((a) => a.name === 'link')) {
						const value = out.find((a) => a.name === 'value');
						if (value?.value) out = [...out, { name: 'link', value: value.value }];
					}
				} else if (unquote(contentType.value) === 'colorscale') {
					const scaleAttrs = new Set(['scaleColor', 'colorMin', 'colorMax', 'colorMid']);
					out = out.filter((a) => !scaleAttrs.has(a.name));
					notes.push({
						level: 'warning',
						message:
							'Column contentType=colorscale: studio dimensions use `conditional_colors` (a SQL expression returning a color per row) instead of a min/max gradient — write one, e.g. conditional_colors="case when sum(x) > 100 then \'#22c55e\' end"'
					});
				} else {
					notes.push({
						level: 'warning',
						message: `Column contentType=${unquote(contentType.value) ?? '?'} has no direct dimension equivalent — review`
					});
				}
			}
			return { attrs: out };
		}
	},
	BigValue: {
		tag: 'big_value',
		transform: (attrs, notes) => {
			// OSS points comparison at a precomputed column; studio computes the
			// comparison itself via the `comparison={...}` object.
			if (attrs.some((a) => a.name.startsWith('comparison'))) {
				notes.push({
					level: 'warning',
					message:
						'BigValue comparison columns are precomputed in OSS; studio computes them — replace with comparison={compare_vs="prior period"} (plus a date_range) and delete the comparison SQL'
				});
			}
			let out = attrs.filter((a) => !a.name.startsWith('comparison'));
			// OSS sparkline=<x column> + sparklineType=<kind> → sparkline={x= type=}.
			const spark = out.find((a) => a.name === 'sparkline');
			const sparkType = out.find((a) => a.name === 'sparklineType');
			if (spark || sparkType) {
				out = out.filter((a) => a !== spark && a !== sparkType);
				const entries: string[] = [];
				if (spark?.value) entries.push(`x=${spark.value}`);
				if (sparkType?.value) entries.push(`type=${sparkType.value}`);
				out.push({ name: 'sparkline', value: `{${entries.join(' ')}}` });
			}
			return { attrs: out };
		}
	},
	BigLink: { tag: 'link_button' },
	LineChart: { tag: 'line_chart', transform: withOssMissingDefault('line') },
	AreaChart: { tag: 'area_chart', transform: withOssMissingDefault('area') },
	Histogram: { tag: 'histogram', transform: chartTransform },
	Heatmap: { tag: 'heatmap', transform: chartTransform },
	CalendarHeatmap: { tag: 'calendar_heatmap', transform: chartTransform },
	BubbleChart: { tag: 'bubble_chart', transform: chartTransform },
	FunnelChart: { tag: 'funnel_chart', transform: chartTransform },
	SankeyDiagram: {
		tag: 'sankey_chart',
		attrRenames: {
			sourceCol: 'source',
			targetCol: 'target',
			valueCol: 'value',
			percentCol: 'percent'
		},
		transform: chartTransform
	},
	ScatterPlot: { tag: 'scatter_chart', transform: chartTransform },
	ScatterChart: { tag: 'scatter_chart', transform: chartTransform },
	BarChart: {
		tag: 'bar_chart',
		transform: (attrs, notes) => {
			const folded = chartTransform(attrs, notes).attrs;
			// swapXY has no studio attr — the horizontal orientation is its own
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
							'horizontal 100% stacked bars are not supported in studio — converted to a regular stacked horizontal_bar_chart'
					});
				}
				return { tag: 'horizontal_bar_chart', attrs };
			}
			return { attrs: folded };
		}
	},
	Value: { tag: 'value' },
	Delta: { tag: 'delta' },
	Sparkline: { tag: 'sparkline' },
	Dropdown: { tag: 'dropdown', attrRenames: INPUT_RENAMES },
	DropdownOption: { tag: 'dropdown_option' },
	ButtonGroup: { tag: 'button_group', attrRenames: INPUT_RENAMES },
	ButtonGroupItem: { tag: 'option' },
	Slider: {
		tag: 'slider',
		attrRenames: { name: 'id' },
		transform: (attrs) => {
			// OSS `range=<column>` names the column driving min/max; studio's
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
	TextInput: { tag: 'text_input', attrRenames: { name: 'id' } },
	Checkbox: { tag: 'toggle', attrRenames: { name: 'id' } },
	Tabs: { tag: 'tabs' },
	Tab: { tag: 'tab', attrRenames: { label: 'title' } },
	Accordion: { tag: 'accordion' },
	AccordionItem: { tag: 'accordion_item' },
	Details: { tag: 'details' },
	Modal: { tag: 'modal' },
	Alert: {
		tag: 'callout',
		transform: (attrs) => {
			// OSS statuses: default|info|danger|success|warning (plus legacy
			// positive/negative/none); studio types: info|success|warning|error.
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
				// default/none/unknown → omit; studio falls back to its info default.
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
	// OSS Callout is a chart annotation (x/y + body text), not an alert box.
	Callout: {
		tag: 'reference_point',
		transform: (attrs, notes) => {
			notes.push({
				level: 'warning',
				message:
					'Callout is a chart annotation — converted to {% reference_point %}; move the body text into the label attribute and make the tag self-closing'
			});
			return { attrs };
		}
	},
	Info: { tag: 'info', attrRenames: { description: 'text' } },
	Note: { tag: 'note' },
	LinkButton: { tag: 'link_button' },
	LineBreak: { tag: 'line_break' },
	PageBreak: { tag: 'page_break' },
	Grid: { tag: 'row' },
	Embed: { tag: 'iframe', attrRenames: { url: 'src' } },
	// OSS ECharts takes a nested JS config object attr the parser can't
	// mechanically translate; studio's custom_echart puts config in the body.
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
		transform: (attrs) => {
			// OSS sloped lines use x/y + x2/y2; studio wants x1/y1 + x2/y2.
			const sloped = attrs.some((a) => a.name === 'x2' || a.name === 'y2');
			if (!sloped) return { attrs };
			return {
				attrs: attrs.map((a) =>
					a.name === 'x' ? { ...a, name: 'x1' } : a.name === 'y' ? { ...a, name: 'y1' } : a
				)
			};
		}
	},
	ReferenceArea: { tag: 'reference_area' },
	ReferencePoint: { tag: 'reference_point' }
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

/** Parse an OSS attribute string into markdoc-ready attrs. */
function parseAttrs(raw: string, notes: MigrationNote[], componentName: string): Attr[] {
	const attrs: Attr[] = [];
	const re = /([A-Za-z_][\w-]*)(?:\s*=\s*("[^"]*"|'[^']*'|\{[^}]*\}|[^\s/>]+))?/g;
	for (const m of raw.matchAll(re)) {
		const name = m[1];
		const rawValue = m[2];
		if (rawValue === undefined) {
			// Bare flag: <BarChart labels /> means true.
			attrs.push({ name, value: 'true' });
			continue;
		}
		attrs.push({ name, value: convertValue(rawValue, name, componentName, notes) });
	}
	return attrs;
}

function convertValue(
	raw: string,
	attrName: string,
	componentName: string,
	notes: MigrationNote[]
): string {
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
		}
		// {queryName} / {row.col} references become plain string names in studio.
		if (!/^[A-Za-z_][\w.]*$/.test(inner) && !isLiteral(inner)) {
			notes.push({
				level: 'warning',
				message: `${componentName} ${attrName}={${inner}} is an expression — converted to a string, review`
			});
		}
	} else {
		inner = raw;
	}
	if (isLiteral(inner)) return inner;
	return `"${decodeEntities(inner).replaceAll('"', '\\"')}"`;
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

/** Convert one matched OSS component tag (opening or self-closing). */
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
	let attrs = parseAttrs(attrRaw, notes, name);
	if (rule?.emit) return { text: rule.emit(attrs), tag: null };

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
	attrs = attrs.map((a) => ({ ...a, name: camelToSnake(a.name) }));

	// data= pointing at a frontmatter-declared SQL file resolves by path in studio.
	if (options.queryFiles?.size) {
		attrs = attrs.map((a) => {
			const bare = unquote(a.value);
			const file = a.name === 'data' && bare ? options.queryFiles!.get(bare) : undefined;
			return file ? { ...a, value: `"/${file}"` } : a;
		});
	}

	const allowed = options.tagAttrs?.get(tag);
	if (allowed) {
		const dropped = attrs.filter((a) => !allowed.has(a.name));
		if (dropped.length > 0) {
			attrs = attrs.filter((a) => allowed.has(a.name));
			notes.push({
				level: 'warning',
				message: `${tag}: dropped attribute(s) with no studio equivalent: ${dropped.map((a) => a.name).join(', ')}`
			});
		}
	}

	if (!STUDIO_TAGS.has(tag)) {
		notes.push({
			level: 'warning',
			message: `<${name}> has no known Studio component (converted to {% ${tag} %}) — review or replace`
		});
	}
	return { text: renderTag(tag, attrs, selfClosing), tag };
}

function convertClosing(name: string, openTag?: string): string {
	const rule = COMPONENT_RULES[name];
	if (rule?.drop || rule?.emit) return '';
	// A transform can pick a different tag per-instance (BarChart swapXY →
	// horizontal_bar_chart), so close what the matching open actually emitted.
	return `{% /${openTag ?? rule?.tag ?? pascalToSnake(name)} %}`;
}

/**
 * OSS `${...}` interpolation → studio `{{...}}` variables:
 * `'${inputs.category.value}'` → `{{category}}`, `${params.user}` → `{{user}}`
 * (templated-page param — pair with an input of the same id), and query
 * references `${my_query}` → `{{my_query}}`.
 *
 * `context: 'sql-file'` marks a standalone project .sql file, where studio
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
					'studio inlines project .sql files verbatim and never interpolates {{...}} in them, so the references converted below will not resolve here — move this query into a ```sql fence on the page that uses it.'
			});
		}
	};

	let out = sql.replace(
		/'?\$\{inputs\.([A-Za-z_]\w*)((?:\.[A-Za-z_]\w*)*)\}'?/g,
		(_m, name: string, props: string) => {
			// `.value`/`.raw` are implicit in studio; real properties (.start, .end,
			// .label, …) carry over. Studio variables emit their own quoting.
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
		// Studio inlines a .sql file verbatim, so a nested query reference is left
		// literal there too — same non-interpolation caveat as inputs.
		flagSqlFileVariables();
		// Frontmatter-declared SQL files resolve by project path in studio.
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
 * OSS pages declare external SQL files in frontmatter:
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
 * and generated text — raw HTML fails studio validation and only these
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

/** Legacy OSS fences put the query name where the language goes: ```my_query */
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
		// HTML width is pixels; studio's image `width` is a percentage — the
		// pixel cap lives in `max_width`.
		if (name === 'width') {
			name = 'max_width';
			inner = inner.replace(/px$/i, '');
		}
		if (name === 'height') continue; // no studio equivalent; aspect is preserved
		attrs.push({ name, value: isLiteral(inner) ? inner : `"${inner}"` });
	}
	// description (alt text) is required by the image schema.
	if (!attrs.some((a) => a.name === 'description')) {
		attrs.push({ name: 'description', value: '"image"' });
	}
	return renderTag('image', attrs, true);
}

/**
 * Wrap raw HTML in the text with `{% html %}` — Studio markdown does not
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
				message: `raw <${htmlStart[1]}> block wrapped in {% html %} — note the sandbox CSP blocks off-allowlist external images, and links open inside the sandboxed iframe; replace with a Studio component if one exists`
			});
			continue;
		}
		out.push(convertInlineHtml(line));
	}
	return out.join('\n');
}

/** Convert OSS component tags (Pascal-case) in a text segment. */
function convertComponents(
	text: string,
	notes: MigrationNote[],
	options: TransformOptions
): string {
	// One ordered pass, tracking open tags per component so a closing tag emits
	// whatever its own opening tag resolved to.
	const openTags = new Map<string, string[]>();
	let result = text.replace(
		/<\/([A-Z]\w*)\s*>|<([A-Z]\w*)((?:"[^"]*"|'[^']*'|\{[^}]*\}|[^>"'{])*?)(\/?)>/g,
		(_m, closeName: string | undefined, name: string, attrRaw: string, slash: string) => {
			if (closeName !== undefined) {
				return convertClosing(closeName, openTags.get(closeName)?.pop());
			}
			const selfClosing = slash === '/';
			const converted = convertComponent(name, attrRaw, selfClosing, notes, options);
			if (!selfClosing && converted.tag) {
				const stack = openTags.get(name) ?? [];
				stack.push(converted.tag);
				openTags.set(name, stack);
			}
			return converted.text;
		}
	);
	// link_button is self-closing in studio (title attribute), but OSS
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
 * OSS rendered the frontmatter `title` as the page h1 (unless
 * `hide_title: true`); studio does not. Returns the `# title` line to insert
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
 * OSS DocTab (tabbed preview/code wrapper) → studio {% tabs %}. The
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

export function transformPage(source: string, options: TransformOptions = {}): TransformResult {
	const notes: MigrationNote[] = [];
	const segments = segment(convertDocTabs(source, notes));
	const frontmatter = segments.find((s) => s.type === 'frontmatter')?.text ?? '';
	// Frontmatter-declared entries take precedence over project-wide discovery.
	const queryFiles = new Map([
		...(options.queryFiles ?? new Map<string, string>()),
		...parseFrontmatterQueries(frontmatter)
	]);

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
			message: `frontmatter title rendered as h1 in OSS — inserted \`${heading}\` at the top of the page`
		});
	}

	let content = segments
		.map((seg) => {
			if (seg.type === 'frontmatter') return seg.text;
			if (seg.type === 'fence') {
				if (seg.lang === 'sql' || isLegacyQueryFence(seg.lang)) {
					let sql = seg.text;
					if (seg.lang !== 'sql') {
						// Legacy OSS query fences name the query where the language
						// goes (```my_query); studio needs ```sql my_query.
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
				// Example fences documenting OSS component syntax get converted
				// too, so documented examples match what the page teaches.
				let text = seg.text;
				// Docusaurus-style fence metas (```js title="index.js") collide with
				// studio's fence meta, which names inline queries — drop them.
				const openerMeta = /^([ \t]{0,7}```+[ \t]*\S+)([ \t]+[^\n{][^\n]*)/.exec(text);
				if (openerMeta) {
					text = text.replace(openerMeta[0], openerMeta[1]);
					notes.push({
						level: 'info',
						message: `fence meta \`${openerMeta[2].trim()}\` removed (studio reads fence metas as query names)`
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
							message: `\`\`\`${seg.lang} example fence converted to studio syntax`
						});
						text = converted;
					}
				}
				return text;
			}
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
