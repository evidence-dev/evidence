<script lang="ts">
	import type { EChartsOption, CustomSeriesOption, CustomSeriesRenderItemReturn } from 'echarts';
	import type { ECharts as EChartsInstance } from 'echarts';
	import ECharts from '../echarts/ECharts.svelte';
	import CustomLegend from '../echarts/CustomLegend.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import SamplingIndicator from '../../common/SamplingIndicator.svelte';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import type { UserComponentProps, DataPoint } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { cn } from '../../../shadcn/utils';
	import { getDefaultConnection } from '../../../QueryService.context';
	import type { SQLProps } from '../../common/sql-options';
	import { extractSQLProps } from '../../common/sql-options';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { buildWaterfallChartSQLConfig } from './build-waterfall-chart-sql';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { Query } from '../../../Query.svelte';
	import { formatValue } from '../../formatValue';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { getAutoRefreshContext } from '../../../auto-refresh.context.svelte';
	import { mergeEchartsOptions } from '../../common/echarts-options-attributes';
	import { getDefaultFormatForDateGrain, type DateGrain } from '../../common/date-options';
	import { coerceBoolean, coerceNumber } from '../../common/process-variables';
	import { getElevatedChartTooltipCss } from '../../common/chart-tooltip-elevation';
	import {
		resolveTooltipFields,
		extractTooltipExtras,
		escapeHtml,
		renderTooltipExtras,
		type TooltipField
	} from '../../common/tooltip-fields';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getThemeToken } from '../../../theme/get-theme-token';
	import { getCardContext } from '../../common/card-context.svelte';
	import { colorPalettes as defaultColorPalettes } from '../echarts/echarts-themes';
	import { measureTextWidth } from '../funnel_chart/funnel-labels';
	import chroma from 'chroma-js';
	import {
		buildBreakdownSteps,
		buildWaterfallSteps,
		findUnmatchedTotals,
		formatStepLabel,
		getPresentKinds,
		getWaterfallExtent,
		type WaterfallBarKind,
		type WaterfallStep
	} from './waterfall-data';
	import {
		CONNECTOR_ALPHA,
		CONNECTOR_WIDTH_PX,
		LABEL_FONT_SIZE,
		LABEL_GAP_PX,
		MIN_BAR_HEIGHT_PX,
		barCornerRadius,
		labelPlacement,
		labelsFit,
		belowLabelRoomPx,
		requiredAxisFloor,
		resolveBarWidth,
		resolveSeriesStyleOverrides
	} from './waterfall-layout';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();
	const themeContext = getThemeContext();
	const cardContext = getCardContext();
	const useCardColors = $derived(Boolean(cardContext?.insideCard));
	const activeTheme = $derived(themeContext.activeTheme);

	type Props = UserComponentProps<typeof schema> & SQLProps;

	const props: Props = $props();
	const height = $derived(props.height);
	const filterIds = $derived(props.filters);
	const chart_options = $derived(props.chart_options);
	const legend_location = $derived(props.legend_location ?? 'top');
	const showConnectors = $derived(props.connectors ?? true);
	const appendTotal = $derived(props.total ?? true);
	const totalsList = $derived((props.totals ?? []).map((t) => String(t)));

	const hasValidationErrors = $derived(hasBlockingErrors());

	const {
		where: rawWhere,
		having: rawHaving,
		limit,
		order: rawOrder,
		qualify: rawQualify
	} = $derived.by(() => extractSQLProps(props));

	const connection = getDefaultConnection();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();
	const getProjectSettings = getProjectSettingsContext();
	const projectSettings = $derived(getProjectSettings());

	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText, resolveColumn, resolveSql, resolveBoolean } = $derived(
		createResolvers(variableProcessor)
	);

	const tableName = $derived(resolveText(props.data));
	const x = $derived(resolveColumn(props.x));
	const y = $derived(resolveColumn(props.y));
	const barType = $derived(resolveColumn(props.bar_type));
	const breakdown = $derived(resolveColumn(props.breakdown));
	const breakdownLimit = $derived(props.breakdown_limit);
	const title = $derived(resolveText(props.title) || '');
	const subtitle = $derived(resolveText(props.subtitle) || '');
	const info = $derived(resolveText(props.info) || '');
	const info_link = $derived(resolveText(props.info_link) || '');
	const info_link_title = $derived(resolveText(props.info_link_title) || '');
	const totalLabel = $derived(resolveText(props.total_label) || 'Total');
	const where = $derived(resolveSql(props.where) ?? rawWhere);
	const having = $derived(resolveSql(props.having) ?? rawHaving);
	const order = $derived(resolveSql(props.order) ?? rawOrder);
	const qualify = $derived(resolveSql(props.qualify) ?? rawQualify);
	const resolvedDateRange = $derived(resolveText(props.date_range) ?? props.date_range);
	const date_grain = $derived(resolveText(props.date_grain) as DateGrain | undefined);
	const x_fmt = $derived(resolveText(props.x_fmt));
	const y_fmt = $derived(resolveText(props.y_fmt));
	const showLegend = $derived(resolveBoolean(props.legend) ?? true);
	const x_axis_options = $derived(resolveText(props.x_axis_options));
	const y_axis_options = $derived(resolveText(props.y_axis_options));
	const resolvedTooltipFields = $derived(
		resolveText(props.tooltip_fields) as TooltipField[] | undefined
	);
	const processedTooltip = $derived(
		resolveTooltipFields(resolvedTooltipFields, connection.dialect)
	);

	const xProcessed = $derived(
		processColumnExpression(
			{ value: x, dateGrain: date_grain, firstDayOfWeek: projectSettings.first_day_of_week },
			connection.dialect
		)
	);
	const yProcessed = $derived(processColumnExpression({ value: y }, connection.dialect));
	const barTypeProcessed = $derived(
		barType ? processColumnExpression({ value: barType }, connection.dialect) : null
	);
	const breakdownProcessed = $derived(
		breakdown ? processColumnExpression({ value: breakdown }, connection.dialect) : null
	);

	const xColumn = $derived(xProcessed.alias);
	const yColumn = $derived(yProcessed.alias);
	const barTypeColumn = $derived(barTypeProcessed?.alias);
	const breakdownColumn = $derived(breakdownProcessed?.alias);

	const queryConfig = $derived.by(() => {
		if (hasValidationErrors || !tableName) return;

		return buildWaterfallChartSQLConfig({
			data: tableName,
			x,
			y,
			bar_type: barType,
			breakdown,
			date_grain,
			x_sort: props.x_sort,
			filters: filterIds,
			where,
			having,
			qualify,
			order,
			limit,
			date_range: resolvedDateRange,
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
		return queryInfoContext?.registerQuery(componentId, 'waterfall_chart', query, title);
	});

	const data = $derived((query.result?.rows ?? []) as DataPoint[]);
	const loading: boolean = $derived(query.loading);
	const isSampled = $derived(Boolean(query.samplingForced));

	const xIsDate = $derived.by(() => {
		const col = query.result?.columns?.find((c) => c.name === xColumn);
		return col?.jsType === 'date';
	});
	const effectiveXFmt = $derived(
		x_fmt ?? getDefaultFormatForDateGrain(date_grain) ?? (xIsDate ? 'date' : undefined)
	);

	const formatXName = (raw: unknown): string => {
		if (raw === null || raw === undefined) return 'null';
		if (!effectiveXFmt) return String(raw);
		return formatValue(
			raw,
			effectiveXFmt,
			String(raw),
			undefined,
			undefined,
			projectSettings.first_day_of_week
		);
	};

	const xOrder = $derived(Array.isArray(props.x_sort) ? props.x_sort : undefined);
	const steps: WaterfallStep[] = $derived.by(() => {
		if (breakdownColumn) {
			return buildBreakdownSteps(data, {
				xColumn,
				yColumn,
				breakdownColumn,
				xOrder,
				limit: breakdownLimit,
				formatName: formatXName
			});
		}
		return buildWaterfallSteps(data, {
			xColumn,
			yColumn,
			barTypeColumn,
			totals: totalsList,
			xOrder,
			appendTotal,
			totalLabel,
			formatName: formatXName,
			extractExtras:
				processedTooltip.fields.length > 0
					? (row) => extractTooltipExtras(row, processedTooltip.fields)
					: undefined
		});
	});

	// A mistyped `totals` entry would silently render as a change bar, so it is reported like any other misconfiguration.
	const unmatchedTotals = $derived(
		!breakdownColumn && !loading
			? findUnmatchedTotals(data, { xColumn, totals: totalsList, formatName: formatXName })
			: []
	);
	const unmatchedTotalsError = $derived.by(() => {
		if (unmatchedTotals.length === 0) return undefined;
		const list = unmatchedTotals.map((t) => `"${t}"`).join(', ');
		return `No row matches the totals ${unmatchedTotals.length === 1 ? 'entry' : 'entries'} ${list}. Check the spelling against the ${xProcessed.displayAlias} values; unmatched rows render as changes, not totals.`;
	});

	$effect(() => {
		setError(query.error ?? unmatchedTotalsError);
	});

	// === COLORS ===
	const palette = $derived.by(() => {
		const themePalette = activeTheme.colorPalettes.default;
		if (themePalette && themePalette.length > 0) return themePalette;
		return defaultColorPalettes.light;
	});
	const kindColors = $derived<Record<WaterfallBarKind, string>>({
		increase: chart_options?.increase_color ?? activeTheme.positive ?? '#16a34a',
		decrease: chart_options?.decrease_color ?? activeTheme.negative ?? '#ef4444',
		total: chart_options?.total_color ?? palette[0] ?? '#154886'
	});
	const KIND_LEGEND_NAMES: Record<WaterfallBarKind, string> = {
		increase: 'Increase',
		decrease: 'Decrease',
		total: 'Total'
	};
	const legendEntries = $derived(
		getPresentKinds(steps).map((kind) => ({
			name: KIND_LEGEND_NAMES[kind],
			color: kindColors[kind]
		}))
	);

	// echarts_series_options can't reach elements a custom series draws, so the styling keys are applied by hand.
	const seriesStyle = $derived(resolveSeriesStyleOverrides(props.echarts_series_options));
	// Label color precedence: echarts_series_options.label.color > chart_options.label_color > theme foreground.
	// "inherit" (either spelling) colors each label like its bar.
	const labelInherit = $derived(
		seriesStyle.labelInherit ||
			(chart_options?.label_color === 'inherit' && seriesStyle.label.fill === undefined)
	);
	const labelColor = $derived(
		(seriesStyle.label.fill as string | undefined) ??
			(chart_options?.label_color !== 'inherit' ? chart_options?.label_color : undefined) ??
			getThemeToken(activeTheme, 'foreground', useCardColors)
	);
	const labelFillFor = (fill: string): string => (labelInherit ? fill : labelColor);
	const connectorColor = $derived.by(() => {
		if (chart_options?.connector_color) return chart_options.connector_color;
		const token = getThemeToken(activeTheme, 'mutedForeground', useCardColors);
		try {
			return chroma(token).alpha(CONNECTOR_ALPHA).css();
		} catch {
			return token;
		}
	});
	const labelFontFamily = $derived(
		activeTheme.chart?.fontFamily ?? activeTheme.fonts?.body ?? 'Inter, sans-serif'
	);
	const barRadius = $derived(activeTheme.chart?.barRadius ?? 0);
	const labelFontSize = $derived(seriesStyle.labelFontSize ?? LABEL_FONT_SIZE);
	const showLabels = $derived((props.labels ?? true) && seriesStyle.labelShow);

	const fitToData = $derived(coerceBoolean(y_axis_options?.fit_to_data) ?? false);

	// === VALUE FORMATTING ===
	// One range for axis, labels and tooltip; sized by the visible span so fit_to_data ticks stay distinct.
	const yRange = $derived.by(() => {
		const { min, max } = getWaterfallExtent(steps, { includeZero: !fitToData });
		const span = max - min;
		return { min, max: span > 0 ? span : Math.abs(max) };
	});
	const formatY = (value: number): string => formatValue(value, y_fmt, String(value), yRange);
	const labelTexts = $derived(steps.map((step) => formatStepLabel(step, formatY)));
	const labelFont = $derived(
		`${seriesStyle.label.fontWeight ?? ''} ${labelFontSize}px ${String(seriesStyle.label.fontFamily ?? labelFontFamily)}`.trim()
	);
	const maxLabelWidth = $derived(
		labelTexts.reduce((max, text) => Math.max(max, measureTextWidth(text, labelFont)), 0)
	);
	// Headroom for labels above bars; labels below lower the axis floor instead so the gutter matches bar_chart.
	const labelBudgetPx = $derived(labelFontSize + LABEL_GAP_PX);

	const chartMarginPx = 3;
	const xAxisFontSize = 12;
	const gridTopPx = $derived(chartMarginPx + 8 + (showLabels ? labelBudgetPx : 0));
	const gridBottomPx = chartMarginPx + xAxisFontSize + 12;

	let chartHeightPx = $state(0);
	$effect(() => {
		const dom = chart?.getDom();
		if (!chart || !dom) return;
		const instance = chart;
		const observer = new ResizeObserver(() => {
			chartHeightPx = instance.getHeight();
		});
		observer.observe(dom);
		chartHeightPx = instance.getHeight();
		return () => observer.disconnect();
	});
	const DEFAULT_CHART_HEIGHT_PX = 215;
	const plotHeightPx = $derived(
		Math.max(0, (chartHeightPx || DEFAULT_CHART_HEIGHT_PX) - gridTopPx - gridBottomPx)
	);

	const belowLabelFloor = $derived.by(() => {
		if (!showLabels) return undefined;
		const { min, max } = getWaterfallExtent(steps, { includeZero: !fitToData });
		return requiredAxisFloor({
			steps,
			extentMin: min,
			extentMax: max,
			plotHeightPx,
			labelRoomPx: belowLabelRoomPx(labelFontSize)
		});
	});

	// Left to ECharts unless a user value, fit_to_data padding or a below-bar label at the floor needs it.
	const yAxisMin = $derived.by(() => {
		const explicit = coerceNumber(y_axis_options?.min);
		if (explicit !== undefined) return explicit;
		if (!fitToData && belowLabelFloor === undefined) return undefined;
		const labelFloor = belowLabelFloor;
		return ({ min, max }: { min: number; max: number }) => {
			// Totals only feed their top into the extent, so a fixed floor must re-include zero itself.
			let floor = Math.min(min, 0);
			if (fitToData) {
				const span = max - min;
				floor = min - (span > 0 ? span * 0.1 : Math.abs(min) * 0.1 || 1);
			}
			if (labelFloor !== undefined) floor = Math.min(floor, labelFloor);
			return floor;
		};
	});
	// A computed floor is not a round number; its tick label would crowd the first real tick.
	const hideMinLabel = $derived(typeof yAxisMin === 'function');

	const elevatedTooltipCss = getElevatedChartTooltipCss();

	const baseOptions = $derived<EChartsOption>({
		color: [kindColors.total, kindColors.increase, kindColors.decrease],
		tooltip: {
			trigger: 'axis',
			appendToBody: true,
			extraCssText: elevatedTooltipCss,
			axisPointer: { type: 'shadow' },
			formatter: (params) => {
				const first = Array.isArray(params) ? params[0] : params;
				const dataIndex = (first as { dataIndex?: number } | undefined)?.dataIndex;
				const step = dataIndex === undefined ? undefined : steps[dataIndex];
				if (!step) return '';

				const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${kindColors[step.kind]};margin-right:6px;vertical-align:middle;"></span>`;
				const rows: string[] = [];
				if (step.kind === 'total') {
					rows.push(
						`<span>Total</span><span class="text-right">${escapeHtml(formatY(step.value))}</span>`
					);
				} else {
					rows.push(
						`<span>Change</span><span class="text-right">${escapeHtml(formatStepLabel(step, formatY))}</span>`,
						`<span>Running total</span><span class="text-right">${escapeHtml(formatY(step.end))}</span>`
					);
				}
				rows.push(...renderTooltipExtras(processedTooltip.fields, step.extras));

				const contextLine = step.context
					? `<span class="text-muted-foreground text-xs">${escapeHtml(step.context)}</span>`
					: '';

				return `
					<div class="flex flex-col">
						<span class="font-semibold">${marker}${escapeHtml(step.name)}</span>
						${contextLine}
						<div class="grid grid-cols-[auto_auto] gap-x-4">${rows.join('')}</div>
					</div>
				`;
			}
		},
		legend: { show: false },
		grid: {
			top: gridTopPx,
			left: chartMarginPx,
			right: chartMarginPx,
			bottom: gridBottomPx
		},
		xAxis: {
			type: 'category',
			data: steps.map((s) => s.name),
			boundaryGap: true,
			axisLine: { show: coerceBoolean(x_axis_options?.baseline) ?? true },
			axisTick: { show: coerceBoolean(x_axis_options?.ticks) ?? false, alignWithLabel: true },
			splitLine: { show: coerceBoolean(x_axis_options?.gridlines) ?? false },
			axisLabel: {
				show: coerceBoolean(x_axis_options?.labels) ?? true,
				...(coerceNumber(x_axis_options?.label_rotate) !== undefined
					? { rotate: coerceNumber(x_axis_options?.label_rotate) }
					: {})
			}
		},
		yAxis: {
			type: 'value',
			name: y_axis_options?.title,
			nameLocation: 'end',
			nameGap: 0,
			nameMoveOverlap: false,
			nameTextStyle: {
				align: 'left',
				verticalAlign: 'middle',
				padding: [1, 5, 1, 0]
			},
			scale: fitToData,
			min: yAxisMin,
			max: coerceNumber(y_axis_options?.max),
			interval: coerceNumber(y_axis_options?.interval),
			axisLine: { show: coerceBoolean(y_axis_options?.baseline) ?? false, onZero: false },
			axisTick: { show: coerceBoolean(y_axis_options?.ticks) ?? false },
			...(coerceBoolean(y_axis_options?.gridlines) !== undefined
				? { splitLine: { show: coerceBoolean(y_axis_options?.gridlines) } }
				: {}),
			axisLabel: {
				show: coerceBoolean(y_axis_options?.labels) ?? true,
				margin: 4,
				showMinLabel: hideMinLabel ? false : undefined,
				formatter: (value: number) => formatY(value)
			}
		},
		series: [
			{
				type: 'custom',
				name: 'Waterfall',
				// Totals feed only their top (so fit_to_data can drop zero); changes feed both edges (zero-crossers).
				encode: { x: 0, y: [1, 2] },
				data: steps.map((step, i) => [i, step.kind === 'total' ? step.end : step.start, step.end]),
				clip: false,
				renderItem: (params, api) => {
					const dataIndex = params.dataIndex;
					const step = steps[dataIndex];
					if (!step) return;

					// Elements are unclipped (labels sit outside the plot), so bars are clamped to it by hand.
					const coordSys = params.coordSys as unknown as { y: number; height: number };
					const plotTop = coordSys.y;
					const plotBottom = coordSys.y + coordSys.height;
					const clampY = (value: number) => Math.min(plotBottom, Math.max(plotTop, value));

					const [barX, rawYStart] = api.coord([dataIndex, step.start]) as [number, number];
					const [, rawYEnd] = api.coord([dataIndex, step.end]) as [number, number];
					const yStart = clampY(rawYStart);
					const yEnd = clampY(rawYEnd);
					const slotWidth = (api.size?.([1, 0]) as [number, number] | undefined)?.[0] ?? 0;
					const barWidth = resolveBarWidth(slotWidth);
					const top = Math.min(yStart, yEnd);
					const barHeight = Math.max(Math.abs(yEnd - yStart), MIN_BAR_HEIGHT_PX);
					// A series-level itemStyle.color wins over the kind color, and inherited labels follow what is drawn.
					const fill = (seriesStyle.bar.fill as string | undefined) ?? kindColors[step.kind];

					const children: unknown[] = [
						{
							type: 'rect',
							shape: {
								x: barX - barWidth / 2,
								y: top,
								width: barWidth,
								height: barHeight,
								r: seriesStyle.barRadius ?? barCornerRadius(step, barRadius)
							},
							style: { fill, ...seriesStyle.bar },
							transition: ['shape', 'style'],
							enterFrom: { style: { opacity: 0 } }
						}
					];

					if (showConnectors && dataIndex < steps.length - 1) {
						const [nextX] = api.coord([dataIndex + 1, step.end]) as [number, number];
						children.push({
							type: 'line',
							silent: true,
							shape: {
								x1: barX + barWidth / 2,
								y1: yEnd,
								x2: nextX - barWidth / 2,
								y2: yEnd
							},
							style: {
								stroke: connectorColor,
								lineWidth: CONNECTOR_WIDTH_PX,
								...seriesStyle.connector
							},
							transition: ['shape'],
							enterFrom: { style: { opacity: 0 } }
						});
					}

					if (showLabels && labelsFit(maxLabelWidth, slotWidth)) {
						const above = labelPlacement(step) === 'above';
						children.push({
							type: 'text',
							silent: true,
							style: {
								text: labelTexts[dataIndex] ?? '',
								x: barX,
								y: above ? top - LABEL_GAP_PX : top + barHeight + LABEL_GAP_PX,
								align: 'center',
								verticalAlign: above ? 'bottom' : 'top',
								fill: labelFillFor(fill),
								fontSize: labelFontSize,
								fontFamily: labelFontFamily,
								...seriesStyle.label
							},
							transition: ['style'],
							enterFrom: { style: { opacity: 0 } }
						});
					}

					return { type: 'group', children } as unknown as CustomSeriesRenderItemReturn;
				}
			} satisfies CustomSeriesOption
		],
		animation: true,
		animationDuration: 600,
		animationDurationUpdate: 400,
		animationEasing: 'cubicOut',
		animationEasingUpdate: 'cubicOut'
	});

	const options = $derived.by(() => mergeEchartsOptions(baseOptions, props));

	const ready = $derived(!query.loading);
	let stableOptions: EChartsOption = $state({});
	$effect(() => {
		if (ready) {
			stableOptions = options;
		}
	});

	let chart: EChartsInstance | undefined = $state(undefined);
	// Rotated x labels ask for more room; grow this container in px (like ComboChart) rather than
	// letting the ECharts wrapper fall back to a percentage min-height that collapses in flex rows.
	let xAxisExtraHeight = $state(0);
</script>

<div
	class="flex w-full flex-col"
	class:h-full={!height}
	style:height={height ? `${height + xAxisExtraHeight}px` : undefined}
>
	{#if title || subtitle}
		<ComponentTitle {title} {subtitle} {info} {info_link} {info_link_title} />
	{/if}

	<div class="relative z-0 flex min-h-0 flex-1 flex-col justify-end">
		{#if showLegend && legend_location === 'top'}
			<CustomLegend legendMode="custom" interactive={false} customLegendData={legendEntries} />
		{/if}

		<ECharts
			bind:chart
			class={cn('h-full w-full flex-1', !height && 'min-h-[215px]')}
			style={!height && xAxisExtraHeight > 0
				? `min-height: ${DEFAULT_CHART_HEIGHT_PX + xAxisExtraHeight}px`
				: undefined}
			options={stableOptions}
			group={props.connect_group}
			onExtraHeightChange={(extraHeight) => {
				xAxisExtraHeight = extraHeight;
			}}
		/>

		{#if showLegend && legend_location === 'bottom'}
			<CustomLegend legendMode="custom" interactive={false} customLegendData={legendEntries} />
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
