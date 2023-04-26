<script>
	import { getContext, beforeUpdate } from 'svelte';
	import { propKey, configKey } from './context';
	$: props = getContext(propKey);
	$: config = getContext(configKey);

	export let options = undefined;

	export let category = undefined;
	export let value = undefined;
	export let total = undefined;
	export let data = undefined;

	// Prop check. If local props supplied, use those. Otherwise fall back to global props.
	$: data = $props.data;
	$: x = $props.x;
	$: swapXY = $props.swapXY;

	let xLabels = [];
	for (let i = 0; i < 6; i++){
		xLabels.push(data[i][category])
	}

	let helper = [];
	let totals = [];
	let positive = [];
	let negative = [];
	let connector = [];
	let sum = 0;

	// set up separate series to construct the waterfall
	for (let i = 0; i < 6; i++) {
		if(data[i][total] === true){
			totals.push(data[i][value]);
			positive.push('-');
			negative.push('-');
		} else if (data[i][value] >= 0) {
			positive.push(data[i][value]);
			negative.push('-');
			totals.push('-');
		} else {
			positive.push('-');
			negative.push(-data[i][value]);
			totals.push('-');
		}

		// create helper series
		if(i === 0){
			helper.push(0);
		} else {
			sum += data[i - 1][value];
			if(data[i][total] === true){
			helper.push(0);
			} else if (data[i][value] < 0) {
			helper.push(sum + data[i][value]);
			} else {
			helper.push(sum);
			}
		}
	
		// create connector series
		if(i === 0){
			connector.push(0)
		} else {
			connector.push(sum)
		}
	}


	$: seriesConfig = [
    {
      type: 'bar',
      stack: 'all',
      itemStyle: {
        normal: {
          barBorderColor: 'rgba(0,0,0,0)',
          color: 'rgba(0,0,0,0)'
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
          color: 'grey'
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
          color: 'green'
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
        color: 'darkred'
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
              color: 'lightgrey',
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
					width: 60,
					interval: 0,
					overflow: 'break'
				}
			}
		};
	}

	beforeUpdate(() => {
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
