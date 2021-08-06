<script>
    import LineChart from '$lib/viz/LineChart.svelte'
    import AreaChart from '$lib/viz/AreaChart.svelte'
    import BubbleChart from '$lib/viz/BubbleChart.svelte'
    import BarChart from '$lib/viz/BarChart.svelte'
    import ColumnChart from '$lib/viz/ColumnChart.svelte'
    import Hist from '$lib/viz/Hist.svelte'
    import ScatterPlot from '$lib/viz/ScatterPlot.svelte'
    import DataTable from '$lib/viz/DataTable.svelte'

    import testData from '/src/data/test.json'
    import pctTest from '/src/data/pct_test.json'
    import countries from '/src/data/countries.json'
 </script>

<h1>Evidence Component Library</h1>

<h2>Area Chart</h2>
<AreaChart data={testData} x=x y=y/>
<AreaChart data={pctTest} x=x y=y_pct/>

<h2>Bubble Chart</h2>
<BubbleChart data={testData} x=x y=y size=y/>

<h2>Bar Chart</h2>
<BarChart data={testData} x=x y=y/>

<h2>Column Chart</h2>
<ColumnChart data={testData} x=x y=y/>
<ColumnChart data={countries} x=year y=value series=country/>

<h2>Histogram</h2>
<Hist data={testData} x=x/>

<h2>Line Chart</h2>
<LineChart data={testData} x=x y=y/>

<h2>Scatter Plot</h2>
<ScatterPlot data={testData} x=x y=y/>

<h2>Data Table</h2>
<DataTable data={testData}/>