<script>


let full = 
[
{x: "a1", series: 'a', y: 10},
{x: "a1", series: 'b', y: 24},
{x: "a1", series: 'c', y: 45},
{x: "a2", series: 'a', y: 14},
{x: "a2", series: 'b', y: 26},
{x: "a2", series: 'c', y: 51},
{x: "a3", series: 'a', y: 16},
{x: "a3", series: 'b', y: 22},
{x: "a3", series: 'c', y: 53},
{x: "a4", series: 'a', y: 11},
{x: "a4", series: 'b', y: 20},
{x: "a4", series: 'c', y: 60},
{x: "a5", series: 'a', y: 18},
{x: "a5", series: 'b', y: 28},
{x: "a5", series: 'c', y: 58},
{x: "a6", series: 'a', y: 15},
{x: "a6", series: 'b', y: 22},
{x: "a6", series: 'c', y: 63}
]

let missingY = 
[
{x: "a1", series: 'a', y: 10},
{x: "a1", series: 'b', y: 24},
{x: "a1", series: 'c', y: 45},
{x: "a2", series: 'a', y: 14},
{x: "a2", series: 'b', y: 26},
{x: "a3", series: 'a', y: 6},
{x: "a3", series: 'b', y: 3},
{x: "a3", series: 'c', y: 5},
{x: "a4", series: 'a', y: 11},
{x: "a4", series: 'b', y: 20},
{x: "a4", series: 'c', y: 60},
{x: "a5", series: 'a', y: 18},
{x: "a5", series: 'b', y: 28},
{x: "a5", series: 'c', y: 58},
{x: "a6", series: 'a', y: 15},
{x: "a6", series: 'b', y: 22},
{x: "a6", series: 'c', y: 63}
]


let missingX =
[
{x: "a1", series: 'a', y: 10},
{x: "a1", series: 'b', y: 24},
{x: "a1", series: 'c', y: 45},
{x: "a2", series: 'a', y: 14},
{x: "a2", series: 'b', y: 26},
{x: "a2", series: 'c', y: 51},
{x: "a3", series: 'a', y: 16},
{x: "a3", series: 'b', y: 22},
{x: "a3", series: 'c', y: 53},
{x: "a5", series: 'a', y: 18},
{x: "a5", series: 'b', y: 28},
{x: "a5", series: 'c', y: 58},
{x: "a6", series: 'a', y: 15},
{x: "a6", series: 'b', y: 22},
{x: "a6", series: 'c', y: 63}
]

let nulls =
[
{x: "a1", series: 'a', y: 10},
{x: "a1", series: 'b', y: 24},
{x: "a1", series: 'c', y: 45},
{x: "a2", series: 'a', y: 14},
{x: "a2", series: 'b', y: 26},
{x: "a2", series: 'c', y: null},
{x: "a3", series: 'a', y: 16},
{x: "a3", series: 'b', y: 22},
{x: "a3", series: 'c', y: 53},
{x: "a4", series: 'a', y: 11},
{x: "a4", series: 'b', y: 20},
{x: "a4", series: 'c', y: 60},
{x: "a5", series: 'a', y: null},
{x: "a5", series: 'b', y: 28},
{x: "a5", series: 'c', y: 58},
{x: "a6", series: 'a', y: 15},
{x: "a6", series: 'b', y: 22},
{x: "a6", series: 'c', y: 63}
]

 </script>

```abc
select 'a1' as start, 'a3' as tend, 'ABC' as label
union all
select 'a5' as start, 'a6' as tend, 'DEF' as label
```

<BarChart data={full} series=series swapXY=true title="Full Data" sort=false/>

<h1>Series Column with String X Axis</h1>
<h2>Line Chart</h2>
<BarChart data={full} series=series swapXY=true title="Full Data" sort=false/>

<LineChart data={full} series=series title="Full Data" sort=false/>
<BarChart data={full} series=series swapXY=true title="Full Data" sort=false/>

<LineChart data={missingY} series=series title="Missing Y - handleNulls=gaps (default)"/>
<LineChart data={missingY} series=series handleNulls=connect title="Missing Y - handleNulls=connect"/>
<LineChart data={missingY} series=series handleNulls=zero title="Missing Y - handleNulls=zero"/>
<LineChart data={nulls} series=series title="Nulls - handleNulls=gaps (default)"/>

<BarChart data={full} series=series swapXY=true title="Full Data" sort=false/>

<h2>Area Chart</h2>
<AreaChart data={full} series=series title="Full Data"/>
<AreaChart data={missingY} series=series title="Missing Y" handleNulls=connect/>
<AreaChart data={nulls} series=series title="Nulls" handleNulls=zero/>

<h2>100% Stacked Area Chart</h2>
<AreaChart data={full} series=series title="Full Data" type=stacked100/>
<AreaChart data={missingY} series=series title="Missing Y" handleNulls=connect type=stacked100/>
<AreaChart data={nulls} series=series title="Nulls" handleNulls=zero type=stacked100/>

<h2>Stacked Bar Chart</h2>
<BarChart data={full} series=series title="Full Data" sort=false>
    <ReferenceLine y=10 label="Target" labelBackground=true labelTextOutline=false/>
</BarChart>
<BarChart data={full} series=series swapXY=true title="Full Data" sort=false/>
<BarChart data={missingY} series=series title="Missing Y"/>
<BarChart data={nulls} series=series title="Nulls"/>

<h2>100% Stacked Bar Chart</h2>
<BarChart data={full} series=series title="Full Data" sort=false type=stacked100/>
<BarChart data={full} series=series swapXY=true title="Full Data" sort=false type=stacked100/>
<BarChart data={missingY} series=series title="Missing Y" type=stacked100/>
<BarChart data={nulls} series=series title="Nulls" type=stacked100/>

<h2>Horizontal Stacked Bar Chart</h2>
<BarChart data={full} series=series swapXY=true title="Full Data" sort=true/>
<BarChart data={missingY} series=series swapXY=true title="Missing Y" sort=false/>
<BarChart data={nulls} series=series swapXY=true title="Nulls" sort=false/>

<h2>Horizontal 100% Stacked Bar Chart</h2>
<BarChart data={full} series=series swapXY=true title="Full Data" sort=true type=stacked100/>
<BarChart data={missingY} series=series swapXY=true title="Missing Y" sort=false type=stacked100/>
<BarChart data={nulls} series=series swapXY=true title="Nulls" sort=false type=stacked100/>

<h2>Grouped Bar Chart</h2>
<BarChart data={full} series=series type=grouped title="Full Data"/>
<BarChart data={missingY} series=series type=grouped title="Missing Y"/>
<BarChart data={nulls} series=series type=grouped title="Nulls"/>

<h2>Horizontal Grouped Bar Chart</h2>
<BarChart data={full} series=series swapXY=true type=grouped title="Full Data"/>
<BarChart data={missingY} series=series swapXY=true type=grouped title="Missing Y"/>
<BarChart data={nulls} series=series swapXY=true type=grouped title="Nulls"/>

<h2>Scatter Plot</h2>
<ScatterPlot data={full} series=series title="Full Data"/>
<ScatterPlot data={missingY} series=series title="Missing Y"/>
<ScatterPlot data={nulls} series=series title="Nulls"/>

<h2>Bubble Chart</h2>
<BubbleChart data={full} series=series size=y y=y title="Full Data"/>
<BubbleChart data={missingY} series=series size=y y=y title="Missing Y"/>
<BubbleChart data={nulls} series=series size=y y=y title="Nulls"/>
