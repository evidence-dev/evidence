<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from './context';
	$: props = getContext(propKey);
	$: config = getContext(configKey);

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
	export let name = undefined; // name to appear in legend (for single series graphics)
	export let type = 'stacked'; // stacked, grouped, or stacked100
	export let stackName = undefined;

	export let fillColor = undefined;
	export let fillOpacity = undefined;
	export let outlineColor = undefined;
	export let outlineWidth = undefined;

	let barMaxWidth = 60;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: x = $props.x;
	$: y = ySet ? y : $props.y;
	$: swapXY = $props.swapXY;
	$: xType = $props.xType;
	$: xMismatch = $props.xMismatch;
	$: columnSummary = $props.columnSummary;
	$: sort = $props.sort;
	$: series = seriesSet ? series : $props.series;

	let stackedData;
	let sortOrder;

	$: if (!series && typeof y !== 'object') {
		// Single Series
		name = name ?? formatTitle(y, columnSummary[y].title);

		if (swapXY && xType !== 'category') {
			data = getCompletedData(data, x, y, series, false, xType !== 'time');
			xType = 'category';
		}

		stackName = 'stack1';
	} else {
		// Multi Series
		// Sort by stack total for category axis
		if (sort === true && xType === 'category') {
			stackedData = getStackedData(data, x, y);

			if (typeof y === 'object') {
				stackedData = getSortedData(stackedData, 'stackTotal', false);
			} else {
				stackedData = getSortedData(stackedData, y, false);
			}

			sortOrder = stackedData.map((d) => d[x]);
			data = [...data].sort(function (a, b) {
				return sortOrder.indexOf(a[x]) - sortOrder.indexOf(b[x]);
			});
		}

		// Run fill for missing series entries, only if it's a stacked bar
		if (swapXY || ((xType === 'value' || xType === 'category') && type.includes('stacked'))) {
			data = getCompletedData(data, x, y, series, false, xType === 'value');
			xType = 'category';
		} else if (xType === 'time' && type.includes('stacked')) {
			data = getCompletedData(data, x, y, series, false, false);
		}

		if (type.includes('stacked')) {
			// Set up stacks
			stackName = stackName ?? 'stack1';
		} else {
			stackName = undefined;
		}
	}

	$: baseConfig = {
		type: 'bar',
		stack: stackName,
		label: {
			show: false
		},
		labelLayout: { hideOverlap: true },
		emphasis: {
			focus: 'series'
		},
		barMaxWidth: barMaxWidth,
		itemStyle: {
			color: fillColor,
			opacity: fillOpacity,
			borderColor: outlineColor,
			borderWidth: outlineWidth
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

	$: chartOverrides = {
		// Evidence definition of axes (yAxis = dependent, xAxis = independent)
		xAxis: {
			boundaryGap: ['1%', '2%'],
			type: xType
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
				if (type.includes('stacked')) {
					d.tooltip = { ...d.tooltip, order: 'seriesDesc' };
				} else {
					d.tooltip = { ...d.tooltip, order: 'seriesAsc' };
				}
				if (type === 'stacked100') {
					if (swapXY) {
						d.xAxis = { ...d.xAxis, max: 1 };
					} else {
						d.yAxis = { ...d.yAxis, max: 1 };
					}
				}
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
