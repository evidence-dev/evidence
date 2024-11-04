<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from '@evidence-dev/component-utilities/chartContext';
	$: props = getContext(propKey);
	$: config = getContext(configKey);

	import getSeriesConfig from '@evidence-dev/component-utilities/getSeriesConfig';
	import getStackedData from '@evidence-dev/component-utilities/getStackedData';
	import getSortedData from '@evidence-dev/component-utilities/getSortedData';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import getCompletedData from '@evidence-dev/component-utilities/getCompletedData';
	import getYAxisIndex from '@evidence-dev/component-utilities/getYAxisIndex';

	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';

	export let y = undefined;
	const ySet = y ? true : false; // Hack, see chart.svelte
	export let y2 = undefined;
	const y2Set = y2 ? true : false; // Hack, see chart.svelte
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

	export let labels = false;
	$: labels = labels === 'true' || labels === true;
	export let seriesLabels = true;
	$: seriesLabels = seriesLabels === 'true' || seriesLabels === true;
	export let labelSize = 11;
	export let labelPosition = undefined;
	export let labelColor = undefined;
	export let labelFmt = undefined;
	let labelFormat;
	if (labelFmt) {
		labelFormat = getFormatObjectFromString(labelFmt);
	}
	export let yLabelFmt = undefined;
	let yLabelFormat;
	if (yLabelFmt) {
		yLabelFormat = getFormatObjectFromString(yLabelFmt);
	}
	export let y2LabelFmt = undefined;
	let y2LabelFormat;
	if (y2LabelFmt) {
		y2LabelFormat = getFormatObjectFromString(y2LabelFmt);
	}

	export let y2SeriesType = 'bar';

	export let stackTotalLabel = true;
	$: stackTotalLabel = stackTotalLabel === 'true' || stackTotalLabel === true;
	export let showAllLabels = false;
	export let seriesOrder = undefined;
	let barMaxWidth = 60;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: x = $props.x;
	$: y = ySet ? y : $props.y;
	$: y2 = y2Set ? y2 : $props.y2;
	$: yFormat = $props.yFormat;
	$: y2Format = $props.y2Format;
	$: yCount = $props.yCount;
	$: y2Count = $props.y2Count;
	$: swapXY = $props.swapXY;
	$: xType = $props.xType;
	$: xMismatch = $props.xMismatch;
	$: columnSummary = $props.columnSummary;
	$: sort = $props.sort;
	$: series = seriesSet ? series : $props.series;

	let stackedData;
	let sortOrder;
	let defaultLabelPosition;

	$: if (!series && typeof y !== 'object') {
		// Single Series
		name = name ?? formatTitle(y, columnSummary[y].title);

		if (swapXY && xType !== 'category') {
			data = getCompletedData(data, x, y, series, true, xType !== 'time');
			xType = 'category';
		}

		stackName = 'stack1';

		defaultLabelPosition = swapXY ? 'right' : 'top';
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
			data = getCompletedData(data, x, y, series, true, xType === 'value');
			xType = 'category';
		} else if (xType === 'time' && type.includes('stacked')) {
			data = getCompletedData(data, x, y, series, true, true);
		}

		if (type.includes('stacked')) {
			// Set up stacks
			stackName = stackName ?? 'stack1';
			defaultLabelPosition = 'inside';
		} else {
			stackName = undefined;
			defaultLabelPosition = swapXY ? 'right' : 'top';
		}
	}

	let stackTotalSeries;
	$: if (type === 'stacked') {
		stackTotalSeries = getStackedData(data, x, y);
	}

	// Value label positions:
	const labelPositions = {
		outside: 'top',
		inside: 'inside'
	};

	const swapXYLabelPositions = {
		outside: 'right',
		inside: 'inside'
	};

	$: labelPosition =
		(swapXY ? swapXYLabelPositions[labelPosition] : labelPositions[labelPosition]) ??
		defaultLabelPosition;

	$: baseConfig = {
		type: 'bar',
		stack: stackName,
		label: {
			show: labels && seriesLabels,
			// formatter: function (params) {
			// 	let output;
			// 	output =
			// 		params.value[swapXY ? 0 : 1] === 0
			// 			? ''
			// 			: formatValue(params.value[swapXY ? 0 : 1], labelFormat ?? yFormat);
			// 	return output;
			// },
			formatter: function (params) {
				return params.value[swapXY ? 0 : 1] === 0
					? ''
					: formatValue(
							params.value[swapXY ? 0 : 1],
							[yLabelFormat ?? labelFormat ?? yFormat, y2LabelFormat ?? labelFormat ?? y2Format][
								getYAxisIndex(params.componentIndex, yCount, y2Count)
							]
						);
			},
			position: labelPosition,
			fontSize: labelSize,
			color: labelColor
		},
		labelLayout: {
			hideOverlap: showAllLabels ? false : true
		},
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
		columnSummary,
		seriesOrder,
		undefined,
		undefined,
		y2
	);

	$: config.update((d) => {
		d.series.push(...seriesConfig);
		// Push series into legend:
		d.legend.data.push(...seriesConfig.map((d) => d.name.toString()));

		// Stacked chart total label:
		// series !== x is to avoid an issue where same column is used for both - stackTotalLabel can't handle that
		if (
			labels === true &&
			type === 'stacked' &&
			(typeof y === 'object') | (series !== undefined) &&
			stackTotalLabel === true &&
			series !== x
		) {
			// push stack total series for total label
			d.series.push({
				type: 'bar',
				stack: stackName,
				name: 'stackTotal',
				color: 'none',
				data: stackTotalSeries.map((d) => [
					swapXY ? 0 : xMismatch ? d[x].toString() : d[x],
					swapXY ? (xMismatch ? d[x].toString() : d[x]) : 0
				]),
				label: {
					show: true,
					position: swapXY ? 'right' : 'top',
					formatter: function (params) {
						let sum = 0;
						seriesConfig.forEach((s) => {
							sum += s.data[params.dataIndex][swapXY ? 0 : 1];
						});
						return sum === 0 ? '' : formatValue(sum, labelFormat ?? yFormat);
					},
					fontWeight: 'bold',
					fontSize: labelSize,
					padding: swapXY ? [0, 0, 0, 5] : undefined
				}
			});

			// disable legend selected mode when stackTotalLabel is displayed:
			d.legend.selectedMode = false;
		}
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
						d.yAxis[0] = { ...d.yAxis[0], max: 1 };
					}
				}
				if (swapXY) {
					d.yAxis = { ...d.yAxis, ...chartOverrides.xAxis };
					d.xAxis = { ...d.xAxis, ...chartOverrides.yAxis };
				} else {
					d.yAxis[0] = { ...d.yAxis[0], ...chartOverrides.yAxis };
					d.xAxis = { ...d.xAxis, ...chartOverrides.xAxis };
					if (y2) {
						d.yAxis[1] = { ...d.yAxis[1], show: true };
						if (['line', 'bar', 'scatter'].includes(y2SeriesType)) {
							for (let i = 0; i < y2Count; i++) {
								d.series[yCount + i].type = y2SeriesType;
								d.series[yCount + i].stack = undefined;
							}
						}
					}
				}
				return d;
			});
		}
	});
</script>
