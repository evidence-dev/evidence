<script>
	import { afterUpdate, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import vegaEmbed from 'vega-embed';

	import ChartLoading from '../../ui/ChartLoading.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';

	export let data = undefined;
	export let spec = undefined;

	/** @type {number | string | undefined} */
	export let height = 291;

	/** @type {number | string | undefined} */
	export let width = '100%';

	export let actions = true;
	export let renderer = undefined;
	export let tooltip = undefined;
	export let description = undefined;
	export let embedOptions = undefined;
	export let chartType = 'Vega-Lite Chart';
	export let title = undefined;
	export let subtitle = undefined;

	let container;
	let embedResult;
	let renderError;
	let pendingRender = false;
	let renderToken = 0;

	const heightCss = () =>
		height === undefined ? '291px' : typeof height === 'number' ? `${height}px` : height;

	const widthCss = () =>
		width === undefined ? '100%' : typeof width === 'number' ? `${width}px` : width;

	const cloneSpec = (input) => {
		if (!input) return undefined;
		if (typeof structuredClone === 'function') {
			return structuredClone(input);
		}
		return JSON.parse(JSON.stringify(input));
	};

	async function renderChart() {
		if (!browser || !container || !spec) return;
		const specCopy = cloneSpec(spec);
		renderError = undefined;

		if (specCopy) {
			if (title && specCopy.title === undefined) {
				specCopy.title = title;
			}

			if (subtitle && specCopy.subtitle === undefined) {
				specCopy.subtitle = subtitle;
			}

			if (!specCopy.data && data !== undefined) {
				specCopy.data = { values: data };
			}

			if (specCopy.height === undefined && typeof height === 'number') {
				specCopy.height = height;
			}

			if (specCopy.width === undefined && typeof width === 'number') {
				specCopy.width = width;
			}
		}

		const options = {
			actions,
			renderer,
			tooltip,
			description,
			...(embedOptions ?? {})
		};

		const token = ++renderToken;
		try {
			embedResult?.view?.finalize();
			const result = await vegaEmbed(container, specCopy, options);
			if (token !== renderToken) {
				result.view.finalize();
				return;
			}
			embedResult = result;
		} catch (err) {
			console.error('Failed to render VegaLite chart', err);
			renderError = err;
		} finally {
			pendingRender = false;
		}
	}

	function scheduleRender() {
		if (!browser || !container || !spec) return;
		if (pendingRender) return;
		pendingRender = true;
	}

	$: spec, scheduleRender();
	$: data, scheduleRender();
	$: actions, scheduleRender();
	$: renderer, scheduleRender();
	$: tooltip, scheduleRender();
	$: description, scheduleRender();
	$: embedOptions, scheduleRender();
	$: height, scheduleRender();
	$: width, scheduleRender();
	$: container, scheduleRender();

	afterUpdate(() => {
		if (!pendingRender) return;
		renderChart();
	});

	onDestroy(() => {
		embedResult?.view?.finalize();
	});
</script>

{#if !spec}
	<ErrorChart title={chartType} error="VegaLiteChart requires a spec prop" />
{:else}
	<div class="chart-container">
		{#if !browser}
			<ChartLoading height={heightCss()} />
		{:else if renderError}
			<ErrorChart title={chartType} error={renderError?.message ?? renderError} />
		{:else}
			<div
				class="vega-chart"
				bind:this={container}
				style={`height:${heightCss()};width:${widthCss()};`}
			/>
		{/if}
	</div>
{/if}

<style>
	.chart-container {
		width: 100%;
	}

	.vega-chart {
		overflow: visible;
	}
</style>
