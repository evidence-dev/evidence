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
    description="Query name, wrapped in curly braces"
    required=true
    options="query name"
/>
<PropListing
    name=x
    description="Column to use for the x-axis of the chart"
    options="column name"
    defaultValue="First column"
/>
<PropListing
    name=y
    description="Column(s) to use for the y-axis of the chart"
    options="column name | array of column names"
    defaultValue="Any non-assigned numeric columns"
/>
<PropListing
    name=y2
    description="Column(s) to include on a secondary y-axis"
    options="column name | array of column names"
/>
<PropListing
    name=y2SeriesType
    description="Chart type to apply to the series on the y2 axis"
    options={['bar', 'line', 'scatter']}
    defaultValue=bar
/>
<PropListing
    name=series
    description="Column to use as the series (groups) in a multi-series chart"
    options="column name"
/>
<PropListing
    name=sort
    description="Whether to apply default sort to your data. Default sort is x ascending for number and date x-axes, and y descending for category x-axes"
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=type
    description="Grouping method to use for multi-series charts"
    options={['stacked', 'grouped', 'stacked100']}
    defaultValue=stacked
/>
<PropListing
    name=stackName
    description="Name for an individual stack. If separate Bar components are used with different stackNames, the chart will show multiple stacks"
    options="string"
/>
<PropListing
    name=emptySet
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    options={['error', 'warn', 'pass']}
    defaultValue=error
/>
<PropListing
    name=emptyMessage
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    options="string"
    defaultValue="No records"
/>

### Formatting & Styling

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
    name=y2Fmt
    description="Format to use for y2 column(s) (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
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
    defaultValue=1
/>
<PropListing
    name=outlineWidth
    description="Width of line surrounding each bar"
    options="number"
    defaultValue=0
/>
<PropListing
    name=outlineColor
    description="Color to use for outline if outlineWidth > 0"
    options="CSS name | hexademical | RGB | HSL"
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

### Value Labels

<PropListing
    name=labels
    description="Show value labels"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=stackTotalLabel
    description="Whether to show a total at the top of stacked bar chart"
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=labelSize
    description="Font size of value labels"
    options="number"
    defaultValue=11
/>
<PropListing
    name=labelPosition
    description="Where label will appear on your series"
    options={['outside', 'inside']}
    defaultValue="Single Series: outside, Stacked: inside, Grouped: outside"
/>
<PropListing
    name=labelColor
    description="Font color of value labels"
    options="CSS name | hexademical | RGB | HSL"
    defaultValue="Automatic based on color contrast of background"
/>
<PropListing
    name=labelFmt
    description="Format to use for value labels (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
    defaultValue="same as y column"
/>
<PropListing
    name=yLabelFmt
    description="Format to use for value labels for series on the y axis. Overrides any other formats (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing
    name=y2LabelFmt
    description="Format to use for value labels for series on the y2 axis. Overrides any other formats (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing
    name=showAllLabels
    description="Allow all labels to appear on chart, including overlapping labels"
    options={['true', 'false']}
    defaultValue=false
/>

### Axes

<PropListing
    name=swapXY
    description="Swap the x and y axes to create a horizontal chart"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=yLog
    description="Whether to use a log scale for the y-axis"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=yLogBase
    description="Base to use when log scale is enabled"
    options="number"
    defaultValue=10
/>
<PropListing
    name=xAxisTitle
    description="Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false"
    options={['true', 'string', 'false']}
    defaultValue=false
/>
<PropListing
    name=yAxisTitle
    description="Name to show beside y-axis. If 'true', formatted column name is used."
    options={['true', 'string', 'false']}
    defaultValue=false
/>
<PropListing
    name=y2AxisTitle
    description="Name to show beside y2 axis. If 'true', formatted column name is used."
    options={['true', 'string', 'false']}
    defaultValue=false
/>
<PropListing
    name=xGridlines
    description="Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=yGridlines
    description="Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)"
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=y2Gridlines
    description="Turns on/off gridlines extending from y2-axis tick marks (horizontal lines when swapXY=false)"
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=xAxisLabels
    description="Turns on/off value labels on the x-axis"
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=yAxisLabels
    description="Turns on/off value labels on the y-axis"
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=y2AxisLabels
    description="Turns on/off value labels on the y2-axis"
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=xBaseline
    description="Turns on/off thick axis line (line appears at y=0)"
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=yBaseline
    description="Turns on/off thick axis line (line appears directly alongside the y-axis labels)"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=y2Baseline
    description="Turns on/off thick axis line (line appears directly alongside the y2-axis labels)"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=xTickMarks
    description="Turns on/off tick marks for each of the x-axis labels"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=yTickMarks
    description="Turns on/off tick marks for each of the y-axis labels"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=y2TickMarks
    description="Turns on/off tick marks for each of the y2-axis labels"
    options={['true', 'false']}
    defaultValue=false
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
    description="Whether to scale the y-axis to fit your data. `yMin` and `yMax` take precedence over `yScale`"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=y2Min
    description="Starting value for the y2-axis"
    options="number"
/>
<PropListing
    name=y2Max
    description="Maximum value for the y2-axis"
    options="number"
/>
<PropListing
    name=y2Scale
    description="Whether to scale the y-axis to fit your data. `y2Min` and `y2Max` take precedence over `y2Scale`"
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=showAllXAxisLabels
    description="Force every x-axis value to be shown. This can truncate labels if there are too many."
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=yAxisColor
    description="Turns on/off color on the y-axis (turned on by default when secondary y-axis is used). Can also be used to set a specific color"
    options={['true', 'false', 'color string (CSS name | hexademical | RGB | HSL)']}
    defaultValue="true when y2 used; false otherwise"
/>

### Chart

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
    defaultValue=180
/>
<PropListing
    name=renderer
    description="Which chart renderer type (canvas or SVG) to use. See ECharts' <a href='https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/' class=markdown>documentation on renderers</a>."
    options={['canvas', 'svg']}
    defaultValue=canvas
/>

### Custom Echarts Options

<PropListing
    name=echartsOptions
    description="Custom Echarts options to override the default options. See <a href='/components/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleOption:'exampleValue'}}`}"
/>
<PropListing
    name=seriesOptions
    description="Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions` See <a href='/components/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
/>
<PropListing
    name=printEchartsConfig
    description="Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options"
    options={['true', 'false']}
    defaultValue=false
/>

### Interactivity

<PropListing
    name=connectGroup
    description="Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected"
/>



## Annotations

Bar charts can include [annotations](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<BarChart data={sales_data} x=date y=sales>
  <ReferenceLine data={target_data} y=target label=name/>
  <ReferenceArea xMin='2020-03-14' xMax='2020-05-01'/>
</BarChart>
```