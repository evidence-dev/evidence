---
title: Histogram
sidebar_position: 1
---

![histogram](/img/exg-histogram-nt.svg)

```markdown
<Histogram
    data={query_name} 
    x=column_x 
/>
```

## Examples

### Histogram

![histogram](/img/exg-histogram-nt.svg)

```markdown
<Histogram 
    data={complaints_by_day_dept} 
    x=complaints 
    xAxisTitle="Daily Calls"
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
    description="Column which contains the data you want to summarize"
    required=true
    options="column name"
/>
<PropListing
    name=emptySet
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    required=false
    options={['error', 'warn', 'pass']}
    defaultValue="error"
/>
<PropListing
    name=emptyMessage
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    required=false
    options="string"
    defaultValue="No records"
/>

### Formatting & Styling

<PropListing
    name=xFmt
    description="Format to use for x column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    required=false
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing
    name=fillColor
    description="Color to override default series color"
    required=false
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=fillOpacity
    description="% of the full color that should be rendered, with remainder being transparent"
    required=false
    options="number (0 to 1)"
    defaultValue="1"
/>
<PropListing
    name=colorPalette
    description="Array of custom colours to use for the chart. E.g., <code class=markdown>{`{['#cf0d06','#eb5752','#e88a87']}`}</code>"
    required=false
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
/>

### Axes

<PropListing
    name=xAxisTitle
    description="Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false"
    required=false
    options={['true', 'string', 'false']}
    defaultValue="false"
/>
<PropListing
    name=yAxisTitle
    description="Name to show beside y-axis. If 'true', formatted column name is used."
    required=false
    options={['true', 'string', 'false']}
    defaultValue="false"
/>
<PropListing
    name=xGridlines
    description="Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)"
    required=false
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=yGridlines
    description="Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)"
    required=false
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=xAxisLabels
    description="Turns on/off value labels on the x-axis"
    required=false
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=yAxisLabels
    description="Turns on/off value labels on the y-axis"
    required=false
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=xBaseline
    description="Turns on/off thick axis line (line appears at y=0)"
    required=false
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=yBaseline
    description="Turns on/off thick axis line (line appears directly alongside the y-axis labels)"
    required=false
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=xTickMarks
    description="Turns on/off tick marks for each of the x-axis labels"
    required=false
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=yTickMarks
    description="Turns on/off tick marks for each of the y-axis labels"
    required=false
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=yMin
    description="Starting value for the y-axis"
    required=false
    options="number"
/>
<PropListing
    name=yMax
    description="Maximum value for the y-axis"
    required=false
    options="number"
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
    defaultValue="180"
/>
<PropListing
    name=renderer
    description="Which chart renderer type (canvas or SVG) to use. See ECharts' <a href='https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/' class=markdown>documentation on renderers</a>."
    options={['canvas', 'svg']}
    defaultValue="canvas"
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

Histograms can include [annotations](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<Histogram data={sales_data} x=category>
  <ReferenceLine y=20/>
  <ReferenceArea xMin=3 xMax=8/>
</Histogram>
```