
title: Mixed-Type Charts
description: Display multiple series types on the same chart, for example a bar for an amount, and a line for a related percentage.
sidebar_position: 99
---

Use mixed-type charts to display multiple series types on the same chart, for example a bar for an amount, and a line for a related percentage. 

Mixed-type charts can be confusing, so use them sparingly. To add reference lines, areas or points to a chart instead, see [Annotations](/components/charts/annotations).

<Alert status=info>

The easiest way to create mixed-type charts is setting up [a secondary y-axis in `LineChart`](/components/charts/line-chart#secondary-axis-with-bar) or a [secondary axis in `BarChart`](/components/charts/bar-chart#secondary-axis-with-line)

</Alert>


You can combine multiple chart types inside a single `<Chart>` tag to create mixed-type charts.

## Examples

### Mixed-Type Chart

This example uses multiple y columns and multiple series types (bar and line)

<DocTab>
    <div slot='preview'>
        <img style="width: 100%;" src="/img/exg-composable-multi-type-nt.svg" alt="Mixed-Type Chart" />
    </div>

```markdown
<Chart data={fda_recalls}>
    <Bar y=voluntary_recalls/>
    <Line y=fda_recalls/>
</Chart>
```
</DocTab>


Because x is the first column in the dataset, an explicit `x` prop is not required.

This structure also gives you control over the individual series on your chart. For example, if you have a single series running through a component, you can override props specifically for that series. Since the FDA acronym was not fully capitalized above, you can rename that specific series inside the `<Line>` primitive:

<DocTab>
    <div slot="preview">
            <img style="width: 100%;" src="/img/exg-composable-name-override-nt.svg" alt="Mixed-Type Chart Name Overide"/>
    </div>

```markdown
<Chart data={fda_recalls}>
    <Bar y=voluntary_recalls/>
    <Line y=fda_recalls name="FDA Recalls"/>
</Chart>
```
</DocTab>


# Chart `<Chart>`

```markdown
<Chart data={query_name}>
    Insert primitives here
</Chart>
```



## Data

<PropListing
    name="data"
    required
    options="query name"
>

Query name, wrapped in curly braces

</PropListing>
<PropListing
    name="x"
    options="column name"
>

Column to use for the x-axis of the chart

</PropListing>
<PropListing
    name="y"
    options="column name | array of column names"
>

Column(s) to use for the y-axis of the chart

</PropListing>
<PropListing
    name="sort"
    options={['true', 'false']}
    defaultValue="true"
>

Whether to apply default sort to your data. Default is x ascending for number and date x-axes, and y descending for category x-axes

</PropListing>
<PropListing
    name="series"
    options="column name"
>

Column to use as the series (groups) in a multi-series chart

</PropListing>
<PropListing
    name="xFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for x column ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name="yFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for y column ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name="yLog"
    options={['true', 'false']}
    defaultValue="false"
>

Whether to use a log scale for the y-axis

</PropListing>
<PropListing
    name="yLogBase"
    options="number"
    defaultValue="10"
>

Base to use when log scale is enabled

</PropListing>
<PropListing
    name="emptySet"
    options={['error', 'warn', 'pass']}
    defaultValue="error"
>

Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in build:strict. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.

</PropListing>
<PropListing
    name="emptyMessage"
    options="string"
    defaultValue="No records"
>

Text to display when an empty dataset is received - only applies when emptySet is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).

</PropListing>


## Chart

<PropListing
    name="swapXY"
    options={['true', 'false']}
    defaultValue="false"
>

Swap the x and y axes to create a horizontal chart

</PropListing>
<PropListing
    name="title"
    options="string"
>

Chart title. Appears at top left of chart.

</PropListing>
<PropListing
    name="subtitle"
    options="string"
>

Chart subtitle. Appears just under title.

</PropListing>
<PropListing
    name="legend"
    options={['true', 'false']}
    defaultValue="true for multiple series"
>

Turns legend on or off. Legend appears at top center of chart.

