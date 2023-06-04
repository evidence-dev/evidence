<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from './context';
	let props = getContext(propKey);
	let config = getContext(configKey);

	import getSeriesConfig from '@evidence-dev/component-utilities/getSeriesConfig';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import replaceNulls from '@evidence-dev/component-utilities/replaceNulls';
	import getCompletedData from '@evidence-dev/component-utilities/getCompletedData';

	export let y = undefined;
	const ySet = y ? true : false; // Hack, see chart.svelte
	export let series = undefined;
	const seriesSet = series ? true : false; // Hack, see chart.svelte
	export let options = undefined;
	export let name = undefined; // name to appear in legend (for single series graphics)

	export let type = 'stacked'; // stacked or stacked100

	export let fillColor = undefined;
	export let lineColor = undefined;
	export let fillOpacity = undefined;
	export let line = true;
	$: line = line === 'true' || line === true;

	export let handleMissing = 'gap';

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: x = $props.x;
	$: y = ySet ? y : $props.y;
	$: swapXY = $props.swapXY;
	$: xType = $props.xType;
	$: xMismatch = $props.xMismatch;
	$: columnSummary = $props.columnSummary;
	$: series = seriesSet ? series : $props.series;

	let stackName;
	$: if (!series && typeof y !== 'object') {
		// Single Series
		name = name ?? formatTitle(y, columnSummary[y].title);
	} else {
		// Multi Series
		stackName = 'area'; // area must be stacked for multi-series chart
		data = getCompletedData(data, x, y, series, false, xType === 'value'); // fill in missing X if it's a value axis (because we need to plot it as category axis)
		data = replaceNulls(data, y); // nulls must be zero (or area shapes will be drawn incorrectly - ECharts limitation)
		xType = xType === 'value' ? 'category' : xType;
	}

	$: if (handleMissing === 'zero') {
		data = replaceNulls(data, y);
	}

	$: baseConfig = {
		type: 'line',
		stack: stackName,
		areaStyle: {
			color: fillColor,
			opacity: fillOpacity
		},
		connectNulls: handleMissing === 'connect',
		lineStyle: {
			width: line ? 1 : 0,
			color: lineColor
		},
		label: {
			show: false
		},
		labelLayout: { hideOverlap: true },
		emphasis: {
			focus: 'series'
		}
	};

	$: seriesConfig = getSeriesConfig(
		data,
		x,
		y,
		series,
		swapXY,
		baseConfig,
		name,
		xMismatch,
		columnSummary
	);

	$: config.update((d) => {
		d.series.push(...seriesConfig);
		return d;
	});

	$: if (options) {
		config.update((d) => {
			return { ...d, ...options };
		});
	}

	$: chartOverrides = {
		yAxis: {
			boundaryGap: ['0%', '1%']
		},
		xAxis: {
			boundaryGap: ['4%', '4%'],
			type: xType
		}
	};

	beforeUpdate(() => {
		config.update((d) => {
			d.tooltip = { ...d.tooltip, order: 'seriesDesc' }; // Areas always stacked
			if (swapXY) {
				d.yAxis = { ...d.yAxis, ...chartOverrides.xAxis };
				d.xAxis = { ...d.xAxis, ...chartOverrides.yAxis };
			} else {
				d.yAxis = { ...d.yAxis, ...chartOverrides.yAxis };
				d.xAxis = { ...d.xAxis, ...chartOverrides.xAxis };
			}
			if (type === 'stacked100') {
				if (swapXY) {
					d.xAxis = { ...d.xAxis, max: 1 };
				} else {
					d.yAxis = { ...d.yAxis, max: 1 };
				}
			}
			return d;
		});
	});
</script>
