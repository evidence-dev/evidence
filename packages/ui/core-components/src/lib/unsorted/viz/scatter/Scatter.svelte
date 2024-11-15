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
	import { formatValue } from '@evidence-dev/component-utilities/formatting';
	import getCompletedData from '@evidence-dev/component-utilities/getCompletedData';

	export let y = undefined;
	const ySet = y ? true : false; // Hack, see chart.svelte
	export let series = undefined;
	const seriesSet = series ? true : false; // Hack, see chart.svelte
	export let options = undefined;
	export let name = undefined; // name to appear in legend (for single series graphics)

	export let shape = 'circle';
	export let fillColor = undefined;
	export let opacity = 0.7; // opacity of both fill and outline (ECharts limitation)
	export let outlineColor = undefined;
	export let outlineWidth = undefined;
	export let pointSize = 10;

	export let useTooltip = false; // if true, will override the default 'axis'-based echarts tooltip. true only for scatter-only charts
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

	// Set up base config for this type of chart series:
	$: baseConfig = {
		type: 'scatter',
		label: {
			show: false
		},
		labelLayout: { hideOverlap: true },
		emphasis: {
			focus: 'item'
		},
		symbol: shape,
		symbolSize: pointSize,
		itemStyle: {
			color: fillColor,
			opacity: opacity,
			borderColor: outlineColor,
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
								params.value[2],
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
														)}</span>`;
						}
					} else {
						if (tooltipTitle) {
							tooltipOutput = `<span id="tooltip" style='font-weight:600;'>${formatValue(
								params.value[2],
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
		undefined,
		tooltipTitle
	);
	$: config.update((d) => {
		d.series.push(...seriesConfig);
		// Push series into legend:
		d.legend.data.push(...seriesConfig.map((d) => d.name.toString()));
		return d;
	});

	// Chart-level config settings:
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
