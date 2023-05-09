<script>
	import { getContext } from 'svelte';
	import { propKey, configKey } from './context';
	import { formatValue } from '$lib/modules/formatting.js';
	import checkInputs from '$lib/modules/checkInputs';
	import ErrorChart from './ErrorChart.svelte';

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

	export let showValueInLabel = true;
	showValueInLabel = showValueInLabel === 'true' || showValueInLabel === true;

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
					position: 'insideEndTop',
					formatter: function (params) {
						let result;
						if (params.name === '') {
							// If no label supplied
							result = showValueInLabel
								? `${formatValue(params.value, y ? yFormat : x ? xFormat : 'string')}`
								: '';
						} else {
							result = showValueInLabel
								? `${params.name} (${formatValue(
										params.value,
										y ? yFormat : x ? xFormat : 'string'
								  )})`
								: `${params.name}`;
						}
						return result;
					},
					color: labelColor ?? color ?? 'var(--grey-600)',
					fontWeight: 'medium',
					textBorderColor: 'white',
					textBorderWidth: 1
					//   backgroundColor: 'hsla(360, 100%, 100%, 0.6)',
					//   padding: 1.5,
					//   borderRadius: 2
				},
				animation: false,
				symbol: 'none',
				emphasis: {
					disabled: true
				},
				lineStyle: {
					color: lineColor ?? color ?? 'var(--grey-600)',
					width: lineWidth ? parseInt(lineWidth) : 1,
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
