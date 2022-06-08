<script>
    import {getContext} from 'svelte'
    import { propKey, configKey } from './context'
    let props = getContext(propKey)
    let config = getContext(configKey)
    
    import getSeriesConfig from '$lib/modules/getSeriesConfig.js';
    import formatTitle from '$lib/modules/formatTitle.js';
    import getCompletedData from '$lib/modules/getCompletedData.js';

    export let y = undefined;
    export let series = undefined;
    export let options = undefined;
    export let name = undefined; // name to appear in legend (for single series graphics)

    export let shape = 'circle';
    export let fillColor = undefined;
    export let opacity = 0.7; // opacity of both fill and outline (ECharts limitation)
    export let outlineColor = undefined;
    export let outlineWidth = undefined;
    export let pointSize = 10;

    // Prop check. If local props supplied, use those. Otherwise fall back to global props.
    let data = $props.data;
    let x = $props.x;
    let swapXY = $props.swapXY;
    let xType = $props.xType;
    let xMismatch = $props.xMismatch;
    let columnSummary = $props.columnSummary;
    y = y ?? $props.y;
    series = series ?? $props.series;
    let yMin = $props.yMin;

    if(!series && typeof y !== 'object'){
        // Single Series
        name = name ?? formatTitle(y, columnSummary[y].title);
    } else {
        // Multi Series
        data = getCompletedData(data, x, y, series);
    }

    let baseConfig = {
            type: "scatter",
            label: {
                show: false,
            },
            labelLayout: { hideOverlap: true },
            emphasis: {
                focus: "series",
            },
            symbol: shape,
            symbolSize: pointSize,
            itemStyle: {
                color: fillColor,
                opacity: opacity,
                borderColor: outlineColor,
                borderWidth: outlineWidth
            }
     }

    if(options){
        baseConfig = {...baseConfig, ...options}
    }

    let seriesConfig = getSeriesConfig(data, x, y, series, swapXY, baseConfig, name, xMismatch, columnSummary);
    
    config.update(d => {d.series.push(...seriesConfig); return d})

    let chartOverrides = {
         yAxis: {
             scale: true,
             boundaryGap: ['1%', '1%']
         },
         xAxis: {
             boundaryGap: [xType === "time" ? '2%' : '1%', '2%']
         }
     }

    if(chartOverrides){
        config.update(d => {
            if(swapXY){
                d.yAxis = {...d.yAxis, ...chartOverrides.xAxis};
                d.xAxis = {...d.xAxis, ...chartOverrides.yAxis};
            } else {
                d.yAxis = {...d.yAxis, ...chartOverrides.yAxis};
                d.xAxis = {...d.xAxis, ...chartOverrides.xAxis};
            }
            return d})
    }

</script>