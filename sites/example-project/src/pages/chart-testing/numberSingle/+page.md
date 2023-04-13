<script>


let full = 
[
    {x: 14, y: 34},
    {x: 15, y: 57},
    {x: 16, y: 26},
    {x: 17, y: 41},
    {x: 18, y: 41},
    {x: 19, y: 62},
    {x: 20, y: 32},
    {x: 21, y: 52},
    {x: 22, y: 48},
    {x: 23, y: 52},
    {x: 24, y: 48},
    {x: 25, y: 48}
]

let missingX =
[
    {x: 14, y: 34},
    {x: 15, y: 57},
    {x: 16, y: 26},
    {x: 17, y: 41},
    {x: 18, y: 41},
    {x: 20, y: 32},
    {x: 21, y: 52},
    {x: 22, y: 48},
    {x: 23, y: 52},
    {x: 24, y: 48},
    {x: 25, y: 48}
]

let nulls =
[
    {x: 14, y: 34},
    {x: 15, y: 57},
    {x: 16, y: null},
    {x: 17, y: 41},
    {x: 18, y: 41},
    {x: 19, y: 62},
    {x: 20, y: 32},
    {x: 21, y: 52},
    {x: 22, y: null},
    {x: 23, y: null},
    {x: 24, y: 48},
    {x: 25, y: 48}
]

 </script>

<h1>Series Column with Numeric X Axis</h1>
<h2>Line Chart</h2>
<LineChart data={full} title="Full Data" xTickMarks=true yBaseline=true yTickMarks=true yGridlines=false/>
<LineChart data={missingX} title="Missing X"/>
<LineChart data={nulls}  title="Nulls"/>

<h2>Area Chart</h2>
<AreaChart data={full}  title="Full Data"/>
<AreaChart data={missingX}  title="Missing X"/>
<AreaChart data={nulls}  title="Nulls"/>

<h2>Bar Chart</h2>
<BarChart data={full}  title="Full Data"/>
<BarChart data={missingX}  title="Missing X"/>
<BarChart data={nulls}  title="Nulls"/>

<h2>horizontal Bar Chart</h2>
<BarChart data={full}  title="Full Data" swapXY=true/>
<BarChart data={missingX}  title="Missing X" swapXY=true/>
<BarChart data={nulls}  title="Nulls" swapXY=true/>

<h2>Scatter Plot</h2>
<ScatterPlot data={full}  title="Full Data"/>
<ScatterPlot data={missingX}  title="Missing X"/>
<ScatterPlot data={nulls}  title="Nulls"/>

<h2>Bubble Chart</h2>
<BubbleChart data={full} size=y y=y title="Full Data"/>
<BubbleChart data={missingX}  size=y y=y title="Missing X"/>
<BubbleChart data={nulls}  size=y y=y title="Nulls"/>
