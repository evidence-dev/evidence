<script lang="ts">
	import type { ECharts } from 'echarts';
	import { slide, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { untrack } from 'svelte';
	import { logger } from '../../../shims/logger';
	import {
		getMarkerShape,
		getRenderedSeriesColor,
		type MarkerShape,
		type LineStyleType,
		type SeriesColorValue
	} from './series-marker';

	type ChartDataPoint = {
		name: string;
		value: number;
		itemStyle?: { color?: string };
		showInLegend?: boolean;
	};

	let {
		chartInstance,
		legendMode = 'series',
		interactive = true,
		customLegendData
	} = $props<{
		chartInstance?: ECharts;
		legendMode?: 'series' | 'datapoints' | 'custom';
		interactive?: boolean;
		customLegendData?: Array<{ name: string; color: string }>;
	}>();

	let series = $state<
		Array<{
			name: string;
			color: string;
			visible: boolean;
			type: string;
			shape: MarkerShape;
			lineStyle?: LineStyleType;
		}>
	>([]);
	let selectedSeries = $state<Set<string>>(new Set());
	let showAll = $state(false);
	let containerWidth = $state(0);
	let containerRef: HTMLDivElement | undefined = $state();

	// Approximate width of each legend item (in pixels)
	const ITEM_WIDTH = 100;
	const MAX_ROWS_MOBILE = 2;
	const MAX_ROWS_DESKTOP = 4;
	const MIN_ITEMS_TO_HIDE = 3; // Only hide if we'd hide at least this many items

	// Use $derived to compute synchronously before render (prevents flash of "+X more")
	let maxItems = $derived.by(() => {
		// Don't collapse items until we have a valid container width measurement
		if (containerWidth === 0) {
			return series.length;
		}

		const isMobile = containerWidth < 640; // Tailwind's sm breakpoint
		const itemsPerRow = Math.max(2, Math.floor(containerWidth / ITEM_WIDTH));
		const maxRows = isMobile ? MAX_ROWS_MOBILE : MAX_ROWS_DESKTOP;

		// Calculate how many complete rows we can show
		const completeRows = Math.floor(series.length / itemsPerRow);

		if (completeRows <= maxRows) {
			// If all rows are complete or we have space for all items, show everything
			return series.length;
		} else {
			// Calculate items that would fit in complete rows plus the remaining space in the last row
			const baseItems = maxRows * itemsPerRow;
			const remainingSpace = containerWidth - (series.length % itemsPerRow) * ITEM_WIDTH;
			const extraItemsInLastRow = Math.floor(remainingSpace / ITEM_WIDTH);
			const totalPossibleItems = baseItems + extraItemsInLastRow;

			// Only hide items if we'd hide at least MIN_ITEMS_TO_HIDE
			return series.length - totalPossibleItems < MIN_ITEMS_TO_HIDE
				? series.length
				: totalPossibleItems;
		}
	});

	$effect(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			containerWidth = entries[0].contentRect.width;
		});

		if (containerRef) {
			resizeObserver.observe(containerRef);
			return () => resizeObserver.disconnect();
		}
	});

	function updateLegend() {
		if (legendMode === 'custom') {
			// For custom legend mode, use the provided custom data
			if (customLegendData) {
				series = customLegendData.map((item: { name: string; color: string }) => ({
					name: item.name,
					color: item.color,
					visible: true,
					type: 'bar',
					shape: getMarkerShape('bar') // Use bar type for square icons
				}));
			}
			return;
		}

		if (!chartInstance) return;
		try {
			const option = chartInstance.getOption();
			if (!option?.series) return;

			const seriesData = Array.isArray(option.series) ? option.series : [option.series];
			const colors = (option.color as string[]) || [];

			type SeriesType = {
				name: string;
				color?: SeriesColorValue;
				itemStyle?: { color?: SeriesColorValue };
				type?: string;
				lineStyle?: { type?: LineStyleType; color?: SeriesColorValue };
				data?: Array<{ name: string; value: number; itemStyle?: { color?: string } }>;
			};

			if (legendMode === 'datapoints') {
				// For charts with datapoint-based legends (pie, funnel, etc.)
				const firstSeries = seriesData[0] as SeriesType;
				if (firstSeries?.data) {
					const legendData = firstSeries.data.filter(
						(dataPoint: ChartDataPoint) => dataPoint.showInLegend !== false
					);

					const seriesType = firstSeries.type || 'pie';
					series = legendData.map((dataPoint, index) => ({
						name: dataPoint.name,
						color: dataPoint.itemStyle?.color || colors[index % colors.length] || '#000',
						visible: !selectedSeries.has(dataPoint.name),
						type: seriesType,
						shape: getMarkerShape(seriesType)
					}));
				}
			} else {
				// For charts with series-based legends (line, bar, area, scatter, etc.)
				series = seriesData
					.filter(
						(s: unknown): s is SeriesType =>
							typeof s === 'object' &&
							s !== null &&
							'name' in s &&
							typeof (s as Record<string, unknown>).name === 'string'
					)
					.map((s: SeriesType, index: number) => {
						const seriesType = s.type || 'line';
						const paletteColor = colors[index % colors.length] || '#000';
						return {
							name: s.name,
							color: getRenderedSeriesColor(s, paletteColor),
							visible: !selectedSeries.has(s.name),
							type: seriesType,
							shape: getMarkerShape(seriesType),
							lineStyle: s.lineStyle?.type
						};
					});
			}
		} catch (e) {
			logger.error(e, 'Error updating legend');
		}
	}

	function toggleSeries(name: string, event: MouseEvent) {
		if (!chartInstance || !interactive) return;

		if (event.ctrlKey || event.metaKey) {
			// Exclusive selection with Ctrl/Cmd key
			selectedSeries.clear();
			selectedSeries.add(name);
		} else {
			// Additive selection by default
			if (selectedSeries.size === 0) {
				// All series are currently visible, hide all except the clicked one
				series.forEach((s) => {
					if (s.name !== name) {
						selectedSeries.add(s.name);
					}
				});
			} else if (selectedSeries.has(name)) {
				// Remove this series from the hidden set
				selectedSeries.delete(name);

				// If all series are now visible (none are hidden), reset the selection state
				if (selectedSeries.size === 0) {
					// This will show all series
					selectedSeries.clear();
				}
			} else {
				// Add this series to the hidden set
				selectedSeries.add(name);

				// If all series would be hidden, reset to show all
				if (selectedSeries.size === series.length) {
					selectedSeries.clear();
				}
			}
		}

		// Update the chart - use the same selection logic for all chart types
		chartInstance.setOption({
			legend: {
				selected: Object.fromEntries(series.map((s) => [s.name, !selectedSeries.has(s.name)]))
			}
		});

		updateLegend();
	}

	$effect(() => {
		if (legendMode === 'custom') {
			// For custom mode, just update once with the provided data
			updateLegend();
			return;
		}

		if (!chartInstance) return;

		chartInstance.on('rendered', updateLegend);
		chartInstance.on('legendselectchanged', updateLegend);

		const oldChartInstance = untrack(() => chartInstance);
		return () => {
			oldChartInstance.off('rendered', updateLegend);
			oldChartInstance.off('legendselectchanged', updateLegend);
		};
	});
