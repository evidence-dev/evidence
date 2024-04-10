---
title: Bubble Chart
sidebar_position: 1
---

![bubble](/img/exg-multi-series-bubble-nt.svg)

```markdown
<BubbleChart 
    data={query_name} 
    x=column_x 
    y=column_y
    size=column_size
/>
```

## Examples

### Bubble

![bubble](/img/exg-bubble-nt.svg)

```markdown
<BubbleChart 
    data={simple_example} 
    x=x 
    y=y 
    size=size 
    xAxisTitle=true 
    yAxisTitle=true
/>
```

### Multi-Series Bubble

![bubble](/img/exg-multi-series-bubble-nt.svg)

```markdown
<BubbleChart 
    data={scores_by_region} 
    x=score_a 
    y=score_b 
    size=size 
    series=region 
    xAxisTitle=true 
    yAxisTitle=true
/>
```

## Options

### Data

<PropListing 
    name="data"
    description="Query name, wrapped in curly braces"
    required=true
    options="query name"
/>
<PropListing 
    name="x"
    description="Column to use for the x-axis of the chart"
    required=true
    options="column name"
    defaultValue="First column"
/>
<PropListing 
    name="y"
    description="Column(s) to use for the y-axis of the chart"
    required=true
    options="column name | array of column names"
    defaultValue="Any non-assigned numeric columns"
/>
<PropListing 
    name="series"
    description="Column to use as the series (groups) in a multi-series chart"
    required=false
    options="column name"
/>
<PropListing 
    name="size"
    description="Column to use to scale the size of the bubbles"
    required=true
    options="column name"
/>
<PropListing 
    name="sort"
    description="Whether to apply default sort to your data. Default is x ascending for number and date x-axes, and y descending for category x-axes"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing 
    name="tooltipTitle"
    description="Column to use as the title for each tooltip. Typically, this is a name to identify each point."
    required=false
    options="column name"
/>
<PropListing 
    name="emptySet"
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    required=false
    options={['error', 'warn', 'pass']}
    defaultValue='error'
/>
<PropListing 
    name="emptyMessage"
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    required=false
    options="string"
    defaultValue='No records'
/>

### Formatting & Styling

<PropListing 
    name="xFmt"
    description="Format to use for x column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    required=false
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing 
    name="yFmt"
    description="Format to use for y column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    required=false
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing 
    name="sizeFmt"
    description="Format to use for size column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    required=false
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing 
    name="shape"
    description="Options for which shape to use for bubble points"
    required=false
    options="circle | emptyCircle | rect | triangle | diamond"
    defaultValue='circle'
/>
<PropListing 
    name="scaleTo"
    description="Scale the size of the bubbles by this factor (e.g., 2 will double the size)"
    required=false
    options="number"
    defaultValue=1
/>
<PropListing 
    name="opacity"
    description="% of the full color that should be rendered, with remainder being transparent"
    required=false
    options="number (0 to 1)"
    defaultValue=0.7
/>
<PropListing 
    name="fillColor"
    description="Color to override default series color. Only accepts a single color."
    required=false
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing 
    name="outlineWidth"
    description="Width of line surrounding each shape"
    required=false
    options="number"
    defaultValue=0
/>
<PropListing 
    name="outlineColor"
    description="Color to use for outline if outlineWidth > 0"
    required=false
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing 
    name="colorPalette"
    description="Array of custom colours to use for the chart. E.g., ['#cf0d06','#eb5752','#e88a87'] Note that the array must be surrounded by curly braces."
    required=false
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue='built-in color palette'
/>
<PropListing 
    name="seriesColors"
    description="Apply a specific color to each series in your chart. Unspecified series will receive colors from the built-in palette as normal. Note the double curly braces required in the syntax"
    required=false
    options="object with series names and assigned colors"
    defaultValue='colors applied by order of series in data'
/>

### Axes

<PropListing 
    name="yLog"
    description="Whether to use a log scale for the y-axis"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing 
    name="yLogBase"
    description="Base to use when log scale is enabled"
    required=false
    options="number"
    defaultValue=10
/>
<PropListing 
    name="xAxisTitle"
    description="Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false"
    required=false
    options="true | string | false"
    defaultValue=true
/>
<PropListing 
    name="yAxisTitle"
    description="Name to show beside y-axis. If 'true', formatted column name is used."
    required=false
    options="true | string | false"
    defaultValue=true
/>
<PropListing 
    name="xGridlines"
    description="Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing 
    name="yGridlines"
    description="Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing 
    name="xAxisLabels"
    description="Turns on/off value labels on the x-axis"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing 
    name="yAxisLabels"
    description="Turns on/off value labels on the y-axis"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing 
    name="xBaseline"
    description="Turns on/off thick axis line (line appears at y=0)"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing 
    name="yBaseline"
    description="Turns on/off thick axis line (line appears directly alongside the y-axis labels)"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing 
    name="xTickMarks"
    description="Turns on/off tick marks for each of the x-axis labels"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing 
    name="yTickMarks"
    description="Turns on/off tick marks for each of the y-axis labels"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing 
    name="yMin"
    description="Starting value for the y-axis"
    required=false
    options="number"
/>
<PropListing 
    name="yMax"
    description="Maximum value for the y-axis"
    required=false
    options="number"
/>

### Chart

<PropListing 
    name="title"
    description="Chart title. Appears at top left of chart."
    required=false
    options="string"
/>
<PropListing 
    name="subtitle"
    description="Chart subtitle. Appears just under title."
    required=false
    options="string"
/>
<PropListing 
    name="legend"
    description="Turns legend on or off. Legend appears at top center of chart."
    required=false
    options={['true', 'false']}
    defaultValue='true for multiple series'
/>
<PropListing 
    name="chartAreaHeight"
    description="Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX."
    required=false
    options="number"
    defaultValue=180
/>
<PropListing 
    name="renderer"
    description="Which chart renderer type (canvas or SVG) to use. See ECharts' <a href='https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/' class=markdown>documentation on renderers</a>."
    required=false
    options="canvas | svg"
    defaultValue='canvas'
/>

### Custom Echarts Options

<PropListing 
    name="echartsOptions"
    description="Custom Echarts options to override the default options. See <a href='/components/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleOption:'exampleValue'}}`}"
/>
<PropListing 
    name="seriesOptions"
    description="Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions` See <a href='/components/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
/>
<PropListing 
    name="printEchartsConfig"
    description="Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options"
    options={['true', 'false']}
    defaultValue="false"
/>


### Interactivity

<PropListing
    name=connectGroup
    description="Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected"
/>

### Interactivity

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	
    <td>connectGroup</td>	
    <td>Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same <code>connectGroup</code> name will become connected</td>	
    <td class='tcenter'>-</td>	
    <td class='tcenter'>string</td>	
    <td class='tcenter'>-</td>	
</tr>
</table>

## Annotations

Bubble charts can include [annotations](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<BubbleChart data={sales_data} x=date y=sales>
  <ReferenceLine data={target_data} y=target label=name/>
  <ReferenceArea xMin='2020-03-14' xMax='2020-05-01'/>
</BubbleChart>
```