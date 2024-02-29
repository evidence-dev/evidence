<script>


let full = 
[
    {x: "A", y: 34},
    {x: "B", y: 57},
    {x: "C", y: 26},
    {x: "D", y: 41},
    {x: "E", y: 41},
    {x: "F", y: 62},
    {x: "G", y: 32},
    {x: "H", y: 52},
    {x: "I", y: 48},
    {x: "J", y: 52},
    {x: "K", y: 48},
    {x: "L", y: 48}
]

let missingX =
[
    {x: "A", y: 34},
    {x: "B", y: 57},
    {x: "C", y: 26},
    {x: "E", y: 41},
    {x: "F", y: 62},
    {x: "G", y: 32},
    {x: "H", y: 52},
    {x: "I", y: 48},
    {x: "J", y: 52},
    {x: "K", y: 48},
    {x: "L", y: 48}
]

let nulls =
[
    {x: "A", y: 34},
    {x: "B", y: 57},
    {x: "C", y: 26},
    {x: "D", y: 41},
    {x: "E", y: 41},
    {x: "F", y: null},
    {x: "G", y: 32},
    {x: "H", y: 52},
    {x: "I", y: 48},
    {x: "J", y: 52},
    {x: "K", y: 48},
    {x: "L", y: 48}
]

 </script>

<h1>Series Column with String X Axis</h1>
<h2>Line Chart</h2>
<LineChart data={full} title="Full Data" xBaseline=true yGridlines=false yBaseline=true xTickMarks=true yTickMarks=true/>
<LineChart data={missingX} title="Missing X"/>
<LineChart data={nulls} handleNulls=gaps title="Nulls - handleNulls=gaps (default)"/>
<LineChart data={nulls} handleNulls=connect title="Nulls - handleNulls=connect"/>
<LineChart data={nulls} handleNulls=zero title="Nulls - handleNulls=zero"/>

<h2>Area Chart</h2>
<AreaChart data={full}  title="Full Data" line=false/>
<AreaChart data={missingX}  title="Missing X"/>
<AreaChart data={nulls} handleNulls=gaps title="Nulls - handleNulls=gaps (default)"/>
<AreaChart data={nulls} handleNulls=connect title="Nulls - handleNulls=connect"/>
<AreaChart data={nulls} handleNulls=zero title="Nulls - handleNulls=zero"/>

<h2>Bar Chart</h2>
<BarChart data={full}  title="Full Data"/>
<BarChart data={missingX}  title="Missing X"/>
<BarChart data={nulls}  title="Nulls"/>

<h2>Horizontal Bar Chart</h2>
<BarChart data={full}  title="Full Data" swapXY=true/>
<BarChart data={missingX}  title="Missing X" swapXY=true/>
<BarChart data={nulls}  title="Nulls" swapXY=true/>

<h2>Scatter Plot</h2>
<ScatterPlot data={full}  title="Full Data"/>
<ScatterPlot data={missingX}  title="Missing X"/>
<ScatterPlot data={nulls}  title="Nulls - handleNulls=none (default)"/>
<ScatterPlot data={nulls}  title="Nulls - handleNulls=zero" handleNulls=zero/>

<h2>Bubble Chart</h2>
<BubbleChart data={full} size=y y=y title="Full Data"/>
<BubbleChart data={missingX}  size=y y=y title="Missing X"/>
<BubbleChart data={nulls}  size=y y=y title="Nulls - handleNulls=none (default)"/>
<BubbleChart data={nulls} size=y y=y title="Nulls - handleNulls=zero" handleNulls=zero/>
