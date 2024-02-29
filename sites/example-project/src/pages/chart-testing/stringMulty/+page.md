<script>

let full = 
[
    {x: "1900", y1: 103, y2: 135, y3: 88},
    {x: "1901", y1: 105, y2: 138, y3: 93},
    {x: "1902", y1: 106, y2: 132, y3: 103},
    {x: "1903", y1: 108, y2: 130, y3: 105},
    {x: "1904", y1: 109, y2: 128, y3: 102},
    {x: "1905", y1: 111, y2: 124, y3: 101},
    {x: "1906", y1: 120, y2: 122, y3: 100},
    {x: "1907", y1: 133, y2: 131, y3: 100},
    {x: "1908", y1: 142, y2: 128, y3: 99},
    {x: "1909", y1: 156, y2: 135, y3: 97},
    {x: "1910", y1: 168, y2: 137, y3: 95}
]

let nulls =
[
    {x: "1900", y1: 103, y2: 135, y3: 88},
    {x: "1901", y1: 105, y2: 138, y3: 93},
    {x: "1902", y1: null, y2: 132, y3: 103},
    {x: "1903", y1: 108, y2: 130, y3: 105},
    {x: "1904", y1: 109, y2: 128, y3: 102},
    {x: "1905", y1: 111, y2: 124, y3: 101},
    {x: "1906", y1: 120, y2: 122, y3: 100},
    {x: "1907", y1: 133, y2: 131, y3: 100},
    {x: "1908", y1: 142, y2: null, y3: 99},
    {x: "1909", y1: 156, y2: 135, y3: 97},
    {x: "1910", y1: 168, y2: 137, y3: 95}
]

 </script>

<h1>Series Column with Numeric X Axis</h1>
<h2>Line Chart</h2>
<LineChart data={full} title="Full Data"/>
<LineChart data={nulls}  title="Nulls"/>
<Chart data={full}>
    <Line y=y1/>
    <Bar y=y2/>
</Chart>

<h2>Area Chart</h2>
<AreaChart data={full}  title="Full Data"/>
<AreaChart data={nulls}  title="Nulls"/>

<h2>100% Stacked Area Chart</h2>
<AreaChart data={full}  title="Full Data" type=stacked100/>
<AreaChart data={nulls}  title="Nulls" type=stacked100/>

<h2>Stacked Bar Chart</h2>
<BarChart data={full}  title="Full Data"/>
<BarChart data={nulls}  title="Nulls"/>

<h2>100% Stacked Bar Chart</h2>
<BarChart data={full}  title="Full Data" type=stacked100/>
<BarChart data={nulls}  title="Nulls" type=stacked100/>

<h2>Horizontal Stacked Bar Chart</h2>
<BarChart data={full}  swapXY=true title="Full Data" xType=value sort={false}/>
<BarChart data={nulls}  swapXY=true title="Nulls" sort=false/>

<h2>Horizontal 100% Stacked Bar Chart</h2>
<BarChart data={full}  swapXY=true title="Full Data" xType=value sort={false} type=stacked100/>
<BarChart data={nulls}  swapXY=true title="Nulls" sort=false type=stacked100/>

<h2>Grouped Bar Chart</h2>
<BarChart data={full}  type=grouped title="Full Data"/>
<BarChart data={nulls}  type=grouped title="Nulls"/>

<h2>horizontal Grouped Bar Chart</h2>
<BarChart data={full}  swapXY=true type=grouped title="Full Data"/>
<BarChart data={nulls}  swapXY=true type=grouped title="Nulls"/>

<h2>Scatter Plot</h2>
<ScatterPlot data={full}  title="Full Data"/>
<ScatterPlot data={nulls}  title="Nulls"/>

<h2>Bubble Chart</h2>
<BubbleChart data={full} size=y1 title="Full Data" legend=true/>
<BubbleChart data={nulls}  size=y1 title="Nulls"/>
