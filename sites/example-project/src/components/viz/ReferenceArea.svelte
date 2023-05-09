<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from './context';
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

	$: swapXY = $props.swapXY;

	$: if(swapXY){
		[x1, x2, y1, y2] = [y1, y2, x1, x2];
		labelPosition = labelPosition ?? 'topRight';
	} else {
		labelPosition = labelPosition ?? 'topLeft';
	}

	$: switch(labelPosition){
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
						xAxis: data[i][x1],
						yAxis: data[i][y1]
					},
					{
						xAxis: data[i][x2],
						yAxis: data[i][y2]
					}
				]
			)
		}
	} else {
		configData.push(
			[
				{
					name: label,
					xAxis: x1,
					yAxis: y1
				},
				{
					xAxis: x2,
					yAxis: y2
				}
			]
		)
	}

	$: baseConfig = {
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
				borderWidth: border ? (borderWidth ?? 1) : null,
				borderColor: borderColor ?? (color ?? '#82C0EF'),
				borderType: borderType ?? 'dashed'
			},
			label: {
				show: true,
				position: labelPosition,
				color: labelColor ?? (color ? 'var(--grey-500)' : '#82C0EF')
			},
      },
	  zlevel: 0
	};

	$: config.update((d) => {
		d.series.push(baseConfig);
		return d;
	});

</script>