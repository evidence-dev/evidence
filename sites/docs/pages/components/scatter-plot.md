---
title: Scatter Plot
sidebar_position: 1
---

![scatter-plot](/img/exg-scatter-nt.svg)

```markdown
<ScatterPlot 
    data={query_name} 
    x=column_x 
    y=column_y
/>
```

## Examples

### Scatter Plot

![scatter-plot](/img/exg-scatter-nt.svg)

```markdown
<ScatterPlot 
    data={census} 
    y=median_rent_usd 
    x=income_per_capita_usd 
    xAxisTitle="Income Per Capita" 
    yAxisTitle="Median Rent" 
/>
```

### Multi-Series Scatter Plot

![scatter-plot](/img/exg-multi-series-scatter-nt.svg)

```markdown
<ScatterPlot 
    data={scores_by_region} 
    x=score_a 
    y=score_b 
    series=region 
    xAxisTitle=true 
    yAxisTitle=true
/>
```

## Options

### Data

<PropListing
    name=data
    description="Query name, wrapped in curly braces"
    required
    options='query name'
/>
<PropListing
    name=x
    description="Column to use for the x-axis of the chart"
    required
    options='column name'
    defaultValue='First column'
/>
<PropListing
    name=y
    description="Column(s) to use for the y-axis of the chart"
    required
    options='column name | array of column names'
    defaultValue='Any non-assigned numeric columns'
/>
<PropListing
    name=series
    description="Column to use as the series (groups) in a multi-series chart"
    options='column name'
/>
<PropListing
    name=sort
    description="Whether to apply default sort to your data. Default is x ascending for number and date x-axes, and y descending for category x-axes"
    options={['true', 'false']}
    defaultValue='true'
/>
<PropListing
    name=tooltipTitle
    description="Column to use as the title for each tooltip. Typically, this is a name to identify each point."
    options='column name'
/>
<PropListing
    name=emptySet
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    options={['error', 'warn', 'pass']}
    defaultValue='error'
/>
<PropListing
    name=emptyMessage
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    options='string'
    defaultValue='No records'
/>

### Formatting & Styling

<PropListing
    name=xFmt
    description="Format to use for x column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options='Excel-style format | built-in format name | custom format name'
/>
<PropListing
    name=yFmt
    description="Format to use for y column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options='Excel-style format | built-in format name | custom format name'
/>
<PropListing
    name=shape
    description="Options for which shape to use for scatter points"
    options='circle | emptyCircle | rect | triangle | diamond'
    defaultValue='circle'
/>
<PropListing
    name=pointSize
    description="Change size of all points on the chart"
    options='number'
    defaultValue='10'
/>
<PropListing
    name=opacity
    description="% of the full color that should be rendered, with remainder being transparent"
    options='number (0 to 1)'
    defaultValue='0.7'
/>
<PropListing
    name=fillColor
    description="Color to override default series color. Only accepts a single color."
    options='CSS name | hexademical | RGB | HSL'
/>
<PropListing
    name=outlineWidth
    description="Width of line surrounding each shape"
    options='number'
    defaultValue='0'
/>
<PropListing
    name=outlineColor
    description="Color to use for outline if outlineWidth > 0"
    options='CSS name | hexademical | RGB | HSL'
/>
<PropListing
    name=colorPalette
    description="Array of custom colours to use for the chart. E.g., <code class=markdown>{`{['#cf0d06','#eb5752','#e88a87']}`}</code>"
    options='array of color strings (CSS name | hexademical | RGB | HSL)'
    defaultValue='built-in color palette'
/>
<PropListing
    name=seriesColors
    description="Apply a specific color to each series in your chart. Unspecified series will receive colors from the built-in palette as normal. Note the double curly braces required in the syntax"
    options='object with series names and assigned colors'
    defaultValue='colors applied by order of series in data'
/>

### Axes

<PropListing
    name=yLog
    description="Whether to use a log scale for the y-axis"
    options={['true', 'false']}
    defaultValue='false'
/>
<PropListing
    name=yLogBase
    description="Base to use when log scale is enabled"
    options='number'
    defaultValue='10'
/>
<PropListing
    name=xAxisTitle
    description="Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false"
    options='true | string | false'
    defaultValue='true'
/>
<PropListing
    name=yAxisTitle
    description="Name to show beside y-axis. If 'true', formatted column name is used."
    options='true | string | false'
    defaultValue='true'
/>
<PropListing
    name=xGridlines
    description="Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)"
    options={['true', 'false']}
    defaultValue='false'
/>
<PropListing
    name=yGridlines
    description="Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)"
    options={['true', 'false']}
    defaultValue='true'
/>
<PropListing
    name=xAxisLabels
    description="Turns on/off value labels on the x-axis"
    options={['true', 'false']}
    defaultValue='true'
/>
<PropListing
    name=yAxisLabels
    description="Turns on/off value labels on the y-axis"
    options={['true', 'false']}
    defaultValue='true'
/>
<PropListing
    name=xBaseline
    description="Turns on/off thick axis line (line appears at y=0)"
    options={['true', 'false']}
    defaultValue='true' 
/>
<PropListing
    name=yBaseline
    description="Turns on/off thick axis line (line appears directly alongside the y-axis labels)"
    options={['true', 'false']}
    defaultValue='false'
/>
<PropListing
    name=xTickMarks
    description="Turns on/off tick marks for each of the x-axis labels"
    options={['true', 'false']}
    defaultValue='false'
/>
<PropListing
    name=yTickMarks
    description="Turns on/off tick marks for each of the y-axis labels"
    options={['true', 'false']}
    defaultValue='false'
/>
<PropListing
    name=xMin
    description="Starting value for the x-axis"
    options='number'
/>
<PropListing
    name=xMax
    description="Maximum value for the x-axis"
    options='number'
/>
<PropListing
    name=yMin
    description="Starting value for the y-axis"
    options='number'
/>
<PropListing
    name=yMax
    description="Maximum value for the y-axis"
    options='number'
/>

### Chart

<PropListing
    name=title
    description="Chart title. Appears at top left of chart."
    options='string'
/>
<PropListing
    name=subtitle
    description="Chart subtitle. Appears just under title."
    options='string'
/>
<PropListing
    name=legend
    description="Turns legend on or off. Legend appears at top center of chart."
    options={['true', 'false']}
    defaultValue='true for multiple series'
/>
<PropListing
    name=chartAreaHeight
    description="Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX."
    options='number'
    defaultValue='180'
/>
<PropListing
    name=renderer
    description="Which chart renderer type (canvas or SVG) to use. See ECharts' <a href='https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/' class=markdown>documentation on renderers</a>."
    options='canvas | svg'
    defaultValue='canvas'
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
    defaultValue="false"
/>

## Annotations

Scatter plots can include [annotations](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<ScatterPlot data={sales_data} x=date y=sales>
  <ReferenceLine data={target_data} y=target label=name/>
  <ReferenceArea xMin='2020-03-14' xMax='2020-05-01'/>
</ScatterPlot>
```