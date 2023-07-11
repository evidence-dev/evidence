---
sidebar_position: 11
title: Mixed-Type Charts
hide_table_of_contents: false
---

You can combine multiple chart types inside a single `<Chart>` tag to create mixed-type charts.

## Examples

### Mixed-Type Chart

This example uses multiple y columns and multiple series types (bar and line)

![composable](/img/exg-composable-multi-type-nt.svg)

```markdown
<Chart data={fda_recalls}>
    <Bar y=voluntary_recalls/>
    <Line y=fda_recalls/>
</Chart>
```

Because x is the first column in the dataset, an explicit `x` prop is not required.

This structure also gives you control over the individual series on your chart. For example, if you have a single series running through a component, you can override props specifically for that series. Since the FDA acronym was not fully capitalized above, you can rename that specific series inside the `<Line>` primitive:

![composable-name-override](/img/exg-composable-name-override-nt.svg)

```markdown
<Chart data={fda_recalls}>
    <Bar y=voluntary_recalls/>
    <Line y=fda_recalls name="FDA Recalls"/>
</Chart>
```

## Chart `<Chart>`

```markdown
<Chart data={query_name}>
    Insert primitives here
</Chart>
```

#### Data Props

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>x</td>	<td>Column to use for the x-axis of the chart</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>First column</td>	</tr>
<tr>	<td>y</td>	<td>Column(s) to use for the y-axis of the chart</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name | array of column names</td>	<td class='tcenter'>Any non-assigned numeric columns</td>	</tr>
<tr>	<td>sort</td>	<td>Whether to apply default sort to your data. Default is x ascending for number and date x-axes, and y descending for category x-axes</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>series</td>	<td>Column to use as the series (groups) in a multi-series chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>xFmt</td>	<td>Format to use for x column (<a href='/core-concepts/formatting'>see available formats</a>)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>Excel-style format | buil-in format name | custom format name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yFmt</td>	<td>Format to use for y column (<a href='/core-concepts/formatting'>see available formats</a>)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>Excel-style format | buil-in format name | custom format name</td>	<td class='tcenter'>-</td>	</tr>

</table>

#### Chart Props

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>swapXY</td>	<td>Swap the x and y axes to create a horizontal chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>title</td>	<td>Chart title. Appears at top left of chart.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>subtitle</td>	<td>Chart subtitle. Appears just under title.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>legend</td>	<td>Turns legend on or off. Legend appears at top center of chart.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true for multiple series</td>	</tr>
<tr>	<td>chartAreaHeight</td>	<td>Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>180</td>	</tr>
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
<tr>	<td>options</td>	<td>JavaScript object to add or override chart configuration settings (see Custom Charts page)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>object</td>	<td class='tcenter'>-</td>	</tr>
</table>

### Line `<Line/>`

```markdown
<Chart data={query_name}>
    <Line/>
</Chart>
```

#### Props

<table>						
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>y</td>	<td>Column(s) to use for the y-axis of the chart. Can be different than the y supplied to Chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name | array of column names</td>	<td class='tcenter'>y supplied to Chart</td>	</tr>
<tr>	<td>series</td>	<td>Column to use as the series (groups) in a multi-series chart. Can be different than the series supplied to Chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>series supplied to Chart</td>	</tr>
<tr>	<td>name</td>	<td>Name to show in legend for a single series (to override column name)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>lineColor</td>	<td>Color to override default series color. Only accepts a single color.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>lineOpacity</td>	<td>% of the full color that should be rendered, with remainder being transparent</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number (0 to 1)</td>	<td class='tcenter'>1</td>	</tr>
<tr>	<td>lineType</td>	<td>Options to show breaks in a line (dashed or dotted)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>solid | dashed | dotted</td>	<td class='tcenter'>solid</td>	</tr>
<tr>	<td>lineWidth</td>	<td>Thickness of line (in pixels)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>2</td>	</tr>
<tr>	<td>markers</td>	<td>Turn on/off markers (shapes rendered onto the points of a line)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>markerShape</td>	<td>Shape to use if markers=true</td>	<td class='tcenter'>-</td>	<td class='tcenter'>circle | emptyCircle | rect | triangle | diamond</td>	<td class='tcenter'>circle</td>	</tr>
<tr>	<td>markerSize</td>	<td>Size of each shape (in pixels)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>8</td>	</tr>
<tr>	<td>handleMissing</td>	<td>Treatment of missing values in the dataset</td>	<td class='tcenter'>-</td>	<td class='tcenter'>gap | connect | zero</td>	<td class='tcenter'>gap</td>	</tr>
<tr>	<td>options</td>	<td>JavaScript object to add or override chart configuration settings (see Custom Charts page)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>object</td>	<td class='tcenter'>-</td>	</tr>
</table>

