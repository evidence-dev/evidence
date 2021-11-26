<script>
    import LineChart from '$lib/viz/LineChart.svelte'
    import AreaChart from '$lib/viz/AreaChart.svelte'
    import BubbleChart from '$lib/viz/BubbleChart.svelte'
    import BarChart from '$lib/viz/BarChart.svelte'
    import Histogram from '$lib/viz/Histogram.svelte'
    import ScatterPlot from '$lib/viz/ScatterPlot.svelte'
    import DataTable from '$lib/viz/DataTable.svelte'
    import Value from '$lib/viz/Value.svelte'

    import Line from '$lib/viz/Line.svelte'
    import Bar from '$lib/viz/Bar.svelte'
    import Scatter from '$lib/viz/Scatter.svelte'
    import Area from '$lib/viz/Area.svelte'

    import Chart from '$lib/viz/Chart.svelte'

    import getCompletedData from '$lib/modules/getCompletedData.js';

let numberSeriesFull = 
[
{x: 1, series: 'a', y: 10},
{x: 1, series: 'b', y: 24},
{x: 1, series: 'c', y: 45},
{x: 3, series: 'a', y: 16},
{x: 3, series: 'b', y: 22},
{x: 3, series: 'c', y: 53},
{x: 2, series: 'a', y: 14},
{x: 2, series: 'b', y: 26},
{x: 2, series: 'c', y: 51},
{x: 4, series: 'a', y: 11},
{x: 4, series: 'b', y: 20},
{x: 4, series: 'c', y: 60},
{x: 5, series: 'a', y: 18},
{x: 5, series: 'b', y: 28},
{x: 5, series: 'c', y: 58},
{x: 6, series: 'a', y: 15},
{x: 6, series: 'b', y: 22},
{x: 6, series: 'c', y: 63}
]


let numberSeriesMissingY = 
[
{x: 1, series: 'a', y: 10},
{x: 1, series: 'b', y: 24},
{x: 1, series: 'c', y: 45},
{x: 2, series: 'a', y: 14},
{x: 2, series: 'c', y: 51},
{x: 3, series: 'a', y: 16},
{x: 3, series: 'b', y: 22},
{x: 3, series: 'c', y: 53},
{x: 4, series: 'a', y: 11},
{x: 4, series: 'b', y: 20},
{x: 4, series: 'c', y: 60},
{x: 5, series: 'a', y: 18},
{x: 5, series: 'b', y: 28},
{x: 5, series: 'c', y: 58},
{x: 6, series: 'a', y: 15},
{x: 6, series: 'b', y: 22},
{x: 6, series: 'c', y: 63}
]


let numberSeriesMissingX =
[
{x: 1, series: 'a', y: 10},
{x: 1, series: 'b', y: 24},
{x: 1, series: 'c', y: 45},
{x: 3, series: 'a', y: 16},
{x: 3, series: 'b', y: 22},
{x: 3, series: 'c', y: 53},
{x: 4, series: 'a', y: 11},
{x: 4, series: 'b', y: 20},
{x: 4, series: 'c', y: 60},
{x: 5, series: 'a', y: 18},
{x: 5, series: 'b', y: 28},
{x: 5, series: 'c', y: 58},
{x: 6, series: 'a', y: 15},
{x: 6, series: 'b', y: 22},
{x: 6, series: 'c', y: 63}
]


let numberSeriesXSync = 
[
{x: 1, series: 'a', y: 10},
{x: 1, series: 'b', y: 24},
{x: 1, series: 'c', y: 45},
{x: 2, series: 'a', y: 14},
{x: 2, series: 'b', y: 26},
{x: 2, series: 'c', y: 51},
{x: 3, series: 'a', y: 16},
{x: 3, series: 'b', y: 22},
{x: 3.3456, series: 'c', y: 53},
{x: 4, series: 'a', y: 11},
{x: 4, series: 'b', y: 20},
{x: 4, series: 'c', y: 60},
{x: 5, series: 'a', y: 18},
{x: 5, series: 'b', y: 28},
{x: 5, series: 'c', y: 58},
{x: 6, series: 'a', y: 15},
{x: 6, series: 'b', y: 22},
{x: 6, series: 'c', y: 63}
]

let numberSeriesNulls =
[
{x: 1, series: 'a', y: 10},
{x: 1, series: 'b', y: 24},
{x: 1, series: 'c', y: 45},
{x: 2, series: 'a', y: null},
{x: 2, series: 'b', y: 26},
{x: 2, series: 'c', y: 51},
{x: 3, series: 'a', y: 16},
{x: 3, series: 'b', y: 22},
{x: 3, series: 'c', y: 53},
{x: 4, series: 'a', y: 11},
{x: 4, series: 'b', y: null},
{x: 4, series: 'c', y: 60},
{x: 5, series: 'a', y: 18},
{x: 5, series: 'b', y: 28},
{x: 5, series: 'c', y: 58},
{x: 6, series: 'a', y: 15},
{x: 6, series: 'b', y: 22},
{x: 6, series: 'c', y: 63}
]

let barTest = [
    {x: 1, y: 10, series: "A"},
    {x: 3, y: 12, series: "A"},
    {x: 1, y: 22, series: "B"},
    {x: 3, y: 24, series: "B"}
]

let full2 = getCompletedData(numberSeriesMissingX, "x", "y", "series", true, true)
let full3 = getCompletedData(numberSeriesMissingY, "x", "y","series", true)
let full4 = getCompletedData(numberSeriesXSync, "x", "y", "series", true)

