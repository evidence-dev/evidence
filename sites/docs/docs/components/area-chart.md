---
sidebar_position: 6
title: 'Area Chart'
hide_table_of_contents: false
image: /img/exg-multi-series-step-area.png
---

![area](/img/exg-area-nt.svg)

```markdown
<AreaChart 
    data={query_name} 
    x=column_x 
    y=column_y
/>
```

## Examples

### Area

![area](/img/exg-area-nt.svg)

```markdown
<AreaChart 
    data={fed_reserve_district_sf} 
    x=established_date 
    y=banks_created
/>
```

### Stacked Area

![stacked-area](/img/exg-stacked-area-nt.svg)

```markdown
<AreaChart 
    data={fed_reserve_district}  
    x=established_date 
    y=banks_created
    series=fed_reserve_district
/>
```

### 100% Stacked Area

![100-stacked-area](/img/100-stacked-area.svg)

```markdown
<AreaChart 
    data={fed_reserve_district}  
    x=established_date 
    y=banks_created
    series=fed_reserve_district
    type=stacked100
/>
```

### Area with Step Line

<img src='/img/exg-multi-series-step-area.png' width='576px'/>

```markdown
<AreaChart
    data={simpler_bar}
    x=year
    y=value
    series=country
    step=true
/>
```

## Options

### Data

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>x</td>	<td>Column to use for the x-axis of the chart</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>First column</td>	</tr>
<tr>	<td>y</td>	<td>Column(s) to use for the y-axis of the chart</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name | array of column names</td>	<td class='tcenter'>Any non-assigned numeric columns</td>	</tr>
<tr>	<td>series</td>	<td>Column to use as the series (groups) in a multi-series chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>sort</td>	<td>Whether to apply default sort to your data. Default sort is x ascending for number and date x-axes, and y descending for category x-axes</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>type</td>	<td>Grouping method to use for multi-series charts</td>	<td class='tcenter'>-</td>	<td class='tcenter'>stacked | stacked100</td>	<td class='tcenter'>stacked</td>	</tr>
<tr>	<td>handleMissing</td>	<td>Treatment of missing values in the dataset</td>	<td class='tcenter'>-</td>	<td class='tcenter'>gap | connect | zero</td>	<td class='tcenter'>gap (single series) | zero (multi-series)</td>	</tr>
</table>

### Formatting & Styling

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>xFmt</td>	<td>Format to use for x column (<a href='/core-concepts/formatting'>see available formats</a>)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>Excel-style format | buil-in format name | custom format name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yFmt</td>	<td>Format to use for y column (<a href='/core-concepts/formatting'>see available formats</a>)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>Excel-style format | buil-in format name | custom format name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>step</td>	<td>Specifies whether the chart is displayed as a step line.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>stepPosition</td>	<td>Configures the position of turn points for a step line chart.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>'start' | 'middle' | 'end'</td>	<td class='tcenter'>'end'</td>	</tr>
<tr>	<td>fillColor</td>	<td>Color to override default series color. Only accepts a single color.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>lineColor</td>	<td>Color to override default line color. Only accepts a single color.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>fillOpacity</td>	<td>% of the full color that should be rendered, with remainder being transparent</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number (0 to 1)</td>	<td class='tcenter'>0.7</td>	</tr>
<tr>	<td>line</td>	<td>Show line on top of the area</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>colorPalette</td>	<td>Array of custom colours to use for the chart<br/>E.g., ['#cf0d06','#eb5752','#e88a87']<br/> Note that the array must be surrounded by curly braces.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>array of color strings (CSS name | hexademical | RGB | HSL)</td>	<td class='tcenter'>built-in color palette</td>	</tr>
</table>

### Value Labels

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>labels</td>	<td>Show value labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>labelSize</td>	<td>Font size of value labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>11</td>	</tr>
<tr>	<td>labelPosition</td>	<td>Where label will appear on your series</td>	<td class='tcenter'>-</td>	<td class='tcenter'>above | middle | below</td>	<td class='tcenter'>above</td>	</tr>
<tr>	<td>labelColor</td>	<td>Font color of value labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>Automatic based on color contrast of background</td>	</tr>
<tr>	<td>labelFmt</td>	<td>Format to use for value labels (<a href='/core-concepts/formatting'>see available formats</a>)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>Excel-style format | buil-in format name | custom format name</td>	<td class='tcenter'>same as y column</td>	</tr>
<tr>	<td>showAllLabels</td>	<td>Allow all labels to appear on chart, including overlapping labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
</table>

### Axes

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>yLog</td>	<td>Whether to use a log scale for the y-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yLogBase</td>	<td>Base to use when log scale is enabled</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>10</td>	</tr>
<tr>	<td>xAxisTitle</td>	<td>Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | string | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yAxisTitle</td>	<td>Name to show beside y-axis. If 'true', formatted column name is used.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | string | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>xGridlines</td>	<td>Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yGridlines</td>	<td>Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>xAxisLabels</td>	<td>Turns on/off value labels on the x-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>yAxisLabels</td>	<td>Turns on/off value labels on the y-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>xBaseline</td>	<td>Turns on/off thick axis line (line appears at y=0)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>yBaseline</td>	<td>Turns on/off thick axis line (line appears directly alongside the y-axis labels)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>xTickMarks</td>	<td>Turns on/off tick marks for each of the x-axis labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yTickMarks</td>	<td>Turns on/off tick marks for each of the y-axis labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yMin</td>	<td>Starting value for the y-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yMax</td>	<td>Maximum value for the y-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
</table>


### Chart

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>title</td>	<td>Chart title. Appears at top left of chart.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>subtitle</td>	<td>Chart subtitle. Appears just under title.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>legend</td>	<td>Turns legend on or off. Legend appears at top center of chart.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true for multiple series</td>	</tr>
<tr>	<td>chartAreaHeight</td>	<td>Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>180</td>	</tr>
</table>

## Annotations

Area charts can include [**annotations**](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<AreaChart data="{sales_data}" x="date" y="sales">
	<ReferenceLine data="{target_data}" y="target" label="name" />
	<ReferenceArea xMin="2020-03-14" xMax="2020-05-01" />
</AreaChart>
```
