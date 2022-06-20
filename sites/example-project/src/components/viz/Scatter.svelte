<script>
    import { props, config } from '$lib/modules/stores.js';   
    import getSeriesConfig from '$lib/modules/getSeriesConfig.js';
    import formatTitle from '$lib/modules/formatTitle.js';
    import formatValue from '$lib/modules/formatValue.js';
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

    export let useTooltip = false; // if true, will override the default 'axis'-based echarts tooltip. true only for scatter-only charts
    let multiSeries;
    let tooltipOutput;

    // Prop check. If local props supplied, use those. Otherwise fall back to global props.
    let data = $props.data;
    let x = $props.x;
    let swapXY = $props.swapXY;
    let xType = $props.xType;
    let xFormat = $props.xFormat;
    let yFormat = $props.yFormat;
    let xMismatch = $props.xMismatch;
    let columnSummary = $props.columnSummary;
    y = y ?? $props.y;
    series = series ?? $props.series;
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

    // Set up base config for this type of chart series:
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
                        ${formatTitle(y, yFormat)}: <span style='float:right; margin-left: 15px;'>${formatValue(params.value[1], yFormat)}</span>`
                    } else {
                        tooltipOutput = `<span style='font-weight: 600;'>${formatTitle(x, xFormat)}:</span> <span style='float:right; margin-left: 15px;'>${formatValue(params.value[0], xFormat)}</span><br/>
                        <span style='font-weight: 600;'>${formatTitle(y, yFormat)}:</span> <span style='float:right; margin-left: 15px;'>${formatValue(params.value[1], yFormat)}</span>`
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
    let seriesConfig = getSeriesConfig(data, x, y, series, swapXY, baseConfig, name, xMismatch, columnSummary);
    config.update(d => {d.series.push(...seriesConfig); return d})

    
    // Chart-level config settings:
    let chartOverrides = {
         yAxis: {
             scale: true,
             boundaryGap: ['1%', '1%']
         },
         xAxis: {
             boundaryGap: [xType === "time" ? '2%' : '1%', '2%']
         }
    }

    // Apply the chart-level overrides to the main config used by Chart.svelte:
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