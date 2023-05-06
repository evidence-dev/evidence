<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from './context';
	let props = getContext(propKey);
	let config = getContext(configKey);

    export let xMin = undefined;
    export let xMax = undefined;
    export let yMin = undefined;
    export let yMax = undefined;
	export let label = undefined;
	export let data = undefined;

	export let color = undefined;
	export let opacity = 0.1;
	export let labelColor = undefined;
	export let border = false;
	export let borderColor = undefined;
	export let borderType = undefined;
	export let borderWidth = undefined;
	export let labelPosition = 'topLeft';

	switch(labelPosition){
		case 'topLeft':
			labelPosition = 'insideTopLeft'
			break;
		case 'topRight':
			labelPosition = 'insideTopRight'
			break;
		case 'topCenter':
			labelPosition = 'insideTop'
			break;
		case 'topCentre':
			labelPosition = 'insideTop'
			break;
		case 'bottomRight':
			labelPosition = 'insideBottomRight'
			break;
		case 'bottomRight':
			labelPosition = 'insideBottomRight'
			break;
		case 'bottomCenter':
			labelPosition = 'insideBottom'
			break;
		case 'bottomCentre':
			labelPosition = 'insideBottom'
			break;
		case 'right':
			labelPosition = 'insideRight'
			break;
		case 'left':
			labelPosition = 'insideLeft'
			break;
		case 'center':
			labelPosition = 'inside'
			break;
		case 'centre':
			labelPosition = 'inside'
			break;
	}


	let configData = [];
	$: if(data){
		configData = [];
		for(let i=0; i < data.length; i++){
			configData.push(
				[
					{
						name: data[i][label],
						xAxis: data[i][xMin],
						yAxis: data[i][yMin]
					},
					{
						xAxis: data[i][xMax],
						yAxis: data[i][yMax]
					}
				]
			)
		}
	} else {
		configData.push(
			[
				{
					name: label,
					xAxis: xMin,
					yAxis: yMin
				},
				{
					xAxis: xMax,
					yAxis: yMax
				}
			]
		)
	}

	$: baseConfig = {
        type: 'line',
            markArea: {
        data: configData,
	    animation: false,
        emphasis: {
            disabled: true
        },
		itemStyle: {
			color: color ?? 'var(--blue-100)',
			opacity: opacity,
			borderWidth: border ? borderWidth ?? 1 : null,
			borderColor: borderColor ?? color ?? 'var(--blue-200)',
			borderType: borderType ?? 'dashed'
		},
		label: {
			show: true,
			position: labelPosition,
			color: labelColor ?? color ?? 'var(--blue-300)'
		},
		z: 0
      }
	};

	$: config.update((d) => {
		d.series.push(baseConfig);
		return d;
	});

</script>