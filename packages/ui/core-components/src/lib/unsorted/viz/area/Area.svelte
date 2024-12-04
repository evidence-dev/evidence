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
	import replaceNulls from '@evidence-dev/component-utilities/replaceNulls';
	import getCompletedData from '@evidence-dev/component-utilities/getCompletedData';
	import { getThemeStores } from '../../../themes/themes.js';

	const { resolveColor } = getThemeStores();

	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';

	export let y = undefined;
	const ySet = y ? true : false; // Hack, see chart.svelte
	export let series = undefined;
	const seriesSet = series ? true : false; // Hack, see chart.svelte
	export let options = undefined;
	export let name = undefined; // name to appear in legend (for single series graphics)

	export let type = 'stacked'; // stacked or stacked100

	export let fillColor = undefined;
	$: fillColorStore = resolveColor(fillColor);

	export let lineColor = undefined;
	$: lineColorStore = resolveColor(lineColor);

	export let fillOpacity = undefined;
	export let line = true;
	$: line = line === 'true' || line === true;

	export let markers = false;
	$: markers = markers === 'true' || markers === true;
	export let markerShape = 'circle';
	export let markerSize = 8;

	export let handleMissing = 'gap';

	/**
	 * Enables step mode for this chart.
	 * @type {boolean}
	 */
	export let step = false;
	$: step = step === 'true' || step === true;

	/**
	 * Configures position of steps (e.g. before or after)
	 * @type {'start' | 'middle' | 'end' }
	 */
	export let stepPosition = 'end';

	export let labels = false;
	$: labels = labels === 'true' || labels === true;
	export let labelSize = 11;
	export let labelPosition = 'top';

	export let labelColor = undefined;
	$: labelColorStore = resolveColor(labelColor);

	export let labelFmt = undefined;
	let labelFormat;
	if (labelFmt) {
		labelFormat = getFormatObjectFromString(labelFmt);
	}
	export let showAllLabels = false;
	export let seriesOrder = undefined;
	export let seriesLabelFmt = undefined;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: x = $props.x;
	$: y = ySet ? y : $props.y;
	$: swapXY = $props.swapXY;
	$: yFormat = $props.yFormat;
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
		stack: stackName,
		areaStyle: {
			color: $fillColorStore,
			opacity: fillOpacity
		},
		connectNulls: handleMissing === 'connect',
		lineStyle: {
			width: line ? 1 : 0,
			color: $lineColorStore
		},
		label: {
			show: labels,
			formatter: function (params) {
				return params.value[swapXY ? 0 : 1] === 0
					? ''
					: formatValue(params.value[swapXY ? 0 : 1], labelFormat ?? yFormat);
			},
			fontSize: labelSize,
			color: $labelColorStore,
			position: labelPosition,
			padding: 3
		},
		labelLayout: {
			hideOverlap: showAllLabels ? false : true
		},
		emphasis: {
			focus: 'series'
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
		undefined, // size (not needed)
		undefined, // tooltipTitle (not needed)
		undefined, // y2 (not needed)
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
				d.yAxis[0] = { ...d.yAxis[0], ...chartOverrides.yAxis };
				d.xAxis = { ...d.xAxis, ...chartOverrides.xAxis };
			}
			if (type === 'stacked100') {
				if (swapXY) {
					d.xAxis = { ...d.xAxis, max: 1 };
				} else {
					d.yAxis[0] = { ...d.yAxis[0], max: 1 };
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