let full5 = 
[
  { x: 1, series: 'a', y: 10 },
  { x: 1, series: 'b', y: 24 },
  { x: 1, series: 'c', y: 45 },
  { x: 2, series: 'a', y: undefined },
  { x: 2, series: 'b', y: undefined },
  { x: 2, series: 'c', y: undefined },
  { x: 3, series: 'a', y: 16 },
  { x: 3, series: 'b', y: 22 },
  { x: 3, series: 'c', y: 53 },
  { x: 4, series: 'a', y: 11 },
  { x: 4, series: 'b', y: 20 },
  { x: 4, series: 'c', y: 60 },
  { x: 5, series: 'a', y: 18 },
  { x: 5, series: 'b', y: 28 },
  { x: 5, series: 'c', y: 58 },
  { x: 6, series: 'a', y: 15 },
  { x: 6, series: 'b', y: 22 },
  { x: 6, series: 'c', y: 63 }
]

</script>

<!-- <BarChart data={barTest} series=series type=grouped/> -->

<h1>Series Column with Numeric X Axis</h1>
<h2>Line Chart</h2>
<LineChart data={numberSeriesFull} series=series title="Full Data"/>
<LineChart data={numberSeriesMissingY} series=series title="Missing Y"/>
<LineChart data={numberSeriesMissingX} series=series title="Missing X"/>
<LineChart data={numberSeriesXSync} series=series title="X out of sync"/>
<LineChart data={numberSeriesNulls} series=series title="Nulls"/>

<h2>Area Chart</h2>
<AreaChart data={numberSeriesFull} series=series title="Full Data"/>
<AreaChart data={full2} series=series title="Fill Attempt"/>
<AreaChart data={numberSeriesMissingY} yBaseline=true xTickMarks=true yTickMarks=true yGridlines=false series=series title="Missing Y"/>
<AreaChart data={numberSeriesMissingY} series=series title="Missing Y"/>
<AreaChart data={full3} series=series title="Missing Y" xType=category/>
<AreaChart data={numberSeriesMissingX} series=series title="Missing X"/>
<AreaChart data={numberSeriesXSync} series=series title="X out of sync"/>
<AreaChart data={numberSeriesNulls} series=series title="Nulls"/>

<h2>Stacked Bar Chart</h2>
<BarChart data={numberSeriesFull} series=series title="Full Data"/>
<BarChart data={numberSeriesMissingY} series=series title="Missing Y" />
<BarChart data={numberSeriesMissingX} series=series title="Missing X"/>
<BarChart data={full2} series=series title="Missing X Filled"/>

<BarChart data={numberSeriesXSync} series=series title="X out of sync"/>
<BarChart data={full4} series=series title="X out of sync"/>

<BarChart data={numberSeriesNulls} series=series title="Nulls"/>

<h2>horizontal Stacked Bar Chart</h2>
<BarChart data={numberSeriesFull} series=series swapXY=true title="Full Data" xType=category yBaseline=true yTickMarks=true xTickMarks=true/>
<BarChart data={numberSeriesMissingY} series=series swapXY=true title="Missing Y"/>
<BarChart data={numberSeriesMissingX} series=series swapXY=true title="Missing X"/>
<BarChart data={numberSeriesXSync} series=series swapXY=true title="X out of sync"/>
<BarChart data={numberSeriesNulls} series=series swapXY=true title="Nulls"/> 

<h2>Grouped Bar Chart</h2>
<BarChart data={numberSeriesFull} series=series type=grouped title="Full Data"/>
<BarChart data={numberSeriesMissingY} series=series type=grouped title="Missing Y"/>
<BarChart data={numberSeriesMissingX} series=series type=grouped title="Missing X"/>
<BarChart data={numberSeriesXSync} series=series type=grouped title="X out of sync"/>
<BarChart data={numberSeriesNulls} series=series type=grouped title="Nulls"/>

<h2>horizontal Grouped Bar Chart</h2>
<BarChart data={numberSeriesFull} series=series swapXY=true type=grouped title="Full Data"/>
<BarChart data={numberSeriesMissingY} series=series swapXY=true type=grouped title="Missing Y"/>
<BarChart data={numberSeriesMissingX} series=series swapXY=true type=grouped title="Missing X"/>
<BarChart data={numberSeriesXSync} series=series swapXY=true type=grouped title="X out of sync"/>
<BarChart data={numberSeriesNulls} series=series swapXY=true type=grouped title="Nulls"/>

<h2>Scatter Plot</h2>
<ScatterPlot data={numberSeriesFull} series=series title="Full Data"/>
<ScatterPlot data={numberSeriesMissingY} series=series title="Missing Y"/>
<ScatterPlot data={numberSeriesMissingX} series=series title="Missing X"/>
<ScatterPlot data={numberSeriesXSync} series=series title="X out of sync"/>
<ScatterPlot data={numberSeriesNulls} series=series title="Nulls"/>

<h2>Bubble Chart</h2>
<BubbleChart data={numberSeriesFull} series=series size=y y=y title="Full Data"/>
<BubbleChart data={numberSeriesMissingY} series=series size=y y=y title="Missing Y"/>
<BubbleChart data={numberSeriesMissingX} series=series size=y y=y title="Missing X"/>
<BubbleChart data={numberSeriesXSync} series=series size=y y=y title="X out of sync"/>
<BubbleChart data={numberSeriesNulls} series=series size=y y=y title="Nulls"/>