</PropListing>
<PropListing
    name="chartAreaHeight"
    options="number"
    defaultValue="180"
>

Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX.

</PropListing>
<PropListing
    name="xAxisTitle"
    options={['true', 'string', 'false']}
    defaultValue="false"
>

Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false

</PropListing>
<PropListing
    name="yAxisTitle"
    options={['true', 'string', 'false']}
    defaultValue="false"
>

Name to show beside y-axis. If 'true', formatted column name is used.

</PropListing>
<PropListing
    name="xGridlines"
    options={['true', 'false']}
    defaultValue="false"
>

Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)

</PropListing>
<PropListing
    name="yGridlines"
    options={['true', 'false']}
    defaultValue="true"
>

Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)

</PropListing>
<PropListing
    name="xAxisLabels"
    options={['true', 'false']}
    defaultValue="true"
>

Turns on/off value labels on the x-axis

</PropListing>
<PropListing
    name="yAxisLabels"
    options={['true', 'false']}
    defaultValue="true"
>

Turns on/off value labels on the y-axis

</PropListing>
<PropListing
    name="xBaseline"
    options={['true', 'false']}
    defaultValue="true"
>

Turns on/off thick axis line (line appears at y=0)

</PropListing>
<PropListing
    name="yBaseline"
    options={['true', 'false']}
    defaultValue="false"
>

Turns on/off thick axis line (line appears directly alongside the y-axis labels)

</PropListing>
<PropListing
    name="xTickMarks"
    options={['true', 'false']}
    defaultValue="false"
>

Turns on/off tick marks for each of the x-axis labels

</PropListing>
<PropListing
    name="yTickMarks"
    options={['true', 'false']}
    defaultValue="false"
>

Turns on/off tick marks for each of the y-axis labels

</PropListing>
<PropListing
    name="yMin"
    options="number"
>

Starting value for the y-axis

</PropListing>
<PropListing
    name="yMax"
    options="number"
>

Maximum value for the y-axis

</PropListing>
<PropListing
    name="yScale"
    options={['true', 'false']}
    defaultValue="false"
>

Whether to scale the y-axis to fit your data. yMin and yMax take precedence over yScale

</PropListing>
<PropListing
    name="options"
    options="object"
>

JavaScript object to add or override chart configuration settings (see Custom Charts page)

</PropListing>
<PropListing
    name="colorPalette"
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
>

Array of custom colours to use for the chart. E.g., `{['#cf0d06','#eb5752','#e88a87']}`

</PropListing>
<PropListing
    name="seriesColors"
    options="object with series names and assigned colors"
    defaultValue="colors applied by order of series in data"
>

Apply a specific color to each series in your chart. Unspecified series will receive colors from the built-in palette as normal. Note the double curly braces required in the syntax `seriesColors={{"Canada": "red", "US": "blue"}}`

</PropListing>
<PropListing
    name="renderer"
    options={['canvas', 'svg']}
    defaultValue="canvas"
>
<PropListing
    name="downloadableData"
    description="Whether to show the download button to allow users to download the data"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>
<PropListing
    name="downloadableImage"
    description="Whether to show the button to allow users to save the chart as an image"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>

Which chart renderer type (canvas or SVG) to use. See ECharts' [documentation on renderers](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg).

</PropListing>


# Line `<Line/>`

```markdown
<Chart data={query_name}>
    <Line/>
</Chart>
```

## Options

<PropListing
    name="y"
    options="column name | array of column names"
    defaultValue="y supplied to Chart"
>

Column(s) to use for the y-axis of the chart. Can be different than the y supplied to Chart

</PropListing>
<PropListing
    name="series"
    options="column name"
    defaultValue="series supplied to Chart"
>

Column to use as the series (groups) in a multi-series chart. Can be different than the series supplied to Chart

</PropListing>
<PropListing
    name="name"
    options="string"
>

Name to show in legend for a single series (to override column name)

</PropListing>
<PropListing
    name="lineColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color to override default series color. Only accepts a single color.

