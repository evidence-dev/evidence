<script>
	import { onMount, onDestroy, createEventDispatcher, getContext } from 'svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import 'leaflet/dist/leaflet.css';

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	/** @type {HTMLElement} */
	let mapElement;
	/** @type {import("leaflet").Map} */
	let map;

	export let data;
	export let lat;
	export let long;
	export let name;
	/** @type {number} */
	export let min;
	/** @type {number} */
	export let max;
	export let value;
	export let startingLat = 44.4;
	export let startingLong = 0.3;
	export let startingZoom = 13;
	export let height = 500; // height in pixels

	const dispatch = createEventDispatcher();

	$: if (max === undefined) {
		max = Math.max(...data.map((d) => d[value]));
	}

	$: if (min === undefined) {
		min = Math.min(...data.map((d) => d[value]));
	}

	onMount(async () => {
		const leaflet = await import('leaflet');

		map = leaflet.map(mapElement).setView([startingLat, startingLong], startingZoom);

		leaflet
			.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
				subdomains: 'abcd',
				maxZoom: 20
			})
			.addTo(map);

		const size = 15;

		const latLngData = [];
		for (let i = 0; i < data.length; i++) {
			/** @type {[number, number]} */
			const currentPoint = [data[i][lat], data[i][long]];
			latLngData.push(currentPoint);

			const svgIcon = leaflet.divIcon({
				html: `
					<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewbox="0 0 ${size} ${size}" width="${size}" height="${size}">
						<circle style="rgba(45, 74, 148, ${(data[i][value] - min) / (max - min)})" fill="#1DA1F2" cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/>
					</svg>`,
				className: '',
				iconSize: [size, size],
				iconAnchor: [size, size]
			});

			const marker = leaflet.marker(currentPoint, { icon: svgIcon }).addTo(map);
			marker.on('click', () => {
				dispatch('click', data[i]);
				$inputs[name] = data[i];
			});

			if (i > 0) {
				/** @type {[number, number]} */
				const prevPoint = [data[i - 1][lat], data[i - 1][long]];
				leaflet.polyline([prevPoint, currentPoint]).addTo(map);
			}
		}

		const bounds = leaflet.latLngBounds(latLngData);
		map.fitBounds(bounds);
		map.removeControl(map.attributionControl);
	});

	onDestroy(() => {
		if (map) {
			console.log('Unloading Leaflet map.');
			map.remove();
		}
	});
</script>

<main>
	<div style:height="{height}px" bind:this={mapElement}></div>
</main>

<style>
	@import 'leaflet/dist/leaflet.css';
	main div {
		z-index: 0;
	}
</style>
