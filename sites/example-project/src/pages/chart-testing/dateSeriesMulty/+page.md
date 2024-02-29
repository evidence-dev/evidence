<script>

let full = 
[
    {date: '1900-01-01', series: 'A', y1: 103, y2: 135, y3: 88},
    {date: '1900-01-01', series: 'B', y1: 240, y2: 299, y3: 201},
    {date: '1900-01-01', series: 'C', y1: 361, y2: 318, y3: 314},
    {date: '1901-01-01', series: 'A', y1: 105, y2: 138, y3: 93},
    {date: '1901-01-01', series: 'B', y1: 298, y2: 215, y3: 277},
    {date: '1901-01-01', series: 'C', y1: 394, y2: 306, y3: 348},
    {date: '1902-01-01', series: 'A', y1: 106, y2: 132, y3: 103},
    {date: '1902-01-01', series: 'B', y1: 209, y2: 282, y3: 227},
    {date: '1902-01-01', series: 'C', y1: 384, y2: 367, y3: 312},
    {date: '1903-01-01', series: 'A', y1: 108, y2: 130, y3: 105},
    {date: '1903-01-01', series: 'B', y1: 296, y2: 274, y3: 259},
    {date: '1903-01-01', series: 'C', y1: 330, y2: 301, y3: 338},
    {date: '1904-01-01', series: 'A', y1: 109, y2: 128, y3: 102},
    {date: '1904-01-01', series: 'B', y1: 280, y2: 266, y3: 293},
    {date: '1904-01-01', series: 'C', y1: 332, y2: 342, y3: 343},
    {date: '1905-01-01', series: 'A', y1: 111, y2: 124, y3: 101},
    {date: '1905-01-01', series: 'B', y1: 218, y2: 288, y3: 204},
    {date: '1905-01-01', series: 'C', y1: 318, y2: 375, y3: 313},
    {date: '1906-01-01', series: 'A', y1: 120, y2: 122, y3: 100},
    {date: '1906-01-01', series: 'B', y1: 261, y2: 275, y3: 265},
    {date: '1906-01-01', series: 'C', y1: 332, y2: 397, y3: 388},
    {date: '1907-01-01', series: 'A', y1: 133, y2: 131, y3: 100},
    {date: '1907-01-01', series: 'B', y1: 285, y2: 259, y3: 229},
    {date: '1907-01-01', series: 'C', y1: 334, y2: 390, y3: 372},
    {date: '1908-01-01', series: 'A', y1: 142, y2: 128, y3: 99},
    {date: '1908-01-01', series: 'B', y1: 257, y2: 219, y3: 235},
    {date: '1908-01-01', series: 'C', y1: 350, y2: 388, y3: 364},
    {date: '1909-01-01', series: 'A', y1: 156, y2: 135, y3: 97},
    {date: '1909-01-01', series: 'B', y1: 228, y2: 275, y3: 299},
    {date: '1909-01-01', series: 'C', y1: 321, y2: 352, y3: 359},
    {date: '1910-01-01', series: 'A', y1: 168, y2: 137, y3: 95},
    {date: '1910-01-01', series: 'B', y1: 212, y2: 216, y3: 270},
    {date: '1910-01-01', series: 'C', y1: 400, y2: 340, y3: 400}
]

