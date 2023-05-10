<script>
	import { getContext } from 'svelte';
	import { propKey, configKey } from './context';
	import checkInputs from '$lib/modules/checkInputs';
	import ErrorChart from './ErrorChart.svelte';
	let props = getContext(propKey);
	let config = getContext(configKey);

	export let xMin = undefined;
	export let xMax = undefined;
	export let yMin = undefined;
	export let yMax = undefined;
	export let label = undefined;
	export let data = undefined;

	export let color = undefined;
	export let areaColor = undefined;
	export let opacity = 1;
	export let labelColor = undefined;
	export let border = false;
	export let borderColor = undefined;
	export let borderType = undefined;
	export let borderWidth = undefined;
	export let labelPosition = undefined;

	let defaultColor = 'blue';
	
	let colorList = {
		red: {areaColor: '#fceeed', labelColor: '#b04646', borderColor: '#b04646'},
		green: {areaColor: '#e6f5e6', labelColor: '#65a665', borderColor: '#65a665'},
		yellow: {areaColor: '#fffede', labelColor: '#e8bb09', borderColor: '#e8bb09'},
		grey: {areaColor: 'var(--grey-100)', labelColor: 'var(--grey-500)', borderColor: 'var(--grey-500)'},
		blue: {areaColor: '#EDF6FD', labelColor: '#51a2e0', borderColor: '#51a2e0'}
	}
	
	if(labelColor){
		if(Object.keys(colorList).includes(labelColor)){
			labelColor =  colorList[labelColor].labelColor
		}
	} 

	if(borderColor){
		if(Object.keys(colorList).includes(borderColor)){
			borderColor =  colorList[borderColor].borderColor
		}
	} 

	if(areaColor){
		if(Object.keys(colorList).includes(areaColor)){
			areaColor =  colorList[areaColor].areaColor
		}
	} 

	if(Object.keys(colorList).includes(color)){
		areaColor = areaColor ?? colorList[color].areaColor;
		labelColor = labelColor ?? colorList[color].labelColor;
		borderColor = borderColor ?? colorList[color].borderColor;
	} else {
		areaColor = areaColor ?? colorList[defaultColor].areaColor;
		labelColor = labelColor ?? colorList[defaultColor].labelColor;
		borderColor = borderColor ?? colorList[defaultColor].borderColor;
	}

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
				[xMin, xMax, yMin, yMax] = [yMin, yMax, xMin, xMax];
				labelPosition = labelPosition ?? 'topRight';
			} else {
				labelPosition = labelPosition ?? 'topLeft';
			}
		} catch (e) {
			error = e;
		}
	}

	const labelPositions= {
		topLeft: 'insideTopLeft',
		top: 'insideTop',
		topRight: 'insideTopRight',
		bottomLeft: 'insideBottomLeft',
		bottom: 'insideBottom',
		bottomRight: 'insideBottomRight',
		left: 'insideLeft',
		center: 'inside',
		centre: 'inside',
		right: 'insideRight'
	}

	$: labelPosition = labelPositions[labelPosition] ?? 'insideEndTop'

	let configData = [];
	let inputs = [xMin, xMax, yMin, yMax, label];
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
						xAxis: data[i][xMin],
						yAxis: data[i][yMin]
					},
					{
						xAxis: data[i][xMax],
						yAxis: data[i][yMax]
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
				xAxis: xMin,
				yAxis: yMin
			},
			{
				xAxis: xMax,
				yAxis: yMax
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
					color: areaColor,
					opacity: opacity,
					borderWidth: border ? borderWidth ?? 1 : null,
					borderColor: borderColor,
					borderType: borderType ?? 'dashed'
				},
				label: {
					show: true,
					position: labelPosition,
					color: labelColor
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
