<script lang="ts">
	import { formatValue } from '../../formatValue';
	import { init } from 'echarts';
	import type { ECharts } from 'echarts';
	import { mode } from 'mode-watcher';
	import { browser } from '../../../shims/env';
	import { echarts } from './echarts.action';
	import { getSparklineVizConfig } from './sparkline';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { getPrintModeContext } from '../../../print-mode.context';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getThemeToken } from '../../../theme/get-theme-token';
	import { getCardContext } from '../../common/card-context.svelte';
	import { escapeHtml } from '../../common/tooltip-fields';

	interface Props {
		chartData: Array<[string | Date, number]>;
		type?: 'line' | 'area' | 'bar';
		color?: string;
		y_fmt?: string;
		x_fmt?: string;
		fit_to_data?: boolean;
		interactive?: boolean;
		class_name?: string;
		width?: number;
		height?: number;
		xEChartsType?: 'time' | 'category' | 'value';
		loading?: boolean;
		group?: string;
	}

	const props: Props = $props();

	const originalChartData = $derived(props.chartData ?? []);
	const type = $derived(props.type ?? 'line');
	const color = $derived(props.color);
	const y_fmt = $derived(props.y_fmt);
	const x_fmt = $derived(props.x_fmt);
	const fit_to_data = $derived(props.fit_to_data ?? false);
	const interactive = $derived(props.interactive ?? true);
	const class_name = $derived(props.class_name);
	const width = $derived(props.width ?? 50);
	const height = $derived(props.height ?? 15);
	const xEChartsType = $derived(props.xEChartsType ?? 'category');
	const loading = $derived(props.loading ?? false);
	const group = $derived(props.group);

	const printing = getPrintModeContext();

	// Resolve theme tokens so the interactive tooltip (transparent bg + custom
	// formatter) and the vertical hover tracking line pick up per-project foreground
	// / mutedForeground. Card context matters: a sparkline inside a card should
	// contrast against the card surface, not the page background.
	const themeContext = getThemeContext();
	const cardContext = getCardContext();
	const useCardColors = $derived(Boolean(cardContext?.insideCard));
	const themeColors = $derived({
		foreground: getThemeToken(themeContext.activeTheme, 'foreground', useCardColors),
		mutedForeground: getThemeToken(themeContext.activeTheme, 'mutedForeground', useCardColors)
	});

	// Track whether the interactive echarts chart has signalled readiness
	let echartsReady = $state(false);

	// Register with the readiness system at mount time.
	// This ensures the task exists BEFORE data loads — no gap where the
	// sparkline is loading but has no pending task in the tracker.
	// In normal app usage (no tracker in context), this is a complete no-op.
	setupRenderReadiness('sparkline', () => {
		// Non-interactive (e.g. table sparklines): ready once loading finishes.
		// If the query returned rows, the SVG is generated synchronously in an
		// $effect and the settle timer covers the sub-frame gap. If the query
		// returned 0 rows (hasData=false), the component renders an empty state
		// — still "ready" from the PDF's perspective. Without this, an empty
		// non-interactive sparkline would block the PDF for the full 30s timeout.
		if (!interactive) return !loading;

		// Interactive: ready when the echarts action fires onReady
		// (which in print mode waits for fonts + stable frames).
		// If the query completed but returned no rows, the echarts action is never
		// attached (it's behind an {#if hasData} guard), so echartsReady will never
		// flip. Short-circuit to prevent permanently blocking PDF readiness.
		if (!loading && !hasData) return true;
		return echartsReady;
	});

	// Sample data if it exceeds 300 points
	function sampleData<T>(inputData: T[], maxRows = 100): T[] {
		if (inputData.length <= maxRows) return inputData;

		const samplingInterval = Math.ceil(inputData.length / maxRows);
		return inputData.filter((_, index) => index % samplingInterval === 0);
	}

	// Apply sampling to chart data
	const chartData = $derived(sampleData(originalChartData));

	// Create ECharts options using our utility function
	const chartOptions = $derived.by(() => {
		return getSparklineVizConfig(
			chartData,
			type as 'line' | 'area' | 'bar',
			color,
			fit_to_data,
			height,
			mode.current === 'dark' ? 'dark' : 'light',
			themeColors
		);
	});

	// Override the formatter to use our formatValue function
	$effect(() => {
		if (chartOptions.tooltip && !Array.isArray(chartOptions.tooltip)) {
			chartOptions.tooltip.formatter = (params: unknown) => {
				const paramArray = Array.isArray(params) ? params : [params];
				if (paramArray.length === 0) return '';

				const param = paramArray[0] as { value: [string | Date, number] };
				if (!param || !param.value) return '';

				const xValue = param.value[0];
				const yValue = param.value[1];

				const xStr = formatValue(
					xValue,
					x_fmt || (xEChartsType === 'time' ? 'shortdate' : ''),
					String(xValue)
				);
				const yStr = formatValue(yValue, y_fmt || 'num', String(yValue));

				// Create a tooltip with transparent background to blend with app background
				const valuePart = `<div style="text-align: center; border-radius: 1px; padding: 0px 2px; text-shadow: 0 0 1px rgba(0,0,0,0.05);">${escapeHtml(yStr)}</div>`;
				const transparentGap = `<div style="background-color: transparent; height: ${height - 1.5}px;"></div>`;
				const datePart = `<div style="text-align: center; height: 1em; background-color: transparent; border-radius: 1px; padding: 0px 2px; text-shadow: 0 0 1px rgba(0,0,0,0.05);">${escapeHtml(xStr)}</div>`;

				return valuePart + transparentGap + datePart;
			};
		}
	});

	// Using let with $state for mutable reactive variables
	let chart = $state<ECharts | null>(null);
	let staticSvg = $state('');
	let staticSvgSSR = $state('');

	// Whether we should show the loading indicator
	const showLoading = $derived(loading && (!chartData || chartData.length === 0));

	// Whether we have data to display
	const hasData = $derived(chartData && chartData.length > 0);

	// Use stable options pattern for interactive charts
	const ready = $derived(!loading && hasData);
	let stableChartOptions = $state({});

	$effect(() => {
		if (ready) {
			stableChartOptions = chartOptions;
		}
	});

	// Update interactive chart when options change
	$effect(() => {
		if (chart && Object.keys(stableChartOptions).length > 0) {
			chart.setOption(
				{
					...stableChartOptions,
					backgroundColor: 'transparent'
				},
				true
			);
		}
	});

	// Generate static SVG for SSR (server-side rendering)
	$effect(() => {
		if (!browser && hasData && !loading) {
			// SSR-specific initialization
			const tempChart = init(null, mode.current, {
				ssr: true,
				renderer: 'svg',
				height,
				width
			});
			tempChart.setOption({
				...chartOptions,
				backgroundColor: 'transparent'
			});
			staticSvgSSR = tempChart.renderToSVGString();
			tempChart.dispose();
		}
	});

	// Generate static SVG for non-interactive mode (exactly like Svelte 4 version)
	$effect(() => {
		if (browser && !interactive && hasData && !loading) {
			// Generate static SVG for non-interactive mode
			const offscreenContainer = document.createElement('div');
			offscreenContainer.style.width = width + 'px';
			offscreenContainer.style.height = height + 'px';
			const tempChart = init(offscreenContainer, mode.current, {
				renderer: 'svg',
				height,
				width
			});
			tempChart.setOption({
				...chartOptions,
				backgroundColor: 'transparent'
			});
			staticSvg = tempChart.renderToSVGString();
			tempChart.dispose();
		} else {
			staticSvg = '';
		}
	});
