<script>
    import LineChart from '$lib/viz/LineChart.svelte'
    import AreaChart from '$lib/viz/AreaChart.svelte'
    import BubbleChart from '$lib/viz/BubbleChart.svelte'
    import BarChart from '$lib/viz/BarChart.svelte'
    import ColumnChart from '$lib/viz/ColumnChart.svelte'
    import Hist from '$lib/viz/Hist.svelte'
    import ScatterPlot from '$lib/viz/ScatterPlot.svelte'
    import DataTable from '$lib/viz/DataTable.svelte'
    import Value from '$lib/viz/Value.svelte'

    import testData from '/src/data/test.json'
    import pctTest from '/src/data/pct_test.json'
    import countries from '/src/data/countries.json'
    import test_string from '/src/data/test_string.json'
    import test_dates from '/src/data/test_dates.json'
    import test_weeks from '/src/data/test_weeks.json'
    import test_months from '/src/data/test_months.json'
    import test_quarters from '/src/data/test_quarters.json'
    import test_years from '/src/data/test_years.json'
 </script>

<h1>Evidence Component Library</h1>

This is a value component: <Value data={[{"date":"2020-05-07"}]}/> and this is another: <Value value=.3054 fmt=pct/>

<h2>Area Chart</h2>
<AreaChart data={testData} x=x y=y/>
<AreaChart data={pctTest} x=x y=y_pct/>

<h2>Bubble Chart</h2>
<BubbleChart data={testData} x=x y=y size=y/>

<h2>Bar Chart</h2>
<BarChart data={testData} x=x y=y/>
<BarChart data={countries} x=year y=value series=country/>

<h2>Column Chart</h2>
<ColumnChart data={testData} x=x y=y/>
<ColumnChart data={countries} x=year y=value series=country/>
<ColumnChart data={countries} x=year y=value series=country xType=categorical xAxisTitle="Created Year"/>

<h2>Histogram</h2>
<Hist data={testData} x=x/>

<h2>Line Chart</h2>
<LineChart data={testData} x=x y=y/>

<h2>Scatter Plot</h2>
<ScatterPlot data={testData} x=x y=y/>

<h2>Data Table</h2>
<DataTable data={testData}/>

<h2>Date Testing</h2>

<h3>Date</h3>
<ColumnChart data={test_dates} x=date y=y/>

<h3>Week</h3>
<ColumnChart data={test_weeks} x=week y=y/>

<h3>Month</h3>
<ColumnChart data={test_months} x=month y=y/>

<h3>Quarter</h3>
<ColumnChart data={test_quarters} x=qtr y=y/>

<h3>Year</h3>
<ColumnChart data={test_years} x=year y=y/>