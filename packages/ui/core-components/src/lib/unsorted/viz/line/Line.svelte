<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from '@evidence-dev/component-utilities/chartContext';
	let props = getContext(propKey);
	let config = getContext(configKey);

	import getSeriesConfig from '@evidence-dev/component-utilities/getSeriesConfig';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import getCompletedData from '@evidence-dev/component-utilities/getCompletedData';
	import getYAxisIndex from '@evidence-dev/component-utilities/getYAxisIndex';
	import { toBoolean } from '$lib/utils.js';

	const { resolveColor } = getThemeStores();

	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { getThemeStores } from '../../../themes/themes.js';

	export let y = undefined;
	const ySet = y ? true : false; // Hack, see chart.svelte
	export let y2 = undefined;
	const y2Set = y2 ? true : false; // Hack, see chart.svelte
	export let series = undefined;
	const seriesSet = series ? true : false; // Hack, see chart.svelte
	export let options = undefined;
	export let name = undefined; // name to appear in legend (for single series graphics)

	export let lineColor = undefined;
	$: lineColorStore = resolveColor(lineColor);

	export let lineWidth = 2;
	export let lineType = 'solid';
	export let lineOpacity = undefined;

	export let markers = false;
	$: markers = toBoolean(markers);
	export let markerShape = 'circle';
	export let markerSize = 8;

	export let labels = false;
	$: labels = toBoolean(labels);
	export let labelSize = 11;
	export let labelPosition = 'top';

	export let labelColor = undefined;
	$: labelColorStore = resolveColor(labelColor);

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

	export let y2SeriesType = undefined;
	export let showAllLabels = false;
	$: showAllLabels = toBoolean(showAllLabels);

	export let handleMissing = 'gap';

	/**
	 * Enables step mode for this chart.
	 * @type {boolean}
	 */
	export let step = false;
	$: step = toBoolean(step);

	/**
	 * Configures position of steps (e.g. before or after)
	 * @type {'start' | 'middle' | 'end' }
	 */
	export let stepPosition = 'end';
	export let seriesOrder = undefined;
	/** @type {string | undefined} */
	export let seriesLabelFmt = undefined;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: x = $props.x;
	$: y = ySet ? y : $props.y;
	$: y2 = y2Set ? y2 : $props.y2;
	$: swapXY = $props.swapXY;
	$: yFormat = $props.yFormat;
	$: y2Format = $props.y2Format;
	$: yCount = $props.yCount;
	$: y2Count = $props.y2Count;
	$: xType = $props.xType;
	$: xMismatch = $props.xMismatch;
	$: columnSummary = $props.columnSummary;
	$: series = seriesSet ? series : $props.series;

	$: if (!series && typeof y !== 'object') {
		// Single Series
		name = name ?? formatTitle(y, columnSummary[y].title);
	} else {
		// Multi Series
		try {
			data = getCompletedData(data, x, y, series);
		} catch (e) {
			console.warn('Failed to complete data', { e });
			data = [];
		}
	}

	$: if (handleMissing === 'zero') {
		try {
			data = getCompletedData(data, x, y, series, true);
		} catch (e) {
			console.warn('Failed to complete data', { e });
			data = [];
		}
	}

	// Value label positions:
	const labelPositions = {
		above: 'top',
		below: 'bottom',
		middle: 'inside'
	};

	const swapXYLabelPositions = {
		above: 'right',
		below: 'left',
		middle: 'inside'
	};

	let defaultLabelPosition = swapXY ? 'right' : 'top';
	$: labelPosition =
		(swapXY ? swapXYLabelPositions[labelPosition] : labelPositions[labelPosition]) ??
		defaultLabelPosition;

	$: baseConfig = {
		type: 'line',
		label: {
			show: labels,
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
			fontSize: labelSize,
			color: $labelColorStore,
			position: labelPosition,
			padding: 3
		},
		labelLayout: {
			hideOverlap: showAllLabels ? false : true
		},
		connectNulls: handleMissing === 'connect',
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
			type: lineType,
			opacity: lineOpacity
		},
		itemStyle: {
			color: $lineColorStore,
			opacity: lineOpacity
		},
		showSymbol: labels || markers,
		symbol: markerShape,
		symbolSize: labels && !markers ? 0 : markerSize,
		step: step ? stepPosition : false
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
		y2,
		seriesLabelFmt
	);

	$: config.update((d) => {
		d.series.push(...seriesConfig);
		// Push series into legend:
		d.legend.data.push(...seriesConfig.map((d) => d.name.toString()));

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
				d.yAxis[0] = { ...d.yAxis[0], ...chartOverrides.yAxis };
				d.xAxis = { ...d.xAxis, ...chartOverrides.xAxis };
				if (y2) {
					d.yAxis[1] = { ...d.yAxis[1], show: true };
					if (['line', 'bar', 'scatter'].includes(y2SeriesType)) {
						for (let i = 0; i < y2Count; i++) {
							d.series[yCount + i].type = y2SeriesType;
						}
					}
				}
			}

			// If labels are turned on, need to turn off "emphasis" state to avoid labels flashing on hover
			if (labels) {
				d.axisPointer = { triggerEmphasis: false };
			}

			return d;
		});
	});
</script>
