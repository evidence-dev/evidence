<script>
	import { createEventDispatcher, getContext } from 'svelte';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import chroma from 'chroma-js';
	import 'leaflet/dist/leaflet.css';

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	export let data;

	/**
	 * Name of the input to be used in the inputs store
	 * @type {string}
	 */
	export let name;

	/**
	 * Column with latitude values
	 * @type {string}
	 */
	export let lat;

	/**
	 * Column with longitude values
	 * @type {string}
	 */
	export let long;

	/**
	 * Column with the value to be represented
	 * @type {string | undefined}
	 */
	export let value = undefined;

	/**
	 * Minimum value to be compared, defaults to the minimum value in the data
	 * @type {number}
	 */
	export let min = value !== undefined && Math.min(...data.map((d) => d[value]));
	/**
	 * Maximum value to be compared, defaults to the maximum value in the data
	 * @type {number}
	 */
	export let max = value !== undefined && Math.max(...data.map((d) => d[value]));

	export let startingLat = 44.4;
	export let startingLong = 0.3;
	export let startingZoom = 13;
	export let height = 500; // height in pixels

	const dispatch = createEventDispatcher();
	const scale = chroma.scale(['lightblue', 'darkblue']);

	/**
	 * async function to load leaflet
	 * @param {HTMLDivElement} el
	 * @param {typeof data} data
	 */
	async function asyncLeafletAction(el, data) {
		const leaflet = await import('leaflet');

		const map = leaflet.map(el).setView([startingLat, startingLong], startingZoom);

		leaflet
			.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
				subdomains: 'abcd',
				maxZoom: 20
			})
			.addTo(map);

		/** @type {import("leaflet").Marker[]} */
		const markers = [];

		/** @param {typeof data} data */
		function updateData(data) {
			const size = 15;

			const latLngData = [];
			for (let i = 0; i < data.length; i++) {
				/** @type {[number, number]} */
				const currentPoint = [data[i][lat], data[i][long]];
				latLngData.push(currentPoint);

				const svgIcon = leaflet.divIcon({
					html: `
						<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewbox="0 0 ${size} ${size}" width="${size}" height="${size}">
							<circle fill="${value === undefined ? scale(1).hex() : scale((data[i][value] - min) / (max - min)).hex()}" cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/>
						</svg>
					`,
					className: '',
					iconSize: [size, size],
					iconAnchor: [size, size]
				});

				const marker = leaflet.marker(currentPoint, { icon: svgIcon }).addTo(map);
				marker.on('click', () => {
					dispatch('click', data[i]);
					$inputs[name] = data[i];
				});
				markers.push(marker);
			}

			const bounds = leaflet.latLngBounds(latLngData);
			map.fitBounds(bounds);
			map.removeControl(map.attributionControl);
		}

		updateData(data);

		return {
			destroy() {
				map.remove();
			},
			/** @param {typeof data} newData */
			update(newData) {
				markers.forEach((marker) => {
					marker.remove();
					marker.off('click');
				});
				markers.length = 0;

				updateData(newData);
			}
		};
	}

	/** @type {import("svelte/action").Action<HTMLDivElement, typeof data>} */
	function leafletAction(el, data) {
		const actionPromise = asyncLeafletAction(el, data);

		return {
			destroy() {
				actionPromise.then((action) => action.destroy());
			},
			update(newData) {
				actionPromise.then((action) => action.update(newData));
			}
		};
	}
</script>

<main>
	<div style:height="{height}px" use:leafletAction={data}></div>
</main>

<style>
	@import 'leaflet/dist/leaflet.css';
	main div {
		z-index: 0;
	}
</style>
