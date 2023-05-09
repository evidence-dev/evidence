<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from './context';
	import { formatValue } from '$lib/modules/formatting.js';

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

	$: xFormat = $props.xFormat;
	$: yFormat = $props.yFormat;
	$: swapXY = $props.swapXY;

	$: if(swapXY){
		[x, y] = [y, x];
		[xFormat, yFormat] = [yFormat, xFormat];
	}

	let configData = [];
	$: if(data){
		configData = [];
		if(x){			
			for(let i=0; i < data.length; i++){
				configData.push(
					{
						name: data[i][label],
						xAxis: data[i][x]
					}
				)
			}
		} else if(y){
			for(let i=0; i < data.length; i++){
				configData.push(
					{
						name: data[i][label],
						yAxis: data[i][y]
					}
				)
			}
		}
	} else {
		if(x){
			configData.push(
				{
					name: label,
					xAxis: x
				}
			)
		} else if(y){
			configData.push(
				{
					name: label,
					yAxis: y
				}
			)
		}
	}


	$: baseConfig = {
        type: 'line',
        markLine: {
        data: configData,
		silent: true,
        label: {
          show: true,
          position: 'insideEndTop',
          formatter: function (params) {
			let result;
			if(params.name === ""){
				// If no label supplied
				result = showValueInLabel ? `${formatValue(params.value, y ? yFormat: x ? xFormat : 'string')}` : "";
			} else {
				result = showValueInLabel ? `${params.name} (${formatValue(params.value, y ? yFormat: x ? xFormat : 'string')})` : `${params.name}`;
			}
			return result
		  },
          color: labelColor ?? (color ?? 'var(--grey-600)'),
          fontWeight: 'medium',
		  textBorderColor: 'white',
		  textBorderWidth: 0.7
        },
		animation: false,
		symbol: 'none',
        emphasis: {
            disabled: true
        },
        lineStyle: {
            color: lineColor ?? (color ?? 'var(--grey-600)'),
            width: lineWidth ? parseInt(lineWidth) : 1,
			type: lineType
        }
      }
	};

	$: config.update((d) => {
		d.series.push(baseConfig);
		return d;
	});

</script>