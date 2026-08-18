<script lang="ts">
	import type {
		EChartsOption,
		CandlestickSeriesOption,
		BarSeriesOption,
		XAXisComponentOption
	} from 'echarts';
	import ECharts from '../echarts/ECharts.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import SamplingIndicator from '../../common/SamplingIndicator.svelte';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import type { ECharts as EChartsInstance } from 'echarts';
	import { cn } from '../../../shadcn/utils';
	import { getQueryService } from '../../../QueryService.context';
	import type { SQLProps } from '../../common/sql-options';
	import { extractSQLProps } from '../../common/sql-options';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import { buildCandlestickSQLConfig } from './build-candlestick-sql';
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
	import { getEchartsType } from '../../common/typeConversions';
	import { getDefaultFormatForDateGrain } from '../../common/date-options';
	import { coerceBoolean, coerceNumber } from '../../common/process-variables';
	import { getElevatedChartTooltipCss } from '../../common/chart-tooltip-elevation';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { colorPalettes as defaultColorPalettes } from '../echarts/echarts-themes';
	import { mode } from 'mode-watcher';
	import {
		resolveTooltipFields,
		extractTooltipExtras,
		escapeHtml,
		renderTooltipExtras,
		type TooltipField
	} from '../../common/tooltip-fields';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();
	const themeContext = getThemeContext();

	type Props = UserComponentProps<typeof schema> & SQLProps;

	const props: Props = $props();
	const height = $derived(props.height);
	const filterIds = $derived(props.filters);
	const chart_options = $derived(props.chart_options);
	const upColor = $derived(
		chart_options?.up_color ?? themeContext.activeTheme.positive ?? '#00da3c'
	);
	const downColor = $derived(
		chart_options?.down_color ?? themeContext.activeTheme.negative ?? '#ec0000'
	);
	const zoom = $derived(chart_options?.zoom ?? false);
	const ZOOM_CLICK_THRESHOLD_PX = 5;

	const hasValidationErrors = $derived(hasBlockingErrors());

	const { limit } = $derived.by(() => extractSQLProps(props));

	const queryService = getQueryService();
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

	const { resolveText, resolveColumn, resolveSql } = $derived(createResolvers(variableProcessor));

	const tableName = $derived(resolveText(props.data));
	const x = $derived(resolveColumn(props.x));
	const openCol = $derived(resolveColumn(props.open));
	const highCol = $derived(resolveColumn(props.high));
	const lowCol = $derived(resolveColumn(props.low));
	const closeCol = $derived(resolveColumn(props.close));
	const volumeCol = $derived(resolveColumn(props.volume));
	const title = $derived(resolveText(props.title) || '');
	const subtitle = $derived(resolveText(props.subtitle) || '');
	const info = $derived(resolveText(props.info) || '');
	const info_link = $derived(resolveText(props.info_link) || '');
	const info_link_title = $derived(resolveText(props.info_link_title) || '');
	const where = $derived(resolveSql(props.where));
	const having = $derived(resolveSql(props.having));
	const order = $derived(resolveSql(props.order));
	const qualify = $derived(resolveSql(props.qualify));
	const resolvedDateRange = $derived(resolveText(props.date_range));
	const resolvedTooltipFields = $derived(
		resolveText(props.tooltip_fields) as TooltipField[] | undefined
	);
	const processedTooltip = $derived(
		resolveTooltipFields(resolvedTooltipFields, queryService.dialect)
	);
	const date_grain = $derived(resolveText(props.date_grain));
	const x_fmt = $derived(resolveText(props.x_fmt));
	const y_fmt = $derived(resolveText(props.y_fmt));
	const y2_fmt = $derived(resolveText(props.y2_fmt));

	const x_axis_options = $derived(resolveText(props.x_axis_options));
	const y_axis_options = $derived(resolveText(props.y_axis_options));

	const xProcessed = $derived.by(() => {
		return processColumnExpression(
			{
				value: x,
				dateGrain: date_grain,
				firstDayOfWeek: projectSettings.first_day_of_week
			},
			queryService.dialect
		);
	});

	const openProcessed = $derived(processColumnExpression({ value: openCol }, queryService.dialect));
	const highProcessed = $derived(processColumnExpression({ value: highCol }, queryService.dialect));
	const lowProcessed = $derived(processColumnExpression({ value: lowCol }, queryService.dialect));
	const closeProcessed = $derived(
		processColumnExpression({ value: closeCol }, queryService.dialect)
	);
	const volumeProcessed = $derived.by(() => {
		if (!volumeCol) return null;
		return processColumnExpression({ value: volumeCol }, queryService.dialect);
	});

	const xColumn = $derived(xProcessed.alias);
	const openColumn = $derived(openProcessed.alias);
	const highColumn = $derived(highProcessed.alias);
	const lowColumn = $derived(lowProcessed.alias);
	const closeColumn = $derived(closeProcessed.alias);
	const volumeColumn = $derived(volumeProcessed?.alias);

	const hasVolume = $derived(Boolean(volumeCol && volumeColumn));

	const queryConfig = $derived.by(() => {
		if (hasValidationErrors || !tableName) {
			return;
		}

		return buildCandlestickSQLConfig({
			data: tableName,
			x,
			open: openCol,
			high: highCol,
			low: lowCol,
			close: closeCol,
			volume: volumeCol,
			date_grain,
			filters: filterIds,
			where,
			date_range: resolvedDateRange,
			having,
			qualify,
			order,
			limit,
			firstDayOfWeek: projectSettings.first_day_of_week,
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
		return queryInfoContext?.registerQuery(componentId, 'candlestick', query, title);
	});

	$effect(() => {
		setError(query.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	const effectiveXFmt = $derived(
		x_fmt ??
			(date_grain &&
			[
				'month of year',
				'quarter of year',
				'day of week',
				'day of month',
				'week of year',
				'day of year',
				'year'
			].includes(date_grain)
				? getDefaultFormatForDateGrain(date_grain)
				: undefined)
	);

	const xColumnType = $derived.by(() => {
		const columns = query?.result?.columns;
		if (columns) {
			const xCol = columns.find((c) => c.name === xColumn);
			return xCol?.jsType as 'date' | 'number' | 'string' | undefined;
		}
		return undefined;
	});

	const xAxisType = $derived(getEchartsType(xColumnType));

	const candlestickData = $derived.by(() => {
		const fields = processedTooltip.fields;
		const hasExtras = fields.length > 0;
		return (data as DataPoint[]).map((row) => {
			const xVal = row[xColumn];
			const open = Number(row[openColumn]) || 0;
			const close = Number(row[closeColumn]) || 0;
			const low = Number(row[lowColumn]) || 0;
			const high = Number(row[highColumn]) || 0;
			const tuple = [xVal, open, close, low, high];
			if (!hasExtras) return tuple;
			return { value: tuple, extras: extractTooltipExtras(row, fields) };
		});
	});

	const volumeData = $derived.by(() => {
		if (!hasVolume || !volumeColumn) return [];
		return (data as DataPoint[]).map((row) => {
			const xVal = row[xColumn];
			const vol = Number(row[volumeColumn]) || 0;
			return [xVal, vol];
		});
	});

	// candlestickData items are tuples by default, or `{ value: [...], extras }`
	// when tooltip_fields is set. Unwrap so downstream x-axis / y-range
	// derivations stay positional.
	const candlestickTuples = $derived(candlestickData.map((d) => (Array.isArray(d) ? d : d.value)));

	const xData = $derived(
		candlestickTuples.map((d) => {
			const v = d[0];
			if (v instanceof Date) return v.toISOString();
			return (v ?? '') as string | number;
		})
	);

	const yRange = $derived.by(() => {
		const allValues = candlestickTuples.flatMap((d) => [d[1], d[2], d[3], d[4]]) as number[];
		const validValues = allValues.filter((v) => typeof v === 'number' && !isNaN(v));
		if (validValues.length === 0) return { min: null, max: null };
		return {
			min: Math.min(...validValues),
			max: Math.max(...validValues)
		};
	});

	const volumeRange = $derived.by(() => {
		if (!hasVolume) return { min: null, max: null };
		const allValues = volumeData.map((d) => d[1] as number);
		const validValues = allValues.filter((v) => typeof v === 'number' && !isNaN(v));
		if (validValues.length === 0) return { min: null, max: null };
		return {
			min: 0,
			max: Math.max(...validValues)
		};
	});

	const loading: boolean = $derived(query.loading);
	const isSampled = $derived(Boolean(query.samplingForced));

	const toolbox = $derived.by(() => {
		if (!zoom) return undefined;

		return {
			feature: {
				dataZoom: {
					show: true,
					icon: {
						zoom: '-',
						back: '-'
					}
				}
			}
		};
	});

	const chartMarginPx = 3;
	const xAxisFontSize = 12;

	// Dynamic boundary gap: more gap for fewer candles to prevent y-axis overlap
	// 1 candle centers naturally, 2-4 need more gap, 5+ use standard 3%
	const boundaryGapPercent = $derived.by(() => {
		const count = candlestickData.length;
		if (count <= 1) return 0; // Single candle centers naturally
		return Math.max(3, Math.ceil(25 / count));
	});

	const effectiveColorPalette = $derived.by(() => {
		const themePalette = themeContext.activeTheme.colorPalettes.default;
		if (themePalette && themePalette.length > 0) return themePalette;
		return defaultColorPalettes[mode.current ?? 'light'] ?? defaultColorPalettes.light;
	});

	const volumeBarColor = $derived(effectiveColorPalette[0] ?? '#5470c6');

	// Raises this chart's tooltip above the floating chat pane when rendered
	// inside it; '' (ECharts default) everywhere else.
	const elevatedTooltipCss = getElevatedChartTooltipCss();
	const baseOptions = $derived<EChartsOption>({
		tooltip: {
			trigger: 'axis',
			appendToBody: true,
			extraCssText: elevatedTooltipCss,
			axisPointer: {
				type: 'cross'
			},
			formatter: (params) => {
				const paramArray = Array.isArray(params) ? params : [params];
				const candleParam = paramArray.find((p) => p.seriesType === 'candlestick');
				const volumeParam = paramArray.find((p) => p.seriesType === 'bar');

				if (!candleParam || !candleParam.data) return '';

				const rawCandleData = candleParam.data as
					| [unknown, number, number, number, number]
					| { value: [unknown, number, number, number, number]; extras?: Record<string, unknown> };
				const dataArr = Array.isArray(rawCandleData) ? rawCandleData : rawCandleData.value;
				const extras = Array.isArray(rawCandleData) ? undefined : rawCandleData.extras;
				const [xVal, open, close, low, high] = dataArr;

				const xFormatted = formatValue(
					xVal,
					effectiveXFmt,
					xVal?.toString(),
					undefined,
					undefined,
					projectSettings.first_day_of_week
				);
				const openFormatted = formatValue(open, y_fmt, open.toString(), yRange);
				const closeFormatted = formatValue(close, y_fmt, close.toString(), yRange);
				const lowFormatted = formatValue(low, y_fmt, low.toString(), yRange);
				const highFormatted = formatValue(high, y_fmt, high.toString(), yRange);

				let volumeRow = '';
				if (volumeParam && volumeParam.data !== undefined) {
					const volData = volumeParam.data as [unknown, number];
					const vol = volData[1];
					const volFormatted = formatValue(vol, y2_fmt ?? 'num0', vol.toString(), volumeRange);
					volumeRow = `<span>Volume</span><span class="text-right">${escapeHtml(volFormatted)}</span>`;
				}

				const extraRows = renderTooltipExtras(processedTooltip.fields, extras).join('');

				return `
					<div class="flex flex-col">
						<span class="font-semibold">${escapeHtml(xFormatted)}</span>
						<div class="grid grid-cols-[auto_auto] gap-x-4">
							<span>Open</span><span class="text-right">${escapeHtml(openFormatted)}</span>
							<span>High</span><span class="text-right">${escapeHtml(highFormatted)}</span>
							<span>Low</span><span class="text-right">${escapeHtml(lowFormatted)}</span>
							<span>Close</span><span class="text-right">${escapeHtml(closeFormatted)}</span>
							${volumeRow}
							${extraRows}
						</div>
					</div>
				`;
			}
		},
		toolbox,
		grid: {
			top: chartMarginPx + 8 + 5,
			left: chartMarginPx,
			right: hasVolume ? chartMarginPx + 50 : chartMarginPx,
			bottom: chartMarginPx + xAxisFontSize + 25,
			containLabel: true
		},
		xAxis: {
			type: xAxisType === 'time' ? 'time' : 'category',
			data: xAxisType !== 'time' ? xData : undefined,
			...(xAxisType === 'time' ? { scale: true } : {}),
			boundaryGap:
				xAxisType === 'time' ? [`${boundaryGapPercent}%`, `${boundaryGapPercent}%`] : true,
			axisLine: { show: coerceBoolean(x_axis_options?.baseline) ?? true },
			axisTick: { show: coerceBoolean(x_axis_options?.ticks) ?? false },
			splitLine: { show: coerceBoolean(x_axis_options?.gridlines) ?? false },
			axisLabel: {
				show: coerceBoolean(x_axis_options?.labels) ?? true,
				formatter:
					xAxisType !== 'time' || effectiveXFmt
						? (value: unknown) => {
								return formatValue(
									value,
									effectiveXFmt,
									value?.toString(),
									undefined,
									undefined,
									projectSettings.first_day_of_week
								);
							}
						: undefined
			}
		} as XAXisComponentOption,
		yAxis: [
			{
				scale: coerceBoolean(y_axis_options?.fit_to_data) ?? true,
				min: coerceNumber(y_axis_options?.min),
				max: coerceNumber(y_axis_options?.max),
				axisLine: { show: coerceBoolean(y_axis_options?.baseline) ?? false },
				axisTick: { show: coerceBoolean(y_axis_options?.ticks) ?? false },
				splitLine: { show: coerceBoolean(y_axis_options?.gridlines) ?? true },
				axisLabel: {
					show: coerceBoolean(y_axis_options?.labels) ?? true,
					formatter: (value: unknown) => {
						return formatValue(value, y_fmt, value?.toString(), yRange);
					}
				}
			},
			...(hasVolume
				? [
						{
							scale: false,
							min: 0,
							max: (volumeRange.max ?? 0) * 3,
							position: 'right' as const,
							axisLine: { show: false },
							axisTick: { show: false },
							splitLine: { show: false },
							axisLabel: {
								show: true,
								formatter: (value: unknown) => {
									return formatValue(value, y2_fmt ?? 'num0', value?.toString(), volumeRange);
								}
							}
						}
					]
				: [])
		],
		series: [
			{
				type: 'candlestick',
				data: candlestickData,
				itemStyle: {
					color: upColor,
					color0: downColor,
					borderColor: upColor,
					borderColor0: downColor,
					borderWidth: 2
				},
				barMaxWidth: 50,
				yAxisIndex: 0
			} satisfies CandlestickSeriesOption,
			...(hasVolume
				? [
						{
							type: 'bar',
							data: volumeData,
							barMaxWidth: 50,
							yAxisIndex: 1,
							itemStyle: {
								color: volumeBarColor,
								opacity: 0.5
							}
						} satisfies BarSeriesOption
					]
				: [])
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

	let chart: EChartsInstance | undefined = $state(undefined);

	$effect(() => {
		if (!chart || !zoom) {
			return () => {};
		}

		const handleFinished = () => {
			if (chart) {
				chart.dispatchAction({
					type: 'takeGlobalCursor',
					key: 'dataZoomSelect',
					dataZoomSelectActive: true
				});
			}
		};

		chart.on('finished', handleFinished);
		handleFinished();

		return () => {
			chart?.off('finished', handleFinished);
		};
	});

	let mouseDownPos: { x: number; y: number } | null = $state(null);

	function handlePointerDown(e: MouseEvent | TouchEvent) {
		if (!zoom) return;
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		mouseDownPos = { x: clientX, y: clientY };
	}

	function handlePointerUp(e: MouseEvent | TouchEvent) {
		if (!zoom || !chart || !mouseDownPos) return;
		const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
		const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

		const deltaX = Math.abs(clientX - mouseDownPos.x);
		const deltaY = Math.abs(clientY - mouseDownPos.y);

		if (deltaX < ZOOM_CLICK_THRESHOLD_PX && deltaY < ZOOM_CLICK_THRESHOLD_PX) {
			chart.dispatchAction({
				type: 'dataZoom',
				start: 0,
				end: 100
			});
		}

		mouseDownPos = null;
	}
</script>

<div
	class="flex w-full flex-col"
	class:h-full={!height}
	style:height={height ? `${height}px` : undefined}
>
	{#if title || subtitle}
		<ComponentTitle {title} {subtitle} {info} {info_link} {info_link_title} />
	{/if}

	<button
		class="relative z-0 flex min-h-0 flex-1 cursor-default flex-col justify-end"
		onmousedown={zoom ? handlePointerDown : undefined}
		onmouseup={zoom ? handlePointerUp : undefined}
		ontouchstart={zoom ? handlePointerDown : undefined}
		ontouchend={zoom ? handlePointerUp : undefined}
	>
		<ECharts
			bind:chart
			class={cn('h-full w-full flex-1', !height && 'min-h-[215px]')}
			options={stableOptions}
			group={props.connect_group}
		/>

		{#if loading}
			<div class="absolute top-2 right-2">
				<LoaderCircle class="text-muted-foreground h-4 w-4 animate-spin [animation-duration:1s]" />
			</div>
		{/if}

		<SamplingIndicator {isSampled} dataLength={data.length} totalCount={query.count} />
	</button>
</div>
