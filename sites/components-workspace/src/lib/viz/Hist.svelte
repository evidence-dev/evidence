<script>
    import { props, config } from '../modules/stores.js';   
    import ecStat from 'echarts-stat';

    export let x = undefined;

    export let fillColor = undefined;
    export let fillOpacity = 1;

    // Prop check. If local props supplied, use those. Otherwise fall back to global props.
    let data = $props.data;
    x = x ?? $props.x;

    // Filter dataset to only x column and create bins
    data = data.map((d) => d[x])

    let histData = ecStat.histogram(data);

    // Remove empty first bin if it would cause negative values on x-axis:
    let firstBinMin = histData.data[0][2]
    let firstBinCount = histData.data[0][1]
    if(firstBinMin < 0 && firstBinCount === 0){
        histData.data.shift()
    }

    let seriesConfig = {
        type: 'custom',
        label: {show: true},
        renderItem: function (params, api) {
            let yValue = api.value(1);
            let start = api.coord([api.value(2), yValue]);
            let size = api.size([api.value(3) - api.value(2), yValue]);
            let barColor = api.visual('color');
            return {
            type: 'rect',
            shape: {
                x: start[0],
                y: start[1],
                width: size[0] - 1, // 1 is the gap between bars. Possibly turn this into variable for changing.
                height: size[1]
            },
            style: {
                fill: fillColor ?? barColor,
                opacity: fillOpacity
            }
            };
        },
        data: histData.data,
        encode: {
            tooltip: [1],
            itemName: 4
        }
    }

    config.update(d => {d.series.push(seriesConfig); return d})

    let chartOverrides = {
         yAxis: {
             boundaryGap: ['0%','1%']
         },
         xAxis: {
             boundaryGap: ['1%', '1%'],
             scale: false,
             min: histData.data[0][2] // min of bin for first bin in hist dataset
         }
     }

    if(chartOverrides){
        config.update(d => {
            d.yAxis = {...d.yAxis, ...chartOverrides.yAxis};
            d.xAxis = {...d.xAxis, ...chartOverrides.xAxis}; 
            return d
        })
    }

</script>