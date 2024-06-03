---
title: Bar Chart
sidebar_position: 1
---

![bar](/img/exg-bar-nt.svg)

```markdown
<BarChart 
    data={query_name} 
    x=column_x 
    y=column_y
/>
```

## Examples

### Bar

![bar](/img/exg-bar-nt.svg)

```markdown
<BarChart 
    data={value_by_region} 
    x=region
    y=value 
    xAxisTitle=Region
/>
```

### Horizontal Bar

![bar](/img/exg-horizontal-bar-nt.svg)

```markdown
<BarChart 
    data={value_by_region}
    x=country 
    y=value 
    swapXY=true
/>
```

### Stacked Bar

![bar](/img/exg-stacked-bar-nt.svg)

```markdown
<BarChart 
    data={annual_value_by_region} 
    x=year 
    y=value 
    series=region
/>
```

### Stacked Bar with Value Labels

<img src='/img/stacked-value-labels.png' width="570px"/>

```markdown
<BarChart 
    data={annual_value_by_region} 
    x=year 
    y=value 
    series=region
    labels=true
    labelFmt=usd0k
/>
```

### 100% Stacked Bar

![bar](/img/100-stacked-bar.svg)

```markdown
<BarChart 
    data={annual_value_by_region} 
    x=year 
    y=value 
    series=region
    type=stacked100
/>
```

### Horizontal Stacked Bar

![bar](/img/exg-horizontal-stacked-bar-nt.svg)

```markdown
<BarChart 
    data={annual_value_by_region} 
    swapXY=true 
    x=year 
    y=value 
    series=region 
    xType=category 
    sort=false
/>
```

### Horizontal 100% Stacked Bar

![bar](/img/100-horiz-stacked-bar.svg)

```markdown
<BarChart 
    data={annual_value_by_region} 
    swapXY=true 
    x=year 
    y=value 
    series=region 
    type=stacked100
    xType=category 
    sort=false
/>
```

### Grouped Bar

![bar](/img/exg-grouped-bar-nt.svg)

```markdown
<BarChart 
    data={annual_value_by_region} 
    x=year 
    y=value 
    series=region 
    type=grouped
/>
```

### Horizontal Grouped Bar

![bar](/img/exg-horizontal-grouped-bar-nt.svg)

```markdown
<BarChart 
    data={annual_value_by_region} 
    swapXY=true 
    x=year 
    y=value 
    series=region 
    type=grouped 
    xType=category
/>
```

### Custom Color Palette

<img src="/img/bar-colorpalette.png"  width='700px'/>

```markdown
<BarChart 
    data={orders_by_month} 
    x=month 
    y=sales 
    series=category 
    colorPalette={
        [
        '#cf0d06',
        '#eb5752',
        '#e88a87',
        '#fcdad9',
        ]
    }
/>
```

### Long Bar Chart

If you create a bar chart with many x-axis items (e.g., names of departments), Evidence will extend the height of the chart for you to avoid the bars becoming squished. See Long Bar example below.

![long-bar](/img/exg-long-bar.svg)

```markdown
<BarChart 
    data={complaints_by_category} 
    x=category 
    y=complaints 
    swapXY=true 
    yAxisTitle="Calls Received" 
/>
```

### Secondary y Axis

<img src="/img/bar-y2.png"  width='700px'/>

```markdown
<BarChart 
    data={orders_by_month} 
    x=month 
    y=sales_usd0k 
    y2=num_orders_num0
/>
```

### Secondary Axis with Line

<img src="/img/bar-line.png"  width='700px'/>

```markdown
<BarChart
    data={orders_by_month} 
    x=month 
    y=sales_usd0k 
    y2=num_orders_num0 
    y2SeriesType=line 
    colorPalette={['rgb(110,117,176,0.8)','rgb(37,91,161)']}
/>
```

## Options

### Data

<PropListing
    name=data
    options="query name"
    required
>

Query name, wrapped in curly braces

</PropListing>
<PropListing
    name=x
    options="column name"
    defaultValue="First column"
>

Column to use for the x-axis of the chart

</PropListing>
<PropListing
    name=y
    options="column name | array of column names"
    defaultValue="Any non-assigned numeric columns"
>

Column(s) to use for the y-axis of the chart

</PropListing>
<PropListing
    name=y2
    options="column name | array of column names"
>

Column(s) to include on a secondary y-axis

