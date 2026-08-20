<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import ECharts from '../echarts/ECharts.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import SamplingIndicator from '../../common/SamplingIndicator.svelte';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import type { ECharts as EChartsInstance } from 'echarts';
	import { cn } from '../../../shadcn/utils';
	import { getDefaultConnection } from '../../../QueryService.context';
	import type { SQLProps } from '../../common/sql-options';
	import { extractSQLProps } from '../../common/sql-options';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { buildHeatmapSQLConfig } from './build-heatmap-sql';
	import { getDefaultFormatForDateGrain } from '../../common/date-options';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { Query } from '../../../Query.svelte';
	import { formatValue } from '../../formatValue';
	import type { DataPoint } from '../../types';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { getAutoRefreshContext } from '../../../auto-refresh.context.svelte';
	import { mergeEchartsOptions } from '../../common/echarts-options-attributes';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getPageSettingsContext } from '../../../page-settings.context';
	import {
		resolveTooltipFields,
		extractTooltipExtras,
		escapeHtml,
		renderTooltipExtras,
		type TooltipField
	} from '../../common/tooltip-fields';
	import { resolveDeprecatedAttribute } from '../../common/resolve-deprecated-attribute';
	import { resolveMetric, applyMetricDimension } from '../../../metrics/resolve-metric';
	import { getMetricsCatalogContext } from '../../../metrics/metrics-catalog';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	// Get theme context for color scales
	const themeContext = getThemeContext();
	const pageSettings = getPageSettingsContext();

	type Props = UserComponentProps<typeof schema> & SQLProps;

	const props: Props = $props();
	const height = $derived(props.height);
	const value_fmt = $derived(props.value_fmt);
	const filterIds = $derived(props.filters);
	const x_fmt = $derived(props.x_fmt);
	const y_fmt = $derived(props.y_fmt);
	const x_sort = $derived(props.x_sort);
	const y_sort = $derived(props.y_sort);
	const value_sort = $derived(props.value_sort);
	const chart_options = $derived(props.chart_options);
	// `color_palette` is the deprecated alias for `color_scale`. Resolver
	// prefers the new name and dev-warns when the old one is set.
	const color_scale = $derived(
		resolveDeprecatedAttribute({
			preferred: chart_options?.color_scale,
			deprecated: chart_options?.color_palette,
			preferredName: 'color_scale',
			deprecatedName: 'color_palette',
			componentName: 'heatmap'
		})
	);

	// Route the inline `color_scale` through the theme helper so a single-color
	// value (e.g. `color_scale=["#f99"]`) gets [background, color] expansion —
	// reads as a gradient anchored on the surface behind the chart instead of a
	// flat fill. Multi-color values pass through untouched.
	const effectiveColorScale = $derived(
		themeContext.getBackgroundAdjustedColorScale(pageSettings().cards, color_scale)
	);

	const hasValidationErrors = $derived(hasBlockingErrors());

	// Extract SQL props in a centralized way
	const {
		where: rawWhere,
		having,
		limit,
		order,
		qualify
	} = $derived.by(() => extractSQLProps(props));

	const connection = getDefaultConnection();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();
	const getProjectSettings = getProjectSettingsContext();
	const projectSettings = $derived(getProjectSettings());

	// === VARIABLE INTERPOLATION ===
	// 1. Create VariableProcessor
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	// 2. Create resolvers (same API as Model classes)
	const { resolveText, resolveColumn, resolveSql, resolveBoolean } = $derived(
		createResolvers(variableProcessor)
	);

	// 3. Resolve props using appropriate resolver for each type
	// `metric="revenue"` supplies base + aggregate SQL + format; the component
	// keeps supplying x + y.
	const metricsCatalog = getMetricsCatalogContext();
	const resolvedMetric = $derived(resolveText(props.metric));
	const metricCompiled = $derived(
		resolveMetric(metricsCatalog, resolvedMetric, connection.dialect)
	);
	const resolvedTableName = $derived(metricCompiled?.base ?? resolveText(props.data));
	const resolvedX = $derived(applyMetricDimension(metricCompiled, resolveColumn(props.x)));
	const resolvedY = $derived(applyMetricDimension(metricCompiled, resolveColumn(props.y)));
	const resolvedValue = $derived(metricCompiled?.valueExpression ?? resolveColumn(props.value));
	const x_axis_title = $derived(resolveText(props.x_axis_title) ?? '');
	const y_axis_title = $derived(resolveText(props.y_axis_title) ?? '');
	const title = $derived(resolveText(props.title) ?? '');
	const subtitle = $derived(resolveText(props.subtitle) ?? '');
	const info = $derived(resolveText(props.info) ?? '');
	const info_link = $derived(resolveText(props.info_link) ?? '');
	const info_link_title = $derived(resolveText(props.info_link_title) ?? '');
	const where = $derived(resolveSql(props.where) ?? rawWhere);
	const x_date_grain = $derived(resolveText(props.x_date_grain) ?? props.x_date_grain);
	const y_date_grain = $derived(resolveText(props.y_date_grain) ?? props.y_date_grain);
	const effectiveValueFmt = $derived(
		resolveText(props.value_fmt) ??
			value_fmt ??
			(metricCompiled ? metricCompiled.columnFormats[metricCompiled.name] : undefined) ??
			'num'
	);
	// Apply default format for date grains (like day of week, month of year, etc.)
	const effectiveXFmt = $derived(x_fmt ?? getDefaultFormatForDateGrain(x_date_grain));
	const effectiveYFmt = $derived(y_fmt ?? getDefaultFormatForDateGrain(y_date_grain));
	// Process entire date_range object - recursively handles date and range properties
	const resolvedDateRange = $derived(resolveText(props.date_range) ?? props.date_range);
	const resolvedTooltipFields = $derived(
		resolveText(props.tooltip_fields) as TooltipField[] | undefined
	);
	const processedTooltip = $derived(
		resolveTooltipFields(resolvedTooltipFields, connection.dialect)
	);
	const legend = $derived(resolveBoolean(props.legend));
	const borders = $derived(resolveBoolean(props.borders) ?? true);

	// Process columns using the new system (with resolved variable values)
	const xProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: resolvedX,
				dateGrain: x_date_grain,
				firstDayOfWeek: projectSettings.first_day_of_week
			},
			connection.dialect
		);
	});

	const yProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: resolvedY,
				dateGrain: y_date_grain,
				firstDayOfWeek: projectSettings.first_day_of_week
			},
			connection.dialect
		);
	});

	const valueProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: resolvedValue ?? ''
			},
			connection.dialect
		);
	});

	// Extract column aliases for use in chart rendering
	const xColumn = $derived(xProcessed.alias);
	const yColumn = $derived(yProcessed.alias);
	const valueColumn = $derived(valueProcessed.alias);

	const queryConfig = $derived.by(() => {
		if (hasValidationErrors) {
			return;
		}
		if (!resolvedTableName || !resolvedValue) return;

		return buildHeatmapSQLConfig({
			data: resolvedTableName,
			x: resolvedX,
			y: resolvedY,
			value: resolvedValue,
			x_date_grain: x_date_grain,
			y_date_grain: y_date_grain,
			filters: filterIds,
			where,
			date_range: resolvedDateRange,
			having,
			qualify,
			order,
			limit,
			firstDayOfWeek: projectSettings.first_day_of_week,
			dialect: connection.dialect,
			tooltipFieldColumns: processedTooltip.columns
		});
	});
	const autoRefreshCtx = getAutoRefreshContext();
	const query = new Query(
		() => queryConfig,
		{
			connection,
			filterContexts: [repeatFilters, pageFilters],
			inlineQueries,
			projectSettings: getProjectSettingsContext(),
			defaultRefreshInterval: () => autoRefreshCtx?.intervalSeconds ?? 0
		},
		{ refreshInterval: () => props.refresh_interval }
	);

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'heatmap', query, title);
	});

	$effect(() => {
		setError(query.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	// Helper: label comparator
	function getLabelComparator(order: string | undefined) {
		if (!order) return undefined;
		const factor = order === 'asc' ? 1 : -1;
		return (a: string, b: string) => {
			const numA = Number(a);
			const numB = Number(b);
			if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
				return (numA - numB) * factor;
			}
			return a.localeCompare(b) * factor;
		};
	}

	// Helper: value comparator
	function getValueComparator(totals: Map<string, number>, order: string) {
		const factor = order === 'asc' ? 1 : -1;
		return (a: string, b: string) => {
			return ((totals.get(a) ?? 0) - (totals.get(b) ?? 0)) * factor;
		};
	}

	// Transform data for ECharts heatmap with sorting capabilities
	const heatmapData = $derived.by(() => {
		if (!data || data.length === 0) {
			return { data: [], xCategories: [], yCategories: [], minValue: 0, maxValue: 0 };
		}

		// Raw unique categories (preserve extraction order)
		const rawXCategories = [...new Set(data.map((row: DataPoint) => String(row[xColumn])))];
		const rawYCategories = [...new Set(data.map((row: DataPoint) => String(row[yColumn])))];

		// Totals for value-based sorting
		const totalsX = new Map<string, number>();
		const totalsY = new Map<string, number>();

		data.forEach((row: DataPoint) => {
			const xCat = String(row[xColumn]);
			const yCat = String(row[yColumn]);
			const val = Number(row[valueColumn]) || 0;
			totalsX.set(xCat, (totalsX.get(xCat) ?? 0) + val);
			totalsY.set(yCat, (totalsY.get(yCat) ?? 0) + val);
		});

		// Start with raw order
		let xCategories = [...rawXCategories];
		let yCategories = [...rawYCategories];

		// Apply explicit label sorting if provided
		const xLabelComparator = getLabelComparator(x_sort);
		const yLabelComparator = getLabelComparator(y_sort);
		if (xLabelComparator) xCategories.sort(xLabelComparator);
		if (yLabelComparator) yCategories.sort(yLabelComparator);

		// Apply value_sort to first axis without explicit sort
		if (value_sort) {
			if (!xLabelComparator) {
				xCategories.sort(getValueComparator(totalsX, value_sort));
			} else if (!yLabelComparator) {
				yCategories.sort(getValueComparator(totalsY, value_sort));
			}
		}

		// Transform to [x_index, y_index, value] format. When tooltip_fields
		// is set we switch to the { value, extras } object form so the
		// formatter can render the extra rows without a second lookup.
		const fields = processedTooltip.fields;
		const hasExtras = fields.length > 0;
		type HeatmapPoint =
			| [number, number, number]
			| { value: [number, number, number]; extras?: Record<string, unknown> };
		const transformedData: HeatmapPoint[] = data.map((row: DataPoint) => {
			const xIndex = xCategories.indexOf(String(row[xColumn]));
			const yIndex = yCategories.indexOf(String(row[yColumn]));
			const val = Number(row[valueColumn]) || 0;
			const tuple: [number, number, number] = [xIndex, yIndex, val];
			if (!hasExtras) return tuple;
			return { value: tuple, extras: extractTooltipExtras(row, fields) };
		});

		// Sort by y coordinate ascending to ensure proper rendering
		transformedData.sort((a, b) => {
			const av = Array.isArray(a) ? a[1] : a.value[1];
			const bv = Array.isArray(b) ? b[1] : b.value[1];
			return av - bv;
		});

		// Calculate min/max values
		const values = transformedData.map((d) => (Array.isArray(d) ? d[2] : d.value[2]));
		const minValue = values.length > 0 ? Math.min(...values) : 0;
		const maxValue = values.length > 0 ? Math.max(...values) : 100;

		return {
			data: transformedData,
			xCategories,
			yCategories,
			minValue,
			maxValue
		};
	});

	const loading: boolean = $derived(query.loading);

	// Determine if server-side sampling was applied
	const isSampled = $derived(Boolean(query.samplingForced));

	// Enhanced chart options with Evidence styling
	const baseOptions = $derived<EChartsOption>({
		animation: false,
		grid: {
			containLabel: true,
			left: '0.5%',
			right: '0.5%',
			top: x_axis_title ? '10%' : '5%', // pragma: allowlist secret
			bottom: legend ? '20%' : '10%'
		},
		xAxis: {
			type: 'category',
			data: heatmapData.xCategories,
			position: 'top',
			name: x_axis_title || undefined,
			nameLocation: 'center',
			nameGap: 30,
			nameTextStyle: {
				fontSize: 12,
				fontWeight: 600
			},
			splitArea: {
				show: true,
				areaStyle: {
					color: ['rgba(250,250,250,0.1)', 'rgba(200,200,200,0.1)']
				}
			},
			axisTick: {
				show: false,
				alignWithLabel: false
			},
			axisLabel: {
				interval: 0,
				hideOverlap: true,
				fontSize: 12,
				formatter: effectiveXFmt
					? (value: string) =>
							formatValue(
								value,
								effectiveXFmt,
								value,
								undefined,
								query.result?.columns?.find((c) => c.name === xColumn)?.jsType,
								projectSettings.first_day_of_week
							)
					: undefined
			},
			axisLine: {
				show: false
			}
		},
		yAxis: {
			type: 'category',
			inverse: true,
			data: heatmapData.yCategories,
			name: y_axis_title ? `${y_axis_title}  ` : undefined,
			nameLocation: 'start',
			nameGap: 10,
			nameRotate: 0,
			nameTextStyle: {
				fontSize: 12,
				fontWeight: 600,
				align: 'right'
			},
			splitArea: {
				show: true,
				areaStyle: {
					color: ['rgba(250,250,250,0.1)', 'rgba(200,200,200,0.1)']
				}
			},
			axisTick: {
				show: false,
				alignWithLabel: false
			},
			axisLabel: {
				fontSize: 12,
				formatter: effectiveYFmt
					? (value: string) =>
							formatValue(
								value,
								effectiveYFmt,
								value,
								undefined,
								query.result?.columns?.find((c) => c.name === yColumn)?.jsType,
								projectSettings.first_day_of_week
							)
					: undefined
			},
			axisLine: {
				show: false
			}
		},
		visualMap: {
			itemWidth: 10,
			show: legend,
			min: heatmapData.minValue,
			max: heatmapData.maxValue,
			calculable: false,
			orient: 'horizontal',
			left: 'center',
			bottom: '0%',
			textStyle: {
				fontSize: 11
			},
			inRange: {
				color: effectiveColorScale
			},
			text: [
				formatValue(heatmapData.maxValue, effectiveValueFmt, heatmapData.maxValue.toString()),
				formatValue(heatmapData.minValue, effectiveValueFmt, heatmapData.minValue.toString())
			],
			formatter: function (value: unknown) {
				const numValue = typeof value === 'number' ? value : Number(value) || 0;
				return formatValue(numValue, effectiveValueFmt, numValue.toString());
			}
		},
		tooltip: {
			trigger: 'item',
			showDelay: 0,
			transitionDuration: 0.2,
			confine: true,
			axisPointer: {
				type: 'shadow'
			},
			formatter: function (params: unknown) {
				const p = params as {
					value: [number, number, number];
					data?: { extras?: Record<string, unknown> } | number[];
				};
				const xLabelRaw = heatmapData.xCategories[p.value[0]];
				const yLabelRaw = heatmapData.yCategories[p.value[1]];
				const xLabel = effectiveXFmt
					? formatValue(
							xLabelRaw,
							effectiveXFmt,
							xLabelRaw,
							undefined,
							query.result?.columns?.find((c) => c.name === xColumn)?.jsType,
							projectSettings.first_day_of_week
						)
					: xLabelRaw;
				const yLabel = effectiveYFmt
					? formatValue(
							yLabelRaw,
							effectiveYFmt,
							yLabelRaw,
							undefined,
							query.result?.columns?.find((c) => c.name === yColumn)?.jsType,
							projectSettings.first_day_of_week
						)
					: yLabelRaw;
				const rawValue = p.value[2];
				const formattedValue =
					rawValue === 0 ? '—' : formatValue(rawValue, effectiveValueFmt, rawValue.toString());

				const extras =
					p.data && !Array.isArray(p.data) && typeof p.data === 'object'
						? p.data.extras
						: undefined;
				const extraRows = renderTooltipExtras(processedTooltip.fields, extras);

				// Same layout combo_chart uses: bold header (y/x labels) +
				// 2-col grid for the primary value row, plus any extras.
				return `
					<div class="flex flex-col">
						<span class="font-semibold">${escapeHtml(yLabel)}</span>
						<span class="font-semibold mb-1">${escapeHtml(xLabel)}</span>
						<div class="grid grid-cols-[auto_auto] gap-x-4">
							<span>${escapeHtml(valueProcessed.displayAlias)}</span>
							<span class="text-right">${escapeHtml(formattedValue)}</span>
							${extraRows.join('')}
						</div>
					</div>
				`;
			}
		},
		series: [
			{
				type: 'heatmap',
				data: heatmapData.data,
				label: {
					show: true,
					formatter: function (params: unknown) {
						const p = params as { value: [number, number, number] };
						const value = p.value[2];
						if (value === 0) return '—';
						return formatValue(value, effectiveValueFmt, value.toString());
					},
					fontSize: 11,
					fontWeight: 500
				},
				labelLayout: {
					hideOverlap: true
				},
				itemStyle: {
					borderWidth: borders ? 0.5 : 0,
					// Track the themed border (what cards use); the heatmap series has
					// no theme default, so without this it falls back to ECharts grey.
					borderColor: themeContext.activeTheme.border
				}
			}
		],
		// Responsive design for mobile
		media: [
			{
				query: { maxWidth: 400 },
				option: {
					series: [
						{
							label: {
								show: false
							}
						}
					],
					grid: {
						left: '5%',
						right: '5%'
					}
				}
			},
			{
				query: { minWidth: 400 },
				option: {
					series: [
						{
							label: {
								show: true
							}
						}
					]
				}
			}
		]
	});

	// Stable options (EXACTLY like pie chart)
	// Author escape hatches: deep-merge echarts_series_options into every
	// series entry, then echarts_options over the whole config (wins last).
	const options = $derived.by(() => mergeEchartsOptions(baseOptions, props));

	const ready = $derived(!query.loading);
	let stableOptions: EChartsOption = $state({});
	$effect(() => {
		if (ready) {
			stableOptions = options;
		}
	});

	let chart: EChartsInstance | undefined = $state(undefined);
</script>

<div
	class="flex w-full flex-col"
	class:h-full={!height}
	style:height={height ? `${height}px` : undefined}
>
	{#if title || subtitle}
		<ComponentTitle {title} {subtitle} {info} {info_link} {info_link_title} />
	{/if}

	<div class="relative z-0 flex min-h-0 flex-1 flex-col justify-end">
		<ECharts
			bind:chart
			class={cn('h-full w-full flex-1', !height && 'min-h-[300px]')}
			options={stableOptions}
			group={props.connect_group}
		/>

		<div class="absolute top-2 right-2">
			<LoaderCircle
				class="text-muted-foreground animate-spin [animation-duration:1s] {loading
					? 'opacity-100'
					: 'opacity-0'} h-4 w-4 transition-opacity duration-500"
			/>
		</div>

		<SamplingIndicator {isSampled} dataLength={data.length} totalCount={query.count} />
	</div>
</div>
