<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';
	import { propKey, configKey } from '@evidence-dev/component-utilities/chartContext';
	import { formatValue } from '@evidence-dev/component-utilities/formatting';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import ErrorChart from '../core/ErrorChart.svelte';
	import { uiColours } from '@evidence-dev/component-utilities/colours';

	let props = getContext(propKey);
	let config = getContext(configKey);

	export let x = undefined;
	export let y = undefined;
	export let x2 = undefined;
	export let y2 = undefined;
	export let data = undefined;
	export let label = undefined;

	export let color = undefined;
	export let lineColor = undefined;
	export let labelColor = undefined;
	export let lineWidth = undefined;
	export let lineType = 'dashed'; // solid, dashed, or dotted
	// Override arrow symbol with custom svg path which is a nice aspect triangle
	let arrowPath = 'path://M0,10 L5,0 L10,10 z';
	export let symbol = 'none';
	if (symbol === 'arrow') {
		symbol = arrowPath;
	}

	export let labelPosition = 'aboveEnd';
	export let labelTextOutline = false;
	$: labelTextOutline = labelTextOutline === 'true' || labelTextOutline === true;

	export let labelBackground = true;
	$: labelBackground = labelBackground === 'true' || labelBackground === true;

	export let hideValue = false;
	$: hideValue = hideValue === 'true' || hideValue === true;

	let colorList = {
		red: { lineColor: '#b04646', labelColor: '#b04646' },
		green: { lineColor: uiColours.green700, labelColor: uiColours.green700 },
		yellow: { lineColor: uiColours.yellow600, labelColor: uiColours.yellow700 },
		grey: { lineColor: uiColours.grey500, labelColor: uiColours.grey600 },
		blue: { lineColor: uiColours.blue500, labelColor: uiColours.blue500 }
	};

	let defaultColor = 'grey';

	$: if (labelColor) {
		if (Object.keys(colorList).includes(labelColor)) {
			labelColor = colorList[labelColor].labelColor;
		}
	}

	$: if (lineColor) {
		if (Object.keys(colorList).includes(lineColor)) {
			lineColor = colorList[lineColor].lineColor;
		}
	}

	$: if (Object.keys(colorList).includes(color)) {
		lineColor = lineColor ?? colorList[color].lineColor;
		labelColor = labelColor ?? colorList[color].labelColor;
	} else {
		lineColor = lineColor ?? color ?? colorList[defaultColor].lineColor;
		labelColor = labelColor ?? color ?? colorList[defaultColor].labelColor;
	}

	let error;
	let chartType;
	let xFormat;
	let yFormat;
	let swapXY;

	$: try {
		chartType = $props.chartType;
	} catch (e) {
		chartType = 'Reference Line';
		error = 'Reference Line cannot be used outside of a chart component';
	}

	$: if (!error) {
		try {
			xFormat = $props.xFormat;
			yFormat = $props.yFormat;
			swapXY = $props.swapXY;

			if (swapXY) {
				[x, y] = [y, x];
				[x2, y2] = [y2, x2];
				[xFormat, yFormat] = [yFormat, xFormat];
			}
		} catch (e) {
			error = e;
		}
	}

	const labelPositions = {
		aboveEnd: 'insideEndTop',
		aboveStart: 'insideStartTop',
		aboveCenter: 'insideMiddleTop',
		aboveCentre: 'insideMiddleTop',
		belowEnd: 'insideEndBottom',
		belowStart: 'insideStartBottom',
		belowCenter: 'insideMiddleBottom',
		belowCentre: 'insideMiddleBottom'
	};

	$: labelPosition = labelPositions[labelPosition] ?? 'insideEndTop';

	let configData = [];
	$: {
		configData = [];

		if (data && !error) {
			try {
				if (typeof x !== 'undefined' && typeof y !== 'undefined') {
					checkInputs(data, [x]);
					checkInputs(data, [y]);
					for (let i = 0; i < data.length; i++) {
						try {
							if (x2 || y2) {
								const coord1 = {
									name: data[i][label] ?? label,
									coord: [data[i][x], data[i][y]]
								};
								const coord2 = {
									coord: [data[i][x2 || x], data[i][y2 || y]],
									symbol: symbol,
									symbolKeepAspect: true
								};
								configData.push([coord1, coord2]);
							} else {
								throw new Error('If you supply x and y, either x2 or y2 must be defined');
							}
						} catch (e) {
							error = e;
						}
					}
				} else if (x) {
					checkInputs(data, [x]);
					for (let i = 0; i < data.length; i++) {
						if (data[i][x] !== null) {
							configData.push({
								name: data[i][label],
								xAxis: data[i][x]
							});
						}
					}
				} else if (y) {
					checkInputs(data, [y]);
					for (let i = 0; i < data.length; i++) {
						if (data[i][y] !== null) {
							configData.push({
								name: data[i][label],
								yAxis: data[i][y]
							});
						}
					}
				}
			} catch (e) {
				error = e;
			}
		} else {
			if (typeof x !== 'undefined' && typeof y !== 'undefined') {
				try {
					if (x2 || y2) {
						const coord1 = { name: label, coord: [x, y] };
						const coord2 = { coord: [x2 || x, y2 || y], symbol: symbol, symbolKeepAspect: true };
						configData.push([coord1, coord2]);
					} else {
						throw new Error('If you supply x and y, either x2 or y2 must be defined');
					}
				} catch (e) {
					error = e;
				}
			} else if (x) {
				configData.push({
					name: label,
					xAxis: x
				});
			} else if (y) {
				configData.push({
					name: label,
					yAxis: y
				});
			}
		}
	}

	const identifier = String(Math.random());

	let baseConfig;

	$: if (!error) {
		baseConfig = {
			id: identifier,
			evidenceSeriesType: 'reference_line',
			type: 'line',
			markLine: {
				data: configData,
				silent: true,
				label: {
					show: true,
					position: labelPosition,
					formatter: function (params) {
						let result;
						if (params.name === '') {
							// If no label supplied
							result = !(hideValue || (typeof x !== 'undefined' && typeof y !== 'undefined'))
								? `${formatValue(
										y ? params.data.yAxis : x ? params.data.xAxis : params.value,
										y ? yFormat : x ? xFormat : 'string'
									)}`
								: '';
						} else {
							result = !(hideValue || (typeof x !== 'undefined' && typeof y !== 'undefined'))
								? `${params.name} (${formatValue(
										y ? params.data.yAxis : x ? params.data.xAxis : params.value,
										y ? yFormat : x ? xFormat : 'string'
									)})`
								: `${params.name}`;
						}
						return result;
					},
					color: labelColor,
					fontWeight: 400,
					textBorderColor: 'white',
					textBorderWidth: labelTextOutline ? 1.5 : 0,
					backgroundColor: labelBackground ? 'hsla(360, 100%, 100%, 0.7)' : '',
					padding: 1,
					borderRadius: 1.5
				},
				animation: false,
				symbol: 'none',
				emphasis: {
					disabled: true
				},
				lineStyle: {
					color: lineColor,
					width: lineWidth ? parseInt(lineWidth) : 1.3,
					type: lineType
				}
			}
		};

		config.update((d) => {
			const existingIndex = d.series.findIndex((e) => e.id === identifier);
			if (existingIndex > -1) {
				d.series[existingIndex] = baseConfig;
			} else {
				d.series.push(baseConfig);
			}
			return d;
		});
	}
</script>

{#if error}
	<ErrorChart
		{error}
		minHeight="50px"
		chartType={chartType === 'Reference Line' ? chartType : `${chartType}: Reference Line`}
	/>
{/if}
