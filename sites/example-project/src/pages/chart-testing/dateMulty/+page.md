<script>
   

let full = 
[
    {date: '1900-01-01', y1: 103, y2: 135, y3: 88},
    {date: '1901-01-01', y1: 105, y2: 138, y3: 93},
    {date: '1902-01-01', y1: 106, y2: 132, y3: 103},
    {date: '1903-01-01', y1: 108, y2: 130, y3: 105},
    {date: '1904-01-01', y1: 109, y2: 128, y3: 102},
    {date: '1905-01-01', y1: 111, y2: 124, y3: 101},
    {date: '1906-01-01', y1: 120, y2: 122, y3: 100},
    {date: '1907-01-01', y1: 133, y2: 131, y3: 100},
    {date: '1908-01-01', y1: 142, y2: 128, y3: 99},
    {date: '1909-01-01', y1: 156, y2: 135, y3: 97},
    {date: '1910-01-01', y1: 168, y2: 137, y3: 95}
]

let missingX =
[
    {date: '1900-01-01', y1: 103, y2: 135, y3: 88},
    {date: '1901-01-01', y1: 105, y2: 138, y3: 93},
    {date: '1902-01-01', y1: 106, y2: 132, y3: 103},
    {date: '1903-01-01', y1: 108, y2: 130, y3: 105},
    {date: '1905-01-01', y1: 111, y2: 124, y3: 101},
    {date: '1906-01-01', y1: 120, y2: 122, y3: 100},
    {date: '1907-01-01', y1: 133, y2: 131, y3: 100},
    {date: '1908-01-01', y1: 142, y2: 128, y3: 99},
    {date: '1909-01-01', y1: 156, y2: 135, y3: 97},
    {date: '1910-01-01', y1: 168, y2: 137, y3: 95}
]

let nulls =
[
    {date: '1900-01-01', y1: 103, y2: 135, y3: 88},
    {date: '1901-01-01', y1: 105, y2: 138, y3: 93},
    {date: '1902-01-01', y1: 106, y2: null, y3: 103},
    {date: '1903-01-01', y1: 108, y2: 130, y3: 105},
    {date: '1904-01-01', y1: 109, y2: 128, y3: 102},
    {date: '1905-01-01', y1: 111, y2: 124, y3: null},
    {date: '1906-01-01', y1: 120, y2: 122, y3: 100},
    {date: '1907-01-01', y1: 133, y2: 131, y3: 100},
    {date: '1908-01-01', y1: 142, y2: 128, y3: 99},
    {date: '1909-01-01', y1: 156, y2: 135, y3: 97},
    {date: '1910-01-01', y1: 168, y2: 137, y3: 95}
]

 </script>

<h1>Date X Axis with Multiple Y Columns</h1>
<h2>Line Chart</h2>
<LineChart data={full} title="Full Data"/>
<LineChart data={missingX} title="Missing X"/>
<LineChart data={nulls}  title="Nulls"/>

<h2>Area Chart</h2>
<AreaChart data={full}  title="Full Data"/>
<AreaChart data={missingX}  title="Missing X"/>
<AreaChart data={nulls}  title="Nulls"/>

<h2>100% Stacked Area Chart</h2>
<AreaChart data={full}  title="Full Data" type=stacked100/>
<AreaChart data={missingX}  title="Missing X" type=stacked100/>
<AreaChart data={nulls}  title="Nulls" type=stacked100/>

<h2>Stacked Bar Chart</h2>
<BarChart data={full}  title="Full Data"/>
<BarChart data={missingX}  title="Missing X"/>
<BarChart data={nulls}  title="Nulls"/>

<h2>100% Stacked Bar Chart</h2>
<BarChart data={full}  title="Full Data" type=stacked100/>
<BarChart data={missingX}  title="Missing X" type=stacked100/>
<BarChart data={nulls}  title="Nulls" type=stacked100/>

<h2>Horizontal Stacked Bar Chart</h2>
<BarChart data={full}  swapXY=true title="Full Data"/>
<BarChart data={missingX}  swapXY=true title="Missing X"/>
<BarChart data={nulls}  swapXY=true title="Nulls"/>

<h2>Horizontal 100% Stacked Bar Chart</h2>
<BarChart data={full}  swapXY=true title="Full Data" type=stacked100/>
<BarChart data={missingX}  swapXY=true title="Missing X" type=stacked100/>
<BarChart data={nulls}  swapXY=true title="Nulls" type=stacked100/>

<h2>Grouped Bar Chart</h2>
<BarChart data={full}  type=grouped title="Full Data"/>
<BarChart data={missingX}  type=grouped title="Missing X"/>
<BarChart data={nulls}  type=grouped title="Nulls"/>

<h2>Horizontal Grouped Bar Chart</h2>
<BarChart data={full}  swapXY=true type=grouped title="Full Data"/>
<BarChart data={missingX}  swapXY=true type=grouped title="Missing X"/>
<BarChart data={nulls}  swapXY=true type=grouped title="Nulls"/>

<h2>Scatter Plot</h2>
<ScatterPlot data={full}  title="Full Data"/>
<ScatterPlot data={missingX}  title="Missing X"/>
<ScatterPlot data={nulls}  title="Nulls"/>

<h2>Bubble Chart</h2>
<BubbleChart data={full} size=y1 title="Full Data"/>
<BubbleChart data={missingX}  size=y1 title="Missing X" legend=true/>
<BubbleChart data={nulls}  size=y1 title="Nulls"/>
