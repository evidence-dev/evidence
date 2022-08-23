<script>
    import {getContext} from 'svelte'
    import { propKey, configKey } from './context'
    let props = getContext(propKey)
    let config = getContext(configKey)
    
    import getSeriesConfig from '$lib/modules/getSeriesConfig.js';
    import getStackedData from '$lib/modules/getStackedData.js';
    import getStackPercentages from '$lib/modules/getStackPercentages.js';
    import getSortedData from '$lib/modules/getSortedData.js';
    import formatTitle from '$lib/modules/formatTitle';
    import { formatAxisValue } from '../modules/formatting';
    import getCompletedData from '$lib/modules/getCompletedData.js';

    export let y = undefined;
    export let series = undefined;
    export let options = undefined;
    export let name = undefined; // name to appear in legend (for single series graphics)
    export let type = 'stacked' // stacked, grouped, or stacked100
    export let stackName = undefined;

    export let fillColor = undefined;
    export let fillOpacity = undefined;
    export let outlineColor = undefined;
    export let outlineWidth = undefined;

    let barMaxWidth;

    // Prop check. If local props supplied, use those. Otherwise fall back to global props.
    let data = $props.data;
    let x = $props.x;
    let swapXY = $props.swapXY;
    let xType = $props.xType;
    let xMismatch = $props.xMismatch;
    let columnSummary = $props.columnSummary;
    let sort = $props.sort;
    y = y ?? $props.y;
    series = series ?? $props.series;

    let stackedData;
    let sortOrder;

    if(!series && typeof y !== 'object'){
        // Single Series
        name = name ?? formatTitle(y, columnSummary[y].title);

        if(swapXY && xType !== "category"){
            data = getCompletedData(data, x, y, series, false, (xType !== "time"));
            xType = "category";
        };
    } else {
        // Multi Series
        // Sort by stack total for category axis
        if(sort === true && xType === "category"){
            stackedData = getStackedData(data, x, y); 

            if(typeof y === "object"){
                stackedData = getSortedData(stackedData, "stackTotal", false); 
            } else {
                stackedData = getSortedData(stackedData, y, false);
            }

            sortOrder = stackedData.map(d => d[x]);
            data = [...data].sort(function (a, b) {
                return sortOrder.indexOf(a[x]) - sortOrder.indexOf(b[x]);
            });
        }

       // Run fill for missing series entries, only if it's a stacked bar
        if((swapXY) || ((xType === "value" || xType === "category") && type.includes("stacked"))){
            data = getCompletedData(data, x, y, series, false, (xType === "value"));
            xType = "category";
        }

        if(type.includes("stacked")){
        // Set up stacks
            stackName = stackName ?? "stack1";
        } else {
            stackName = null;
        }

        if(type === "stacked100"){
            data = getStackPercentages(data, x, y);
            y= "percentOfX_pct"
        }

        console.log(data)

    }

    barMaxWidth = 60;

    let baseConfig = {
            type: "bar",
            stack: stackName,
            label: {
                show: false,
            },
            labelLayout: { hideOverlap: true },
            emphasis: {
                focus: "series",
            },
            barMaxWidth: barMaxWidth,
            itemStyle: {
                color: fillColor,
                opacity: fillOpacity,
                borderColor: outlineColor,
                borderWidth: outlineWidth
            }
    }
 
    let seriesConfig = getSeriesConfig(data, x, y, series, swapXY, baseConfig, name, xMismatch, columnSummary);
    
    config.update(d => {d.series.push(...seriesConfig); return d})

    if(options){
        config.update(d => {return {...d, ...options}})
    }

    let chartOverrides = {
         // Evidence definition of axes (yAxis = dependent, xAxis = independent)
         xAxis: {
             boundaryGap: ['1%', '2%'],
             type: xType
         }
    }

    if(chartOverrides){
        config.update(d => {
            if(type.includes("stacked")){
                d.tooltip = {...d.tooltip, order: 'seriesDesc'} 
            } else {
                d.tooltip = {...d.tooltip, order: 'seriesAsc'} 
            }
            if(type === "stacked100"){
                if(swapXY){
                    d.xAxis = {...d.xAxis, max: 1};
                } else {
                    d.yAxis = {...d.yAxis, max: 1};
                    d.yAxis = {...d.yAxis, axisLabel: {
                        formatter: function(value){
                            return formatAxisValue(value, "#,##0%")
                        }
                    }
                }
                }
            }
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