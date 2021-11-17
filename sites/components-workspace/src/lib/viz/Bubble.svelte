<script>
    import { props, config } from '$lib/modules/stores.js';   
    import getSeriesConfig from '$lib/modules/getSeriesConfig.js'
    import getColumnExtents from '$lib/modules/getColumnExtents'
    import formatTitle from '$lib/modules/formatTitle'

    export let y = undefined;
    export let series = undefined;
    export let options = undefined;
    export let size = undefined;
    export let name = undefined; // name to appear in legend (for single series graphics)

    export let shape = undefined;
    export let fillColor = undefined;
    export let opacity = 0.7; // opacity of both fill and outline (ECharts limitation)
    export let outlineColor = undefined;
    export let outlineWidth = undefined;

    export let minSize = 50;
    export let maxSize = 900;

    // Prop check. If local props supplied, use those. Otherwise fall back to global props.
    let data = $props.data;
    let x = $props.x;
    let horiz = $props.horiz;
    let xMismatch = $props.xMismatch;
    let columnSummary = $props.columnSummary;
    y = y ?? $props.y;
    series = series ?? $props.series;
    size = size ?? $props.size;
    let yMin = $props.yMin;

    if(!series && typeof y !== 'object'){
        name = name ?? formatTitle(y, columnSummary[y].title)
    }

    // Determine bubble sizes:
    let sizeExtents = getColumnExtents(data, size);

    let dataRange = sizeExtents[1] - sizeExtents[0];
    let minData = sizeExtents[0];

    function bubbleSize(newPoint){
        minSize = minSize ^ 2
        maxSize = maxSize ^ 2
        let sizeRange = maxSize - minSize;
        
        return Math.sqrt(((newPoint - minData) / dataRange) * sizeRange + minSize)
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
            symbolSize: function (data) {
                return bubbleSize(data[1]);
            },
            symbol: shape,
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

    // Overriding global chart config:
    let chartOverrides = {
         yAxis: { // vertical axis
             scale: true,
             min: yMin,
             boundaryGap: ['1%', '1%']
         },
         xAxis: { // horizontal axis
             boundaryGap: ['1%', '1%']
         }
    }

    let seriesConfig = getSeriesConfig(data, x, y, series, horiz, baseConfig, name, xMismatch, columnSummary);
    
    config.update(d => {d.series.push(...seriesConfig); return d})

    if(chartOverrides){
        config.update(d => {
            if(horiz){
                d.yAxis = {...d.yAxis, ...chartOverrides.xAxis};
                d.xAxis = {...d.xAxis, ...chartOverrides.yAxis};
            } else {
                d.yAxis = {...d.yAxis, ...chartOverrides.yAxis};
                d.xAxis = {...d.xAxis, ...chartOverrides.xAxis};
            }
            return d})
    }

</script>