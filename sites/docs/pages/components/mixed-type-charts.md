---
title: Mixed-Type Charts
sidebar_position: 1
---

<Alert status=info>

The easiest way to create mixed-type charts is setting up [a secondary y-axis in `LineChart`](/components/line-chart#secondary-axis-with-bar) or a [secondary axis in `BarChart`](/components/bar-chart#secondary-axis-with-line)

</Alert>


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

# Chart `<Chart>`

```markdown
<Chart data={query_name}>
    Insert primitives here
</Chart>
```



## Data

<PropListing
    name=data
    description="Query name, wrapped in curly braces"
    required=true
    options="query name"
/>
<PropListing
    name=x
    description="Column to use for the x-axis of the chart"
    options="column name"
/>
<PropListing
    name=y
    description="Column(s) to use for the y-axis of the chart"
    options="column name | array of column names"
/>
<PropListing
    name=sort
    description="Whether to apply default sort to your data. Default is x ascending for number and date x-axes, and y descending for category x-axes"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=series
    description="Column to use as the series (groups) in a multi-series chart"
    options="column name"
/>
<PropListing
    name=xFmt
    description="Format to use for x column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing
    name=yFmt
    description="Format to use for y column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing
    name=yLog
    description="Whether to use a log scale for the y-axis"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=yLogBase
    description="Base to use when log scale is enabled"
    options="number"
    defaultValue="10"
/>
<PropListing
    name=emptySet
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in build:strict. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    options={['error', 'warn', 'pass']}
    defaultValue="error"
/>
<PropListing
    name=emptyMessage
    description="Text to display when an empty dataset is received - only applies when emptySet is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    options="string"
    defaultValue="No records"
/>


## Chart

<PropListing
    name=swapXY
    description="Swap the x and y axes to create a horizontal chart"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=title
    description="Chart title. Appears at top left of chart."
    options="string"
/>
<PropListing
    name=subtitle
    description="Chart subtitle. Appears just under title."
    options="string"
/>
<PropListing
    name=legend
    description="Turns legend on or off. Legend appears at top center of chart."
    options={['true', 'false']}
    defaultValue="true for multiple series"
/>
<PropListing
    name=chartAreaHeight
    description="Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX."
    options="number"
    defaultValue="180"
/>
<PropListing
    name=xAxisTitle
    description="Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false"
    options={['true', 'string', 'false']}
    defaultValue="false"
/>
<PropListing
    name=yAxisTitle
    description="Name to show beside y-axis. If 'true', formatted column name is used."
    options={['true', 'string', 'false']}
    defaultValue="false"
/>
<PropListing
    name=xGridlines
    description="Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=yGridlines
    description="Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=xAxisLabels
    description="Turns on/off value labels on the x-axis"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=yAxisLabels
    description="Turns on/off value labels on the y-axis"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=xBaseline
    description="Turns on/off thick axis line (line appears at y=0)"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=yBaseline
    description="Turns on/off thick axis line (line appears directly alongside the y-axis labels)"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=xTickMarks
    description="Turns on/off tick marks for each of the x-axis labels"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=yTickMarks
    description="Turns on/off tick marks for each of the y-axis labels"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=yMin
    description="Starting value for the y-axis"
    options="number"
/>
<PropListing
    name=yMax
    description="Maximum value for the y-axis"
    options="number"
/>
<PropListing
    name=yScale
    description="Whether to scale the y-axis to fit your data. yMin and yMax take precedence over yScale"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=options
    description="JavaScript object to add or override chart configuration settings (see Custom Charts page)"
    options="object"
/>
<PropListing
    name=colorPalette
    description="Array of custom colours to use for the chart. E.g., <code class=markdown>{`{['#cf0d06','#eb5752','#e88a87']}`}</code>"
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
/>
<PropListing
    name=seriesColors
    description="Apply a specific color to each series in your chart. Unspecified series will receive colors from the built-in palette as normal. Note the double curly braces required in the syntax"
    options="object with series names and assigned colors"
    defaultValue="colors applied by order of series in data"
/>
<PropListing
    name=renderer
    description="Which chart renderer type (canvas or SVG) to use. See ECharts' <a href='https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/' class=markdown>documentation on renderers</a>."
    options={['canvas', 'svg']}
    defaultValue="canvas"
/>


# Line `<Line/>`

```markdown
<Chart data={query_name}>
    <Line/>
</Chart>
```

## Options

<PropListing
    name=y
    description="Column(s) to use for the y-axis of the chart. Can be different than the y supplied to Chart"
    options="column name | array of column names"
    defaultValue="y supplied to Chart"
/>
<PropListing
    name=series
    description="Column to use as the series (groups) in a multi-series chart. Can be different than the series supplied to Chart"
    options="column name"
    defaultValue="series supplied to Chart"
/>
<PropListing
    name=name
    description="Name to show in legend for a single series (to override column name)"
    options="string"
/>
<PropListing
    name=lineColor
    description="Color to override default series color. Only accepts a single color."
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=lineOpacity
    description="% of the full color that should be rendered, with remainder being transparent"
    options="number (0 to 1)"
    defaultValue="1"
/>
<PropListing
    name=lineType
    description="Options to show breaks in a line (dashed or dotted)"
    options={['solid', 'dashed', 'dotted']}
    defaultValue="solid"
/>
<PropListing
    name=lineWidth
    description="Thickness of line (in pixels)"
    options="number"
    defaultValue="2"
/>
<PropListing
    name=markers
    description="Turn on/off markers (shapes rendered onto the points of a line)"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=markerShape
    description="Shape to use if markers=true"
    options={['circle', 'emptyCircle', 'rect', 'triangle', 'diamond']}
    defaultValue="circle"
/>
<PropListing
    name=markerSize
    description="Size of each shape (in pixels)"
    options="number"
    defaultValue="8"
/>
<PropListing
    name=handleMissing
    description="Treatment of missing values in the dataset"
    options={['gap', 'connect', 'zero']}
    defaultValue="gap"
/>
<PropListing
    name=options
    description="JavaScript object to add or override chart configuration settings (see Custom Charts page)"
    options="object"
/>




# Area `<Area/>`

```markdown
<Chart data={query_name}>
    <Area/>
</Chart>
```

## Options

<PropListing
    name=y
    description="Column(s) to use for the y-axis of the chart. Can be different than the y supplied to Chart"
    options="column name | array of column names"
    defaultValue="y supplied to Chart"
/>
<PropListing
    name=series
    description="Column to use as the series (groups) in a multi-series chart. Can be different than the series supplied to Chart"
    options="column name"
    defaultValue="series supplied to Chart"
/>
<PropListing
    name=name
    description="Name to show in legend for a single series (to override column name)"
    options="string"
/>
<PropListing
    name=fillColor
    description="Color to override default series color. Only accepts a single color."
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=fillOpacity
    description="% of the full color that should be rendered, with remainder being transparent"
    options="number (0 to 1)"
    defaultValue="0.7"
/>
<PropListing
    name=line
    description="Show line on top of the area"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=handleMissing
    description="Treatment of missing values in the dataset"
    options={['gap', 'connect', 'zero']}
    defaultValue="gap (single series) | zero (multi-series)"
/>
<PropListing
    name=options
    description="JavaScript object to add or override chart configuration settings (see Custom Charts page)"
    options="object"
/>

# Bar `<Bar/>`

```markdown
<Chart data={query_name}>
    <Bar/>
</Chart>
```

## Options

<PropListing
    name=y
    description="Column to use for the y-axis of the chart"
    options="column name"
/>
<PropListing
    name=name
    description="Name to show in legend for a single series (to override column name)"
    options="string"
/>
<PropListing
    name=type
    description="Grouping method to use for multi-series charts"
    options={['stacked', 'grouped']}
    defaultValue="stacked"
/>
<PropListing
    name=stackName
    description="Name for an individual stack. If separate Bar components are used with different stackNames, the chart will show multiple stacks"
    options="string"
/>
<PropListing
    name=fillColor
    description="Color to override default series color. Only accepts a single color."
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=fillOpacity
    description="% of the full color that should be rendered, with remainder being transparent"
    options="number (0 to 1)"
    defaultValue="1"
/>
<PropListing
    name=outlineWidth
    description="Width of line surrounding each bar"
    options="number"
    defaultValue="0"
/>
<PropListing
    name=outlineColor
    description="Color to use for outline if outlineWidth > 0"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=options
    description="JavaScript object to add or override chart configuration settings (see Custom Charts page)"
    options="object"
/>

# Scatter `<Scatter/>`

```markdown
<Chart data={query_name}>
    <Scatter/>
</Chart>
```

## Options

<PropListing
    name=y
    description="Column to use for the y-axis of the chart"
    options="column name"
/>
<PropListing
    name=name
    description="Name to show in legend for a single series (to override column name)"
    options="string"
/>
<PropListing
    name=shape
    description="Options for which shape to use for scatter points"
    options={['circle', 'emptyCircle', 'rect', 'triangle', 'diamond']}
    defaultValue="circle"
/>
<PropListing
    name=pointSize
    description="Change size of all points on the chart"
    options="number"
    defaultValue="10"
/>
<PropListing
    name=opacity
    description="% of the full color that should be rendered, with remainder being transparent"
    options="number (0 to 1)"
    defaultValue="0.7"
/>
<PropListing
    name=fillColor
    description="Color to override default series color. Only accepts a single color."
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=outlineWidth
    description="Width of line surrounding each shape"
    options="number"
    defaultValue="0"
/>
<PropListing
    name=outlineColor
    description="Color to use for outline if outlineWidth > 0"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=options
    description="JavaScript object to add or override chart configuration settings (see Custom Charts page)"
    options="object"
/>

# Bubble `<Bubble/>`

```markdown
<Chart data={query_name}>
    <Bubble/>
</Chart>
```

## Options

<PropListing
    name=y
    description="Column to use for the y-axis of the chart"
    options="column name"
/>
<PropListing
    name=size
    description="Column to use to scale the size of the bubbles"
    options="column name"
/>
<PropListing
    name=name
    description="Name to show in legend for a single series (to override column name)"
    options="string"
/>
<PropListing
    name=shape
    description="Options for which shape to use for bubble points"
    options={['circle', 'emptyCircle', 'rect', 'triangle', 'diamond']}
    defaultValue="circle"
/>
<PropListing
    name=minSize
    description="Minimum bubble size"
    options="number"
    defaultValue="200"
/>
<PropListing
    name=maxSize
    description="Maximum bubble size"
    options="number"
    defaultValue="400"
/>
<PropListing
    name=opacity
    description="% of the full color that should be rendered, with remainder being transparent"
    options="number (0 to 1)"
    defaultValue="0.7"
/>
<PropListing
    name=fillColor
    description="Color to override default series color. Only accepts a single color."
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=outlineWidth
    description="Width of line surrounding each shape"
    options="number"
    defaultValue="0"
/>
<PropListing
    name=outlineColor
    description="Color to use for outline if outlineWidth > 0"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=options
    description="JavaScript object to add or override chart configuration settings (see Custom Charts page)"
    options="object"
/>

# Hist `<Hist/>`

```markdown
<Chart data={query_name}>
    <Hist/>
</Chart>
```

## Options

<PropListing
    name=x
    description="Column which contains the data you want to summarize"
    options="column name"
/>
<PropListing
    name=fillColor
    description="Color to override default series color"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=fillOpacity
    description="% of the full color that should be rendered, with remainder being transparent"
    options="number (0 to 1)"
    defaultValue="1"
/>
<PropListing
    name=options
    description="JavaScript object to add or override chart configuration settings (see Custom Charts page)"
    options="object"
/>

### Interactivity

<PropListing
    name=connectGroup
    description="Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected"
/>

## Annotations

Mixed type charts can include [annotations](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<Chart data={sales_data} x=date y=sales>
  <Line y=sales/>
  <ReferenceLine data={target_data} y=target label=name/>
  <ReferenceArea xMin='2020-03-14' xMax='2020-05-01'/>
</Chart>
```