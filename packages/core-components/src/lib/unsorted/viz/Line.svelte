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

	export let lineColor = undefined;
	export let lineWidth = 2;
	export let lineType = 'solid';
	export let lineOpacity = undefined;

	export let markers = false;
	$: markers = markers === 'true' || markers === true;
	export let markerShape = 'circle';
	export let markerSize = 8;

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

	$: if (!series && typeof y !== 'object') {
		// Single Series
		name = name ?? formatTitle(y, columnSummary[y].title);
	} else {
		// Multi Series
		data = getCompletedData(data, x, y, series);
	}

	$: if (handleMissing === 'zero') {
		data = replaceNulls(data, y);
	}

	$: baseConfig = {
		type: 'line',
		label: {
			show: false
		},
		connectNulls: handleMissing === 'connect',
		labelLayout: { hideOverlap: true },
		emphasis: {
			focus: 'series',
			endLabel: {
				show: false
			},
			lineStyle: {
				opacity: 1,
				width: 3
			}
		},
		lineStyle: {
			width: parseInt(lineWidth),
			type: lineType
		},
		itemStyle: {
			color: lineColor,
			opacity: lineOpacity
		},
		showSymbol: markers,
		symbol: markerShape,
		symbolSize: markerSize
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
			boundaryGap: [xType === 'time' ? '2%' : '0%', '2%']
		}
	};

	beforeUpdate(() => {
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
	});
</script>