### Area `<Area/>`

```markdown
<Chart data={query_name}>
    <Area/>
</Chart>
```

#### Props

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>y</td>	<td>Column(s) to use for the y-axis of the chart. Can be different than the y supplied to Chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name | array of column names</td>	<td class='tcenter'>y supplied to Chart</td>	</tr>
<tr>	<td>series</td>	<td>Column to use as the series (groups) in a multi-series chart. Can be different than the series supplied to Chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>series supplied to Chart</td>	</tr>
<tr>	<td>name</td>	<td>Name to show in legend for a single series (instead of showing y column name)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>fillColor</td>	<td>Color to override default series color. Only accepts a single color.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>fillOpacity</td>	<td>% of the full color that should be rendered, with remainder being transparent</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number (0 to 1)</td>	<td class='tcenter'>0.7</td>	</tr>
<tr>	<td>line</td>	<td>Show line on top of the area</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>handleMissing</td>	<td>Treatment of missing values in the dataset</td>	<td class='tcenter'>-</td>	<td class='tcenter'>gap | connect | zero</td>	<td class='tcenter'>gap (single series) | zero (multi-series)</td>	</tr>
<tr>	<td>options</td>	<td>JavaScript object to add or override chart configuration settings (see Custom Charts page)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>object</td>	<td class='tcenter'>-</td>	</tr>
</table>

### Bar `<Bar/>`

```markdown
<Chart data={query_name}>
    <Bar/>
</Chart>
```

#### Props

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>y</td>	<td>Column(s) to use for the y-axis of the chart. Can be different than the y supplied to Chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name | array of column names</td>	<td class='tcenter'>y supplied to Chart</td>	</tr>
<tr>	<td>series</td>	<td>Column to use as the series (groups) in a multi-series chart. Can be different than the series supplied to Chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>series supplied to Chart</td>	</tr>
<tr>	<td>name</td>	<td>Name to show in legend for a single series (to override column name)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>type</td>	<td>Grouping method to use for multi-series charts</td>	<td class='tcenter'>-</td>	<td class='tcenter'>stacked | grouped</td>	<td class='tcenter'>stacked</td>	</tr>
<tr>	<td>stackName</td>	<td>Name for an individual stack. If separate Bar components are used with different stackNames, the chart will show multiple stacks</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>fillColor</td>	<td>Color to override default series color. Only accepts a single color.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>fillOpacity</td>	<td>% of the full color that should be rendered, with remainder being transparent</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number (0 to 1)</td>	<td class='tcenter'>1</td>	</tr>
<tr>	<td>outlineWidth</td>	<td>Width of line surrounding each bar</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>0</td>	</tr>
<tr>	<td>outlineColor</td>	<td>Color to use for outline if outlineWidth > 0</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>options</td>	<td>JavaScript object to add or override chart configuration settings (see Custom Charts page)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>object</td>	<td class='tcenter'>-</td>	</tr>
</table>

### Scatter `<Scatter/>`

```markdown
<Chart data={query_name}>
    <Scatter/>
</Chart>
```

