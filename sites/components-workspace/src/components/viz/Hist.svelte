<script>
import { extent } from 'd3-array';
import * as d3 from 'd3';
import {tidy, arrange, groupBy, summarize, n} from '@tidyjs/tidy'
import getThresholds from '../modules/getThresholds.js'

import Chart from './Chart.svelte'
import Column from './Column.svelte'
import XAxis from './XAxis.svelte'
import YAxis from './YAxis.svelte'
import ErrorChart from './ErrorChart.svelte'
import checkInputs from '../modules/checkInputs.js';
  
// Chart Area:
let height = undefined;
let width = undefined;

// Input Data (chart only needs values from the supplied column):
export let data;
export let x = null;

// Output Data Names:
let x2 = 'binMin';
let y = 'frequency';

// Bin Props:
export let binCount = null;

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

// Labels:
export let units = "";
export let xAxisTitle = "";

// Styling:
export let fillColor = undefined;
export let fillTransparency = undefined;

let finalData = [];
let thresh;

let error;
try{
    checkInputs(data, [x]);

    data = data.map(d => d[x]);

// Handle Negative Values on Y Axis:
if(yMin === null){
    if(d3.min(data, d => d[y]) < 0){
        yMin = null
    } else {
        yMin = 0
    }
}

// Histogram Calculations: 

// If binCount not supplied, use Freedman-Diaconis formula from D3 to determine good starting point for binCount:
const domain = extent(data);
if(binCount === null){
    binCount = d3.thresholdFreedmanDiaconis(data, domain[0], domain[1]);
}

thresh = getThresholds(domain, binCount);

// The loop below checks each value of the dataset against each bin threshold value. If it is less, that threshold value
// is assigned as the bin for that piece of data. The threshold function above returns the threshold values ordered ascending,
// which is why we can loop through them like this (and exit the loop once we find the right bin for each data point).
for(var i = 0; i < data.length; i++){
    for(var j = 1; j < thresh.length; j++){
        // Check if value is between threshold min and max. Data can be equal to the last threshold max, but should be less
        // than the other threshold maxes:
        if(j === (thresh.length - 2) ? (data[i] <= Math.ceil(thresh[j])) : (data[i] < thresh[j])){
        finalData.push({"value": data[i], "binMin": thresh[j-1], "binMax": thresh[j]});
        break;
        }
    }
}

finalData = tidy(
        finalData,
        groupBy(["binMin", "binMax"], summarize({frequency: n("value")}))
);

finalData.push({"binMin": thresh[thresh.length-2], "binMax": thresh[thresh.length-1], "frequency": 0})

finalData = tidy(
        finalData,
        arrange('binMin')
);

// Reset upper bound of X Axis:
// Use user-supplied number if provided, otherwise use the maximum threshold value (leaves enough space for all data)
xMax = xMax ? xMax : thresh[thresh.length - 1];

} catch(e) {
    error = e.message;
}

</script>

{#if !error}
<div width=100%>
    <Chart data={finalData} x={x2} y={y}
    yMin={yMin} 
    yMax={yMax} 
    xMin={xMin} 
    xMax={xMax}
    height={height}
    width={width}
    >
        <XAxis 
            ticks={xTickCount} 
            tickMarks={xTickMarks}
            baseline={xBaseline}
            gridlines={xGridlines}
            axisTitle={xAxisTitle}/>
        <YAxis 
            units={units}
            baseline={yBaseline}
            gridlines={yGridlines}/>
        <Column 
            binMax={"binMax"} 
            fillColor={fillColor}
            fillTransparency={fillTransparency}/>
    </Chart>
</div>
{:else}
<ErrorChart {error} chartType="Histogram"/>
{/if}