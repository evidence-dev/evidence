<script>
    import {getContext, beforeUpdate} from 'svelte'
    import { propKey, configKey } from './context'
    $: props = getContext(propKey)
    $: config = getContext(configKey)
    
    import formatTitle from '$lib/modules/formatTitle';
    import { formatValue } from '../modules/formatting';

    export let valueCol = undefined;
    const valueColSet = valueCol ? true : false     // Hack, see chart.svelte
    export let options = undefined;
    export let name = undefined; // name to appear in legend (for single series graphics)

    export let outlineColor = undefined;
    export let outlineWidth = undefined;
    export let labelPosition = undefined;
    export let funnelAlign = "center";
    export let funnelSort = "descending";

    // Prop check. If local props supplied, use those. Otherwise fall back to global props.
    $: data = $props.data;
    $: nameCol = $props.nameCol;
    $: valueCol = valueColSet ? valueCol : $props.valueCol;
    $: columnSummary = $props.columnSummary;
    $: nameColFormat = $props.nameColFormat;

    $: name = name ?? formatTitle(valueCol, columnSummary[nameCol].title);

    $: seriesConfig = [{
        type: "funnel",
        name,
        left: '10%',
        top: 60,
        bottom: 60,
        width: '80%',
        min: 0,
        max: 100,
        minSize: '0%',
        maxSize: '100%',
        
        funnelAlign,
        sort: funnelSort,

        labelLine: {
            length: 10,
            lineStyle: {
                width: 1,
                type: 'solid'
            }
        },
        label: {
            show: true,
            position: labelPosition
        },
       
        labelLayout: { hideOverlap: true },
        emphasis: {
            focus: "series",
        },
        itemStyle: {
            borderColor: outlineColor,
            borderWidth: outlineWidth
        },
        tooltip: {
            formatter: function(params){
            return `<span style='font-weight:600;'>${formatValue(params.name, nameColFormat)}</span></br><span>Value:</span><span style='margin-left: 4px;'> ${params.value}</span>`
            }
        },
        data: data.map(d => ({name: d[nameCol], value: d[valueCol]}))
    }]
    
    $: config.update(d => {d.series.push(...seriesConfig); return d})

    $: chartOverrides = {
        tooltip: {
            trigger: "item",
        }
    }

    beforeUpdate(() => {
        // beforeUpdate ensures that these overrides always run before we render the chart. 
        // otherwise, this block won't re-execute after a change to the data object, and 
        // the chart will re-render using the base config from Chart.svelte

        if(options){
            config.update(d => {return {...d, ...options}})
        }

        if(chartOverrides){
            config.update(d => {
                d.tooltip = {...d.tooltip, ...chartOverrides.tooltip};
                return d
            })
        }


    }) 
    
</script>