<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';
	import { propKey, configKey } from './context';
	import { formatValue } from '@evidence-dev/component-utilities/formatting';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import ErrorChart from './ErrorChart.svelte';
	import { colours } from '@evidence-dev/component-utilities/colours';

	let props = getContext(propKey);
	let config = getContext(configKey);

	export let x = undefined;
	export let y = undefined;
	export let data = undefined;
	export let label = undefined;

	export let color = undefined;
	export let lineColor = undefined;
	export let labelColor = undefined;
	export let lineWidth = undefined;
	export let lineType = 'dashed'; // solid, dashed, or dotted

	export let labelPosition = 'aboveEnd';
	export let labelTextOutline = false;
	$: labelTextOutline = labelTextOutline === 'true' || labelTextOutline === true;

	export let labelBackground = true;
	$: labelBackground = labelBackground === 'true' || labelBackground === true;

	export let hideValue = false;
	$: hideValue = hideValue === 'true' || hideValue === true;

	let colorList = {
		red: { lineColor: '#b04646', labelColor: '#b04646' },
		green: { lineColor: colours.green700, labelColor: colours.green700 },
		yellow: { lineColor: colours.yellow600, labelColor: colours.yellow700 },
		grey: { lineColor: colours.grey500, labelColor: colours.grey600 },
		blue: { lineColor: colours.blue500, labelColor: colours.blue500 }
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
	$: if (data && !error) {
		try {
			configData = [];
			if (x) {
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
		if (x) {
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

	let baseConfig;

	$: if (!error) {
		baseConfig = {
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
							result = !hideValue
								? `${formatValue(params.value, y ? yFormat : x ? xFormat : 'string')}`
								: '';
						} else {
							result = !hideValue
								? `${params.name} (${formatValue(
										params.value,
										y ? yFormat : x ? xFormat : 'string'
								  )})`
								: `${params.name}`;
						}
						return result;
					},
					color: labelColor,
					fontWeight: 'medium',
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
			d.series.push(baseConfig);
			return d;
		});
	}
</script>

{#if error}
	<ErrorChart
		{error}
		chartType={chartType === 'Reference Line' ? chartType : `${chartType}: Reference Line`}
	/>
{/if}
