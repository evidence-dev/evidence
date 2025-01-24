---
title: Histogram
description: Display the distribution of a metric along a continuous range, aggregated into buckets.
sidebar_position: 1
---

Use histograms to display the distribution of a metric along a continuous range, aggregated into buckets.

```sql orders
select * from needful_things.orders limit 1000
```
```sql orders_week
select * from needful_things.orders limit 10000
```

<DocTab>
    <div slot='preview'>
        <Histogram
        data={orders}
        x=sales
        />
    </div>

```markdown
<Histogram
    data={orders}
    x=sales
/>
```
</DocTab>


## Examples

### Histogram

<DocTab>
    <div slot='preview'>
        <Histogram
        data={orders_week}
        x=sales
        xAxisTitle="Weekly Sales"
        />
    </div>

```markdown
<Histogram
    data={orders_week}
    x=sales
    xAxisTitle="Weekly Sales"
/>
```
</DocTab>

## Options

### Data

<PropListing 
    name="data"
    required
    options="query name"
>

Query name, wrapped in curly braces

</PropListing>
<PropListing 
    name="x"
    required
    options="column name"
>

Column which contains the data you want to summarize

</PropListing>
<PropListing 
    name="emptySet"
    options={['error', 'warn', 'pass']}
    defaultValue="error"
>

Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.

</PropListing>
<PropListing 
    name="emptyMessage"
    options="string"
    defaultValue="No records"
>

Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).

</PropListing>

### Formatting & Styling

<PropListing 
    name="xFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for x column ([see available formats](/core-concepts/formatting))

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
    name="colorPalette"
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
>

Array of custom colours to use for the chart. E.g., `{['#cf0d06','#eb5752','#e88a87']}`

</PropListing>
<PropListing
    name=leftPadding
    description="Number representing the padding (whitespace) on the left side of the chart. Useful to avoid labels getting cut off"
    options="number"
/>
<PropListing
    name=rightPadding
    description="Number representing the padding (whitespace) on the left side of the chart. Useful to avoid labels getting cut off"
    options="number"
/>
<PropListing
    name=xLabelWrap
    description="Whether to wrap x-axis labels when there is not enough space. Default behaviour is to truncate the labels."
    options={["true", "false"]}
    defaultValue="false"
/>

### Axes

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

### Custom Echarts Options

<PropListing
    name="echartsOptions"
    options="{`{{exampleOption:'exampleValue'}}`}"
>

Custom Echarts options to override the default options. See [reference page](/components/charts/echarts-options) for available options.

</PropListing>
<PropListing
    name="seriesOptions"
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
>

Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions` See [reference page](/components/charts/echarts-options) for available options.

</PropListing>
<PropListing
    name="printEchartsConfig"
    options={['true', 'false']}
    defaultValue="false"
>

Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options

</PropListing>

### Interactivity

<PropListing
    name="connectGroup"
>

Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected

</PropListing>



## Annotations

Histograms can include [annotations](/components/charts/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<Histogram data={sales_data} x=category>
  <ReferenceLine y=20/>
  <ReferenceArea xMin=3 xMax=8/>
</Histogram>
```