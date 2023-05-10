<script>
	import { getContext } from 'svelte';
	import { propKey, configKey } from './context';
	import checkInputs from '$lib/modules/checkInputs';
	import ErrorChart from './ErrorChart.svelte';
	let props = getContext(propKey);
	let config = getContext(configKey);

	export let x1 = undefined;
	export let x2 = undefined;
	export let y1 = undefined;
	export let y2 = undefined;
	export let label = undefined;
	export let data = undefined;

	export let color = undefined;
	export let opacity = 1;
	export let labelColor = undefined;
	export let border = false;
	export let borderColor = undefined;
	export let borderType = undefined;
	export let borderWidth = undefined;
	export let labelPosition = undefined;

	let chartType;
	let error;
	let swapXY;

	$: try {
		chartType = $props.chartType;
	} catch (e) {
		chartType = 'Reference Area';
		error = 'Reference Area cannot be used outside of a chart component';
	}

	$: if (!error) {
		try {
			swapXY = $props.swapXY;
			if (swapXY) {
				[x1, x2, y1, y2] = [y1, y2, x1, x2];
				labelPosition = labelPosition ?? 'topRight';
			} else {
				labelPosition = labelPosition ?? 'topLeft';
			}
		} catch (e) {
			error = e;
		}
	}

	$: switch (labelPosition) {
		case 'topLeft':
			labelPosition = 'insideTopLeft';
			break;
		case 'topRight':
			labelPosition = 'insideTopRight';
			break;
		case 'topCenter':
			labelPosition = 'insideTop';
			break;
		case 'topCentre':
			labelPosition = 'insideTop';
			break;
		case 'bottomRight':
			labelPosition = 'insideBottomRight';
			break;
		case 'bottomCenter':
			labelPosition = 'insideBottom';
			break;
		case 'bottomCentre':
			labelPosition = 'insideBottom';
			break;
		case 'right':
			labelPosition = 'insideRight';
			break;
		case 'left':
			labelPosition = 'insideLeft';
			break;
		case 'center':
			labelPosition = 'inside';
			break;
		case 'centre':
			labelPosition = 'inside';
			break;
		default:
			labelPosition = 'insideTopLeft';
	}

	let configData = [];
	let inputs = [x1, x2, y1, y2, label];
	let reqCols = [];
	$: for (let i = 0; i < inputs.length; i++) {
		reqCols = [];
		if (inputs[i] !== undefined) {
			reqCols.push(inputs[i]);
		}
	}

	$: if (data && !error) {
		try {
			checkInputs(data, reqCols);
			configData = [];
			for (let i = 0; i < data.length; i++) {
				configData.push([
					{
						name: data[i][label],
						xAxis: data[i][x1],
						yAxis: data[i][y1]
					},
					{
						xAxis: data[i][x2],
						yAxis: data[i][y2]
					}
				]);
			}
		} catch (e) {
			error = e;
		}
	} else {
		configData.push([
			{
				name: label,
				xAxis: x1,
				yAxis: y1
			},
			{
				xAxis: x2,
				yAxis: y2
			}
		]);
	}

	let baseConfig;

	$: if (!error) {
		baseConfig = {
			type: 'line',
			markArea: {
				data: configData,
				silent: true,
				animation: false,
				emphasis: {
					disabled: true
				},
				itemStyle: {
					color: color ?? '#EDF6FD',
					opacity: opacity,
					borderWidth: border ? borderWidth ?? 1 : null,
					borderColor: borderColor ?? color ?? '#82C0EF',
					borderType: borderType ?? 'dashed'
				},
				label: {
					show: true,
					position: labelPosition,
					color: labelColor ?? (color ? 'var(--grey-500)' : '#82C0EF')
				}
			},
			zlevel: 0
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
		chartType={chartType === 'Reference Area' ? chartType : `${chartType}: Reference Area`}
	/>
{/if}
