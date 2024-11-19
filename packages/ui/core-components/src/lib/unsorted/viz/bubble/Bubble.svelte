<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from '@evidence-dev/component-utilities/chartContext';
	let props = getContext(propKey);
	let config = getContext(configKey);

	import getSeriesConfig from '@evidence-dev/component-utilities/getSeriesConfig';
	import { getColumnExtentsLegacy } from '@evidence-dev/component-utilities/getColumnExtents';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import { formatValue } from '@evidence-dev/component-utilities/formatting';
	import getCompletedData from '@evidence-dev/component-utilities/getCompletedData';
	import { getThemeStores } from '../../../themes/themes.js';

	const { resolveColor } = getThemeStores();

	export let y = undefined;
	const ySet = y ? true : false; // Hack, see chart.svelte
	export let series = undefined;
	const seriesSet = series ? true : false; // Hack, see chart.svelte
	export let options = undefined;
	export let size = undefined;
	export let name = undefined; // name to appear in legend (for single series graphics)

	export let shape = undefined;

	export let fillColor = undefined;
	$: fillColorStore = resolveColor(fillColor);

	export let opacity = 0.7; // opacity of both fill and outline (ECharts limitation)

	export let outlineColor = undefined;
	$: outlineColorStore = resolveColor(outlineColor);

	export let outlineWidth = undefined;

	let maxSize = 35;
	export let scaleTo = 1;
	$: maxSize = maxSize * (scaleTo / 1);

	export let useTooltip = false;
	export let tooltipTitle;
	export let seriesOrder = undefined;

	let multiSeries;
	let tooltipOutput;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: x = $props.x;
	$: swapXY = $props.swapXY;
	$: xType = $props.xType;
	$: xFormat = $props.xFormat;
	$: yFormat = $props.yFormat;
	$: sizeFormat = $props.sizeFormat;
	$: xMismatch = $props.xMismatch;
	$: columnSummary = $props.columnSummary;
	$: y = ySet ? y : $props.y;
	$: series = seriesSet ? series : $props.series;
	$: size = size ?? $props.size;
	$: tooltipTitle = tooltipTitle ?? $props.tooltipTitle;

	$: if (!series && typeof y !== 'object') {
		// Single Series
		name = name ?? formatTitle(y, columnSummary[y].title);
		multiSeries = false;
	} else {
		// Multi Series
		data = getCompletedData(data, x, y, series);
		multiSeries = true;
	}

	// Determine bubble sizes:
	$: sizeExtents = getColumnExtentsLegacy(data, size);
	$: maxData = sizeExtents[1];
	$: maxSizeSq = Math.pow(maxSize, 2);

	// Maximum point in dataset is assigned the maximum point area on the graph. Other
	// points are assigned based on their proportion to the maximum point.
	// E.g., if max point in dataset is 100 and we want to plot 45 as the next point,
	// we will be drawing a point that is 45% of the area of the max point

	function bubbleSize(newPoint) {
		const newPointSize = newPoint[2];
		return Math.sqrt((newPointSize / maxData) * maxSizeSq);
	}

	$: baseConfig = {
		type: 'scatter',
		label: {
			show: false
		},
		labelLayout: { hideOverlap: true },
		emphasis: {
			focus: 'series'
		},
		symbolSize: function (newPoint) {
			return bubbleSize(newPoint);
		},
		symbol: shape,
		itemStyle: {
			color: $fillColorStore,
			opacity: opacity,
			borderColor: $outlineColorStore,
			borderWidth: outlineWidth
		}
	};

	// Tooltip settings (scatter and bubble charts require different tooltip than default)

	let tooltipOpts;
	let tooltipOverride;
	if (useTooltip) {
		tooltipOpts = {
			tooltip: {
				formatter: function (params) {
					if (multiSeries) {
						if (tooltipTitle) {
							tooltipOutput = `<span id="tooltip" style='font-weight:600'>${formatValue(
								params.value[3],
								'0'
							)}</span><br/>
                            ${formatTitle(
															series
														)}: <span style='float:right; margin-left: 15px;'>${formatValue(
															params.seriesName
														)}</span><br/>
                            ${formatTitle(
															x,
															xFormat
														)}: <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[0],
															xFormat
														)}</span><br/>
                            ${formatTitle(
															typeof y === 'object' ? params.seriesName : y,
															yFormat
														)}: <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[1],
															yFormat
														)}</span><br/>
                            ${formatTitle(
															size,
															sizeFormat
														)} <span style='font-weight: 400;'> (size)</span>: <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[2],
															sizeFormat
														)}</span>`;
						} else {
							tooltipOutput = `<span id="tooltip" style='font-weight:600'>${formatValue(
								params.seriesName
							)}</span><br/>
                            ${formatTitle(
															x,
															xFormat
														)}: <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[0],
															xFormat
														)}</span><br/>
                            ${formatTitle(
															typeof y === 'object' ? params.seriesName : y,
															yFormat
														)}: <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[1],
															yFormat
														)}</span><br/>
                            ${formatTitle(
															size,
															sizeFormat
														)} <span style='font-weight: 400;'> (size)</span>: <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[2],
															sizeFormat
														)}</span>`;
						}
					} else {
						if (tooltipTitle) {
							tooltipOutput = `<span id="tooltip" style='font-weight:600;'>${formatValue(
								params.value[3],
								'0'
							)}</span><br/>
                            <span style='font-weight: 400;'>${formatTitle(
															x,
															xFormat
														)}:</span> <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[0],
															xFormat
														)}</span><br/>
                            <span style='font-weight: 400;'>${formatTitle(
															y,
															yFormat
														)}:</span> <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[1],
															yFormat
														)}</span><br/>
                            <span style='font-weight: 400;'>${formatTitle(
															size,
															sizeFormat
														)} <span style='font-weight: 400;'> (size)</span>:</span> <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[2],
															sizeFormat
														)}</span>`;
						} else {
							tooltipOutput = `<span id="tooltip" style='font-weight: 600;'>${formatTitle(
								x,
								xFormat
							)}:</span> <span style='float:right; margin-left: 15px;'>${formatValue(
								params.value[0],
								xFormat
							)}</span><br/>
                            <span style='font-weight: 600;'>${formatTitle(
															y,
															yFormat
														)}:</span> <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[1],
															yFormat
														)}</span><br/>
                            <span style='font-weight: 600;'>${formatTitle(
															size,
															sizeFormat
														)} <span style='font-weight: 400;'> (size)</span>:</span> <span style='float:right; margin-left: 15px;'>${formatValue(
															params.value[2],
															sizeFormat
														)}</span>`;
						}
					}
					return tooltipOutput;
				}
			}
		};

		baseConfig = { ...baseConfig, ...tooltipOpts };

		tooltipOverride = {
			tooltip: {
				trigger: 'item'
			}
		};
	}

	// If user has passed in custom echarts config options, append to the baseConfig:
	$: if (options) {
		baseConfig = { ...baseConfig, ...options };
	}

	// Generate config for each series:
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
		size,
		tooltipTitle
	);
	$: config.update((d) => {
		d.series.push(...seriesConfig);
		// Push series into legend:
		d.legend.data.push(...seriesConfig.map((d) => d.name.toString()));
		return d;
	});

	// Overriding global chart config:
	$: chartOverrides = {
		yAxis: {
			scale: true,
			boundaryGap: ['1%', '1%']
		},
		xAxis: {
			boundaryGap: [xType === 'time' ? '2%' : '1%', '2%']
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
			}
			if (useTooltip) {
				d.tooltip = { ...d.tooltip, ...tooltipOverride.tooltip };
			}
			return d;
		});
	});
</script>