#### Props

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>y</td>	<td>Column(s) to use for the y-axis of the chart. Can be different than the y supplied to Chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name | array of column names</td>	<td class='tcenter'>y supplied to Chart</td>	</tr>
<tr>	<td>series</td>	<td>Column to use as the series (groups) in a multi-series chart. Can be different than the series supplied to Chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>series supplied to Chart</td>	</tr>
<tr>	<td>name</td>	<td>Name to show in legend for a single series (to override column name)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>shape</td>	<td>Options for which shape to use for scatter points</td>	<td class='tcenter'>-</td>	<td class='tcenter'>circle | emptyCircle | rect | triangle | diamond</td>	<td class='tcenter'>circle</td>	</tr>
<tr>	<td>pointSize</td>	<td>Change size of all points on the chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>10</td>	</tr>
<tr>	<td>opacity</td>	<td>% of the full color that should be rendered, with remainder being transparent</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number (0 to 1)</td>	<td class='tcenter'>0.7</td>	</tr>
<tr>	<td>fillColor</td>	<td>Color to override default series color. Only accepts a single color.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>outlineWidth</td>	<td>Width of line surrounding each shape</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>0</td>	</tr>
<tr>	<td>outlineColor</td>	<td>Color to use for outline if outlineWidth > 0</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>options</td>	<td>JavaScript object to add or override chart configuration settings (see Custom Charts page)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>object</td>	<td class='tcenter'>-</td>	</tr>
</table>

### Bubble `<Bubble/>`

```markdown
<Chart data={query_name}>
    <Bubble/>
</Chart>
```

#### Props

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>y</td>	<td>Column(s) to use for the y-axis of the chart. Can be different than the y supplied to Chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name | array of column names</td>	<td class='tcenter'>y supplied to Chart</td>	</tr>
<tr>	<td>series</td>	<td>Column to use as the series (groups) in a multi-series chart. Can be different than the series supplied to Chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>series supplied to Chart</td>	</tr>
<tr>	<td>size</td>	<td>Column to use to scale the size of the bubbles</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>name</td>	<td>Name to show in legend for a single series (to override column name)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>shape</td>	<td>Options for which shape to use for bubble points</td>	<td class='tcenter'>-</td>	<td class='tcenter'>circle | emptyCircle | rect | triangle | diamond</td>	<td class='tcenter'>circle</td>	</tr>
<tr>	<td>minSize</td>	<td>Minimum bubble size</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>200</td>	</tr>
<tr>	<td>maxSize</td>	<td>Maximum bubble size</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>400</td>	</tr>
<tr>	<td>opacity</td>	<td>% of the full color that should be rendered, with remainder being transparent</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number (0 to 1)</td>	<td class='tcenter'>0.7</td>	</tr>
<tr>	<td>fillColor</td>	<td>Color to override default series color. Only accepts a single color.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>outlineWidth</td>	<td>Width of line surrounding each shape</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>0</td>	</tr>
<tr>	<td>outlineColor</td>	<td>Color to use for outline if outlineWidth > 0</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>options</td>	<td>JavaScript object to add or override chart configuration settings (see Custom Charts page)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>object</td>	<td class='tcenter'>-</td>	</tr>
</table>

### Hist `<Hist/>`

```markdown
<Chart data={query_name}>
    <Hist/>
</Chart>
```

#### Props

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>x</td>	<td>Column which contains the data you want to summarize</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>x supplied to Chart</td>	</tr>
<tr>	<td>fillColor</td>	<td>Color to override default series color</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>fillOpacity</td>	<td>% of the full color that should be rendered, with remainder being transparent</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number (0 to 1)</td>	<td class='tcenter'>1</td>	</tr>
</table>

## Annotations

Mixed type charts can include [**annotations**](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<Chart data={sales_data} x=date y=sales>
  <Line y=sales/>
  <ReferenceLine data={target_data} y=target label=name/>
  <ReferenceArea xMin='2020-03-14' xMax='2020-05-01'/>
</Chart>
```