</PropListing>
<PropListing
    name=y2SeriesType
    options={['bar', 'line', 'scatter']}
    defaultValue=bar
>

Chart type to apply to the series on the y2 axis

</PropListing>
<PropListing
    name=series
    options="column name"
>

Column to use as the series (groups) in a multi-series chart

</PropListing>
<PropListing
    name=sort
    options={['true', 'false']}
    defaultValue=true
>

Whether to apply default sort to your data. Default sort is x ascending for number and date x-axes, and y descending for category x-axes

</PropListing>
<PropListing
    name=type
    options={['stacked', 'grouped', 'stacked100']}
    defaultValue=stacked
>

Grouping method to use for multi-series charts

</PropListing>
<PropListing
    name=stackName
    options="string"
>

Name for an individual stack. If separate Bar components are used with different stackNames, the chart will show multiple stacks

</PropListing>
<PropListing
    name=emptySet
    options={['error', 'warn', 'pass']}
    defaultValue=error
>

Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.

</PropListing>
<PropListing
    name=emptyMessage
    options="string"
    defaultValue="No records"
>

Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).

</PropListing>

### Formatting & Styling

<PropListing
    name=xFmt
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for x column ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name=yFmt
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for y column ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name=y2Fmt
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for y2 column(s) ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name=fillColor
    options="CSS name | hexademical | RGB | HSL"
>

Color to override default series color. Only accepts a single color.

</PropListing>
<PropListing
    name=fillOpacity
    options="number (0 to 1)"
    defaultValue=1
>

% of the full color that should be rendered, with remainder being transparent

</PropListing>
<PropListing
    name=outlineWidth
    options="number"
    defaultValue=0
>

Width of line surrounding each bar

</PropListing>
<PropListing
    name=outlineColor
    options="CSS name | hexademical | RGB | HSL"
>

Color to use for outline if outlineWidth > 0

</PropListing>
<PropListing
    name=colorPalette
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
>

Array of custom colours to use for the chart. E.g., `{['#cf0d06','#eb5752','#e88a87']}`

</PropListing>
<PropListing
    name=seriesColors
    options="object with series names and assigned colors"
    defaultValue="colors applied by order of series in data"
>

Apply a specific color to each series in your chart. Unspecified series will receive colors from the built-in palette as normal. Note the double curly braces required in the syntax `seriesColors={{"Canada": "red", "US": "blue"}}`

</PropListing>

### Value Labels

<PropListing
    name=labels
    options={['true', 'false']}
    defaultValue=false
>

Show value labels

</PropListing>
<PropListing
    name=stackTotalLabel
    options={['true', 'false']}
    defaultValue=true
>

Whether to show a total at the top of stacked bar chart

</PropListing>
<PropListing
    name=labelSize
    options="number"
    defaultValue=11
>

Font size of value labels

</PropListing>
<PropListing
    name=labelPosition
    options={['outside', 'inside']}
    defaultValue="Single Series: outside, Stacked: inside, Grouped: outside"
>

Where label will appear on your series

</PropListing>
<PropListing
    name=labelColor
    options="CSS name | hexademical | RGB | HSL"
    defaultValue="Automatic based on color contrast of background"
>

Font color of value labels

</PropListing>
<PropListing
    name=labelFmt
    options="Excel-style format | built-in format name | custom format name"
    defaultValue="same as y column"
>

Format to use for value labels ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name=yLabelFmt
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for value labels for series on the y axis. Overrides any other formats ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name=y2LabelFmt
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for value labels for series on the y2 axis. Overrides any other formats ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name=showAllLabels
    options={['true', 'false']}
    defaultValue=false
>

Allow all labels to appear on chart, including overlapping labels

</PropListing>

### Axes

<PropListing
    name="swapXY"
    options={["true", "false"]}
    defaultValue="false"
>

Swap the x and y axes to create a horizontal chart

</PropListing>
<PropListing
    name="yLog"
    options={["true", "false"]}
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
    name="xAxisTitle"
    options={["true", "string", "false"]}
    defaultValue="false"
>

Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false

</PropListing>
<PropListing
    name="yAxisTitle"
    options={["true", "string", "false"]}
    defaultValue="false"
>

Name to show beside y-axis. If 'true', formatted column name is used.

</PropListing>
<PropListing
    name="y2AxisTitle"
    options={["true", "string", "false"]}
    defaultValue="false"
