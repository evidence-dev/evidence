---
sidebar_position: 13
title: Reference Area
hide_table_of_contents: false
---

Reference areas allow you to add highlighted ranges to a chart. These ranges can be:
- Along the x-axis (e.g., recession date ranges)
- Along the y-axis (e.g., control threshold for a metric)
- Both (e.g, highlighting a specific series of points in the middle of the chart)

Reference areas can be produced by hardcoding the x and y-axis values (e.g., `x1='2020-03-14' x2='2020-06-30'`) or by supplying a dataset (e.g., `start_date`, `end_date`, `name`).

When a dataset is provided, `ReferenceArea` can generate multiple areas - one for each row in the dataset. 

![line](/img/exg-line-nt.svg)

```markdown
<LineChart data={query_name} x=column_x y=column_y>
    <ReferenceLine y=2500 label="Target"/>
</LineChart>
```

## Examples

### Hardcoded Values

![line](/img/exg-line-nt.svg)

```markdown
<LineChart 
    data={daily_complaints} 
    x=date 
    y=number_of_complaints 
    yAxisTitle="calls to Austin 311 per day"
/>
```

### Values from Database

![multi-series-line](/img/exg-multi-series-line-nt.svg)

```markdown
<LineChart 
    data={daily_volume_yoy} 
    x=day_of_year 
    y=cum_vol 
    series=year 
    yAxisTitle="cumulative calls" 
    xAxisTitle="day of year"
/>
```

### Horizontal Charts

![multiple-y-line](/img/exg-multiple-y-line-nt.svg)

```markdown
<LineChart
data={fda_recalls}  
 x=year
y={["voluntary_recalls", "fda_recalls"]}
/>
```

### Custom Area Styling
![multiple-y-line](/img/exg-multiple-y-line-nt.svg)

```markdown
<LineChart
data={fda_recalls}  
 x=year
y={["voluntary_recalls", "fda_recalls"]}
/>
```

### Changing Label Position
![multiple-y-line](/img/exg-multiple-y-line-nt.svg)

```markdown
<LineChart
data={fda_recalls}  
 x=year
y={["voluntary_recalls", "fda_recalls"]}
/>
```

## Props
A reference area can be produced by hardcoding values or by supplying a dataset, and the required props are different for each of those cases.

### Option 1: Hardcoding Values

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>x1</td>	<td>x-axis value where area should start. If left out, range will extend to the start of the x-axis.</td>	<td class='tcenter'>At least 1 of x1, x2, y1, or y2 required</td>	<td class='tcenter'>number | string | date</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>x2</td>	<td>x-axis value where area should end. If left out, range will extend to the end of the x-axis.</td>	<td class='tcenter'>At least 1 of x1, x2, y1, or y2 required</td>	<td class='tcenter'>number | string | date</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>y1</td>	<td>y-axis value where area should start. If left out, range will extend to the start of the y-axis.</td>	<td class='tcenter'>At least 1 of x1, x2, y1, or y2 required</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>y2</td>	<td>y-axis value where area should end. If left out, range will extend to the end of the y-axis.</td>	<td class='tcenter'>At least 1 of x1, x2, y1, or y2 required</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>label</td>	<td>Text to show as label for the area</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
</table>

### Option 2: Supplying a Dataset

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>x1</td>	<td>Column containing x-axis values for area start. If left out, range will extend to the start of the x-axis.</td>	<td class='tcenter'>At least 1 of x1, x2, y1, or y2 required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>x2</td>	<td>Column containing x-axis values for area end. If left out, range will extend to the end of the x-axis.</td>	<td class='tcenter'>At least 1 of x1, x2, y1, or y2 required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>y1</td>	<td>Column containing y-axis values for area start. If left out, range will extend to the start of the y-axis.</td>	<td class='tcenter'>At least 1 of x1, x2, y1, or y2 required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>y2</td>	<td>Column containing y-axis values for area end. If left out, range will extend to the end of the y-axis.</td>	<td class='tcenter'>At least 1 of x1, x2, y1, or y2 required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
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
