<script>
    import { props, config } from '../modules/stores.js';   
    import getSeriesConfig from '../modules/getSeriesConfig.js'
    import formatTitle from '../modules/formatTitle'

    export let y;
    export let series;
    export let options;
    export let name; // name to appear in legend (for single series graphics)

    export let fillColor;
    export let fillOpacity;
    export let line = true;

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

    let baseConfig = {
            type: "line",
            areaStyle: {
                color: fillColor,
                opacity: fillOpacity
            },
            lineStyle: {
                width: line ? 1.5 : 0
            },
            label: {
                show: false,
            },
            labelLayout: { hideOverlap: true },
            emphasis: {
                focus: "series",
            }
    }

    let seriesConfig = getSeriesConfig(data, x, y, series, horiz, baseConfig, name, xMismatch, columnSummary);
    
    config.update(d => {d.series.push(...seriesConfig); return d})

    if(options){
        config.update(d => {return {...d, ...options}})
    }

</script>