<script>
	import { onMount, onDestroy } from 'svelte';
	import { init, connect } from 'echarts';
	import { browser } from '$app/environment';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import ValueError from './ValueError.svelte';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import { getColumnFormats, getSparklineConfig, validateSize } from './sparkline.js';
	import { getThemeStores } from '../../../themes/themes.js';

	const { theme, resolveColor } = getThemeStores();

	export let config = {};
	export let width = 50; // Default width for the sparkline, adjust as needed
	export let height = 15; // Default height for the sparkline, adjust as needed
	export let interactive = true; // Prop to control interactivity
	$: interactive = interactive === 'true' || interactive === true;

	let chartContainer;
	let chartInstance = null;
	let staticSVG = ''; // Holds the static SVG markup

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

	let tooltipBackgroundColor = 'white';

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

	// Initialize the static SVG
	onMount(() => {
		if (!interactive) {
			// Generate static SVG for non-interactive mode
			const offscreenContainer = document.createElement('div');
			offscreenContainer.style.width = width + 'px';
			offscreenContainer.style.height = height + 'px';
			const tempChart = init(offscreenContainer, 'evidence-light', {
				renderer: 'svg',
				height,
				width
			});
			tempChart.setOption(config);
			staticSVG = tempChart.renderToSVGString();
			tempChart.dispose();
		} else {
			initializeChart();
		}
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
			tooltipBackgroundColor,
			$theme
		);

		if (!browser) {
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

	$: data, config;

	$: if (browser && chartInstance && config) {
		chartInstance.setOption(config, true); // true forces a complete replacement of the options
	}

	$: if (browser && !interactive) {
		// Generate static SVG for non-interactive mode
		const offscreenContainer = document.createElement('div');
		offscreenContainer.style.width = width + 'px';
		offscreenContainer.style.height = height + 'px';
		const tempChart = init(offscreenContainer, 'evidence-light', {
			renderer: 'svg',
			height,
			width
		});
		tempChart.setOption(config);
		staticSVG = tempChart.renderToSVGString();
		tempChart.dispose();
	} else {
		initializeChart();
	}
</script>

{#if error}
	<ValueError {error} />
{:else if !browser}
	<div class="inline-block align-baseline" style="width: {width}px; height: {height}px;">
		{@html staticSVGSSR}
	</div>
{:else if !interactive}
	<div class="inline-block align-baseline" style="width: {width}px; height: {height}px;">
		{@html staticSVG}
	</div>
{:else}
	<div
		bind:this={chartContainer}
		class="inline-block align-baseline overflow-visible"
		style="width: {width}px; height: {height}px;"
	/>
{/if}