</script>

{#if !browser}
	<!-- SSR mode -->
	<span
		class="inline-block align-baseline {class_name || ''}"
		style="width: {width}px; height: {height}px; background-color: transparent;"
	>
		{@html staticSvgSSR}
	</span>
{:else if !interactive && hasData && !loading}
	<!-- Client-side non-interactive mode -->
	<span
		class="inline-block align-baseline {class_name || ''}"
		style="width: {width}px; height: {height}px; background-color: transparent;"
	>
		{@html staticSvg}
	</span>
{:else}
	<!-- Interactive mode or loading/no data states -->
	<svelte:element
		this={interactive ? 'div' : 'span'}
		class="inline-block align-baseline {class_name || ''}"
		style="width: {width}px; height: {height}px; background-color: transparent;"
	>
		{#if showLoading}
			<div class="flex h-full w-full items-center justify-center">
				<LoaderCircle class="text-muted-foreground h-3 w-3 animate-spin [animation-duration:1s]" />
			</div>
		{:else if !hasData}
			<div class="flex h-full w-full items-center justify-center">
				<span class="text-muted-foreground text-xs">-</span>
			</div>
		{:else}
			<div
				class="h-full w-full overflow-visible"
				style="background-color: transparent;"
			use:echarts={{
				options: stableChartOptions,
				theme: mode.current,
				width,
				height,
				renderer: 'svg',
				printing,
				group,
				onCreate: (c) => {
					chart = c;
				},
				onReady: () => {
					echartsReady = true;
				},
				onDestroy: () => {
					chart = null;
				}
			}}
			></div>
		{/if}
	</svelte:element>
{/if}

<svelte:window
	onunload={() => {
		if (chart) {
			chart.dispose();
			chart = null;
		}
	}}
/>
