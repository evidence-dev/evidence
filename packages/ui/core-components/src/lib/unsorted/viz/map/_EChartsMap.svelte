<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { browser } from '$app/environment';
	import echartsMap from '@evidence-dev/component-utilities/echartsMap';
	import echartsCanvasDownload from '@evidence-dev/component-utilities/echartsCanvasDownload';
	import EChartsCopyTarget from '../core/EChartsCopyTarget.svelte';
	import DownloadData from '../../ui/DownloadData.svelte';
	import CodeBlock from '../../ui/CodeBlock.svelte';
	import ChartLoading from '../../ui/ChartLoading.svelte';
	import { flush } from 'svelte/internal';
	import { getThemeStores } from '../../../themes/themes.js';
	import { toBoolean } from '$lib/utils.js';

	const { activeAppearance, theme } = getThemeStores();

	export let extraHeight = 0;

	export let config = undefined;

	export let queryID = undefined;
	export let height = '350px';

	export let width = '100%';

	export let data;

	export let hasLink = false;

	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let printEchartsConfig = false;
	export let renderer = undefined;
	export let downloadableData = true;
	$: downloadableData = toBoolean(downloadableData);
	export let downloadableImage = true;
	$: downloadableImage = toBoolean(downloadableImage);

	export let connectGroup = undefined;

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
	class="chart-container mt-2 mb-6"
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
				width: {width};
				margin-left: 0;
				overflow: visible;
				display: {copying ? 'none' : 'inherit'}
			"
				use:echartsMap={{
					config,
					hasLink,
					echartsOptions,
					seriesOptions,
					extraHeight,
					renderer,
					connectGroup
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
		isMap
		{extraHeight}
	/>

	{#if downloadableImage || downloadableData}
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
		<CodeBlock>
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
        height: {666 * 0.5 + extraHeight}px;
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
			queryID,
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

	@media screen and (max-width: 480px) {
		.chart {
			height: 190px;
		}
	}

	@media screen and (max-width: 600px) and (min-width: 480px) {
		.chart {
			height: 240px;
		}
	}

	@media screen and (min-width: 600px) {
		.chart {
			height: 330px;
		}
	}

	.chart {
		-moz-user-select: none;
		-webkit-user-select: none;
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