</PropListing>
<PropListing
    name="lineOpacity"
    options="number (0 to 1)"
    defaultValue="1"
>

% of the full color that should be rendered, with remainder being transparent

</PropListing>
<PropListing
    name="lineType"
    options={['solid', 'dashed', 'dotted']}
    defaultValue="solid"
>

Options to show breaks in a line (dashed or dotted)

</PropListing>
<PropListing
    name="lineWidth"
    options="number"
    defaultValue="2"
>

Thickness of line (in pixels)

</PropListing>
<PropListing
    name="markers"
    options={['true', 'false']}
    defaultValue="false"
>

Turn on/off markers (shapes rendered onto the points of a line)

</PropListing>
<PropListing
    name="markerShape"
    options={['circle', 'emptyCircle', 'rect', 'triangle', 'diamond']}
    defaultValue="circle"
>

Shape to use if markers=true

</PropListing>
<PropListing
    name="markerSize"
    options="number"
    defaultValue="8"
>

Size of each shape (in pixels)

</PropListing>
<PropListing
    name="handleMissing"
    options={['gap', 'connect', 'zero']}
    defaultValue="gap"
>

Treatment of missing values in the dataset

</PropListing>
<PropListing
    name="options"
    options="object"
>

JavaScript object to add or override chart configuration settings (see Custom Charts page)

</PropListing>




# Area `<Area/>`

```markdown
<Chart data={query_name}>
    <Area/>
</Chart>
```

## Options

<PropListing
    name="y"
    options="column name | array of column names"
    defaultValue="y supplied to Chart"
>

Column(s) to use for the y-axis of the chart. Can be different than the y supplied to Chart

</PropListing>
<PropListing
    name="series"
    options="column name"
    defaultValue="series supplied to Chart"
>

Column to use as the series (groups) in a multi-series chart. Can be different than the series supplied to Chart

</PropListing>
<PropListing
    name="name"
    options="string"
>

Name to show in legend for a single series (to override column name)

</PropListing>
<PropListing
    name="fillColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color to override default series color. Only accepts a single color.

</PropListing>
<PropListing
    name="fillOpacity"
    options="number (0 to 1)"
    defaultValue="0.7"
>

% of the full color that should be rendered, with remainder being transparent

</PropListing>
<PropListing
    name="line"
    options={['true', 'false']}
    defaultValue="true"
>

Show line on top of the area

</PropListing>
<PropListing
    name="handleMissing"
    options={['gap', 'connect', 'zero']}
    defaultValue="gap (single series) | zero (multi-series)"
>

Treatment of missing values in the dataset

</PropListing>
<PropListing
    name="options"
    options="object"
>

JavaScript object to add or override chart configuration settings (see Custom Charts page)

</PropListing>

# Bar `<Bar/>`

```markdown
<Chart data={query_name}>
    <Bar/>
</Chart>
```

## Options

<PropListing
    name="y"
    options="column name"
>

Column to use for the y-axis of the chart

</PropListing>
<PropListing
    name="name"
    options="string"
>

Name to show in legend for a single series (to override column name)

</PropListing>
<PropListing
    name="type"
    options={['stacked', 'grouped']}
    defaultValue="stacked"
>

Grouping method to use for multi-series charts

</PropListing>
<PropListing
    name="stackName"
    options="string"
>

Name for an individual stack. If separate Bar components are used with different stackNames, the chart will show multiple stacks

</PropListing>
<PropListing
    name="fillColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color to override default series color. Only accepts a single color.

</PropListing>
<PropListing
    name="fillOpacity"
    options="number (0 to 1)"
    defaultValue="1"
>

% of the full color that should be rendered, with remainder being transparent

</PropListing>
<PropListing
    name="outlineWidth"
    options="number"
    defaultValue="0"
>

Width of line surrounding each bar

</PropListing>
<PropListing
    name="outlineColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color to use for outline if outlineWidth > 0

</PropListing>
<PropListing
    name="options"
    options="object"
>

