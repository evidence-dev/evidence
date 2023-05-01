<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from './context';
	$: props = getContext(propKey);
	$: config = getContext(configKey);

	export let options = undefined;

	// export let category = undefined;
	// export let value = undefined;
	export let total = undefined;
	export let data = undefined;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: x = $props.x;
	$: y = $props.y;
	$: swapXY = $props.swapXY;

	let xLabels = [];
	$: for (let i = 0; i < $props.data.length; i++){
		if(i === 0){
			xLabels = [];
		}
		
		xLabels.push(data[i][x])
	}

	let helper = [];
	let totals =[];
	let positive = [];
	let positive2 = [];
	let negative = [];
	let negative2 = [];
	let connector = [];
	let sum = 0

	// set up separate series to construct the waterfall
	$: for (let i = 0; i < $props.data.length; i++) {
		if(i === 0){
			helper = [];
			totals = [];
			positive = [];
			positive2 = [];
			negative = [];
			negative2 = [];
			connector = [];
			sum = 0;
		}
		
		if(data[i][total] === true){
			totals.push(data[i][y]);
			positive.push('-');
			positive2.push('-');
			negative.push('-');
			negative2.push('-');
		} else if (sum >= 0) {
			// Starting in Positive Space
			if((sum + data[i][y]) >= 0){
				// Ending in Positive Space
				if (data[i][y] >= 0) {
					positive.push(data[i][y]);
					negative.push('-');
					negative2.push('-');
					totals.push('-');
					positive2.push('-');
				} else {
					positive.push('-');
					positive2.push('-');
					negative.push(-data[i][y]);
					negative2.push('-');
					totals.push('-');
				}
			} else {
				// Ending in Negative Space (Crossover)
				// Value must be negatve
				positive2.push('-');
				positive.push('-');
				negative.push(sum);
				negative2.push(data[i][y] + sum);
				totals.push('-');
			}
		} else {
			// Starting in Negative Space
			if((sum + data[i][y]) < 0){
				// Ending in Negative Space
				if (data[i][y] >= 0) {
					positive.push(-data[i][y]);
					negative.push('-');
					negative2.push('-');
					totals.push('-');
					positive2.push('-');
				} else {
					positive.push('-');
					positive2.push('-');
					negative.push(data[i][y]);
					negative2.push('-');
					totals.push('-');
				}
			} else {
				// Ending in Positive Space (Crossover)
				positive2.push(sum);
				positive.push(data[i][y] + sum);
				negative.push('-');
				negative2.push('-');
				totals.push('-');
			}
		}

		// create connector series
		if(i === 0){
			connector.push(0)
		} else {
			connector.push(sum)
		}

		// create helper series
		if(i === 0){
			helper.push(0);
			sum += data[i][y];
		} else {
			if(data[i][total] === true){
				helper.push(0);
			} else if ((sum >= 0) === (sum + data[i][y]) >= 0){
				if(sum >= 0) {
					// Positive Space
					if(data[i][y] < 0){
						helper.push(sum + data[i][y]);
						sum += data[i][y];
					} else {
						helper.push(sum);
						sum += data[i][y];					
					}
				} else {
					// Negative Space
					if(data[i][y] >= 0){
						helper.push(sum + data[i][y]);
						sum += data[i][y];
					} else {
						helper.push(sum);
						sum += data[i][y];					
					}
				}
			} else {
				helper.push(0);
				sum += data[i][y];					
			}
		}
	
	}

	$: seriesConfig = [
    {
      type: 'bar',
      stack: 'all',
      itemStyle: {
        normal: {
          barBorderColor: 'rgba(0,0,0,0)',
          color:'rgba(0,0,0,0)'
        },
        emphasis: {
          barBorderColor: 'rgba(0,0,0,0)',
          color: 'rgba(0,0,0,0)'
        }
      },
      data: helper,
		tooltip: {
			show: false
		}
    },
     {
      name: 'total',
      type: 'bar',
      stack: 'all',
      data: totals,
      itemStyle: {
          color: '#888b8c'
      },
	  label: {
		normal: {
			show: true,
			position: swapXY ? 'right' : 'top'
		}
        },
		tooltip: {
			show: false
		}
    },
    {
      name: 'positive',
      type: 'bar',
      stack: 'all',
      data: positive,
      itemStyle: {
          color: '#0a7f10'
      },
	  label: {
		normal: {
			show: true,
			position: swapXY ? 'right' : 'top'
		}
        },
		tooltip: {
			show: false
		}
    },
	{
      name: 'positive2',
      type: 'bar',
      stack: 'all',
      data: positive2,
      itemStyle: {
          color: '#0a7f10'
      },
	  label: {
		normal: {
			show: true,
			position: swapXY ? 'right' : 'top'
		}
        },
		tooltip: {
			show: false
		}
    },
    {
      name: 'negative',
      type: 'bar',
      stack: 'all',
      data: negative,
      itemStyle: {
        color: '#a60303'
      },
	  label: {
		normal: {
			show: true,
			position: swapXY ? 'left' : 'bottom'
		}
        },
		tooltip: {
			show: false
		}
    },
	{
      name: 'negative2',
      type: 'bar',
      stack: 'all',
      data: negative2,
      itemStyle: {
        color: '#a60303'
      },
	  label: {
		normal: {
			show: true,
			position: swapXY ? 'left' : 'bottom'
		}
        },
		tooltip: {
			show: false
		}
    },
            {
            name:'connector',
            type:'line',
            symbol:'none',
            z:1,
            step:'start',
            data: connector,
            lineStyle: {
              color: '#a2a5a6',
              width: 1,
              type: 'dashed'
            },
			animationDelay: 400,
			tooltip: {
				show: false
			}
        }
  ]

	$: config.update((d) => {
		d.series.push(...seriesConfig);
		return d;
	});

	let chartOverrides;
	$: if(swapXY){
		chartOverrides = {
			// Evidence definition of axes (yAxis = dependent, xAxis = independent)
			xAxis: {
				data: xLabels
			}
		};
	} else {
		chartOverrides = {
			// Evidence definition of axes (yAxis = dependent, xAxis = independent)
			xAxis: {
				data: xLabels,
				axisLabel: {
					width: 500 / xLabels.length,
					interval: 0,
					overflow: 'break'
				}
			}
		};
	}

	$: beforeUpdate(() => {
		// beforeUpdate ensures that these overrides always run before we render the chart.
		// otherwise, this block won't re-execute after a change to the data object, and
		// the chart will re-render using the base config from Chart.svelte

		if (options) {
			config.update((d) => {
				return { ...d, ...options };
			});
		}

		if (chartOverrides) {
			config.update((d) => {
				if (swapXY) {
					d.yAxis = { ...d.yAxis, ...chartOverrides.xAxis };
					d.xAxis = { ...d.xAxis, ...chartOverrides.yAxis };
				} else {
					d.yAxis = { ...d.yAxis, ...chartOverrides.yAxis };
					d.xAxis = { ...d.xAxis, ...chartOverrides.xAxis };
				}
				return d;
			});
		}
	});
</script>
