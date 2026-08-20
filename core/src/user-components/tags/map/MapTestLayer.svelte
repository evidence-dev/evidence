<script lang="ts">
	import { onMount } from 'svelte';
	import { getMapContext } from './map-context';

	const mapContext = getMapContext();

	onMount(() => {
		const area = mapContext.addAreaLayer(() => ({
			data: 'area_values',
			area_id: 'area_id',
			value: 'value',
			filters: [],
			tooltip: true,
			legend: true,
			value_fmt: 'num',
			show_unmatched: true
		}));
		const point = mapContext.addPointLayer(() => ({
			data: 'point_values',
			lat: 'lat',
			lng: 'lng',
			filters: [],
			shape: 'circle',
			cluster: false,
			size: 6,
			size_scale: 1,
			tooltip: true,
			legend: true,
			color_value_fmt: 'num',
			size_value_fmt: 'num'
		}));
		const heatmap = mapContext.addHeatmapLayer(() => ({
			data: 'heatmap_values',
			lat: 'lat',
			lng: 'lng',
			filters: [],
			radius: 30,
			opacity: 0.8,
			intensity: 1
		}));

		return () => {
			area.removeAreaLayer();
			point.removePointLayer();
			heatmap.removeHeatmapLayer();
		};
	});
</script>
