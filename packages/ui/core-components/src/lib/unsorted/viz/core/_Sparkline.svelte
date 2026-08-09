<script>
	import { onMount, onDestroy } from 'svelte';
	import { init, connect } from 'echarts';
	import chroma from 'chroma-js';
	import { browser } from '$app/environment';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import ValueError from './ValueError.svelte';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import {
		getColumnFormats,
		getSparklineConfig,
		getSparklinePaths,
		validateSize
	} from './sparkline.js';
	import { getThemeStores } from '../../../themes/themes.js';

	const { theme, resolveColor } = getThemeStores();

	export let config = {};
	export let width = 50; // Default width for the sparkline, adjust as needed
	export let height = 15; // Default height for the sparkline, adjust as needed
	export let interactive = true; // Prop to control interactivity
	$: interactive = interactive === 'true' || interactive === true;

	let chartContainer;
	let chartInstance = null;

	export let data = undefined;
	export let dateCol = undefined;
	export let valueCol = undefined;
	export let valueFmt = undefined;
	let value_format_object;

	export let dateFmt = undefined;
	let date_format_object;

	export let type = 'line'; // line, area, or bar

	export let color = undefined;
	$: colorStore = resolveColor(color);

	export let yScale = false; // scale the y axis to the data
	$: yScale = yScale === 'true' || yScale === true;

	let seriesType = type === 'area' ? 'line' : type;

	export let connectGroup = undefined; // connects to all other connected sparklines with the same group name (shared tooltip behaviour)

	let staticSVGSSR;
	let error;

	// Non-interactive sparklines are drawn as plain SVG rather than by creating an
	// offscreen ECharts instance per sparkline just to call renderToSVGString().
	// DataTable renders one sparkline per row, and echarts.init() is roughly 30x
	// slower in WebKit than in V8, so ~100 sparkline cells put Safari into a ~24s
	// uninterruptible main-thread task (32.6s on an iPhone) where Chrome is fast
	// enough to hide it. Nothing is lost: a non-interactive sparkline has no
	// tooltip, no axis labels and no animation. See getSparklinePaths().
	let staticPaths = null;

	$: lineColor = $colorStore ?? $theme.colors['base-content-muted'];
	$: areaColor =
		type === 'area'
			? $colorStore
				? chroma($colorStore).brighten(1.5).hex()
				: $theme.colors['base-300']
			: 'transparent';

	// Initialize chart for interactive mode
	function initializeChart() {
		if (interactive && chartContainer && !chartInstance) {
			chartInstance = init(chartContainer, 'evidence-light', { renderer: 'svg', width, height });
			chartInstance.setOption(config);
			if (connectGroup) {
				chartInstance.group = connectGroup;
				connect(connectGroup);
			}
		}
	}

	onMount(() => {
		initializeChart();
	});

	// Cleanup
	onDestroy(() => {
		if (chartInstance) {
			chartInstance.dispose();
		}
	});

	$: try {
		// Check that sparkline type is valid:
		if (!['line', 'area', 'bar'].includes(type)) {
			throw Error('type must be line, area, or bar');
		}

		// Check that dimensions are valid:
		({ height, width } = validateSize(height, width));

		// Check that inputs are valid:
		checkInputs(data, [valueCol, dateCol]);

		// Get column formats:
		({ value_format_object, date_format_object } = getColumnFormats(
			data,
			valueCol,
			dateCol,
			valueFmt,
			dateFmt
		));

		// Prepare data for sparkline config:
		const sparklineData = data.map((d) => [d[dateCol], d[valueCol]]);
		sparklineData.sort((a, b) => a[0] - b[0]);

		config = getSparklineConfig(
			sparklineData,
			type,
			seriesType,
			$colorStore,
			yScale,
			value_format_object,
			date_format_object,
			height,
			$theme
		);

		if (!interactive) {
			staticPaths = getSparklinePaths(sparklineData, type, width, height, yScale);
		}

		if (!browser && interactive) {
			// SSR-specific initialization
			const tempChart = init(null, 'evidence-light', {
				ssr: true,
				renderer: 'svg',
				height: height,
				width: width
			});
			tempChart.setOption(config);
			staticSVGSSR = tempChart.renderToSVGString();
			tempChart.dispose(); // Dispose instance after generating SVG
		}

		if (chartContainer && interactive && !chartInstance) {
			initializeChart();
		}
	} catch (e) {
		error = e;
		const setTextRed = '\x1b[31m%s\x1b[0m';
		console.error(setTextRed, `Error in Sparkline: ${error.message}`);
		if (strictBuild) {
			throw error;
		}
	}

	$: (data, config);

	$: if (browser && chartInstance && config) {
		chartInstance.setOption(config, true); // true forces a complete replacement of the options
	}
</script>

{#if error}
	<ValueError {error} />
{:else if !interactive}
	<!-- Identical markup on the server and in the browser, so hydration replaces
	     like with like instead of rebuilding the chart. -->
	<div class="inline-block align-baseline" style="width: {width}px; height: {height}px;">
		{#if staticPaths}
			<svg
				{width}
				{height}
				viewBox="0 0 {width} {height}"
				xmlns="http://www.w3.org/2000/svg"
				role="presentation"
				aria-hidden="true"
				style="display: block;"
			>
				{#each staticPaths.areaPaths as d}
					<path {d} fill={areaColor} stroke="none" />
				{/each}
				<line
					x1="0"
					x2={width}
					y1={staticPaths.baseline}
					y2={staticPaths.baseline}
					stroke={$theme.colors['base-300']}
					stroke-width="0.75"
				/>
				{#each staticPaths.bars as bar}
					<rect x={bar.x} y={bar.y} width={bar.w} height={bar.h} fill={lineColor} />
				{/each}
				{#each staticPaths.linePaths as d}
					<path
						{d}
						fill="none"
						stroke={lineColor}
						stroke-width="1"
						stroke-linejoin="round"
						stroke-linecap="round"
					/>
				{/each}
			</svg>
		{/if}
	</div>
{:else if !browser}
	<div class="inline-block align-baseline" style="width: {width}px; height: {height}px;">
		{@html staticSVGSSR}
	</div>
{:else}
	<div
		bind:this={chartContainer}
		class="inline-block align-baseline overflow-visible"
		style="width: {width}px; height: {height}px;"
	/>
{/if}
