<script>
    import { props, config } from '$lib/modules/stores.js';   
    import getSeriesConfig from '$lib/modules/getSeriesConfig.js';
    import getColumnExtents from '$lib/modules/getColumnExtents';
    import formatTitle from '$lib/modules/formatTitle';
    import formatValue from '$lib/modules/formatValue.js';
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

    export let useTooltip = false;
    let multiSeries;
    let tooltipOutput;

    // Prop check. If local props supplied, use those. Otherwise fall back to global props.
    let data = $props.data;
    let x = $props.x;
    let swapXY = $props.swapXY;
    let xType = $props.xType;
    let xFormat = $props.xFormat;
    let yFormat = $props.yFormat;
    let sizeFormat = $props.sizeFormat;
    let xMismatch = $props.xMismatch;
    let columnSummary = $props.columnSummary;
    y = y ?? $props.y;
    series = series ?? $props.series;
    size = size ?? $props.size;
    let yMin = $props.yMin;

    if(!series && typeof y !== 'object'){
        // Single Series
        name = name ?? formatTitle(y, columnSummary[y].title);
        multiSeries = false;
    } else {
        // Multi Series
        data = getCompletedData(data, x, y, series);
        multiSeries = true;
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
        const newPointSize = newPoint[2]
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

    // Tooltip settings (scatter and bubble charts require different tooltip than default)

    let tooltipOpts;
    let tooltipOverride;
    if(useTooltip){
        tooltipOpts = {
            tooltip: {
                formatter: function(params) {
                    if(multiSeries){
                        tooltipOutput = `<span style='font-weight:600'>${formatValue(params.seriesName)}</span><br/>
                        ${formatTitle(x, xFormat)}: <span style='float:right; margin-left: 15px;'>${formatValue(params.value[0], xFormat)}</span><br/>
                        ${formatTitle(y, yFormat)}: <span style='float:right; margin-left: 15px;'>${formatValue(params.value[1], yFormat)}</span><br/>
                        ${formatTitle(size, sizeFormat)}: <span style='float:right; margin-left: 15px;'>${formatValue(params.value[2], sizeFormat)}</span>`
                    } else {
                        tooltipOutput = `<span style='font-weight: 600;'>${formatTitle(x, xFormat)}:</span> <span style='float:right; margin-left: 15px;'>${formatValue(params.value[0], xFormat)}</span><br/>
                        <span style='font-weight: 600;'>${formatTitle(y, yFormat)}:</span> <span style='float:right; margin-left: 15px;'>${formatValue(params.value[1], yFormat)}</span><br/>
                        <span style='font-weight: 600;'>${formatTitle(size, sizeFormat)}:</span> <span style='float:right; margin-left: 15px;'>${formatValue(params.value[2], sizeFormat)}</span>`
                    }
                    return tooltipOutput
                }
            }
        }

        baseConfig = {...baseConfig, ...tooltipOpts}

        tooltipOverride = {
            tooltip: {
                trigger: "item"
            }
        }
    }

    // If user has passed in custom echarts config options, append to the baseConfig:
    if(options){
        baseConfig = {...baseConfig, ...options}
    }

    // Generate config for each series:
    let seriesConfig = getSeriesConfig(data, x, y, series, swapXY, baseConfig, name, xMismatch, columnSummary, size);
    config.update(d => {d.series.push(...seriesConfig); return d})

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

    if(chartOverrides){
        config.update(d => {
            if(swapXY){
                d.yAxis = {...d.yAxis, ...chartOverrides.xAxis};
                d.xAxis = {...d.xAxis, ...chartOverrides.yAxis};
            } else {
                d.yAxis = {...d.yAxis, ...chartOverrides.yAxis};
                d.xAxis = {...d.xAxis, ...chartOverrides.xAxis};
            }
            if(useTooltip){
                d.tooltip = {...d.tooltip, ...tooltipOverride.tooltip};
            }
            return d})
    }

</script>