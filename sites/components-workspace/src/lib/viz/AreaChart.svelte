<script>
    import Chart from './Chart.svelte'
    import XAxis from './XAxis.svelte'
    import YAxis from './YAxis.svelte'
    import Area from './Area.svelte'
    import * as d3 from 'd3'
    import ErrorChart from './ErrorChart.svelte'
    import checkInputs from '../modules/checkInputs.js'
    
    // Chart Area:
    let height = undefined;
    let width = undefined;

    // Data:
    export let data;
    export let x = null;
    export let y = null;

    // Data Types:
    export let xType = null;
    export let yType = null;

    // Axis Bounds:
    export let yMin = null;
    let yMax = null;
    let xMin = null;
    let xMax = null;

    // Axis Baselines:
    let xBaseline = undefined;
    let yBaseline = undefined;

    // Gridlines:
    export let xGridlines = "false";
    export let yGridlines = "true";

    // Sorting:
    let sort = "true";
    const sortBy = x;
    const sortOrder = "asc";

    // Labels:
    export let units = "";
    export let xAxisTitle = undefined;

    // Styling:
    export let fillColor = undefined;
    export let fillTransparency = undefined;
    
    // Check Inputs
    let error;
    try{
        checkInputs(data, [x,y]);
     
        // Handle negative values in y axis:
        if (yMin === null) {
            if (d3.min(data, (d) => d[y]) < 0) {
                yMin = null;
            } else {
                yMin = 0;
            }
        }
    } catch(e) {
        error = e.message;
    }

</script>
  
{#if !error}
<div width=100%>
    <Chart data={data} x={x} y={y}
    yMin={yMin} 
    yMax={yMax} 
    xMax={xMax}
    xMin={xMin}
    xType={xType}
    yType={yType}
    height={height}
    width={width}
    sort={sort}
    sortBy={sortBy}
    sortOrder={sortOrder}
    > 
        <XAxis
            baseline={xBaseline}
            axisTitle={xAxisTitle}
            gridlines={xGridlines}/>
        <YAxis 
            units={units}
            baseline={yBaseline}
            gridlines={yGridlines}/>
        <Area 
            fillColor={fillColor} 
            fillTransparency={fillTransparency}/>
    </Chart>
</div>
{:else}
<ErrorChart {error} chartType="Area Chart"/>
{/if}