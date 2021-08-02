<script>
    import Chart from "./Chart.svelte";
    import XAxis from "./XAxis.svelte";
    import YAxis from "./YAxis.svelte";
    import Line from "./Line.svelte";
    import Legend from './Legend.svelte';
    import ErrorChart from "./ErrorChart.svelte";
    import checkInputs from '../modules/checkInputs.js';
    import getDistinctValues from '../modules/getDistinctValues.js';

    import * as d3 from "d3";

    // Chart Area:
    let height = undefined;
    let width = undefined;
    let paddingLeft = undefined;
    let paddingRight = undefined;

    // Data:
    export let data;
    export let x = null;
    export let y = null;
    export let series = null;

    // Data Types:
    let xType = null;
    let yType = null;

    // Axis Bounds:
    export let yMin = null;
    let yMax = null;
    let xMin = null;
    let xMax = null;

    // Axis Baselines:
    let xBaseline = undefined;
    let yBaseline = undefined;

    // Gridlines:
    export let yGridlines = "true";
    export let xGridlines = "false";

    // Sorting:
    let sort = "true";
    const sortBy = x;
    const sortOrder = "asc";

    // Axis Ticks:
    let yAxisPosition = undefined;
    if(yAxisPosition === "right"){
        paddingRight = 40;
        paddingLeft = 40;
    }
    let xTickCount = undefined;
    let xTickMarks = undefined;

    // Labels:
    export let units = "";
    export let lineLabel = null; // string: used to add custom label to single line
    export let xAxisTitle = "";
    export let legend = undefined;
    // export let seriesLabels = undefined;
    // seriesLabels = seriesLabels ? seriesLabels : yAxisPosition === "right" ? "left" : undefined;

    // Styling:
    export let lineColor = undefined;
    export let lineWidth = undefined;
    export let lineDashSize = undefined;
    export let lineTransparency = undefined;

    let seriesNames;

    // Error Handling:
    let error;
    try{
        checkInputs(data, [x,y], [series]);
        // Handle Negative Values on Y Axis:
        if (yMin === null) {
            if (d3.min(data, (d) => d[y]) < 0) {
                yMin = null;
            } else {
                yMin = 0;
            }
        }


        if(series != null){
            seriesNames = getDistinctValues(data, series);
            legend = "top";
        }

    } catch(e) {
        error = e.message;
    }


</script>

{#if !error}

{#if series != null && legend === "top"}
<Legend seriesNames={seriesNames}/>
{/if}

<div width="100%">
    <Chart
        {data}
        {x}
        {y}
        {yMin}
        {yMax}
        {xMin}
        {xMax}
        {xType}
        {yType}
        {height}
        {width}
        {paddingLeft}
        {paddingRight}
        sort={sort}
        sortBy={sortBy}
        sortOrder={sortOrder}
    >
        <XAxis 
            axisTitle={xAxisTitle} 
            ticks={xTickCount} 
            tickMarks={xTickMarks}
            baseline={xBaseline}
            gridlines={xGridlines}/>
        <YAxis 
            units={units} 
            axisPosition={yAxisPosition}
            baseline={yBaseline}
            gridlines={yGridlines}/>
        <Line 
            series={series} 
            lineLabel={lineLabel} 
            lineColor={lineColor}
            lineWidth={lineWidth} 
            lineTransparency={lineTransparency}
            lineDashSize={lineDashSize}
            />
    </Chart>
</div>
{:else}

<ErrorChart {error} chartType="Line Chart"/>

{/if}