let missingY = 
[ // remove B in 1905
    {date: '1900-01-01', series: 'A', y1: 103, y2: 135, y3: 88},
    {date: '1900-01-01', series: 'B', y1: 240, y2: 299, y3: 201},
    {date: '1900-01-01', series: 'C', y1: 361, y2: 318, y3: 314},
    {date: '1901-01-01', series: 'A', y1: 105, y2: 138, y3: 93},
    {date: '1901-01-01', series: 'B', y1: 298, y2: 215, y3: 277},
    {date: '1901-01-01', series: 'C', y1: 394, y2: 306, y3: 348},
    {date: '1902-01-01', series: 'A', y1: 106, y2: 132, y3: 103},
    {date: '1902-01-01', series: 'B', y1: 209, y2: 282, y3: 227},
    {date: '1902-01-01', series: 'C', y1: 384, y2: 367, y3: 312},
    {date: '1903-01-01', series: 'A', y1: 108, y2: 130, y3: 105},
    {date: '1903-01-01', series: 'B', y1: 296, y2: 274, y3: 259},
    {date: '1903-01-01', series: 'C', y1: 330, y2: 301, y3: 338},
    {date: '1904-01-01', series: 'A', y1: 109, y2: 128, y3: 102},
    {date: '1904-01-01', series: 'B', y1: 280, y2: 266, y3: 293},
    {date: '1904-01-01', series: 'C', y1: 332, y2: 342, y3: 343},
    {date: '1905-01-01', series: 'A', y1: 111, y2: 124, y3: 101},
    {date: '1905-01-01', series: 'C', y1: 318, y2: 375, y3: 313},
    {date: '1906-01-01', series: 'A', y1: 120, y2: 122, y3: 100},
    {date: '1906-01-01', series: 'B', y1: 261, y2: 275, y3: 265},
    {date: '1906-01-01', series: 'C', y1: 332, y2: 397, y3: 388},
    {date: '1907-01-01', series: 'A', y1: 133, y2: 131, y3: 100},
    {date: '1907-01-01', series: 'B', y1: 285, y2: 259, y3: 229},
    {date: '1907-01-01', series: 'C', y1: 334, y2: 390, y3: 372},
    {date: '1908-01-01', series: 'A', y1: 142, y2: 128, y3: 99},
    {date: '1908-01-01', series: 'B', y1: 257, y2: 219, y3: 235},
    {date: '1908-01-01', series: 'C', y1: 350, y2: 388, y3: 364},
    {date: '1909-01-01', series: 'A', y1: 156, y2: 135, y3: 97},
    {date: '1909-01-01', series: 'B', y1: 228, y2: 275, y3: 299},
    {date: '1909-01-01', series: 'C', y1: 321, y2: 352, y3: 359},
    {date: '1910-01-01', series: 'A', y1: 168, y2: 137, y3: 95},
    {date: '1910-01-01', series: 'B', y1: 212, y2: 216, y3: 270},
    {date: '1910-01-01', series: 'C', y1: 400, y2: 340, y3: 400}
]

let missingX =
[ // remove 1906
    {date: '1900-01-01', series: 'A', y1: 103, y2: 135, y3: 88},
    {date: '1900-01-01', series: 'B', y1: 240, y2: 299, y3: 201},
    {date: '1900-01-01', series: 'C', y1: 361, y2: 318, y3: 314},
    {date: '1901-01-01', series: 'A', y1: 105, y2: 138, y3: 93},
    {date: '1901-01-01', series: 'B', y1: 298, y2: 215, y3: 277},
    {date: '1901-01-01', series: 'C', y1: 394, y2: 306, y3: 348},
    {date: '1902-01-01', series: 'A', y1: 106, y2: 132, y3: 103},
    {date: '1902-01-01', series: 'B', y1: 209, y2: 282, y3: 227},
    {date: '1902-01-01', series: 'C', y1: 384, y2: 367, y3: 312},
    {date: '1903-01-01', series: 'A', y1: 108, y2: 130, y3: 105},
    {date: '1903-01-01', series: 'B', y1: 296, y2: 274, y3: 259},
    {date: '1903-01-01', series: 'C', y1: 330, y2: 301, y3: 338},
    {date: '1904-01-01', series: 'A', y1: 109, y2: 128, y3: 102},
    {date: '1904-01-01', series: 'B', y1: 280, y2: 266, y3: 293},
    {date: '1904-01-01', series: 'C', y1: 332, y2: 342, y3: 343},
    {date: '1905-01-01', series: 'A', y1: 111, y2: 124, y3: 101},
    {date: '1905-01-01', series: 'B', y1: 218, y2: 288, y3: 204},
    {date: '1905-01-01', series: 'C', y1: 318, y2: 375, y3: 313},
    {date: '1907-01-01', series: 'A', y1: 133, y2: 131, y3: 100},
    {date: '1907-01-01', series: 'B', y1: 285, y2: 259, y3: 229},
    {date: '1907-01-01', series: 'C', y1: 334, y2: 390, y3: 372},
    {date: '1908-01-01', series: 'A', y1: 142, y2: 128, y3: 99},
    {date: '1908-01-01', series: 'B', y1: 257, y2: 219, y3: 235},
    {date: '1908-01-01', series: 'C', y1: 350, y2: 388, y3: 364},
    {date: '1909-01-01', series: 'A', y1: 156, y2: 135, y3: 97},
    {date: '1909-01-01', series: 'B', y1: 228, y2: 275, y3: 299},
    {date: '1909-01-01', series: 'C', y1: 321, y2: 352, y3: 359},
    {date: '1910-01-01', series: 'A', y1: 168, y2: 137, y3: 95},
    {date: '1910-01-01', series: 'B', y1: 212, y2: 216, y3: 270},
    {date: '1910-01-01', series: 'C', y1: 400, y2: 340, y3: 400}
]

