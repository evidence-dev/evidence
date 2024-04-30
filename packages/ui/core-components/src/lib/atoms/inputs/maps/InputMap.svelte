<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import 'leaflet/dist/leaflet.css';

	let mapElement;
	let map;

	export let data;
	export let lat;
	export let long;
	export let name;
	export let startingLat = 44.4;
	export let startingLong = 0.3;
	export let startingZoom = 13;
	export let tooltipFields = [];
	export let height = 500; // height in pixels

	$: onMount(async () => {
		if (browser) {
			const leaflet = await import('leaflet');

			map = leaflet.map(mapElement).setView([startingLat, startingLong], startingZoom);

			leaflet
				.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
					subdomains: 'abcd',
					maxZoom: 20
				})
				.addTo(map);

			const svgIcon = leaflet.divIcon({
				html: `
                <svg width="32" height="45" viewBox="0 0 42 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M21 0C32.598 0 42 9.40202 42 21C42 22.4157 41.8599 23.7986 41.5929 25.1358C39.7394 39.1032 21.1104 55 21.1104 55C21.1104 55 5.25689 41.4717 1.34456 28.4096C0.475507 26.1054 0 23.6083 0 21C0 9.40202 9.40202 0 21 0Z" fill="#0254C0"/>
                <path d="M29 21C29 16.5817 25.4183 13 21 13C16.5817 13 13 16.5817 13 21C13 25.4183 16.5817 29 21 29C25.4183 29 29 25.4183 29 21Z" fill="white"/>
                </svg>`,
				className: '',
				iconSize: [50, 20],
				iconAnchor: [20, 20]
			});

			let currentPoint;
			let prevPoint;
			let latLngData = [];
			let tooltipCode;
			for (let i = 0; i < data.length; i++) {
				latLngData.push([[data[i][lat], data[i][long]]]);
				currentPoint = [[data[i][lat], data[i][long]]];
				if (i > 0) {
					prevPoint = [[data[i - 1][lat], data[i - 1][long]]];
				}
				let marker = leaflet.marker([data[i][lat], data[i][long]], { icon: svgIcon }).addTo(map);

				tooltipCode = '';
				for (let j = 0; j < tooltipFields.length; j++) {
					tooltipCode =
						tooltipCode +
						`<b>${formatTitle(tooltipFields[j])}</b>` +
						': ' +
						data[i][tooltipFields[j]] +
						'<br>';
				}
				marker
					.bindPopup(
						`<b>${data[i][name]}</b><br><span style="color: grey; font-size: 0.9em;">${tooltipCode}</span>`
					)
					.openPopup();

				if (prevPoint !== undefined) {
					leaflet.polyline([prevPoint, currentPoint]).addTo(map);
				}
			}
			var bounds = leaflet.latLngBounds(latLngData);
			map.fitBounds(bounds);
			map.removeControl(map.attributionControl);
		}
	});

	$: data;

	$: onDestroy(async () => {
		if (map) {
			console.log('Unloading Leaflet map.');
			map.remove();
		}
	});
</script>

<main>
	<div style="height: {height}px;" bind:this={mapElement}></div>
</main>

<style>
	@import 'leaflet/dist/leaflet.css';
	main div {
		z-index: 0;
	}
</style>
