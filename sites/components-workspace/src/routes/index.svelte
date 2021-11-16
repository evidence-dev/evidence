<script>
    import LineChart from '$lib/viz/LineChart.svelte'
    import AreaChart from '$lib/viz/AreaChart.svelte'
    import BubbleChart from '$lib/viz/BubbleChart.svelte'
    import BarChart from '$lib/viz/BarChart.svelte'
    import Histogram from '$lib/viz/Histogram.svelte'
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

    let testH = [
        {a:5},
        {a:5},
        {a:9},
        {a:9},
        {a:7},
        {a:8},
        {a:6},
        {a:6}
    ]

    let textP = [
        {dept: 'Public Works', category: 'Pothole Repair', complaints: 24105},
{dept: 'Public Works', category: 'Debris in Street', complaints: 16378},
{dept: 'Public Works', category: 'Tree Issue ROW', complaints: 14871},
{dept: 'Public Works', category: 'Obstruction in ROW', complaints: 10528},
{dept: 'Public Works', category: 'Sidewalk Repair', complaints: 9206},
{dept: 'Public Works', category: 'Pavement Failure', complaints: 6941},
{dept: 'Public Works', category: 'Tree Issue ROW/Emergency (PW)', complaints: 5675},
{dept: 'Public Works', category: 'Tree Issue ROW/Maintenance (PW)', complaints: 4688},
{dept: 'Public Works', category: 'Alley & Unpaved Street Maintenance', complaints: 3160},
{dept: 'Public Works', category: 'Mowing Medians', complaints: 2743},
{dept: 'Public Works', category: 'Curb/Gutter Repair', complaints: 1435},
{dept: 'Public Works', category: 'Sidewalk/Curb Ramp/Route - NEW', complaints: 1272},
{dept: 'Public Works', category: 'Street Resurfacing', complaints: 1029},
{dept: 'Public Works', category: 'School Zone - New/Review/Changes', complaints: 696},
{dept: 'Public Works', category: 'Street Resurfacing Inquiry', complaints: 611},
{dept: 'Public Works', category: 'Guardrail New/Repair', complaints: 402},
{dept: 'Public Works', category: 'Guardrail Repair', complaints: 357},
{dept: 'Public Works', category: 'Roadway Spillage', complaints: 323},
{dept: 'Public Works', category: 'Bridge Repair', complaints: 294},
{dept: 'Public Works', category: 'Barricade Request', complaints: 228},
{dept: 'Public Works', category: 'School Issues - Crossing Guards', complaints: 171},
{dept: 'Public Works', category: 'Bicycle Issues', complaints: 97},
{dept: 'Public Works', category: 'Road Sanding Request', complaints: 59},
{dept: 'Public Works', category: 'Fence/Wall Repair', complaints: 42},
{dept: 'Public Works', category: 'Tree Issue ROW/Maintenance (PARD)', complaints: 29},
{dept: 'Public Works', category: 'Guardrail - New', complaints: 27},
{dept: 'Public Works', category: 'Tree Issue ROW/Emergency (PARD)', complaints: 24},
{dept: 'Public Works', category: 'Fence Repair - MOPAC', complaints: 10}
    ]
    

    let binCheck = 
    [
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 3},
    {a: 3},
    {a: 3},
    {a: 3},
    {a: 3},
    {a: 3},
    {a: 7},
    {a: 8}
]
let bc3 = [
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},

    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},

    {a: 2},


    {a: 3},
    {a: 3},
    {a: 3},
    {a: 3},
    {a: 3},
    {a: 3},



    {a: 4},
    {a: 5},
    {a: 6},
    {a: 7}
]



let binCheck2 = 
    [
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 1},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 2},
    {a: 3},
    {a: 3},
    {a: 3},
    {a: 3},
    {a: 3},
    {a: 3},
    {a: 7},
    {a: 8}
]

let binNull = 
    [
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: null},
    {a: 5},
    {a: 5},
    {a: 5},
    {a: 5},
    {a: 5},
    {a: 5},
    {a: 5},
    {a: 2}
]

let singleVal = [
    {a: 1},
]
 </script>

<Histogram data={binCheck}/>
<Histogram data={binCheck2}/>
<Histogram data={bc3}/>

<BarChart data={textP} x=category y=complaints horiz=true/>

<Histogram data={testH} x=a/>

<!-- <h1>Evidence Component Library</h1>
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
 -->



<h2>Area Chart</h2>
<AreaChart data={testData} x=x y=y/>

<AreaChart data={pctTest} x=x y=y_pct/>

<h2>Bubble Chart</h2>
<BubbleChart data={testData} x=x y=y size=y/>

<h2>Bar Chart</h2>
<BarChart data={testData} x=x y=y horiz={true}/>
<BarChart data={countries} x=year y=value series=country yAxisTitle="long units string" horiz={true}/>

<h2>Column Chart</h2>
<BarChart data={testData} x=x y=y/>
<BarChart data={countries} x=year y=value series=country xType=category/>
<BarChart data={countries} x=year y=value series=country xType=category xAxisTitle="Created Year"/>

<h2>Grouped Column Chart</h2>
<BarChart data={countries} type=grouped x=year y=value series=country xType=category xAxisTitle="Created Year"/>


<h2>Histogram</h2>
<Histogram data={testData} x=x/>

<h2>Line Chart</h2>
<LineChart data={testData} x=x y=y/>

<h2>Scatter Plot</h2>
<ScatterPlot data={testData} x=x y=y/>

<h2>Data Table</h2>
<DataTable data={testData}/>

<h2>Date Testing</h2>

<h3>Date</h3>
<BarChart data={test_dates} x=date y=y/>
<BarChart data={test_dates_stacked} x=date y=y series=group/>

<h3>Week</h3>
<BarChart data={test_weeks} x=week y=y/>

<h3>Month</h3>
<BarChart data={test_months} x=month y=y/>

<h3>Quarter</h3>
<BarChart data={test_quarters} x=qtr y=y/>

<h3>Year</h3>
<BarChart data={test_years} x=year y=y/>