let xSync = 
[ // change B 1905 to Feb 12
    {date: '1900-01-01', series: 'A', y1: 103, y2: 135, y3: 88},
    {date: '1900-01-01', series: 'B', y1: 240, y2: 299, y3: 201},
    {date: '1900-01-01', series: 'C', y1: 361, y2: 318, y3: 314},
    {date: '1901-01-01', series: 'A', y1: 105, y2: 138, y3: 93},
    {date: '1901-01-01', series: 'B', y1: 298, y2: 215, y3: 277},
    {date: '1901-01-01', series: 'C', y1: 394, y2: 306, y3: 348},
    {date: '1902-01-01', series: 'A', y1: 106, y2: 132, y3: 103},
    {date: '1902-01-01', series: 'B', y1: 209, y2: 282, y3: 227},
    {date: '1902-01-01', series: 'C', y1: 384, y2: 367, y3: 312},
    {date: '1903-01-01', series: 'A', y1: 108, y2: 130, y3: 105},
    {date: '1903-01-01', series: 'B', y1: 296, y2: 274, y3: 259},
    {date: '1903-01-01', series: 'C', y1: 330, y2: 301, y3: 338},
    {date: '1904-01-01', series: 'A', y1: 109, y2: 128, y3: 102},
    {date: '1904-01-01', series: 'B', y1: 280, y2: 266, y3: 293},
    {date: '1904-01-01', series: 'C', y1: 332, y2: 342, y3: 343},
    {date: '1905-01-01', series: 'A', y1: 111, y2: 124, y3: 101},
    {date: '1905-02-12', series: 'B', y1: 218, y2: 288, y3: 204},
    {date: '1905-01-01', series: 'C', y1: 318, y2: 375, y3: 313},
    {date: '1906-01-01', series: 'A', y1: 120, y2: 122, y3: 100},
    {date: '1906-01-01', series: 'B', y1: 261, y2: 275, y3: 265},
    {date: '1906-01-01', series: 'C', y1: 332, y2: 397, y3: 388},
    {date: '1907-01-01', series: 'A', y1: 133, y2: 131, y3: 100},
    {date: '1907-01-01', series: 'B', y1: 285, y2: 259, y3: 229},
    {date: '1907-01-01', series: 'C', y1: 334, y2: 390, y3: 372},
    {date: '1908-01-01', series: 'A', y1: 142, y2: 128, y3: 99},
    {date: '1908-01-01', series: 'B', y1: 257, y2: 219, y3: 235},
    {date: '1908-01-01', series: 'C', y1: 350, y2: 388, y3: 364},
    {date: '1909-01-01', series: 'A', y1: 156, y2: 135, y3: 97},
    {date: '1909-01-01', series: 'B', y1: 228, y2: 275, y3: 299},
    {date: '1909-01-01', series: 'C', y1: 321, y2: 352, y3: 359},
    {date: '1910-01-01', series: 'A', y1: 168, y2: 137, y3: 95},
    {date: '1910-01-01', series: 'B', y1: 212, y2: 216, y3: 270},
    {date: '1910-01-01', series: 'C', y1: 400, y2: 340, y3: 400}
]

let nulls =
[
    {date: '1900-01-01', series: 'A', y1: 103, y2: 135, y3: 88},
    {date: '1900-01-01', series: 'B', y1: 240, y2: 299, y3: 201},
    {date: '1900-01-01', series: 'C', y1: 361, y2: 318, y3: 314},
    {date: '1901-01-01', series: 'A', y1: 105, y2: 138, y3: 93},
    {date: '1901-01-01', series: 'B', y1: 298, y2: 215, y3: 277},
    {date: '1901-01-01', series: 'C', y1: 394, y2: 306, y3: 348},
    {date: '1902-01-01', series: 'A', y1: 106, y2: 132, y3: 103},
    {date: '1902-01-01', series: 'B', y1: 209, y2: null, y3: 227},
    {date: '1902-01-01', series: 'C', y1: 384, y2: 367, y3: 312},
    {date: '1903-01-01', series: 'A', y1: 108, y2: 130, y3: 105},
    {date: '1903-01-01', series: 'B', y1: 296, y2: 274, y3: 259},
    {date: '1903-01-01', series: 'C', y1: 330, y2: 301, y3: 338},
    {date: '1904-01-01', series: 'A', y1: 109, y2: 128, y3: 102},
    {date: '1904-01-01', series: 'B', y1: null, y2: 266, y3: 293},
    {date: '1904-01-01', series: 'C', y1: 332, y2: 342, y3: 343},
    {date: '1905-01-01', series: 'A', y1: 111, y2: 124, y3: 101},
    {date: '1905-01-01', series: 'B', y1: 218, y2: 288, y3: 204},
    {date: '1905-01-01', series: 'C', y1: 318, y2: 375, y3: 313},
    {date: '1906-01-01', series: 'A', y1: 120, y2: 122, y3: 100},
    {date: '1906-01-01', series: 'B', y1: 261, y2: 275, y3: 265},
    {date: '1906-01-01', series: 'C', y1: 332, y2: 397, y3: 388},
    {date: '1907-01-01', series: 'A', y1: 133, y2: 131, y3: 100},
    {date: '1907-01-01', series: 'B', y1: 285, y2: 259, y3: 229},
    {date: '1907-01-01', series: 'C', y1: 334, y2: 390, y3: 372},
    {date: '1908-01-01', series: 'A', y1: 142, y2: 128, y3: 99},
    {date: '1908-01-01', series: 'B', y1: 257, y2: 219, y3: 235},
    {date: '1908-01-01', series: 'C', y1: 350, y2: 388, y3: 364},
    {date: '1909-01-01', series: 'A', y1: 156, y2: 135, y3: null},
    {date: '1909-01-01', series: 'B', y1: 228, y2: 275, y3: 299},
    {date: '1909-01-01', series: 'C', y1: 321, y2: 352, y3: 359},
    {date: '1910-01-01', series: 'A', y1: 168, y2: 137, y3: 95},
    {date: '1910-01-01', series: 'B', y1: 212, y2: 216, y3: 270},
    {date: '1910-01-01', series: 'C', y1: 400, y2: 340, y3: 400}
]


 </script>

