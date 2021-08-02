<script>
    import Chart from './Chart.svelte'
    import XAxis from './XAxis.svelte'
    import YAxis from './YAxis.svelte'
    import Bubble from './Bubble.svelte'
    import Legend from './Legend.svelte'
    import ErrorChart from './ErrorChart.svelte'
    import checkInputs from '../modules/checkInputs.js'
    import getDistinctValues from '../modules/getDistinctValues.js';
    
    // Chart Area:
    let height = undefined;
    let width = undefined;

    // Data:
    export let data; 
    export let x = null;
    export let y = null;
    export let size = null; // size is the column used to calculate bubble size
    export let series = null;

    // Point Size
    export let minPointSize = undefined;
    export let maxPointSize = undefined;

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

    // Styling:
    export let fillColor = undefined;
    export let fillTransparency = undefined;
    export let outlineColor = undefined;
    export let outlineWidth = undefined;
    export let outlineTransparency = undefined;
    
    // Error Handling:
    let error;
    let seriesNames;

    try{
        checkInputs(data, [x,y,size], [series]);

        if(series != null){
            seriesNames = getDistinctValues(data, series);
            legend = "top";
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
    <Chart data={data} x={x} y={y} 
            yMin={yMin} 
            yMax={yMax} 
            xMin={xMin} 
            xMax={xMax}
            height={height}
            width={width}
        >
        <XAxis 
            axisTitle={xAxisTitle}
            baseline={xBaseline}
            gridlines={xGridlines}/>
        <YAxis 
            units={units}
            baseline={yBaseline}
            gridlines={yGridlines}/>
        <Bubble 
            size={size} 
            minPointSize={minPointSize}
            maxPointSize={maxPointSize}
            series={series}
            fillColor={fillColor}
            fillTransparency={fillTransparency}
            outlineColor={outlineColor}
            outlineWidth={outlineWidth}
            outlineTransparency={outlineTransparency}
            />
    </Chart>
</div>
{:else}
<ErrorChart {error} chartType="Bubble Chart"/>
{/if}