JavaScript object to add or override chart configuration settings (see Custom Charts page)

</PropListing>

# Scatter `<Scatter/>`

```markdown
<Chart data={query_name}>
    <Scatter/>
</Chart>
```

## Options

<PropListing
    name="y"
    options="column name"
>

Column to use for the y-axis of the chart

</PropListing>
<PropListing
    name="name"
    options="string"
>

Name to show in legend for a single series (to override column name)

</PropListing>
<PropListing
    name="shape"
    options={['circle', 'emptyCircle', 'rect', 'triangle', 'diamond']}
    defaultValue="circle"
>

Options for which shape to use for scatter points

</PropListing>
<PropListing
    name="pointSize"
    options="number"
    defaultValue="10"
>

Change size of all points on the chart

</PropListing>
<PropListing
    name="opacity"
    options="number (0 to 1)"
    defaultValue="0.7"
>

% of the full color that should be rendered, with remainder being transparent

</PropListing>
<PropListing
    name="fillColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color to override default series color. Only accepts a single color.

</PropListing>
<PropListing
    name="outlineWidth"
    options="number"
    defaultValue="0"
>

Width of line surrounding each shape

</PropListing>
<PropListing
    name="outlineColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color to use for outline if outlineWidth > 0

</PropListing>
<PropListing
    name="options"
    options="object"
>

JavaScript object to add or override chart configuration settings (see Custom Charts page)

</PropListing>

# Bubble `<Bubble/>`

```markdown
<Chart data={query_name}>
    <Bubble/>
</Chart>
```

## Options

<PropListing
    name="y"
    options="column name"
>

Column to use for the y-axis of the chart

</PropListing>
<PropListing
    name="size"
    options="column name"
>

Column to use to scale the size of the bubbles

</PropListing>
<PropListing
    name="name"
    options="string"
>

Name to show in legend for a single series (to override column name)

</PropListing>
<PropListing
    name="shape"
    options={['circle', 'emptyCircle', 'rect', 'triangle', 'diamond']}
    defaultValue="circle"
>

Options for which shape to use for bubble points

</PropListing>
<PropListing
    name="minSize"
    options="number"
    defaultValue="200"
>

Minimum bubble size

</PropListing>
<PropListing
    name="maxSize"
    options="number"
    defaultValue="400"
>

Maximum bubble size

</PropListing>
<PropListing
    name="opacity"
    options="number (0 to 1)"
    defaultValue="0.7"
>

% of the full color that should be rendered, with remainder being transparent

</PropListing>
<PropListing
    name="fillColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color to override default series color. Only accepts a single color.

</PropListing>
<PropListing
    name="outlineWidth"
    options="number"
    defaultValue="0"
>

Width of line surrounding each shape

</PropListing>
<PropListing
    name="outlineColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color to use for outline if outlineWidth > 0

</PropListing>
<PropListing
    name="options"
    options="object"
>

JavaScript object to add or override chart configuration settings (see Custom Charts page)

</PropListing>

# Hist `<Hist/>`

```markdown
<Chart data={query_name}>
    <Hist/>
</Chart>
```

## Options

<PropListing
    name="x"
    options="column name"
>

Column which contains the data you want to summarize

</PropListing>
<PropListing
    name="fillColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color to override default series color

</PropListing>
<PropListing
    name="fillOpacity"
    options="number (0 to 1)"
    defaultValue="1"
>

% of the full color that should be rendered, with remainder being transparent

</PropListing>
<PropListing
    name="options"
    options="object"
>

JavaScript object to add or override chart configuration settings (see Custom Charts page)

</PropListing>

### Interactivity

<PropListing
    name="connectGroup"
>

Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected

</PropListing>

## Annotations

Mixed type charts can include [annotations](/components/charts/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<Chart data={sales_data} x=date y=sales>
  <Line y=sales/>
  <ReferenceLine data={target_data} y=target label=name/>
  <ReferenceArea xMin='2020-03-14' xMax='2020-05-01'/>
</Chart>
```