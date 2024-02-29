<script>


let full = 
[
    {x: "1900", series: 'A', y1: 103, y2: 135, y3: 88},
    {x: "1900", series: 'B', y1: 240, y2: 299, y3: 201},
    {x: "1900", series: 'C', y1: 361, y2: 318, y3: 314},
    {x: "1901", series: 'A', y1: 105, y2: 138, y3: 93},
    {x: "1901", series: 'B', y1: 298, y2: 215, y3: 277},
    {x: "1901", series: 'C', y1: 394, y2: 306, y3: 348},
    {x: "1902", series: 'A', y1: 106, y2: 132, y3: 103},
    {x: "1902", series: 'B', y1: 209, y2: 282, y3: 227},
    {x: "1902", series: 'C', y1: 384, y2: 367, y3: 312},
    {x: "1903", series: 'A', y1: 108, y2: 130, y3: 105},
    {x: "1903", series: 'B', y1: 296, y2: 274, y3: 259},
    {x: "1903", series: 'C', y1: 330, y2: 301, y3: 338},
    {x: "1904", series: 'A', y1: 109, y2: 128, y3: 102},
    {x: "1904", series: 'B', y1: 280, y2: 266, y3: 293},
    {x: "1904", series: 'C', y1: 332, y2: 342, y3: 343},
    {x: "1905", series: 'A', y1: 111, y2: 124, y3: 101},
    {x: "1905", series: 'B', y1: 218, y2: 288, y3: 204},
    {x: "1905", series: 'C', y1: 318, y2: 375, y3: 313},
    {x: "1906", series: 'A', y1: 120, y2: 122, y3: 100},
    {x: "1906", series: 'B', y1: 261, y2: 275, y3: 265},
    {x: "1906", series: 'C', y1: 332, y2: 397, y3: 388},
    {x: "1907", series: 'A', y1: 133, y2: 131, y3: 100},
    {x: "1907", series: 'B', y1: 285, y2: 259, y3: 229},
    {x: "1907", series: 'C', y1: 334, y2: 390, y3: 372},
    {x: "1908", series: 'A', y1: 142, y2: 128, y3: 99},
    {x: "1908", series: 'B', y1: 257, y2: 219, y3: 235},
    {x: "1908", series: 'C', y1: 350, y2: 388, y3: 364},
    {x: "1909", series: 'A', y1: 156, y2: 135, y3: 97},
    {x: "1909", series: 'B', y1: 228, y2: 275, y3: 299},
    {x: "1909", series: 'C', y1: 321, y2: 352, y3: 359},
    {x: "1910", series: 'A', y1: 168, y2: 137, y3: 95},
    {x: "1910", series: 'B', y1: 212, y2: 216, y3: 270},
    {x: "1910", series: 'C', y1: 400, y2: 340, y3: 400}
]

let missingY = 
[ // remove B 1902
    {x: "1900", series: 'A', y1: 103, y2: 135, y3: 88},
    {x: "1900", series: 'B', y1: 240, y2: 299, y3: 201},
    {x: "1900", series: 'C', y1: 361, y2: 318, y3: 314},
    {x: "1901", series: 'A', y1: 105, y2: 138, y3: 93},
    {x: "1901", series: 'B', y1: 298, y2: 215, y3: 277},
    {x: "1901", series: 'C', y1: 394, y2: 306, y3: 348},
    {x: "1902", series: 'A', y1: 106, y2: 132, y3: 103},
    {x: "1902", series: 'C', y1: 384, y2: 367, y3: 312},
    {x: "1903", series: 'A', y1: 108, y2: 130, y3: 105},
    {x: "1903", series: 'B', y1: 296, y2: 274, y3: 259},
    {x: "1903", series: 'C', y1: 330, y2: 301, y3: 338},
    {x: "1904", series: 'A', y1: 109, y2: 128, y3: 102},
    {x: "1904", series: 'B', y1: 280, y2: 266, y3: 293},
    {x: "1904", series: 'C', y1: 332, y2: 342, y3: 343},
    {x: "1905", series: 'A', y1: 111, y2: 124, y3: 101},
    {x: "1905", series: 'B', y1: 218, y2: 288, y3: 204},
    {x: "1905", series: 'C', y1: 318, y2: 375, y3: 313},
    {x: "1906", series: 'A', y1: 120, y2: 122, y3: 100},
    {x: "1906", series: 'B', y1: 261, y2: 275, y3: 265},
    {x: "1906", series: 'C', y1: 332, y2: 397, y3: 388},
    {x: "1907", series: 'A', y1: 133, y2: 131, y3: 100},
    {x: "1907", series: 'B', y1: 285, y2: 259, y3: 229},
    {x: "1907", series: 'C', y1: 334, y2: 390, y3: 372},
    {x: "1908", series: 'A', y1: 142, y2: 128, y3: 99},
    {x: "1908", series: 'B', y1: 257, y2: 219, y3: 235},
    {x: "1908", series: 'C', y1: 350, y2: 388, y3: 364},
    {x: "1909", series: 'A', y1: 156, y2: 135, y3: 97},
    {x: "1909", series: 'B', y1: 228, y2: 275, y3: 299},
    {x: "1909", series: 'C', y1: 321, y2: 352, y3: 359},
    {x: "1910", series: 'A', y1: 168, y2: 137, y3: 95},
    {x: "1910", series: 'B', y1: 212, y2: 216, y3: 270},
    {x: "1910", series: 'C', y1: 400, y2: 340, y3: 400}
]

