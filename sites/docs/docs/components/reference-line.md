---
sidebar_position: 12
title: Reference Line
hide_table_of_contents: false
---

Reference lines allow you to add horizontal or vertical lines to a chart to provide additional context within the visualization. These lines can be produced by providing a specific value (`y=50` or `x='2020-03-14'`) or by providing a dataset (e.g., `date`, `event_name`).

When a dataset is provided, `ReferenceLine` can generate multiple lines - one for each row in the dataset. This can be helpful for plotting things like important milestones, launch dates, or experiment start dates.

## Examples

### Y-axis Defined Inline

<img src="/img/refline-y-basic.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=90000 label="Target"/>
</LineChart>
```

### X-axis Defined Inline

<img src="/img/refline-x-basic.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine x='2019-09-18' label="Launch" hideValue=true/>
</LineChart>
```

### Y-axis Multiple Lines
<img src="/img/refline-y-multi.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=90000 label="Target" labelPosition=belowEnd/>
    <ReferenceLine y=105000 label="Forecast"/>
</LineChart>
```

### X-axis from Data

<img src="/img/refline-x-multi.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine data={multiple_dates} x=start_date/>
</LineChart>
```

### Custom Styling
<img src="/img/refline-y-custom.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=110000 color=red hideValue=true lineWidth=3 lineType=solid/>
</LineChart>
```

### Label Positions
<img src="/img/refline-label-positions.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=40000 label=aboveStart labelPosition=aboveStart hideValue=true/>
    <ReferenceLine y=40000 label=aboveCenter labelPosition=aboveCenter hideValue=true/>
    <ReferenceLine y=40000 label=aboveEnd labelPosition=aboveEnd hideValue=true/>
    <ReferenceLine y=40000 label=belowStart labelPosition=belowStart hideValue=true/>
    <ReferenceLine y=40000 label=belowCenter labelPosition=belowCenter hideValue=true/>
    <ReferenceLine y=40000 label=belowEnd labelPosition=belowEnd hideValue=true/>
</LineChart>
```

### Colours
<img src="/img/refline-colors.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=15000 color=red label=red/>
    <ReferenceLine y=35000 color=yellow label=yellow/>
    <ReferenceLine y=55000 color=green label=green/>
    <ReferenceLine y=75000 color=blue label=blue/>
    <ReferenceLine y=95000 color=grey label=grey/>
    <ReferenceLine y=115000 color=#63178f label=custom/>
</LineChart>
```

## Props
A reference line can be produced by defining values inline or by supplying a dataset, and the required props are different for each of those cases.

### Option 1: Defining Values Inline

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>x</td>	<td>x-axis value where line will be plotted</td>	<td class='tcenter'>One of x or y is required</td>	<td class='tcenter'>number | string | date</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>y</td>	<td>y-axis value where line will be plotted</td>	<td class='tcenter'>One of x or y is required</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>label</td>	<td>Text to show as label for the line</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>hideValue</td>	<td>Option to remove the value from the label</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false - If no label supplied, value will become the label. If label is supplied, value will appear in parentheses after the label.</td>	</tr>
</table>

- If both `x` and `y` are provided, `x` will be used and `y` will be ignored.

### Option 2: Supplying a Dataset

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes </td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>x</td>	<td>Column containing x-axis values</td>	<td class='tcenter'>One of x or y is required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>y</td>	<td>Column containing y-axis values</td>	<td class='tcenter'>One of x or y is required</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>label</td>	<td>Column containing a label to use for each line</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>hideValue</td>	<td>Option to remove the value from the label</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false - If no label supplied, value will become the label. If label is supplied, value will appear in parentheses after the label.</td>	</tr>
</table>

- If both `x` and `y` are provided, `x` will be used and `y` will be ignored.

### Styling

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>labelPosition</td>	<td>Where label will appear on the line</td>	<td class='tcenter'>-</td>	<td class='tcenter'>aboveStart | aboveCenter | aboveEnd <br/> belowStart | belowCenter | belowEnd</td>	<td class='tcenter'>aboveEnd</td>	</tr>
<tr>	<td>color</td>	<td>Color to override default line and label colors</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>lineColor</td>	<td>Color to override default line color. If used, takes precedence over `color`</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>labelColor</td>	<td>Color to override default label color. If used, takes precedence over `color`</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>lineType</td>	<td>Options to show breaks in a line (dashed or dotted)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>solid | dashed | dotted</td>	<td class='tcenter'>dashed</td>	</tr>
<tr>	<td>lineWidth</td>	<td>Thickness of line (in pixels)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>1.3</td>	</tr>
<tr>	<td>labelBackground</td>	<td>Option to show a white semi-transparent background behind the label. Helps when label is shown in front of darker colours.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
</table>
