<script>
    import { props, config } from '../modules/stores.js';   
    import getSeriesConfig from '../modules/getSeriesConfig.js'
    import formatTitle from '../modules/formatTitle'

    export let y;
    export let series;
    export let options;
    export let name; // name to appear in legend (for single series graphics)

    export let lineColor;
    export let lineWidth = 2;
    export let lineType = "solid";
    export let lineOpacity;

    export let markers = false;
    export let markerShape = 'circle';
    export let markerSize = 8;

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
            label: {
                show: false,
            },
            labelLayout: { hideOverlap: true },
            emphasis: {
                focus: "series",
            },
            lineStyle: {
                width: lineWidth,
                type: lineType,
            },
            itemStyle: {
                color: lineColor,
                opacity: lineOpacity
            },
            showSymbol: markers,
            symbol: markerShape,
            symbolSize: markerSize
    }

    let seriesConfig = getSeriesConfig(data, x, y, series, horiz, baseConfig, name, xMismatch, columnSummary);
    config.update(d => {d.series.push(...seriesConfig); return d})

    if(options){
        config.update(d => {return {...d, ...options}})
    }

</script>