let nulls =
[
    {x: "1900", series: 'A', y1: 103, y2: 135, y3: 88},
    {x: "1900", series: 'B', y1: 240, y2: 299, y3: 201},
    {x: "1900", series: 'C', y1: 361, y2: 318, y3: 314},
    {x: "1901", series: 'A', y1: 105, y2: 138, y3: 93},
    {x: "1901", series: 'B', y1: 298, y2: 215, y3: 277},
    {x: "1901", series: 'C', y1: 394, y2: 306, y3: 348},
    {x: "1902", series: 'A', y1: null, y2: 132, y3: 103},
    {x: "1902", series: 'B', y1: 209, y2: 282, y3: 227},
    {x: "1902", series: 'C', y1: 384, y2: 367, y3: 312},
    {x: "1903", series: 'A', y1: 108, y2: 130, y3: 105},
    {x: "1903", series: 'B', y1: 296, y2: 274, y3: 259},
    {x: "1903", series: 'C', y1: 330, y2: 301, y3: 338},
    {x: "1904", series: 'A', y1: 109, y2: 128, y3: 102},
    {x: "1904", series: 'B', y1: 280, y2: 266, y3: 293},
    {x: "1904", series: 'C', y1: 332, y2: null, y3: 343},
    {x: "1905", series: 'A', y1: 111, y2: 124, y3: 101},
    {x: "1905", series: 'B', y1: 218, y2: 288, y3: 204},
    {x: "1905", series: 'C', y1: 318, y2: 375, y3: 313},
    {x: "1906", series: 'A', y1: 120, y2: 122, y3: 100},
    {x: "1906", series: 'B', y1: 261, y2: 275, y3: 265},
    {x: "1906", series: 'C', y1: 332, y2: 397, y3: 388},
    {x: "1907", series: 'A', y1: 133, y2: 131, y3: 100},
    {x: "1907", series: 'B', y1: 285, y2: 259, y3: 229},
    {x: "1907", series: 'C', y1: 334, y2: 390, y3: 372},
    {x: "1908", series: 'A', y1: 142, y2: 128, y3: 99},
    {x: "1908", series: 'B', y1: 257, y2: 219, y3: null},
    {x: "1908", series: 'C', y1: 350, y2: 388, y3: 364},
    {x: "1909", series: 'A', y1: 156, y2: 135, y3: 97},
    {x: "1909", series: 'B', y1: 228, y2: 275, y3: 299},
    {x: "1909", series: 'C', y1: 321, y2: 352, y3: 359},
    {x: "1910", series: 'A', y1: 168, y2: 137, y3: 95},
    {x: "1910", series: 'B', y1: 212, y2: 216, y3: 270},
    {x: "1910", series: 'C', y1: 400, y2: 340, y3: 400}
]



 </script>

<h1>Series Column with String X Axis</h1>
<h2>Line Chart</h2>
<LineChart data={full} series=series title="Full Data"/>
<LineChart data={missingY} series=series title="Missing Y"/>
<LineChart data={nulls}  series=series title="Nulls"/>

<h2>Area Chart</h2>
<AreaChart data={full}  series=series title="Full Data"/>
<AreaChart data={missingY} series=series title="Missing Y"/>
<AreaChart data={nulls}  series=series title="Nulls"/>

<h2>100% Area Chart</h2>
<AreaChart data={full}  series=series title="Full Data" type=stacked100/>
<AreaChart data={missingY} series=series title="Missing Y" type=stacked100/>
<AreaChart data={nulls}  series=series title="Nulls" type=stacked100/>

<h2>Stacked Bar Chart</h2>
<BarChart data={full}  series=series title="Full Data"/>
<BarChart data={missingY} series=series title="Missing Y"/>
<BarChart data={nulls}  series=series title="Nulls"/>

<h2>100% Stacked Bar Chart</h2>
<BarChart data={full}  series=series title="Full Data" type=stacked100/>
<BarChart data={missingY} series=series title="Missing Y" type=stacked100/>
<BarChart data={nulls}  series=series title="Nulls" type=stacked100/>

<h2>Horizontal Stacked Bar Chart</h2>
<BarChart data={full}  swapXY=true series=series title="Full Data" xType=value/>
<BarChart data={missingY}  swapXY=true series=series title="Missing Y"/>
<BarChart data={nulls}  swapXY=true series=series title="Nulls"/>

<h2>100% Horizontal Stacked Bar Chart</h2>
<BarChart data={full}  swapXY=true series=series title="Full Data" xType=value type=stacked100/>
<BarChart data={missingY}  swapXY=true series=series title="Missing Y" type=stacked100/>
<BarChart data={nulls}  swapXY=true series=series title="Nulls" type=stacked100/>

<h2>Grouped Bar Chart</h2>
<BarChart data={full}  type=grouped series=series title="Full Data"/>
<BarChart data={missingY} type=grouped series=series title="Missing Y"/>
<BarChart data={nulls}  type=grouped series=series title="Nulls"/>

<h2>Horizontal Grouped Bar Chart</h2>
<BarChart data={full}  swapXY=true type=grouped series=series title="Full Data"/>
<BarChart data={missingY}  swapXY=true type=grouped series=series title="Missing Y"/>
<BarChart data={nulls}  swapXY=true type=grouped series=series title="Nulls"/>

<h2>Scatter Plot</h2>
<ScatterPlot data={full}  series=series title="Full Data"/>
<ScatterPlot data={missingY} series=series title="Missing Y"/>
<ScatterPlot data={nulls}  series=series title="Nulls"/>

<h2>Bubble Chart</h2>
<BubbleChart data={full} size=y1 series=series title="Full Data"/>
<BubbleChart data={missingY}  size=y1 series=series title="Missing Y" legend=true/>
<BubbleChart data={nulls}  size=y1 series=series title="Nulls"/>
