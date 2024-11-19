<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from '@evidence-dev/component-utilities/chartContext';
	$: props = getContext(propKey);
	$: config = getContext(configKey);

	// import { prepareBoxplotData } from 'echarts/extension/dataTool';
	import { formatValue } from '@evidence-dev/component-utilities/formatting';
	import { getThemeStores } from '../../../themes/themes.js';

	const { resolveColor } = getThemeStores();

	export let y = undefined;
	const ySet = y ? true : false; // Hack, see chart.svelte
	export let series = undefined;
	const seriesSet = series ? true : false; // Hack, see chart.svelte
	export let options = undefined;

	/** @type {import('@evidence-dev/component-utilities/generateBoxPlotData').BoxPlotData}*/
	export let boxPlotData;
	$: ({ colors } = boxPlotData);

	export let color = undefined;
	$: colorStore = resolveColor(color);

	export let min = undefined;
	export let max = undefined;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: y = ySet ? y : $props.y;
	$: swapXY = $props.swapXY;
	$: yFormat = $props.yFormat;
	$: series = seriesSet ? series : $props.series;

	// $: data = echarts.dataTool.prepareBoxplotData(data.map(d => d[y]));

	// let outlierData = [
	// 	[0,2],
	// 	[0, 1400],
	// 	[1, 5],
	// 	[1, 10],
	// 	[1, 17]
	// ];

	$: boxConfig = {
		type: 'boxplot',
		data: boxPlotData.data,
		colorBy: $colorStore ? 'data' : 'series',
		itemStyle: {
			opacity: 1
			// borderColor: 'inherit'
		},
		boxWidth: [7, 25],
		hoverAnimation: false,
		emphasis: {
			disabled: true
		},
		__id: id
	};

	// $: outlierConfig = {
	// 	name: 'outlier',
	// 	type: 'scatter',
	// 	data: outlierData
	// }

	const id = Math.random().toString();

	$: config.update((d) => {
		d.series = d.series.filter((s) => s.__id !== id);
		d.series.push(boxConfig);
		// d.series.push(outlierConfig);
		return d;
	});

	$: chartOverrides = {
		// Evidence definition of axes (yAxis = dependent, xAxis = independent)
		xAxis: {
			boundaryGap: true,
			data: boxPlotData.names
		},
		yAxis: {
			scale: true,
			boundaryGap: ['1%', '1%']
		},
		tooltip: {
			show: true,
			formatter: function (params) {
				let output;
				output =
					`<span style="font-weight: 600;">${params[0].name}</span><br/>` +
					(max
						? `Maximum: <span style='float:right; margin-left: 15px;'>${formatValue(
								params[0].data[5],
								yFormat
							)}</span><br/>`
						: '') +
					`Interval Top: <span style='float:right; margin-left: 15px;'>${formatValue(
						params[0].data[4],
						yFormat
					)}</span><br/>` +
					`Midpoint: <span style='float:right; margin-left: 15px;'>${formatValue(
						params[0].data[3],
						yFormat
					)}</span><br/>` +
					`Interval Bottom: <span style='float:right; margin-left: 15px;'>${formatValue(
						params[0].data[2],
						yFormat
					)}</span><br/>` +
					(min
						? `Minimum: <span style='float:right; margin-left: 15px;'>${formatValue(
								params[0].data[1],
								yFormat
							)}</span><br/>`
						: '');

				return output;
			}
		},
		color: $colors
	};

	beforeUpdate(() => {
		// beforeUpdate ensures that these overrides always run before we render the chart.
		// otherwise, this block won't re-execute after a change to the data object, and
		// the chart will re-render using the base config from Chart.svelte

		if (options) {
			config.update((d) => {
				return { ...d, ...options };
			});
		}

		if (chartOverrides) {
			config.update((d) => {
				if (swapXY) {
					d.yAxis = { ...d.yAxis, ...chartOverrides.xAxis };
					d.xAxis = { ...d.xAxis, ...chartOverrides.yAxis };
				} else {
					d.yAxis[0] = { ...d.yAxis[0], ...chartOverrides.yAxis };
					d.xAxis = { ...d.xAxis, ...chartOverrides.xAxis };
				}
				d.tooltip = { ...d.tooltip, ...chartOverrides.tooltip };
				if ($colorStore) {
					d.color = chartOverrides.color;
				}
				return d;
			});
		}
	});
</script>
