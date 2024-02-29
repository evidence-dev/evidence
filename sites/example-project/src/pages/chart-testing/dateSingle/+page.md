<script>

let full = 
[
    {year: '1985-01-01', value: 302},
    {year: '1986-01-01', value: 375},
    {year: '1987-01-01', value: 336},
    {year: '1988-01-01', value: 579},
    {year: '1989-01-01', value: 443},
    {year: '1990-01-01', value: 598},
    {year: '1991-01-01', value: 303},
    {year: '1992-01-01', value: 587},
    {year: '1993-01-01', value: 305},
    {year: '1994-01-01', value: 262},
    {year: '1995-01-01', value: 399},
    {year: '1996-01-01', value: 406}
]

let missingX =
[
    {year: '1985-01-01', value: 302},
    {year: '1986-01-01', value: 375},
    {year: '1987-01-01', value: 336},
    {year: '1988-01-01', value: 579},
    {year: '1990-01-01', value: 598},
    {year: '1991-01-01', value: 303},
    {year: '1992-01-01', value: 587},
    {year: '1993-01-01', value: 305},
    {year: '1994-01-01', value: 262},
    {year: '1995-01-01', value: 399},
    {year: '1996-01-01', value: 406}
]

let nulls =
[
    {year: '1985-01-01', value: 302},
    {year: '1986-01-01', value: 375},
    {year: '1987-01-01', value: 336},
    {year: '1988-01-01', value: 579},
    {year: '1989-01-01', value: null},
    {year: '1990-01-01', value: 598},
    {year: '1991-01-01', value: 303},
    {year: '1992-01-01', value: null},
    {year: '1993-01-01', value: 305},
    {year: '1994-01-01', value: 262},
    {year: '1995-01-01', value: 399},
    {year: '1996-01-01', value: 406}
]

 </script>

<h1>Series Column with Date X Axis</h1>
<h2>Line Chart</h2>
<LineChart data={full} title="Full Data"/>
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

<h2>Horizontal Bar Chart</h2>
<BarChart data={full}  x=year title="Full Data" swapXY=true/>
<BarChart data={missingX}  x=year y=value title="Missing X" swapXY=true/>
<BarChart data={nulls}  title="Nulls" swapXY=true/>

<h2>Scatter Plot</h2>
<ScatterPlot data={full}  title="Full Data"/>
<ScatterPlot data={missingX} title="Missing X"/>
<ScatterPlot data={nulls}  title="Nulls"/>

<h2>Bubble Chart</h2>
<BubbleChart data={full} size=value y=value  title="Full Data"/>
<BubbleChart data={missingX}  size=value y=value  title="Missing X"/>
<BubbleChart data={nulls}  size=value y=value  title="Nulls"/>
