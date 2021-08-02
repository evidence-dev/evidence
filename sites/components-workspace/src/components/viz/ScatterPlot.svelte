<script>
    import Chart from './Chart.svelte'
    import XAxis from './XAxis.svelte'
    import YAxis from './YAxis.svelte'
    import Scatter from './Scatter.svelte'
    import Legend from './Legend.svelte'
    import ErrorChart from './ErrorChart.svelte'
    import checkInputs from '../modules/checkInputs.js'
    import getDistinctValues from '../modules/getDistinctValues.js'
    
    // Chart Area:
    let height = undefined;
    let width = undefined;

    // Data:
    export let data;
    export let x = null;
    export let y = null;
    export let series = null;

    // Data Types:
    let xType = null;
    let yType = null;

    // Labels:
    export let units = '';
    export let xAxisTitle = '';
    export let legend = undefined;

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

    // Axis Ticks:
    let xTickCount = undefined;
    let xTickMarks = null;

    // Point Styling:
    export let fillColor = undefined;
    export let fillTransparency = undefined;
    export let outlineColor = undefined;
    export let outlineWidth = undefined;
    export let outlineTransparency = undefined;
    export let pointSize = undefined;

    let seriesNames;

    // Error Handling:
    let error;
    try{
        checkInputs(data, [x,y], [series]);
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

<div width=100%>
    <Chart data={data} x={x} y={y}
    yMin={yMin} 
    yMax={yMax} 
    xMin={xMin} 
    xMax={xMax}
    xType={xType}
    yType={yType}
    height={height}
    width={width}
    >
        <XAxis 
            axisTitle={xAxisTitle}
            ticks={xTickCount} 
            tickMarks={xTickMarks}
            baseline={xBaseline}
            gridlines={xGridlines}/>
        <YAxis 
            units={units}
            baseline={yBaseline}
            gridlines={yGridlines}/>
        <Scatter 
            series={series}
            fillColor={fillColor}
            fillTransparency={fillTransparency}
            outlineColor={outlineColor}
            outlineWidth={outlineWidth}
            outlineTransparency={outlineTransparency}
            pointSize={pointSize}
            />
    </Chart>
</div>
{:else}
<ErrorChart {error} chartType="Scatter Plot"/>
{/if}