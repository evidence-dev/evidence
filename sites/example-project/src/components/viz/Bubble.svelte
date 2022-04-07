<script>
    import { props, config } from '$lib/modules/stores.js';   
    import getSeriesConfig from '$lib/modules/getSeriesConfig.js';
    import getColumnExtents from '$lib/modules/getColumnExtents';
    import formatTitle from '$lib/modules/formatTitle';
    import getCompletedData from '$lib/modules/getCompletedData.js';

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

    let maxSize = 35;
    export let scaleTo = 1;
    maxSize = maxSize * (scaleTo / 1);

    // Prop check. If local props supplied, use those. Otherwise fall back to global props.
    let data = $props.data;
    let x = $props.x;
    let swapXY = $props.swapXY;
    let xType = $props.xType;
    let xMismatch = $props.xMismatch;
    let columnSummary = $props.columnSummary;
    y = y ?? $props.y;
    series = series ?? $props.series;
    size = size ?? $props.size;
    let yMin = $props.yMin;

    if(!series && typeof y !== 'object'){
        // Single Series
        name = name ?? formatTitle(y, columnSummary[y].title);
    } else {
        // Multi Series
        data = getCompletedData(data, x, y, series);
    }

    // Determine bubble sizes:
    let sizeExtents = getColumnExtents(data, size);
    let maxData = sizeExtents[1];
    let maxSizeSq = Math.pow(maxSize, 2);

    // Maximum point in dataset is assigned the maximum point area on the graph. Other
    // points are assigned based on their proportion to the maximum point. 
    // E.g., if max point in dataset is 100 and we want to plot 45 as the next point,
    // we will be drawing a point that is 45% of the area of the max point

    function bubbleSize(newPoint){
        const newPointSize = data.filter(d => d[x] === newPoint[0] && d[y] === newPoint[1])[0][size]
        return Math.sqrt((newPointSize / maxData) * maxSizeSq)
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
                return bubbleSize(data);
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
         yAxis: {
             scale: true,
             boundaryGap: ['1%', '1%']
         },
         xAxis: {
             boundaryGap: [xType === "time" ? '2%' : '1%', '2%']
         }
    }

    let seriesConfig = getSeriesConfig(data, x, y, series, swapXY, baseConfig, name, xMismatch, columnSummary);
    
    config.update(d => {d.series.push(...seriesConfig); return d})

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