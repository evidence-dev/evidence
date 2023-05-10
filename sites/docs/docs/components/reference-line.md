---
sidebar_position: 12
title: Reference Line
hide_table_of_contents: false
---

Reference lines allow you to add horizontal or vertical lines to a chart to provide additional context within the visualization. These lines can be produced by providing a specific value (`y=50` or `x='2020-03-14'`) or by providing a dataset (e.g., `date`, `event_name`).

When a dataset is provided, `ReferenceLine` can generate multiple lines - one for each row in the dataset. This can be helpful for plotting things like important milestones, launch dates, or experiment start dates.

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

### Custom Line Styling
![multiple-y-line](/img/exg-multiple-y-line-nt.svg)

```markdown
<LineChart
data={fda_recalls}  
 x=year
y={["voluntary_recalls", "fda_recalls"]}
/>
```

### Custom Label Styling
![multiple-y-line](/img/exg-multiple-y-line-nt.svg)

```markdown
<LineChart
data={fda_recalls}  
 x=year
y={["voluntary_recalls", "fda_recalls"]}
/>
```

## Props
A reference line can be produced by hardcoding values or by supplying a dataset, and the required props are different for each of those cases.

### Option 1: Hardcoding Values

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>x</td>	<td>x-axis value where line will be plotted</td>	<td class='tcenter'>One of x or y is required</td>	<td class='tcenter'>number | string | date</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>y</td>	<td>y-axis value where line will be plotted</td>	<td class='tcenter'>One of x or y is required</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>label</td>	<td>Text to show as label for the line</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>showValueInLabel</td>	<td>Whether the x or y value should be included in the label</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true - If no label supplied, value will become the label. If label is supplied, value will appear in parentheses after the label.</td>	</tr>
</table>

- If both `x` and `y` are provided, `x` will be used and `y` will be ignored.

### Option 2: Supplying a Dataset

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes </td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>x</td>	<td>Column containing x-axis values</td>	<td class='tcenter'>One of x or y is required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>y</td>	<td>Column containing y-axis values</td>	<td class='tcenter'>One of x or y is required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>label</td>	<td>Column containing a label to use for each line</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>showValueInLabel</td>	<td>Whether the x or y value should be included in the label</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true - If no label supplied, value will become the label. If label is supplied, value will appear in parentheses after the label.</td>	</tr>
</table>

- If both `x` and `y` are provided, `x` will be used and `y` will be ignored.

### Styling

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>color</td>	<td>Color to override default line and label colors</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>lineColor</td>	<td>Color to override default line color. If used, takes precedence over `color`</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>labelColor</td>	<td>Color to override default label color. If used, takes precedence over `color`</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>lineType</td>	<td>Options to show breaks in a line (dashed or dotted)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>solid | dashed | dotted</td>	<td class='tcenter'>dashed</td>	</tr>
<tr>	<td>lineWidth</td>	<td>Thickness of line (in pixels)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>1</td>	</tr>
<tr>	<td>labelTextOutline</td>	<td>Option to show a white outline around the label text. Helps when label is shown in front of darker colours.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>labelBackground</td>	<td>Option to show a white semi-transparent background behind the label. Helps when label is shown in front of darker colours.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
</table>
