<script lang="ts">
	import type { EChartsOption, FunnelSeriesOption } from 'echarts';
	import ECharts from '../echarts/ECharts.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import SamplingIndicator from '../../common/SamplingIndicator.svelte';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import type { ECharts as EChartsInstance } from 'echarts';
	import CustomLegend from '../echarts/CustomLegend.svelte';
	import { cn } from '../../../shadcn/utils';
	import { getQueryService } from '../../../QueryService.context';
	import type { SQLProps } from '../../common/sql-options';
	import { extractSQLProps } from '../../common/sql-options';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { buildFunnelChartSQLConfig } from './build-funnel-chart-sql';
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
	import {
		resolveTooltipFields,
		extractTooltipExtras,
		escapeHtml,
		renderTooltipExtras,
		type TooltipField
	} from '../../common/tooltip-fields';
	import { getMetricsCatalogContext } from '../../../metrics/metrics-catalog';
	import { resolveMetric, applyMetricDimension } from '../../../metrics/resolve-metric';
	import chroma from 'chroma-js';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getThemeToken } from '../../../theme/get-theme-token';
	import { getCardContext } from '../../common/card-context.svelte';
	import { colorPalettes } from '../echarts/echarts-themes';
	import {
		FUNNEL_LABEL_INSIDE_PADDING,
		FUNNEL_LABEL_SINGLE_LINE_TOP_NUDGE,
		FUNNEL_NAME_FONT_SIZE,
		FUNNEL_VALUE_FONT_SIZE,
		estimateSegmentWidthPx,
		formatPercentOfFirst,
		measureFunnelLabelWidth,
		pickLabelTextColor,
		resolveAutoLabelPlacement,
		sanitizeRichText
	} from './funnel-labels';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	type Props = UserComponentProps<typeof schema> & SQLProps;

	const props: Props = $props();
	const height = $derived(props.height);
	const value_fmt = $derived(props.value_fmt);
	const filterIds = $derived(props.filters);
	const legend = $derived(props.legend);
	const legend_location = $derived(props.legend_location ?? 'top');
	const label_position = $derived(props.label_position);
	const align = $derived(props.align);
	const show_percent = $derived(props.show_percent);
	const min_size = $derived(props.min_size);
	const max_size = $derived(props.max_size);
	const gap = $derived(props.gap);
	const chart_options = $derived(props.chart_options);
	const color_palette = $derived(chart_options?.color_palette);

	const hasValidationErrors = $derived(hasBlockingErrors());

	const TOP_BORDER = 5;
	const BOTTOM_BORDER = 5;
	const DEFAULT_CHART_HEIGHT = 215;
	// Must match the series `width` option below; used to estimate segment
	// pixel widths for the auto label placement.
	const SERIES_WIDTH_FRACTION = 0.8;
	const FALLBACK_CHART_WIDTH = 640;

	const themeContext = getThemeContext();
	const cardContext = getCardContext();
	const useCardColors = $derived(Boolean(cardContext?.insideCard));
	const activeTheme = $derived(themeContext.activeTheme);
	const palette = $derived(
		color_palette && color_palette.length > 0
			? color_palette
			: (activeTheme.colorPalettes.default ?? colorPalettes.light)
	);
	const outsideNameColor = $derived(getThemeToken(activeTheme, 'foreground', useCardColors));
	const outsideValueColor = $derived(getThemeToken(activeTheme, 'mutedForeground', useCardColors));
	const labelFontFamily = $derived(
		activeTheme.chart?.fontFamily ?? activeTheme.fonts?.body ?? 'Inter, sans-serif'
	);

	// Extract SQL props in a centralized way
	const {
		where: rawWhere,
		having,
		limit,
		order,
		qualify
	} = $derived.by(() => extractSQLProps(props));

	const queryService = getQueryService();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

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
	const { resolveText, resolveColumn, resolveSql } = $derived(createResolvers(variableProcessor));

	// 3. Resolve props using appropriate resolver for each type
	// `metric="revenue"` supplies base + aggregate SQL + format; category flows
	// through unchanged (there's no view-level default stage dimension in v1).
	const metricsCatalog = getMetricsCatalogContext();
	const resolvedMetric = $derived(resolveText(props.metric));
	const metricCompiled = $derived(
		resolveMetric(metricsCatalog, resolvedMetric, queryService.dialect)
	);
	const resolvedTableName = $derived(resolveText(props.data) ?? metricCompiled?.base ?? '');
	const resolvedCategory = $derived(applyMetricDimension(metricCompiled, resolveColumn(props.category)));
	const resolvedValue = $derived(
		resolveColumn(props.value) ?? metricCompiled?.valueExpression ?? ''
	);
	const title = $derived(resolveText(props.title) ?? '');
	const subtitle = $derived(resolveText(props.subtitle) ?? '');
	const info = $derived(resolveText(props.info) ?? '');
	const info_link = $derived(resolveText(props.info_link) ?? '');
	const info_link_title = $derived(resolveText(props.info_link_title) ?? '');
	const where = $derived(resolveSql(props.where) ?? rawWhere);
	const effectiveValueFmt = $derived(
		resolveText(props.value_fmt) ??
			value_fmt ??
			metricCompiled?.columnFormats[metricCompiled.name]
	);
	// Process entire date_range object - recursively handles date and range properties
	const resolvedDateRange = $derived(resolveText(props.date_range) ?? props.date_range);
	const resolvedTooltipFields = $derived(
		resolveText(props.tooltip_fields) as TooltipField[] | undefined
	);
	const processedTooltip = $derived(
		resolveTooltipFields(resolvedTooltipFields, queryService.dialect)
	);

	// Process columns using the new system (with resolved variable values)
	// NOTE: These must come after resolvedCategory and resolvedValue are defined
	const categoryProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: resolvedCategory
			},
			queryService.dialect
		);
	});

	const valueProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: resolvedValue
			},
			queryService.dialect
		);
	});

	// Extract column aliases for use in chart rendering
	const categoryColumn = $derived(categoryProcessed.alias);
	const valueColumn = $derived(valueProcessed.alias);

	const queryConfig = $derived.by(() => {
		if (hasValidationErrors || !resolvedTableName) {
			return;
		}

		return buildFunnelChartSQLConfig({
			data: resolvedTableName,
			category: resolvedCategory,
			value: resolvedValue,
			filters: filterIds,
			where,
			date_range: resolvedDateRange,
			having,
			qualify,
			order,
			limit,
			dialect: queryService.dialect,
			tooltipFieldColumns: processedTooltip.columns
		});
	});

	const autoRefreshCtx = getAutoRefreshContext();
	const query = new Query(
		() => queryConfig,
		{
			queryService,
			filterContexts: [repeatFilters, pageFilters],
			inlineQueries,
			projectSettings: getProjectSettingsContext(),
			defaultRefreshInterval: () => autoRefreshCtx?.intervalSeconds ?? 0
		},
		{ refreshInterval: () => props.refresh_interval }
	);

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'funnel_chart', query, title);
	});

	$effect(() => {
		setError(query.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	// Transform data for ECharts funnel. `extras` carries the raw tooltip
	// field values per stage so the formatter can render them on hover.
	const funnelData = $derived.by(() => {
		const rawData = data as DataPoint[];
		const fields = processedTooltip.fields;
		return rawData.map((row) => ({
			name: String(row[categoryColumn] ?? 'null'),
			value: Number(row[valueColumn]) || 0,
			extras: extractTooltipExtras(row, fields)
		}));
	});
	type FunnelDataPoint = NonNullable<FunnelSeriesOption['data']>[0];

	// Calculate min and max values for funnel sizing
	const minMax = $derived.by(() => {
		if (funnelData.length === 0) return { min: 0, max: 100 };

		const values = funnelData.map((d) => d.value);
		return {
			min: 0,
			max: Math.max(...values)
		};
	});

	const firstStageValue = $derived(funnelData[0]?.value ?? 0);
	// Stage names live in the labels unless the user opts back into a legend.
	const showStageNames = $derived(!legend);

	let chartWidth = $state(0);
	let chartHeight = $state(0);
	$effect(() => {
		const dom = chart?.getDom();
		if (!chart || !dom) return;
		const instance = chart;
		const observer = new ResizeObserver(() => {
			chartWidth = instance.getWidth();
			chartHeight = instance.getHeight();
		});
		observer.observe(dom);
		chartWidth = instance.getWidth();
		chartHeight = instance.getHeight();
		return () => observer.disconnect();
	});

	// Add points after each row with same value and zero height, so that the
	// funnel is squared off. Each real segment carries its own label config:
	// text color picked for contrast against the segment fill, placed inside
	// when it fits and to the right of the segment otherwise.
	const processedFunnel = $derived.by(() => {
		const items: FunnelDataPoint[] = [];
		const labelTexts: string[] = [];
		let maxOutsideLabelWidth = 0;

		const totalGapSpace = 2 * Number(gap) * (funnelData.length - 1);

		// Size segments from the rendered chart height so the funnel fills its
		// container (e.g. inside a card) instead of a fixed 215px reference.
		const referenceHeight = chartHeight || DEFAULT_CHART_HEIGHT;
		const availableHeight =
			referenceHeight * (1 - (TOP_BORDER + BOTTOM_BORDER) / 100) - totalGapSpace;
		const segmentHeight = availableHeight / funnelData.length; // Ensure minimum height
		const twoLinesFit = segmentHeight >= 34;

		const seriesWidthPx = (chartWidth || FALLBACK_CHART_WIDTH) * SERIES_WIDTH_FRACTION;

		funnelData.forEach((d, i) => {
			const fill = palette[i % palette.length] ?? '#888888';

			const formattedValue = formatValue(d.value, effectiveValueFmt, String(d.value));
			const percentSuffix =
				show_percent && firstStageValue > 0
					? ` (${formatPercentOfFirst(d.value, firstStageValue)})`
					: '';
			const valueText = sanitizeRichText(`${formattedValue}${percentSuffix}`);
			const nameText = showStageNames ? sanitizeRichText(d.name) : '';

			if (label_position === 'outside') {
				maxOutsideLabelWidth = Math.max(
					maxOutsideLabelWidth,
					measureFunnelLabelWidth(nameText, valueText, labelFontFamily, !twoLinesFit)
				);
			}

			const placement =
				label_position === 'inside'
					? ({ inside: true, position: 'inner' } as const)
					: label_position === 'center'
						? ({ inside: true, position: 'center' } as const)
						: label_position === 'outside'
							? // A rail beside the chart: left of a left/center-aligned
								// funnel, right of a right-aligned one. The series is
								// inset by outsideGutterPx to make room.
								({ inside: false, position: align === 'right' ? 'right' : 'left' } as const)
							: resolveAutoLabelPlacement({
									nameText,
									valueText,
									segmentWidthPx: estimateSegmentWidthPx({
										value: d.value,
										maxValue: minMax.max,
										seriesWidthPx,
										minSize: min_size,
										maxSize: max_size
									}),
									align: align as 'left' | 'center' | 'right',
									fontFamily: labelFontFamily,
									singleLine: !twoLinesFit
								});

			// Optically center one-line labels (see the constant); two-line labels
			// already balance around the segment middle.
			const topNudge = twoLinesFit ? 0 : FUNNEL_LABEL_SINGLE_LINE_TOP_NUDGE;

			const insideColor = pickLabelTextColor(fill);
			const nameColor = placement.inside ? insideColor : outsideNameColor;
			const valueColor = placement.inside
				? chroma(insideColor).alpha(0.8).css()
				: outsideValueColor;

			labelTexts.push(
				nameText
					? twoLinesFit
						? `{name|${nameText}}\n{value|${valueText}}`
						: `{name|${nameText}}  {value|${valueText}}`
					: `{value|${valueText}}`
			);
			items.push({
				name: d.name,
				value: d.value,
				extras: d.extras,
				itemStyle: {
					height: segmentHeight,
					color: fill
				},
				label: {
					show: true,
					position: placement.position,
					padding:
						placement.position === 'insideLeft'
							? [topNudge, 0, 0, FUNNEL_LABEL_INSIDE_PADDING]
							: placement.position === 'insideRight'
								? [topNudge, FUNNEL_LABEL_INSIDE_PADDING, 0, 0]
								: [topNudge, 0, 0, 0],
					rich: {
						name: {
							fontWeight: 600,
							fontSize: FUNNEL_NAME_FONT_SIZE,
							lineHeight: 16,
							color: nameColor
						},
						value: {
							fontSize: FUNNEL_VALUE_FONT_SIZE,
							lineHeight: 15,
							color: valueColor
						}
					}
				},
				showInLegend: true
			} as FunnelDataPoint & { showInLegend: boolean; extras?: Record<string, unknown> });
			// Spacer segment — zero height, no label, no extras (tooltip can
			// still fire on it in some layouts; leaving extras off avoids
			// rendering an extra rows block for the invisible spacer).
			labelTexts.push('');
			items.push({
				name: d.name,
				value: d.value,
				itemStyle: {
					height: 0,
					color: fill
				},
				label: {
					show: false
				},
				showInLegend: false
			} as FunnelDataPoint & { showInLegend: boolean });
		});

		// Rail width = widest label + the 8px hidden-labelLine gap to the segment
		// + a margin so text never kisses the canvas edge. Capped so a pathological
		// stage name can't squeeze out the chart.
		const outsideGutterPx =
			label_position === 'outside'
				? Math.min(maxOutsideLabelWidth + 8 + 12, (chartWidth || FALLBACK_CHART_WIDTH) * 0.4)
				: 0;
		return { items, labelTexts, outsideGutterPx };
	});

	const loading: boolean = $derived(query.loading);

	// Determine if server-side sampling was applied
	const isSampled = $derived(Boolean(query.samplingForced));

	const baseOptions = $derived<EChartsOption>({
		tooltip: {
			trigger: 'item',
			// Same layout combo_chart uses everywhere: bold stage header
			// at top, 2-column grid for the primary value row (with the
			// value column's displayAlias as the label), then any
			// tooltip_fields extras slot into the same grid.
			formatter(params: unknown) {
				const typedParams = params as {
					name: string;
					value: number;
					data?: { extras?: Record<string, unknown> };
				};
				const formattedValue = formatValue(
					typedParams.value,
					effectiveValueFmt,
					typedParams.value.toString()
				);
				const extraRows = renderTooltipExtras(processedTooltip.fields, typedParams.data?.extras);
				const percentSuffix =
					show_percent && firstStageValue > 0
						? ` (${formatPercentOfFirst(typedParams.value, firstStageValue)})`
						: '';

				return `
					<div class="flex flex-col">
						<span class="font-semibold">${escapeHtml(typedParams.name)}</span>
						<div class="grid grid-cols-[auto_auto] gap-x-4">
							<span>${escapeHtml(valueProcessed.displayAlias)}</span>
							<span class="text-right">${escapeHtml(formattedValue)}${percentSuffix}</span>
							${extraRows.join('')}
						</div>
					</div>
				`;
			}
		},
		color: color_palette,
		legend: {
			show: false,
			// Enable legend data so selection state can be managed
			data: funnelData.map((item) => item.name)
		},
		series: [
			{
				type: 'funnel',
				left:
					processedFunnel.outsideGutterPx && align !== 'right'
						? processedFunnel.outsideGutterPx
						: align === 'center'
							? '10%'
							: '0%',
				top: TOP_BORDER + '%',
				bottom: BOTTOM_BORDER + '%',
				width: processedFunnel.outsideGutterPx
					? Math.max(60, (chartWidth || FALLBACK_CHART_WIDTH) - processedFunnel.outsideGutterPx)
					: '80%',
				min: minMax.min,
				max: minMax.max,
				minSize: min_size,
				maxSize: max_size,
				gap: gap,
				funnelAlign: align as 'center' | 'left' | 'right',
				sort: 'none',
				label: {
					show: true,
					// Placement, colors, and rich styles are set per data item in
					// processedFunnel; this only supplies the precomputed text.
					formatter: function (params: unknown) {
						const { dataIndex } = params as { dataIndex: number };
						return processedFunnel.labelTexts[dataIndex] ?? '';
					}
				},
				// Outside labels sit directly beside their segment (or in the
				// outside rail), so leader lines are never drawn — the hidden
				// line's length still sets the segment-to-label gap.
				labelLine: {
					show: false,
					length: 8
				},
				labelLayout: {
					hideOverlap: true
				},
				emphasis: {
					focus: 'series'
				},
				data: processedFunnel.items
			}
		],
		animation: true,
		animationDuration: 800,
		animationEasing: 'cubicInOut'
	});

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

	// Force chart update when props change (ECharts doesn't auto-update some properties)
	$effect(() => {
		void align; // Track alignment changes
		void legend; // Track legend changes
		if (chart && ready && stableOptions.series) {
			// Give ECharts a moment to be ready, then update
			setTimeout(() => {
				chart?.setOption(stableOptions, { notMerge: false });
			}, 0);
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
		{#if chart && legend && legend_location === 'top'}
			<CustomLegend chartInstance={chart} legendMode="datapoints" />
		{/if}

		<ECharts
			bind:chart
			class={cn('h-full w-full flex-1', !height && 'min-h-[215px]')}
			options={stableOptions}
			group={props.connect_group}
		/>

		{#if chart && legend && legend_location === 'bottom'}
			<CustomLegend chartInstance={chart} legendMode="datapoints" />
		{/if}

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
