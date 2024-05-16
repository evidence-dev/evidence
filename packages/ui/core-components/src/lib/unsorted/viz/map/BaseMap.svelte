<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount, setContext } from 'svelte';
	import { browser } from '$app/environment';
	import ErrorChart from '../core/ErrorChart.svelte';
	import 'leaflet/dist/leaflet.css';
	import { EvidenceMap } from './EvidenceMap.js';
	import { mapContextKey } from './constants.js';

	let mapElement;

	/** @type {number} */
	export let startingLat = 39.07788448885593;
	/** @type {number} */
	export let startingLong = -77.4064950906748;
	/** @type {number} */
	export let startingZoom = 5;

	/** @type {number} */
	export let height = 500; // height in pixels

	/** @type {string} */
	export let basemap = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

	/** @type {string|undefined} */
	export let title = undefined;

	/** @type {string|undefined} */
	let error = undefined;

	const evidenceMap = new EvidenceMap();
	setContext(mapContextKey, evidenceMap);

	// Lifecycle hooks:
	onMount(async () => {
		if (browser) {
			try {
				await evidenceMap.init(mapElement, basemap, [startingLat, startingLong], startingZoom);
				return () => evidenceMap.cleanup();
			} catch (e) {
				error = e.message;
				console.error(e);
			}
		}
	});
</script>

{#if error}
	<ErrorChart {error} chartType="Map" />
{:else}
	<div class="my-5 break-inside-avoid">
		{#if title}
			<h4 class="markdown mb-2">{title}</h4>
		{/if}
		<div
			class="z-0 rounded-md focus:outline-none"
			style="height: {height}px;"
			bind:this={mapElement}
		>
			<slot></slot>
		</div>
	</div>
{/if}

<style>
	div :global(.leaflet-popup-content-wrapper) {
		background-color: white;
		box-shadow: 0 1px 3px rgb(0, 0, 0, 0.4);
		border-radius: 4px;
		font-family: 'Inter', sans-serif;
		font-size: 11px;
	}

	div :global(.leaflet-popup-content) {
		margin: 7px 9px;
	}

	div :global(.leaflet-popup-tip) {
		background-color: white;
		display: none;
	}

	div :global(.leaflet-popup-close-button) {
		width: 14px;
		font: 10px/15px sans-serif;
		display: none;
	}

	div :global(.leaflet-tooltip) {
		font-family: 'Inter', sans-serif;
	}

	div :global(.leaflet-tooltip::before) {
		background-color: white;
		display: none;
	}
</style>
