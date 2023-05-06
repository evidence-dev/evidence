<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from './context';
	let props = getContext(propKey);
	let config = getContext(configKey);

    export let xVal = undefined;
	export let yVal = undefined;
	export let data = undefined;
	export let label = undefined;

	export let color = undefined;
	export let lineColor = undefined;
	export let labelColor = undefined;
	export let lineWidth = undefined;

	export let showValueInLabel = true;
	showValueInLabel = showValueInLabel === 'true' || showValueInLabel === true;

	$: swapXY = $props.swapXY;

	$: if(swapXY){
		[xVal, yVal] = [yVal, xVal];
	}

	let configData = [];
	$: if(data){
		configData = [];
		if(xVal){			
			for(let i=0; i < data.length; i++){
				configData.push(
					{
						name: data[i][label],
						xAxis: data[i][xVal]
					}
				)
			}
		} else if(yVal){
			for(let i=0; i < data.length; i++){
				configData.push(
					{
						name: data[i][label],
						yAxis: data[i][yVal]
					}
				)
			}
		}
	} else {
		if(xVal){
			configData.push(
				{
					name: label,
					xAxis: xVal
				}
			)
		} else if(yVal){
			configData.push(
				{
					name: label,
					yAxis: yVal
				}
			)
		}
	}


	$: baseConfig = {
        type: 'line',
        markLine: {
        data: configData,
        label: {
          show: true,
          position: 'insideEndTop',
          formatter: showValueInLabel ? '{b} ({c})' : '{b}',
          color: labelColor ?? color ?? 'var(--grey-600)',
          fontWeight: 'medium',
		  textBorderColor: 'white',
		  textBorderWidth: 0.5
        },
		tooltip: {
			show: true
		},
		animation: false,
		symbol: 'none',
        emphasis: {
            disabled: true
        },
        lineStyle: {
            color: lineColor ?? color ?? 'var(--grey-600)',
            width: lineWidth ? parseInt(lineWidth) : 1
        }
      }
	};

	// $: seriesConfig = getSeriesConfig(
	// 	data,
	// 	x,
	// 	y,
	// 	series,
	// 	swapXY,
	// 	baseConfig,
	// 	name,
	// 	xMismatch,
	// 	columnSummary
	// );

	$: config.update((d) => {
		d.series.push(baseConfig);
		return d;
	});

	// $: if (options) {
	// 	config.update((d) => {
	// 		return { ...d, ...options };
	// 	});
	// }

	// $: chartOverrides = {
	// 	yAxis: {
	// 		boundaryGap: ['0%', '1%']
	// 	},
	// 	xAxis: {
	// 		boundaryGap: [xType === 'time' ? '2%' : '0%', '2%']
	// 	}
	// };

	// beforeUpdate(() => {
	// 	config.update((d) => {
	// 		if (swapXY) {
	// 			d.yAxis = { ...d.yAxis, ...chartOverrides.xAxis };
	// 			d.xAxis = { ...d.xAxis, ...chartOverrides.yAxis };
	// 		} else {
	// 			d.yAxis = { ...d.yAxis, ...chartOverrides.yAxis };
	// 			d.xAxis = { ...d.xAxis, ...chartOverrides.xAxis };
	// 		}
	// 		return d;
	// 	});
	// });
</script>