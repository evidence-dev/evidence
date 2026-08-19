<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import ECharts from '../echarts/ECharts.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import InfoIcon from 'lucide-svelte/icons/info';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { Query } from '../../../Query.svelte';
	import type { UserComponentProps } from '../../types';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import type { ECharts as EChartsInstance } from 'echarts';
	import CustomLegend from '../echarts/CustomLegend.svelte';
	import { cn } from '../../../shadcn/utils';
	import { getQueryService } from '../../../QueryService.context';
	import { extractSQLProps, processFilterIds } from '../../common/sql-options';
	import { buildHistogramSQL } from './build-histogram-sql';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { formatValue } from '../../formatValue';
	import { getSeriesTypeMarker } from '../echarts/series-marker';
	import { escapeHtml } from '../../common/tooltip-fields';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { getAutoRefreshContext } from '../../../auto-refresh.context.svelte';
	import { mergeEchartsOptions } from '../../common/echarts-options-attributes';
	import { logger } from '../../../shims/logger';

	const { getComponentId, setError, hasBlockingErrors } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	export type HistogramUserProps = UserComponentProps<typeof schema>;
	export type HistogramInternalProps = {
		transformOptions?: (options: EChartsOption) => void;
		tagName?: string;
	};

	export type HistogramProps = HistogramUserProps & HistogramInternalProps;

	const props: HistogramProps = $props();
	const height = $derived(props.height);
	const fmt = $derived(props.fmt);
	const filterIds = $derived(props.filters);
	const legend_location = $derived(props.legend_location ?? 'top');
	const transformOptions = $derived(props.transformOptions);
	const chart_options = $derived(props.chart_options);
	const color_palette = $derived(chart_options?.color_palette);

	const hasValidationErrors = $derived(hasBlockingErrors());

	// Extract SQL props in a centralized way (limit doesn't support variables)
	const { limit } = $derived.by(() => extractSQLProps(props));

	const queryService = getQueryService();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();
	const themeContext = getThemeContext();

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
	const { resolveText, resolveColumn, resolveSql, resolveBoolean, resolveNumber } = $derived(
		createResolvers(variableProcessor)
	);

	// 3. Resolve props using appropriate resolver for each type
	const tableName = $derived(resolveText(props.data));
	const value = $derived(resolveColumn(props.value));
	const series = $derived(resolveColumn(props.series));
	const title = $derived(resolveText(props.title) || '');
	const subtitle = $derived(resolveText(props.subtitle) || '');
	const info = $derived(resolveText(props.info) || '');
	const info_link = $derived(resolveText(props.info_link) || '');
	const info_link_title = $derived(resolveText(props.info_link_title) || '');
	const where = $derived(resolveSql(props.where));
	const binCount = $derived(resolveNumber(props.bin_count));
	const binWidth = $derived(resolveNumber(props.bin_width));
	const legend = $derived(resolveBoolean(props.legend) ?? true);

	// Resolve table name through inline queries if available.
	// During editing, user may temporarily have invalid template syntax (e.g. unbalanced
	// brackets) which causes getInterpolated to throw. Fall back to the raw table name
	// to avoid crashing the page. Per COMPONENT_SYSTEM.md rule 4.
	const resolvedTableName = $derived.by(() => {
		if (!tableName) return tableName;
		try {
			return inlineQueries?.getInterpolated(tableName, queryService.dialect) || tableName;
		} catch (error) {
			logger.warn(error, 'Failed to interpolate inline query, using raw table name');
			return tableName;
		}
	});

	const sql = $derived.by(() => {
		if (hasValidationErrors) {
			return;
		}

		return buildHistogramSQL({
			data: resolvedTableName,
			value,
			series,
			where,
			filterSql: processFilterIds(filterIds, [repeatFilters, pageFilters], queryService.dialect),
			bin_count: binCount,
			bin_width: binWidth,
			limit
		});
	});
	const autoRefreshCtx = getAutoRefreshContext();
	const query = new Query(
		() => sql,
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
		return queryInfoContext?.registerQuery(componentId, 'histogram', query, title);
	});

	$effect(() => {
		setError(query.error ?? undefined);
	});

	const data = $derived(query.result?.rows ?? []);

	// ClickHouse now returns the histogram data directly
	const histogramData = $derived(data);

	// Group data by series if series column is specified
	const groupedData = $derived.by(() => {
		if (!series) {
			// For single series, use a consistent key and ensure clean data structure
			return { Frequency: histogramData };
		}

		const groups: Record<string, typeof histogramData> = {};
		for (const row of histogramData) {
			const seriesValue = String(row[series] ?? '');
			if (!groups[seriesValue]) {
				groups[seriesValue] = [];
			}
			groups[seriesValue].push(row);
		}
		return groups;
	});

	// Sample data if it exceeds 5000 bins
	function sampleData<T>(inputData: T[], maxRows = 2000): T[] {
		if (inputData.length <= maxRows) return inputData;

		const samplingInterval = Math.ceil(inputData.length / maxRows);
		return inputData.filter((_, index) => index % samplingInterval === 0);
	}

	// Apply sampling to each series
	const sampledGroupedData = $derived.by(() => {
		const sampled: Record<string, typeof histogramData> = {};
		for (const [seriesName, seriesData] of Object.entries(groupedData)) {
			sampled[seriesName] = sampleData(seriesData);
		}
		return sampled;
	});

	// Track if sampling was applied to any series
	const isSampled = $derived(
		Object.entries(groupedData).some(
			([seriesName, originalData]) => originalData.length > sampledGroupedData[seriesName].length
		)
	);

	const loading: boolean = $derived(query.loading);

	// Use the same constants as ComboChart
	const CHART_MARGIN_PX = 2;
	const X_AXIS_FONT_SIZE = 12;

	const baseOptions = $derived<EChartsOption>({
		color: color_palette,
		grid: {
			// +8 accounts for y-axis label
			top: CHART_MARGIN_PX + 8,
			left: CHART_MARGIN_PX,
			right: CHART_MARGIN_PX + 15, // Extra space for rightmost x-axis label
			// +8 is space between x-axis label and x-axis
			bottom: CHART_MARGIN_PX + X_AXIS_FONT_SIZE + 8
		},
		tooltip: {
			trigger: 'item',
			formatter: function (params: unknown) {
				// params.value[0] = bin midpoint
				// params.value[1] = frequency (count)
				// params.value[2] = bin min
				// params.value[3] = bin max
				// params.value[4] = string of bin range
				// params.value[5] = series name (if multi-series)

				const p = params as {
					value: (string | number)[];
					marker: string;
					seriesName: string;
				};
				const frequency = Math.round(p.value[1] as number)?.toLocaleString();
				const range = p.value[4]; // Already formatted range string

				// Generate square marker matching the series color
				const marker = getSeriesTypeMarker('custom', p.marker);

				// Build tooltip with marker
				const seriesRow = series
					? `<div style="display:flex;align-items:center;gap:4px;">${marker}<span>${escapeHtml(p.seriesName)}</span></div>`
					: '';

				return `
					<div style="display:flex;flex-direction:column;">
						${seriesRow}
						<div style="display:grid;grid-template-columns:auto auto;gap:4px 12px;">
							<span>Range</span>
							<span style="text-align:right;font-weight:500;">${escapeHtml(String(range))}</span>
							<span>Count</span>
							<span style="text-align:right;font-weight:500;">${frequency}</span>
						</div>
					</div>
				`;
			}
		},
		legend: {
			show: false
		},
		xAxis: {
			type: 'value',
			axisLabel: {
				formatter: (value: number) => formatValue(value, fmt),
				margin: 6,
				hideOverlap: true
			},
			splitLine: {
				show: false // Hide x-axis gridlines
			},
			axisLine: {
				show: true
			},
			axisTick: {
				show: false
			}
		},
		yAxis: (() => {
			// Calculate the actual maximum value that needs to be displayed
			let dataMax = 0;

			if (!series) {
				// Single series mode - find max frequency
				const singleSeriesData = Object.values(sampledGroupedData)[0] || [];
				dataMax = Math.max(
					...singleSeriesData.map((d) => Number((d as Record<string, unknown>).frequency || 0)),
					0
				);
			} else {
				// Multi-series mode - calculate max stacked value
				const seriesEntries = Object.entries(sampledGroupedData);

				if (seriesEntries.length > 0) {
					// Get all unique bins from all series
					const allBins = new Set<number>();
					seriesEntries.forEach(([, data]) => {
						data.forEach((d) => allBins.add((d as Record<string, unknown>).bin_start as number));
					});

					// Calculate maximum stacked frequency across all bins
					allBins.forEach((binStart) => {
						let binTotal = 0;
						seriesEntries.forEach(([, seriesData]) => {
							const dataPoint = seriesData.find(
								(d) => (d as Record<string, unknown>).bin_start === binStart
							);
							if (dataPoint) {
								binTotal += Number((dataPoint as Record<string, unknown>).frequency || 0);
							}
						});
						dataMax = Math.max(dataMax, binTotal);
					});
				}
			}

			// Calculate smart interval and max using our own algorithm
			function calculateNiceAxisRange(dataMax: number) {
				if (dataMax === 0) return { max: 10, interval: 2 };

				// Calculate the order of magnitude
				const magnitude = Math.pow(10, Math.floor(Math.log10(dataMax)));

				// Normalize the max to 1-10 range
				const normalizedMax = dataMax / magnitude;

				// Choose nice intervals based on the normalized value
				let niceInterval: number;
				let niceMax: number;

				if (normalizedMax <= 1) {
					niceInterval = 0.2 * magnitude;
					niceMax = Math.ceil(normalizedMax / 0.2) * 0.2 * magnitude;
				} else if (normalizedMax <= 2) {
					niceInterval = 0.5 * magnitude;
					niceMax = Math.ceil(normalizedMax / 0.5) * 0.5 * magnitude;
				} else if (normalizedMax <= 5) {
					niceInterval = 1 * magnitude;
					niceMax = Math.ceil(normalizedMax / 1) * 1 * magnitude;
				} else {
					niceInterval = 2 * magnitude;
					niceMax = Math.ceil(normalizedMax / 2) * 2 * magnitude;
				}

				return { max: niceMax, interval: niceInterval };
			}

			const { max, interval } = calculateNiceAxisRange(dataMax);

			return {
				type: 'value',
				name: 'Frequency',
				min: 0,
				max: max,
				interval: interval,
				minInterval: 1,
				nameMoveOverlap: false,
				nameGap: 6,
				nameLocation: 'end',
				nameTextStyle: {
					align: 'left',
					verticalAlign: 'top',
					padding: [0, 5, 0, 0]
				}
			};
		})(),
		series: (() => {
			// Get all unique bins from all series
			const allBins = new Set<number>();
			Object.values(sampledGroupedData).forEach((data) => {
				data.forEach((d) => allBins.add((d as Record<string, unknown>).bin_start as number));
			});
			const sortedBins = Array.from(allBins).sort((a, b) => a - b);

			const seriesEntries = Object.entries(sampledGroupedData);

			return seriesEntries.map(([seriesName, seriesData], seriesIndex) => {
				const seriesDataMap = new Map(
					seriesData.map((d) => [(d as Record<string, unknown>).bin_start, d])
				);
				const isMultiSeries = seriesEntries.length > 1;

				return {
					name: isMultiSeries ? seriesName : 'Frequency',
					type: 'custom',
					renderItem: function (params: unknown, api: unknown) {
						const binStart = (api as { value: (index: number) => number }).value(2);
						const binEnd = (api as { value: (index: number) => number }).value(3);
						const frequency = (api as { value: (index: number) => number }).value(1);

						let currentCumulative = 0;

						// For multi-series, calculate stacking
						if (isMultiSeries) {
							for (let i = 0; i < seriesIndex; i++) {
								const [, otherSeriesData] = seriesEntries[i];
								const otherDataPoint = otherSeriesData.find(
									(d) => (d as Record<string, unknown>).bin_start === binStart
								);
								if (otherDataPoint) {
									currentCumulative += Number(
										(otherDataPoint as Record<string, unknown>).frequency || 0
									);
								}
							}
						}

						const nextCumulative = currentCumulative + frequency;
						const start = (api as { coord: (coords: number[]) => number[] }).coord([
							binStart,
							currentCumulative
						]);
						const end = (api as { coord: (coords: number[]) => number[] }).coord([
							binEnd,
							nextCumulative
						]);
						const width = end[0] - start[0];
						const height = start[1] - end[1];

						// Get color from ECharts palette (resolved by ECharts based on series index)
						const barColor = (api as { visual: (type: string) => string }).visual('color');

						return {
							type: 'rect',
							shape: {
								x: start[0],
								y: end[1],
								width: isMultiSeries ? width : width - 1, // Small gap for single series only
								height: height
							},
							style: {
								fill: barColor,
								stroke: 'none',
								lineWidth: 0
							},
							// Enable series-level emphasis (fade other series on hover)
							focus: 'series',
							blur: {
								style: {
									opacity: 0.3
								}
							},
							// Enable transition animation for smooth updates when data changes
							transition: ['shape', 'style']
						};
					},
					data: sortedBins
						.map((binStart) => {
							const dataPoint = seriesDataMap.get(binStart);
							const typedDataPoint = dataPoint as Record<string, unknown> | undefined;
							const frequency = typedDataPoint ? Number(typedDataPoint.frequency || 0) : 0;
							const binEnd = typedDataPoint ? (typedDataPoint.bin_end as number) : binStart + 1;
							const rangeString = `${formatValue(binStart, fmt)} - ${formatValue(binEnd, fmt)}`;

							return isMultiSeries
								? [(binStart + binEnd) / 2, frequency, binStart, binEnd, rangeString, seriesName]
								: [(binStart + binEnd) / 2, frequency, binStart, binEnd, rangeString];
						})
						.filter((d) => (d[1] as number) > 0)
				};
			});
		})(),
		animation: true,
		animationDuration: 800,
		animationDurationUpdate: 500,
		animationEasing: 'cubicInOut',
		animationEasingUpdate: 'cubicInOut'
	});

	// Author escape hatches: deep-merge echarts_series_options into every
	// series entry, then echarts_options over the whole config (wins last).
	const options = $derived.by(() => mergeEchartsOptions(baseOptions, props));

	const ready = $derived(!query.loading);
	let stableOptions: EChartsOption = $state({});
	$effect(() => {
		if (ready) {
			transformOptions?.(options);
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
		{#if chart && series && legend && legend_location === 'top'}
			<CustomLegend chartInstance={chart} interactive={false} />
		{/if}

		<ECharts
			bind:chart
			class={cn('h-full w-full flex-1', !height && 'min-h-[215px]')}
			options={stableOptions}
			group={props.connect_group}
		/>

		{#if chart && series && legend && legend_location === 'bottom'}
			<CustomLegend chartInstance={chart} interactive={false} />
		{/if}

		<div class="absolute top-2 right-2">
			<LoaderCircle
				class="text-muted-foreground animate-spin [animation-duration:1s] {loading
					? 'opacity-100'
					: 'opacity-0'} h-4 w-4 transition-opacity duration-500"
			/>
		</div>

		{#if isSampled}
			<div class="group absolute top-0.5 right-0">
				<div class="bg-background rounded-sm p-0.5">
					<InfoIcon class="text-muted-foreground/60 h-3.5 w-3.5" />
				</div>
				<div
					class="bg-background text-foreground absolute top-0 right-0 z-10 hidden w-44 rounded-md p-1.5 text-[10px] shadow-md group-hover:block"
				>
					Showing {Math.round(
						(Object.values(sampledGroupedData).reduce((sum, data) => sum + data.length, 0) /
							Object.values(groupedData).reduce((sum, data) => sum + data.length, 0)) *
							100
					)}% sample of dataset ({Object.values(sampledGroupedData)
						.reduce((sum, data) => sum + data.length, 0)
						.toLocaleString()}
					of {Object.values(groupedData)
						.reduce((sum, data) => sum + data.length, 0)
						.toLocaleString()} bins)
				</div>
			</div>
		{/if}
	</div>
</div>
