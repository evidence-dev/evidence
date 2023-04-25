<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from './context';
	let props = getContext(propKey);
	let config = getContext(configKey);

	// import getSeriesConfig from '$lib/modules/getSeriesConfig.js';
	// import formatTitle from '$lib/modules/formatTitle';
	// import replaceNulls from '$lib/modules/replaceNulls';
	// import getCompletedData from '$lib/modules/getCompletedData.js';

	export let y = undefined;
	const ySet = y ? true : false; // Hack, see chart.svelte
	export let series = undefined;
	const seriesSet = series ? true : false; // Hack, see chart.svelte
	export let options = undefined;

    export let xVal = undefined;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: x = $props.x;
	$: y = ySet ? y : $props.y;
	$: swapXY = $props.swapXY;
	$: xType = $props.xType;
	$: xMismatch = $props.xMismatch;
	$: columnSummary = $props.columnSummary;
	$: series = seriesSet ? series : $props.series;

	// $: if (!series && typeof y !== 'object') {
	// 	// Single Series
	// 	name = name ?? formatTitle(y, columnSummary[y].title);
	// } else {
	// 	// Multi Series
	// 	data = getCompletedData(data, x, y, series);
	// }

	// $: if (handleMissing === 'zero') {
	// 	data = replaceNulls(data, y);
	// }

	$: baseConfig = {
        type: 'line',
        markLine: {
        data: [{xAxis: xVal}],
        label: {
          show: true,
          position: 'insideEndTop'
        },
		animation: false,
        emphasis: {
            disabled: true
        }
      }
	};

	// $: seriesConfig = getSeriesConfig(
	// 	data,
	// 	x,
	// 	y,
	// 	series,
	// 	swapXY,
	// 	baseConfig,
	// 	name,
	// 	xMismatch,
	// 	columnSummary
	// );

	$: config.update((d) => {
		d.series.push(baseConfig);
		return d;
	});

	// $: if (options) {
	// 	config.update((d) => {
	// 		return { ...d, ...options };
	// 	});
	// }

	// $: chartOverrides = {
	// 	yAxis: {
	// 		boundaryGap: ['0%', '1%']
	// 	},
	// 	xAxis: {
	// 		boundaryGap: [xType === 'time' ? '2%' : '0%', '2%']
	// 	}
	// };

	// beforeUpdate(() => {
	// 	config.update((d) => {
	// 		if (swapXY) {
	// 			d.yAxis = { ...d.yAxis, ...chartOverrides.xAxis };
	// 			d.xAxis = { ...d.xAxis, ...chartOverrides.yAxis };
	// 		} else {
	// 			d.yAxis = { ...d.yAxis, ...chartOverrides.yAxis };
	// 			d.xAxis = { ...d.xAxis, ...chartOverrides.xAxis };
	// 		}
	// 		return d;
	// 	});
	// });
</script>