</script>

{#if series.length > 1}
	<div class="mx-1 flex w-full flex-col items-center justify-center">
		<div bind:this={containerRef} class="inline-flex flex-wrap" style="max-width: 95%;">
			{#each series.slice(0, showAll ? undefined : maxItems) as { name, color, visible, shape, lineStyle }}
				<div transition:slide|local={{ duration: 200, easing: cubicOut }} class="scale-100">
					<button
						class="text-muted-foreground flex items-center rounded px-2 py-1 text-xs transition-all duration-200 {interactive
							? 'hover:bg-accent'
							: 'cursor-default'}"
						class:opacity-50={!visible && interactive}
						onclick={(e: MouseEvent) => toggleSeries(name, e)}
					>
						{#if shape === 'line'}
							<span class="mr-1 flex h-3 items-center">
								{#if lineStyle === 'dashed'}
									<span class="h-0 w-3.5 border-b-[2.5px] border-dashed" style:border-color={color}
									></span>
								{:else if lineStyle === 'dotted'}
									<span class="h-0 w-3.5 border-b-[2.5px] border-dotted" style:border-color={color}
									></span>
								{:else}
									<span class="h-[2.5px] w-3.5" style:background={color}></span>
								{/if}
							</span>
						{:else if shape === 'circle'}
							<span class="mr-1 h-2.5 w-2.5 rounded-full" style:background={color}></span>
						{:else if shape === 'square'}
							<span class="mr-1 h-2.5 w-2.5" style:background={color}></span>
						{:else}
							<span class="mr-1 h-2.5 w-2.5 rounded-sm" style:background={color}></span>
						{/if}
						{name}
					</button>
				</div>
			{/each}
			{#if series.length > maxItems}
				<button
					class="text-muted-foreground hover:bg-accent flex items-center rounded px-2 py-1 text-xs transition-all duration-200"
					onclick={() => (showAll = !showAll)}
					transition:fade|local={{ duration: 150 }}
				>
					{showAll ? 'Show Less' : `+ ${series.length - maxItems} More`}
				</button>
			{/if}
		</div>
	</div>
{/if}
