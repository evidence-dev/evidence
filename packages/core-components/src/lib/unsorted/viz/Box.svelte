<script context="module">
	export const evidenceInclude = true;

</script>

<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from './context';
	$: props = getContext(propKey);
	$: config = getContext(configKey);

	// import { prepareBoxplotData } from 'echarts/extension/dataTool';
	import getSeriesConfig from '@evidence-dev/component-utilities/getSeriesConfig';
	import getStackedData from '@evidence-dev/component-utilities/getStackedData';
	import getSortedData from '@evidence-dev/component-utilities/getSortedData';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import getCompletedData from '@evidence-dev/component-utilities/getCompletedData';

	export let y = undefined;
	const ySet = y ? true : false; // Hack, see chart.svelte
	export let series = undefined;
	const seriesSet = series ? true : false; // Hack, see chart.svelte
	export let options = undefined;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: y = ySet ? y : $props.y;
	$: swapXY = $props.swapXY;
	$: columnSummary = $props.columnSummary;
	$: series = seriesSet ? series : $props.series;

	let boxData = [
		[100, 150, 200, 250, 1000],
		[130, 155, 260, 280, 800]
	];
	// $: data = echarts.dataTool.prepareBoxplotData(data.map(d => d[y]));

	let outlierData = [
		[0,2],
		[0, 1400],
		[1, 5],
		[1, 10],
		[1, 17]
	];

	$: boxConfig = {
		type: 'boxplot',
		data: boxData
	};

	$: outlierConfig = {
		name: 'outlier',
		type: 'scatter',
		data: outlierData
	}

	$: config.update((d) => {
		d.series.push(boxConfig);
		d.series.push(outlierConfig);
		return d;
	});

	$: chartOverrides = {
		// Evidence definition of axes (yAxis = dependent, xAxis = independent)
		xAxis: {
			boundaryGap: ['1%', '2%'],
			type: 'category',
			data: ['a', 'b']
		}
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
					d.yAxis = { ...d.yAxis, ...chartOverrides.yAxis };
					d.xAxis = { ...d.xAxis, ...chartOverrides.xAxis };
				}
				return d;
			});
		}
	});
</script>
