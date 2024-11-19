<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';
	import { propKey, configKey } from '@evidence-dev/component-utilities/chartContext';
	let props = getContext(propKey);
	let config = getContext(configKey);

	import ecStat from 'echarts-stat';
	import getDistinctValues from '@evidence-dev/component-utilities/getDistinctValues';
	import { formatValue } from '@evidence-dev/component-utilities/formatting';
	import { getThemeStores } from '../../../themes/themes.js';

	const { resolveColor } = getThemeStores();

	export let x = undefined;
	const xSet = x ? true : false; // Hack, see chart.svelte

	export let fillColor = undefined;
	$: fillColorStore = resolveColor(fillColor);

	export let fillOpacity = 1;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	let data;
	$: data = $props.data;
	$: x = x ?? $props.x;
	$: x = xSet ? x : $props.x;

	$: xFormat = $props.xFormat;

	// Determine right method to use based on distinct x values (echarts-stat limitation causes some errors otherwise)
	let method;
	$: xDistinct = getDistinctValues(data, x).filter(function (x) {
		return x != null;
	});
	$: xMax = Math.max(...xDistinct);

	$: if (xDistinct.length <= 1) {
		method = 'squareRoot';
	} else if (xMax < 10) {
		method = 'freedmanDiaconis';
	} else if (xMax < 40) {
		method = 'sturges';
	} else {
		method = 'squareRoot';
	}

	// Filter dataset to only x column and create bins
	$: data = data.map((d) => d[x]);

	// Run ECharts histogram function
	$: histData = ecStat.histogram(data, method);

	// Remove empty first bin if it would cause negative values on x-axis:
	$: firstBinMin = histData.data[0][2];
	$: firstBinCount = histData.data[0][1];
	$: if (firstBinMin < 0 && firstBinCount === 0) {
		histData.data.shift();
	}

	$: seriesConfig = {
		type: 'custom',
		label: { show: true },
		renderItem: function (params, api) {
			let yValue = api.value(1);
			let start = api.coord([api.value(2), yValue]);
			let size = api.size([api.value(3) - api.value(2), yValue]);
			let barColor = api.visual('color');
			return {
				type: 'rect',
				shape: {
					x: start[0],
					y: start[1],
					width: size[0] - 1, // 1 is the gap between bars. Possibly turn this into variable for changing.
					height: size[1]
				},
				style: {
					fill: $fillColorStore ?? barColor,
					opacity: fillOpacity
				}
			};
		},
		data: histData.data,
		encode: {
			tooltip: [1], // y column from shape{} above,
			itemName: 4 // data at index 4 of api.value() - min and max of bin separated by hyphen
		},
		tooltip: {
			formatter: function (params) {
				// params.value[0] = bin midpoint
				// params.value[1] = frequency (count)
				// params.value[2] = bin min
				// params.value[3] = bin max
				// params.value[4] = string of bin range - min and max separated by hyphen

				return `<span style='font-weight:600;'>${formatValue(
					params.value[2],
					xFormat
				)} - ${formatValue(params.value[3], xFormat)}</span> <span style='margin-left: 10px;'> ${
					params.value[1]
				}</span>`;
			}
		},
		z: 3
	};

	$: config.update((d) => {
		d.series.push(seriesConfig);
		return d;
	});

	$: chartOverrides = {
		yAxis: {
			// vertical axis
			boundaryGap: ['0%', '1%'],
			axisLabel: {
				formatter: null
			}
		},
		xAxis: {
			// horizontal axis
			boundaryGap: ['1%', '1%'],
			scale: false,
			min: histData.data[0][2] // min of bin for first bin in hist dataset
		},
		tooltip: {
			trigger: 'item'
		}
	};

	$: if (chartOverrides) {
		config.update((d) => {
			d.yAxis[0] = { ...d.yAxis[0], ...chartOverrides.yAxis };
			d.xAxis = { ...d.xAxis, ...chartOverrides.xAxis };
			d.tooltip = { ...d.tooltip, ...chartOverrides.tooltip };
			return d;
		});
	}
</script>