>

Name to show beside y2 axis. If 'true', formatted column name is used.

</PropListing>
<PropListing
    name="xGridlines"
    options={["true", "false"]}
    defaultValue="false"
>

Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)

</PropListing>
<PropListing
    name="yGridlines"
    options={["true", "false"]}
    defaultValue="true"
>

Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)

</PropListing>
<PropListing
    name="y2Gridlines"
    options={["true", "false"]}
    defaultValue="true"
>

Turns on/off gridlines extending from y2-axis tick marks (horizontal lines when swapXY=false)

</PropListing>
<PropListing
    name="xAxisLabels"
    options={["true", "false"]}
    defaultValue="true"
>

Turns on/off value labels on the x-axis

</PropListing>
<PropListing
    name="yAxisLabels"
    options={["true", "false"]}
    defaultValue="true"
>

Turns on/off value labels on the y-axis

</PropListing>
<PropListing
    name="y2AxisLabels"
    options={["true", "false"]}
    defaultValue="true"
>

Turns on/off value labels on the y2-axis

</PropListing>
<PropListing
    name="xBaseline"
    options={["true", "false"]}
    defaultValue="true"
>

Turns on/off thick axis line (line appears at y=0)

</PropListing>
<PropListing
    name="yBaseline"
    options={["true", "false"]}
    defaultValue="false"
>

Turns on/off thick axis line (line appears directly alongside the y-axis labels)

</PropListing>
<PropListing
    name="y2Baseline"
    options={["true", "false"]}
    defaultValue="false"
>

Turns on/off thick axis line (line appears directly alongside the y2-axis labels)

</PropListing>
<PropListing
    name="xTickMarks"
    options={["true", "false"]}
    defaultValue="false"
>

Turns on/off tick marks for each of the x-axis labels

</PropListing>
<PropListing
    name="yTickMarks"
    options={["true", "false"]}
    defaultValue="false"
>

Turns on/off tick marks for each of the y-axis labels

</PropListing>
<PropListing
    name="y2TickMarks"
    options={["true", "false"]}
    defaultValue="false"
>

Turns on/off tick marks for each of the y2-axis labels

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
    options={["true", "false"]}
    defaultValue="false"
>

Whether to scale the y-axis to fit your data. `yMin` and `yMax` take precedence over `yScale`

</PropListing>
<PropListing
    name="y2Min"
    options="number"
>

Starting value for the y2-axis

</PropListing>
<PropListing
    name="y2Max"
    options="number"
>

Maximum value for the y2-axis

</PropListing>
<PropListing
    name="y2Scale"
    options={["true", "false"]}
    defaultValue="false"
>

Whether to scale the y-axis to fit your data. `y2Min` and `y2Max` take precedence over `y2Scale`

</PropListing>
<PropListing
    name="showAllXAxisLabels"
    options={["true", "false"]}
    defaultValue="false"
>

Force every x-axis value to be shown. This can truncate labels if there are too many.

</PropListing>
<PropListing
    name="yAxisColor"
    options={["true", "false", "color"]}
    defaultValue="true when y2 used; false otherwise"
>

Turns on/off color on the y-axis (turned on by default when secondary y-axis is used). Can also be used to set a specific color

</PropListing>

### Chart

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
    options={["true", "false"]}
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
    name="renderer"
    options={["canvas", "svg"]}
    defaultValue="canvas"
>

Which chart renderer type (canvas or SVG) to use. See ECharts' [documentation on renderers](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/).

</PropListing>

### Custom Echarts Options

<PropListing
    name=echartsOptions
    options="{`{{exampleOption:'exampleValue'}}`}"
>

Custom Echarts options to override the default options. See [reference page](/components/echarts-options/) for available options.

</PropListing>
<PropListing
    name=seriesOptions
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
>

Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions`. See [reference page](/components/echarts-options/) for available options.

</PropListing>
<PropListing
    name=printEchartsConfig
    options={['true', 'false']}
    defaultValue=false
>

Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options

</PropListing>

### Interactivity

<PropListing
    name=connectGroup
>

Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected

</PropListing>


## Annotations

Bar charts can include [annotations](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<BarChart data={sales_data} x=date y=sales>
  <ReferenceLine data={target_data} y=target label=name/>
  <ReferenceArea xMin='2020-03-14' xMax='2020-05-01'/>
</BarChart>
```