<script>
    import { props, config } from '../modules/stores.js';   
    import getSeriesConfig from '../modules/getSeriesConfig.js'
    import formatTitle from '../modules/formatTitle'

    export let y;
    export let series;
    export let options;
    export let name; // name to appear in legend (for single series graphics)
    export let type = 'stacked' // stacked or grouped
    export let stackName;

    export let fillColor;
    export let fillOpacity;
    export let outlineColor;
    export let outlineWidth;

    let barMaxWidth;

    // Prop check. If local props supplied, use those. Otherwise fall back to global props.
    let data = $props.data;
    let x = $props.x;
    let horiz = $props.horiz;
    let xMismatch = $props.xMismatch;
    let columnSummary = $props.columnSummary;
    y = y ?? $props.y;
    series = series ?? $props.series;

    if(!series && typeof y !== 'object'){
        name = name ?? formatTitle(y, columnSummary[y].title)
    }

    barMaxWidth = 60;

    // Set up stacks
    if(type === 'stacked'){
        stackName = stackName ?? "stack1";
    } else {
        stackName = null;
    }

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

    let seriesConfig = getSeriesConfig(data, x, y, series, horiz, baseConfig, name, xMismatch, columnSummary);
    
    config.update(d => {d.series.push(...seriesConfig); return d})

    if(options){
        config.update(d => {return {...d, ...options}})
    }

    let chartOverrides = {
         xAxis: {
             boundaryGap: ['1%','1%']
         }
    }

    if(chartOverrides){
        config.update(d => {
            d.xAxis = {...d.xAxis, ...chartOverrides.xAxis}; 
            return d
        })
    }

</script>