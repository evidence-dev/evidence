<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from '@evidence-dev/component-utilities/chartContext';
	let props = getContext(propKey);
	let config = getContext(configKey);

	import getDistinctValues from '@evidence-dev/component-utilities/getDistinctValues';
	import { getThemeStores } from '../../../themes/themes.js';
	import { toBoolean } from '$lib/utils.js';

	const { resolveColor } = getThemeStores();

	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';

	export let y = undefined;
	const ySet = y ? true : false;
	export let series = undefined;
	const seriesSet = series ? true : false;
	export let options = undefined;
	export let name = undefined;

	export let fillColor = undefined;
	$: fillColorStore = resolveColor(fillColor);

	export let fillOpacity = 0.3;

	export let lineColor = undefined;
	$: lineColorStore = resolveColor(lineColor);

	export let lineWidth = 2;

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
	export let showAllLabels = false;
	$: showAllLabels = toBoolean(showAllLabels);

	export let seriesOrder = undefined;

	export let shape = 'polygon';
	export let max = undefined;

	$: data = $props.data;
	$: x = $props.x;
	$: y = ySet ? y : $props.y;
	$: yFormat = $props.yFormat;
	$: columnSummary = $props.columnSummary;
	$: series = seriesSet ? series : $props.series;

	let indicators = [];
	let seriesConfig = [];

	$: {
		indicators = [];
		seriesConfig = [];

		if (data && x && y) {
			const xValues = getDistinctValues(data, x);

			let maxValues = {};
			if (typeof y === 'object') {
				for (const yCol of y) {
					for (const row of data) {
						const xVal = row[x];
						const yVal = row[yCol];
						if (yVal !== null && yVal !== undefined) {
							if (!maxValues[xVal] || yVal > maxValues[xVal]) {
								maxValues[xVal] = yVal;
							}
						}
					}
				}
			} else {
				for (const row of data) {
					const xVal = row[x];
					const yVal = row[y];
					if (yVal !== null && yVal !== undefined) {
						if (!maxValues[xVal] || yVal > maxValues[xVal]) {
							maxValues[xVal] = yVal;
						}
					}
				}
			}

			indicators = xValues.map((xVal) => ({
				name: xVal,
				max: max !== undefined ? max : maxValues[xVal] * 1.1
			}));

			if (series) {
				const seriesDistinct = getDistinctValues(data, series);

				for (const seriesVal of seriesDistinct) {
					const filteredData = data.filter((d) => d[series] === seriesVal);

					let values = [];
					if (typeof y === 'object') {
						for (const xVal of xValues) {
							const row = filteredData.find((d) => d[x] === xVal);
							let sum = 0;
							for (const yCol of y) {
								sum += row ? (row[yCol] ?? 0) : 0;
							}
							values.push(sum);
						}
					} else {
						for (const xVal of xValues) {
							const row = filteredData.find((d) => d[x] === xVal);
							values.push(row ? (row[y] ?? 0) : 0);
						}
					}

					seriesConfig.push({
						name: seriesVal ?? 'null',
						value: values
					});
				}
			} else if (typeof y === 'object') {
				for (const yCol of y) {
					let values = [];
					for (const xVal of xValues) {
						const row = data.find((d) => d[x] === xVal);
						values.push(row ? (row[yCol] ?? 0) : 0);
					}
					seriesConfig.push({
						name: columnSummary[yCol]?.title ?? yCol,
						value: values
					});
				}
			} else {
				let values = [];
				for (const xVal of xValues) {
					const row = data.find((d) => d[x] === xVal);
					values.push(row ? (row[y] ?? 0) : 0);
				}
				seriesConfig.push({
					name: name ?? columnSummary[y]?.title ?? y,
					value: values
				});
			}
		}

		if (seriesOrder) {
			seriesConfig.sort((a, b) => seriesOrder.indexOf(a.name) - seriesOrder.indexOf(b.name));
		}
	}

	$: baseConfig = {
		type: 'radar',
		areaStyle: {
			color: $fillColorStore,
			opacity: fillOpacity
		},
		lineStyle: {
			width: parseInt(lineWidth),
			color: $lineColorStore
		},
		itemStyle: {
			color: $lineColorStore
		},
		label: {
			show: labels,
			formatter: function (params) {
				return formatValue(params.value, labelFormat ?? yFormat);
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
			focus: 'series',
			lineStyle: {
				width: 3
			}
		},
		showSymbol: labels || markers,
		symbol: markerShape,
		symbolSize: labels && !markers ? 0 : markerSize
	};

	$: radarSeries = seriesConfig.map((s) => ({
		...baseConfig,
		name: s.name,
		data: [{ name: s.name, value: s.value }]
	}));

	$: config.update((d) => {
		d.series.push(...radarSeries);
		d.legend.data.push(...radarSeries.map((s) => s.name.toString()));
		return d;
	});

	$: if (options) {
		config.update((d) => {
			return { ...d, ...options };
		});
	}

	beforeUpdate(() => {
		config.update((d) => {
			d.radar = {
				indicator: indicators,
				shape: shape
			};

			d.xAxis = { show: false };
			d.yAxis = [{ show: false }];
			d.grid = { show: false };

			if (labels) {
				d.axisPointer = { triggerEmphasis: false };
			}

			return d;
		});
	});
</script>
