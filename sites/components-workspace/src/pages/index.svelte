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
    import test_dates_stacked from '/src/data/test_dates_stacked.json'
    import test_weeks from '/src/data/test_weeks.json'
    import test_months from '/src/data/test_months.json'
    import test_quarters from '/src/data/test_quarters.json'
    import test_years from '/src/data/test_years.json'

    let data = {}
 </script>

<h1>Evidence Component Library</h1>
<Value placeholder="Report Date"/>
<br>
<br>
This is a value component: <Value data={[{"date":"2020-05-07"}]}/> and this is another: <Value value=.3054 fmt=pct/>. Here is a value component written to produce an error: <Value data={data.abc}/> along with another <Value data={[{"date":"2020-05-07"}]} row=8/>, and another <Value data={[{"date":"2020-05-07"}]} column=revenue/> in the same sentence.  
<br>
<br>  
The company has added <Value placeholder="number of employees"/> employees since <Value last report date/>.

<h2>Value Component Error Handling</h2>
1. Empty tag: <Value/>
<br>
2. Non-existent query result: <Value data=abc/> 
<br>
3. Wrong query result name: <Value data={data.abc}/>
<br>
4. Non-existent column: <Value data={[{"date":"2020-05-07"}]} column=abc/>
<br>
5. Non-existent row with no column: <Value data={[{"date":"2020-05-07"}]} row=11/>
<br>
6. Non-existent row with correct column: <Value data={[{"date":"2020-05-07"}]} column=date row=11/>

<h2>Area Chart</h2>
<AreaChart data={testData} x=x y=y/>
<AreaChart data={pctTest} x=x y=y_pct/>

<h2>Bubble Chart</h2>
<BubbleChart data={testData} x=x y=y size=y/>

<h2>Bar Chart</h2>
<BarChart data={testData} x=x y=y/>
<BarChart data={countries} x=year y=value series=country units="long units string"/>

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
<ColumnChart data={test_dates_stacked} x=date y=y series=group/>

<h3>Week</h3>
<ColumnChart data={test_weeks} x=week y=y/>

<h3>Month</h3>
<ColumnChart data={test_months} x=month y=y/>

<h3>Quarter</h3>
<ColumnChart data={test_quarters} x=qtr y=y/>

<h3>Year</h3>
<ColumnChart data={test_years} x=year y=y/>