<script>
    import { props, config } from '../modules/stores.js';   
    import getSeriesConfig from '../modules/getSeriesConfig.js';
    import getStackedData from '../modules/getStackedData.js';
    import getSortedData from '../modules/getSortedData.js';
    import formatTitle from '../modules/formatTitle';
    import getCompletedData from '../modules/getCompletedData.js';

    export let y = undefined;
    export let series = undefined;
    export let options = undefined;
    export let name = undefined; // name to appear in legend (for single series graphics)
    export let type = 'stacked' // stacked or grouped
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
            stackedData = getStackedData(data, x, y); // REMEMBER: need to broaden this to include multiple y columns
            stackedData = getSortedData(stackedData, y, false);
            sortOrder = stackedData.map(d => d[x]);
            data.sort(function (a, b) {
                return sortOrder.indexOf(a[x]) - sortOrder.indexOf(b[x]);
            });
        }

        // Run fill for missing series entries, only if it's a value x axis and a stacked bar
        if((swapXY && xType !== "category") || (xType === "value" && type === "stacked")){
            data = getCompletedData(data, x, y, series, false, (xType !== "time"));
            xType = "category";
        }
              
        if(type === "stacked"){
        // Set up stacks
            stackName = stackName ?? "stack1";
        } else {
            stackName = null;
        }
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