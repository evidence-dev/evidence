<script>
    import Chart from './Chart.svelte'
    import XAxis from './XAxis.svelte'
    import YAxis from './YAxis.svelte'
    import Column from './Column.svelte'
    import Legend from './Legend.svelte'
    import ErrorChart from './ErrorChart.svelte'
    import checkInputs from '../modules/checkInputs.js'
    import getDistinctValues from '../modules/getDistinctValues.js';
    import getColumnType from '../modules/getColumnType.js';
    import getColumnExtents from '../modules/getColumnExtents.js';
    import getFormatTag from '../modules/getFormatTag.js';
    import * as d3 from 'd3'

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
    export let xType = "categorical";
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
    export let xGridlines = "false";
    export let yGridlines = "true";
    
    // Sorting:
    export let sort = "true";
    let stackOrder = "true";

    // Axis Ticks:
    let xTickMarks = null;
    let yTickMarks = null;
    let xTickCount = undefined;
    let xLabelPosition = undefined;
    let yAxisPosition = undefined;
    if(yAxisPosition === "right"){
        paddingRight = 40;
        paddingLeft = 20;
    }

    // Labels:
    export let units = "";
    export let legend = "top";

    // Stacked Data Flag:
    let groupType = null;
    let seriesNames;
    if(series !== null){
        groupType = "stacked";
    };

    // Styling:
    export let fillColor = undefined;
    export let fillTransparency = undefined;

    let xFormat;
    // Error Handling:
    let error;
    try{
        checkInputs(data, [x,y],[series]);
        xFormat = getFormatTag(x);
        if(getColumnType(data, x, xFormat) === "date"){
            throw Error("Column chart does not accept dates yet. You can format the column as strings by appending '_str' to the column name in SQL");  
        }
        
        if(series !== null){
            seriesNames = getDistinctValues(data, series);
        }
        // Handle Negative Values on Y Axis:
        if(yMin === null){
            if(d3.min(data, d => d[y]) < 0){
                yMin = null
            } else {
                yMin = 0
            }
        }
    } catch(e) {
        error = e.message;
    }

</script>
  
{#if !error}

{#if series != null && legend === "top"}
<Legend seriesNames={seriesNames}/>
{/if}

<div width=100%>
    <Chart data={data} x={x} y={y}
    yMin={yMin} 
    yMax={yMax} 
    xMin={xMin} 
    xMax={xMax}
    xType={xType}
    yType={yType}
    groupType={groupType}
    height={height}
    width={width}
    sort={sort}
    {paddingLeft}
    {paddingRight}
    >
        <XAxis 
            tickMarks={xTickMarks} 
            ticks={xTickCount} 
            labelPosition={xLabelPosition}
            baseline={xBaseline}
            gridlines={xGridlines}
            />
        <YAxis 
            units={units} 
            axisPosition={yAxisPosition}
            baseline={yBaseline}
            tickMarks={yTickMarks}
            gridlines={yGridlines}/>
        <Column 
            series={series} 
            stackOrder={stackOrder}
            fillColor={fillColor}
            fillTransparency={fillTransparency}/>
    </Chart>
</div>
{:else}
<ErrorChart {error} chartType="Column Chart"/>
{/if}



