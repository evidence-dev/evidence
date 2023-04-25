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

    export let xMin = undefined;
    export let xMax = undefined;
    export let yMin = undefined;
    export let yMax = undefined;
	export let label = undefined;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: x = $props.x;
	$: y = ySet ? y : $props.y;
	$: swapXY = $props.swapXY;
	$: xType = $props.xType;
	$: xMismatch = $props.xMismatch;
	$: columnSummary = $props.columnSummary;
	$: series = seriesSet ? series : $props.series;

	$: baseConfig = {
        type: 'line',
            markArea: {
        data: [[
          {
			name: label,
            xAxis: xMin,
			yAxis: yMin
          },
          {
            xAxis: xMax,
			yAxis: yMax
          }
          ]
          ],
		  animation: false,
        emphasis: {
            disabled: true
        },
		itemStyle: {
			color: 'var(--blue-100)',
			// borderColor: 'var(--blue-200)',
			// borderWidth: 1,
			// borderType: 'dashed'
		},
		label: {
			show: true,
			position: 'insideTopLeft',
			color: 'var(--blue-300)'
		},
		z: 0
      }
	};

	$: config.update((d) => {
		d.series.push(baseConfig);
		return d;
	});

</script>