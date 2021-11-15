<script>
    import { props, config } from '../modules/stores.js';   
    import getSeriesConfig from '../modules/getSeriesConfig.js'
    import formatTitle from '../modules/formatTitle'

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
    let horiz = $props.horiz;
    let xMismatch = $props.xMismatch;
    let columnSummary = $props.columnSummary;
    y = y ?? $props.y;
    series = series ?? $props.series;
    let yMin = $props.yMin;

    if(!series && typeof y !== 'object'){
        name = name ?? formatTitle(y, columnSummary[y].title)
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

    let seriesConfig = getSeriesConfig(data, x, y, series, horiz, baseConfig, name, xMismatch, columnSummary);
    
    config.update(d => {d.series.push(...seriesConfig); return d})

    let chartOverrides = {
         yAxis: {
             scale: true,
             min: yMin,
             boundaryGap: ['1%', '1%']
         },
         xAxis: {
             boundaryGap: ['1%', '1%']
         }
     }

    if(chartOverrides){
        config.update(d => {
            d.yAxis = {...d.yAxis, ...chartOverrides.yAxis};
            d.xAxis = {...d.xAxis, ...chartOverrides.xAxis};
            return d})
    }

</script>