<h1>Series Column with Date X Axis</h1>
<h2>Line Chart</h2>
<LineChart data={full} series=series title="Full Data"/>
<LineChart data={missingX} series=series title="Missing X"/>
<LineChart data={missingY} series=series title="Missing Y"/>
<LineChart data={nulls}  series=series title="Nulls"/>

<h2>Area Chart</h2>
<AreaChart data={full}  series=series title="Full Data"/>
<AreaChart data={missingX}  series=series title="Missing X"/>
<AreaChart data={missingY} series=series title="Missing Y"/>
<AreaChart data={nulls}  series=series title="Nulls"/>

<h2>100% Stacked Area Chart</h2>
<AreaChart data={full}  series=series title="Full Data" type=stacked100/>
<AreaChart data={missingX}  series=series title="Missing X" type=stacked100/>
<AreaChart data={missingY} series=series title="Missing Y" type=stacked100/>
<AreaChart data={nulls}  series=series title="Nulls" type=stacked100/>

<h2>Stacked Bar Chart</h2>
<BarChart data={full}  series=series title="Full Data" />
<BarChart data={missingX}  series=series title="Missing X"/>
<BarChart data={missingY} series=series title="Missing Y"/>
<BarChart data={nulls}  series=series title="Nulls"/>

<h2>100% Stacked Bar Chart</h2>
<BarChart data={full}  series=series title="Full Data" type=stacked100/>
<BarChart data={missingX}  series=series title="Missing X" type=stacked10/>
<BarChart data={missingY} series=series title="Missing Y" type=stacked10/>
<BarChart data={nulls}  series=series title="Nulls" type=stacked10/>

<!-- <h2>horizontal Stacked Bar Chart</h2>
<BarChart data={full}  swapXY=true series=series title="Full Data" xType=value/>
<BarChart data={missingY}  swapXY=true series=series title="Missing Y"/>
<BarChart data={missingX}  swapXY=true series=series title="Missing X"/>
<BarChart data={xSync}  swapXY=true series=series title="X out of sync"/>
<BarChart data={nulls}  swapXY=true series=series title="Nulls"/> -->

<h2>Grouped Bar Chart</h2>
<BarChart data={full}  type=grouped series=series title="Full Data"/>
<BarChart data={missingX}  type=grouped series=series title="Missing X"/>
<BarChart data={missingY} type=grouped series=series title="Missing Y"/>
<BarChart data={nulls}  type=grouped series=series title="Nulls"/>

<!-- <h2>horizontal Grouped Bar Chart</h2>
<BarChart data={full}  swapXY=true type=grouped series=series title="Full Data"/>
<BarChart data={missingY}  swapXY=true type=grouped series=series title="Missing Y"/>
<BarChart data={missingX}  swapXY=true type=grouped series=series title="Missing X"/>
<BarChart data={xSync}  swapXY=true type=grouped series=series title="X out of sync"/>
<BarChart data={nulls}  swapXY=true type=grouped series=series title="Nulls"/> -->

<h2>Scatter Plot</h2>
<ScatterPlot data={full}  series=series title="Full Data"/>
<ScatterPlot data={missingX}  series=series title="Missing X"/>
<ScatterPlot data={missingY} series=series title="Missing Y"/>
<ScatterPlot data={nulls}  series=series title="Nulls"/>

<h2>Bubble Chart</h2>
<BubbleChart data={full} size=y1 series=series title="Full Data"/>
<BubbleChart data={missingX}  size=y1 series=series title="Missing X" legend=true/>
<BubbleChart data={missingY} size=y1 series=series title="Missing Y" legend=true/>
<BubbleChart data={nulls}  size=y1 series=series title="Nulls"/>
