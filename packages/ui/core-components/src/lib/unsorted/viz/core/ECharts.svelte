<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { browser } from '$app/environment';
	import echarts from '@evidence-dev/component-utilities/echarts';
	import echartsCanvasDownload from '@evidence-dev/component-utilities/echartsCanvasDownload';
	import EChartsCopyTarget from './EChartsCopyTarget.svelte';
	import DownloadData from '../../ui/DownloadData.svelte';
	import CodeBlock from '../../ui/CodeBlock.svelte';
	import ChartLoading from '../../ui/ChartLoading.svelte';
	import { flush } from 'svelte/internal';
	import { createEventDispatcher } from 'svelte';
	import { getThemeStores } from '../../../themes/themes.js';

	const { activeAppearance, theme, resolveColorsObject } = getThemeStores();

	export let config = undefined;

	export let queryID = undefined;
	export let evidenceChartTitle = undefined;

	export let height = '291px';
	export let width = '100%';

	export let data;

	export let renderer = undefined;
	export let downloadableData = undefined;
	export let downloadableImage = undefined;
	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let printEchartsConfig; // helper for custom chart development

	export let seriesColors = undefined;
	$: seriesColorsStore = resolveColorsObject(seriesColors);

	export let connectGroup = undefined;

	const dispatch = createEventDispatcher();

	let downloadChart = false;
	let copying = false;
	let printing = false;
	let hovering = false;
</script>

<svelte:window
	on:copy={() => {
		copying = true;
		flush();
		setTimeout(() => {
			copying = false;
		}, 0);
	}}
	on:beforeprint={() => (printing = true)}
	on:afterprint={() => (printing = false)}
	on:export-beforeprint={() => (printing = true)}
	on:export-afterprint={() => (printing = false)}
/>

<div
	role="none"
	class="chart-container mt-2 mb-3"
	on:mouseenter={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
>
	{#if !printing}
		{#if !browser}
			<ChartLoading {height} />
		{:else}
			<div
				class="chart"
				style="
				height: {height};
				width: {width};
				overflow: visible;
				display: {copying ? 'none' : 'inherit'}
			"
				use:echarts={{
					config,
					...$$restProps,
					echartsOptions,
					seriesOptions,
					dispatch,
					renderer,
					connectGroup,
					seriesColors: $seriesColorsStore,
					theme: $activeAppearance
				}}
			/>
		{/if}
	{/if}

	<EChartsCopyTarget
		{config}
		{height}
		{width}
		{copying}
		{printing}
		{echartsOptions}
		{seriesOptions}
		seriesColors={seriesColorsStore}
	/>

	{#if downloadableData || downloadableImage}
		<div class="chart-footer">
			{#if downloadableImage}
				<DownloadData
					text="Save Image"
					class="download-button"
					downloadData={() => {
						downloadChart = true;
						setTimeout(() => {
							downloadChart = false;
						}, 0);
					}}
					display={hovering}
					{queryID}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#000"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<path d="M20.4 14.5L16 10 4 20" />
					</svg>
				</DownloadData>
			{/if}
			{#if data && downloadableData}
				<DownloadData
					text="Download Data"
					{data}
					{queryID}
					class="download-button"
					display={hovering}
				/>
			{/if}
		</div>
	{/if}

	{#if printEchartsConfig && !printing}
		<CodeBlock source={JSON.stringify(config, undefined, 3)} copyToClipboard={true}>
			{JSON.stringify(config, undefined, 3)}
		</CodeBlock>
	{/if}
</div>

{#if downloadChart}
	<div
		class="chart"
		style="
        display: none;
        visibility: visible;
        height: {height};
        width: 666px;
        margin-left: 0;
        margin-top: 15px;
        margin-bottom: 15px;
        overflow: visible;
    "
		use:echartsCanvasDownload={{
			config,
			...$$restProps,
			echartsOptions,
			seriesOptions,
			seriesColors: $seriesColorsStore,
			queryID,
			evidenceChartTitle,
			theme: $activeAppearance,
			backgroundColor: $theme.colors['base-100']
		}}
	/>
{/if}

<style>
	@media print {
		.chart {
			-moz-column-break-inside: avoid;
			break-inside: avoid;
		}

		.chart-container {
			padding: 0;
		}
	}

	.chart {
		-moz-user-select: none;
		-webkit-user-select: none;
		-ms-user-select: none;
		-o-user-select: none;
		user-select: none;
	}

	.chart-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin: 3px 12px;
		font-size: 12px;
		height: 9px;
	}
</style>
