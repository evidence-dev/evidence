---
sidebar_position: 13
title: Reference Area
hide_table_of_contents: false
---

Reference areas allow you to add highlighted ranges to a chart. These ranges can be:
- Along the x-axis (e.g., recession date ranges)
- Along the y-axis (e.g., control threshold for a metric)
- Both (e.g, highlighting a specific series of points in the middle of the chart)

Reference areas can be produced by defining the x and y-axis values inline (e.g., `xMin='2020-03-14' xMax='2020-06-30'`) or by supplying a dataset (e.g., `start_date`, `end_date`, `name`).

When a dataset is provided, `ReferenceArea` can generate multiple areas - one for each row in the dataset. 

## Examples

### X-axis Defined Inline
<img src="/img/refarea-x-multi.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceArea xMin='2020-03-14' xMax='2020-08-15' label=First color=yellow/>
    <ReferenceArea xMin='2021-03-14' xMax='2021-08-15' label=Second/>
</LineChart>
```

### Y-axis Defined Inline
<img src="/img/refarea-y-ranges.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=num_orders_num0 yAxisTitle="Orders per Month">
    <ReferenceArea yMin=2500 color=green label="Good"/>
    <ReferenceArea yMin=1000 yMax=2500 color=yellow label="Okay"/>
    <ReferenceArea yMin=0 yMax=1000 color=red label="Bad"/>
</LineChart>
```

### X-axis from Data
<img src="/img/refarea-x-multi-data.png"  width='600px'/>

```html
<LineChart data={query_name} x=column_x y=column_y>
    <ReferenceArea data={campaigns} xMin=start_date xMax=end_date label=campaign_name/>
</LineChart>
```

### Bar Chart
<img src="/img/refarea-bar.png"  width='600px'/>

```html
<BarChart data={orders_by_category_2021} x=month y=sales_usd0k series=category>
    <ReferenceArea xMin='2021-01-01' xMax='2021-04-01'/>
</BarChart> 
```

#### Continuous Axis Bar Charts
On a continous x-axis (dates or numbers), the reference area will start and stop at the exact point on the x-axis. This means it will appear in the middle of whichever bar is at that point. If you would prefer to see the area cover the full bar, there are 2 ways to achieve this:
1. Add a buffer on either side of the range you want to highlight (e.g., instead of ending the area at `2020-07-01`, end it at `2020-07-15`)
2. Change your x-axis to categorical data (using `xType=category`). If using a date axis, you may also want to retain the axis label formatting for dates - to achieve this, you can use a format tag for your x-axis column (e.g., `x=date_mmm`)

### Reference Area Box
<img src="/img/refarea-box.png"  width='600px'/>

```html
<ScatterPlot data={countries} x=gdp_usd y=gdp_growth_pct1 tooltipTitle=country series=continent>
    <ReferenceArea xMin=16000 xMax=24000 yMin=-0.03 yMax=0.055 label="Large and stagnant" color=grey border=true/>
</ScatterPlot>
```

### Labels
<img src="/img/refarea-label-positions.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=topLeft labelPosition=topLeft/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=top labelPosition=top/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=topRight labelPosition=topRight/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=left labelPosition=left/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=center labelPosition=center/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=right labelPosition=right/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottomLeft labelPosition=bottomLeft/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottom labelPosition=bottom/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottomRight labelPosition=bottomRight/>
</LineChart>
```

#### Label Overlaps
Reference areas appear behind chart gridlines, including reference area labels. If you are seeing an overlap between the gridlines and the reference area label, you can avoi this by turning gridlines off (`yGridlines=false`).

### Colours
<img src="/img/refarea-colors.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k >
    <ReferenceArea xMax='2019-04-01' label=blue color=blue/>
    <ReferenceArea xMin='2019-04-01' xMax='2019-11-01' label=red color=red/>
    <ReferenceArea xMin='2019-11-01' xMax='2020-07-01' label=yellow color=yellow/>
    <ReferenceArea xMin='2020-07-01' xMax='2021-02-01' label=green color=green/>
    <ReferenceArea xMin='2021-02-01' xMax='2021-09-01' label=grey color=grey/>
    <ReferenceArea xMin='2021-09-01' label=custom color=#f2dbff labelColor=#4d1070/>
</LineChart>
```


## Props
A reference area can be produced by defining values inline or by supplying a dataset, and the required props are different for each of those cases.

### Option 1: Defining Values Inline

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>xMin</td>	<td>x-axis value where area should start. If left out, range will extend to the start of the x-axis.</td>	<td class='tcenter'>At least 1 of xMin, xMax, yMin, or yMax required</td>	<td class='tcenter'>number | string | date</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>xMax</td>	<td>x-axis value where area should end. If left out, range will extend to the end of the x-axis.</td>	<td class='tcenter'>At least 1 of xMin, xMax, yMin, or yMax required</td>	<td class='tcenter'>number | string | date</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yMin</td>	<td>y-axis value where area should start. If left out, range will extend to the start of the y-axis.</td>	<td class='tcenter'>At least 1 of xMin, xMax, yMin, or yMax required</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yMax</td>	<td>y-axis value where area should end. If left out, range will extend to the end of the y-axis.</td>	<td class='tcenter'>At least 1 of xMin, xMax, yMin, or yMax required</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>label</td>	<td>Text to show as label for the area</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
</table>

### Option 2: Supplying a Dataset

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>xMin</td>	<td>Column containing x-axis values for area start. If left out, range will extend to the start of the x-axis.</td>	<td class='tcenter'>At least 1 of xMin, xMax, yMin, or yMax required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>xMax</td>	<td>Column containing x-axis values for area end. If left out, range will extend to the end of the x-axis.</td>	<td class='tcenter'>At least 1 of xMin, xMax, yMin, or yMax required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yMin</td>	<td>Column containing y-axis values for area start. If left out, range will extend to the start of the y-axis.</td>	<td class='tcenter'>At least 1 of xMin, xMax, yMin, or yMax required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yMax</td>	<td>Column containing y-axis values for area end. If left out, range will extend to the end of the y-axis.</td>	<td class='tcenter'>At least 1 of xMin, xMax, yMin, or yMax required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>label</td>	<td>Column containing a label to use for each area</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
</table>


### Styling

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>labelPosition</td>	<td>Where label will appear within the area</td>	<td class='tcenter'>-</td>	<td class='tcenter'>topLeft | top | topRight <br/> left | center | right <br/> bottomLeft | bottom | bottomRight</td>	<td class='tcenter'>topLeft</td>	</tr>
<tr>	<td>color</td>	<td>Color to override default area and label colors</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>labelColor</td>	<td>Color to override default label color. If used, takes precedence over `color`</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>border</td>	<td>Whether border should be shown</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>borderColor</td>	<td>Color to override default border color</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>borderType</td>	<td>Options to show breaks in a line (dashed or dotted)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>solid | dashed | dotted</td>	<td class='tcenter'>dashed</td>	</tr>
<tr>	<td>borderWidth</td>	<td>Thickness of line (in pixels)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>1</td>	</tr>
</table>
