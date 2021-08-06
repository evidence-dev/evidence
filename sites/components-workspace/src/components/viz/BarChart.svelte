<script>
    import Chart from './Chart.svelte'
    import XAxis from './XAxis.svelte'
    import YAxis from './YAxis.svelte'
    import Bar from './Bar.svelte'
    import Legend from './Legend.svelte'
    import ErrorChart from './ErrorChart.svelte'
    import checkInputs from '../modules/checkInputs.js'

    import * as d3 from 'd3'
    import getDistinctValues from '../modules/getDistinctValues.js';
    import getColumnType from '../modules/getColumnType.js';
    import getColumnExtents from '../modules/getColumnExtents.js';
  
    // Chart Area:
    let height = undefined;
    let width = undefined;
    let paddingLeft;
    let paddingRight;
    let paddingTop;
    // Set maximum bars allowed in standard height of chart (used to auto-adjust chart height)
    const maxBars = 5;

    // Data:
    export let data;  
    export let x = null;
    export let y = null;
    export let series = null;

    // In this bar chart, the x axis is the vertical axis and the y axis is the horizontal axis,
    // but the switch doesn't occur until the <Chart> call below. In the script tag, x means
    // the vertical axis and y the horizontal axis.

    // Data Types:
    let xType = "categorical";
    let yType = null;

    // Axis Bounds:
    export let yMin = null;
    let yMax = null;
    let xMin = null;
    let xMax = null;

    // Axis Baselines:
    let xBaseline = undefined;
    let yBaseline = undefined;

    let yAxisPosition = "top";
    let yTickMarks = "false";
    let xTickMarks = undefined;
    let xAxisTitle = "";

    // Gridlines:
    export let xGridlines = "false";
    export let yGridlines = "true";

    // Sorting:
    export let sort = "true";
    let stackOrder = "true";

    // Labels:
    export let units = "";
    export let legend = "top";

    // Set Stacked Data Flag:
    let groupType = null;
    let seriesNames;
    if(series !== null){
        groupType = "stacked";
    };

    // Styling:
    export let fillColor = undefined;
    export let fillTransparency = undefined;

    let barCount = 0;
    let heightMultiplier = undefined;

    // Error Handling:
    let error;
    try{
        checkInputs(data, [x,y], [series]);
        if(getColumnType(data, x) === "date"){
            throw Error("Bar chart does not accept dates yet");  
        }

        if(series != null){
            seriesNames = getDistinctValues(data, series);
        }
        // Handle Negative Values on Y Axis:
        if(d3.min(data, d => d[y]) < 0){
            yMin = null
        } else {
            yMin = 0
        };

        // Set height multiplier if number of bars exceeds maximum:
        if(height === undefined){
            barCount = getDistinctValues(data, x).length;
            heightMultiplier = Math.max(1, barCount / maxBars);
        }

    } catch(e) {
        error = e.message ?? error;
    }

</script>
  
{#if !error}

{#if series != null && legend === "top"}
<Legend seriesNames={seriesNames}/>
{/if}

<div width=100%>
    <Chart data={data} x={y} y={x}
    yMin={xMin} 
    yMax={xMax} 
    xMin={yMin} 
    xMax={yMax}
    {paddingLeft}
    {paddingRight}
    {paddingTop}
    reverseAxes={true}
    xType={yType}
    yType={xType}
    groupType={groupType}
    height={height}
    heightMultiplier={heightMultiplier}
    width={width}
    sort={sort}
    >
    <XAxis 
            gridlines={yGridlines}
            axisPosition={yAxisPosition}
            axisTitle={units}
            tickMarks={yTickMarks}
            baseline={yBaseline}
            />
        <YAxis 
            gridlines={xGridlines} 
            units={xAxisTitle}
            tickMarks={xTickMarks}
            baseline={xBaseline}/>
        <Bar 
            series={series} 
            seriesNames={seriesNames}
            stackOrder={stackOrder} 
            fillColor={fillColor}
            fillTransparency={fillTransparency}/>
    </Chart>
</div>
{:else}
<ErrorChart {error} chartType="Bar Chart"/>
{/if}