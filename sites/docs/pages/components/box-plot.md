---
title: Box Plot
sidebar_position: 1
---

<img src="/img/boxplot-basic.png" width="700"/>

```markdown
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    confidenceInterval=confidence
    yFmt='+0.0%;-0.0%;0'
/>
```

## Data Structure
The BoxPlot component requires pre-aggregated data, with one row per box you would like to display. There are 2 ways to pass in the values needed to construct the box:

**1. Explicitly define each value (e.g., `min`, `intervalBottom`, `midpoint`, `intervalTop`, `max`)**

```sql boxplot
SELECT 'Experiment A' as name, 0.02 as intervalBottom, 0.04 as midpoint, 0.08 as intervalTop
UNION ALL
SELECT 'Experiment B' as name, -0.01 as intervalBottom, 0.01 as midpoint, 0.02 as intervalTop
```

<DataTable data={boxplot} formatColumnTitles=false>
    <Column id="name" />
    <Column id="intervalBottom" fmt=num2/>
    <Column id="midpoint" fmt=num2/>
    <Column id="intervalTop" fmt=num2/>
</DataTable>

This example table excludes whiskers which would be defined with `min` and `max` columns

**2. Define a `midpoint` and a `confidenceInterval` - this will add the interval to the midpoint to get the max, and subtract to get the min**

```sql boxplot_with_confidence_interval
SELECT 'Experiment A' as name, 0.04 as midpoint, 0.03 as confidenceInterval
UNION ALL
SELECT 'Experiment B' as name, 0.01 as midpoint, 0.04 as confidenceInterval
```

<DataTable data={boxplot_with_confidence_interval} formatColumnTitles=false>
    <Column id="name" />
    <Column id="midpoint" fmt=num2/>
    <Column id="confidenceInterval" fmt=num2/>
</DataTable>

## Examples

### Basic Box Plot

<img src="/img/boxplot-basic.png" width="700"/>

```markdown
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    confidenceInterval=confidence
    yFmt='+0.0%;-0.0%;0'
/>
```

### Horizontal Box Plot

<img src="/img/boxplot-horiz.png" width="700"/>

```markdown
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    confidenceInterval=confidence
    swapXY=true
    yFmt='+0.0%;-0.0%;0'
/>
```

### Box Plot with Whiskers

<img src="/img/boxplot-whiskers.png" width="700"/>

```markdown
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    min=min
    max=max
    confidenceInterval=confidence
    yFmt='+0.0%;-0.0%;0'
/>
```

### Box Plot with Custom Colors

<img src="/img/boxplot-color.png" width="700"/>

```markdown
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    min=min
    max=max
    color=color
    confidenceInterval=confidence
    swapXY=true
    yFmt='+0.0%;-0.0%;0'
/>
```

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
    name="name"
    required
    options="column name"
>

Column to use for the names of each box in your plot

</PropListing>
<PropListing
    name="min"
    options="column name"
>

Column containing minimum values, appearing as whisker

</PropListing>
<PropListing
    name="intervalBottom"
    options="column name"
>

Column containing values for bottom of box

</PropListing>
<PropListing
    name="midpoint"
    required
    options="column name"
>

Column containing values for midpoint of box

</PropListing>
<PropListing
    name="intervalTop"
    options="column name"
>

Column containing values for top of box

</PropListing>
<PropListing
    name="max"
    options="column name"
>

Column containing maximum values, appearing as whisker

</PropListing>
<PropListing
    name="confidenceInterval"
    options="column name"
>

Column containing value to use in place of intervalBottom and intervalTop. Is subtracted from midpoint to get the bottom and added to midpoint to get the top

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
    name="color"
    options="column name"
>

Column containing color strings

</PropListing>
<PropListing
    name="yFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for y column ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name="seriesColors"
    options="object with series names and assigned colors"
    defaultValue="colors applied by order of series in data"
>

Apply a specific color to each series in your chart. Unspecified series will receive colors from the built-in palette as normal.

</PropListing>

### Axes

<PropListing
    name="swapXY"
    options={['true', 'false']}
    defaultValue="false"
>

Swap the x and y axes to create a horizontal chart

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
    name="showAllXAxisLabels"
    options={['true', 'false']}
    defaultValue="false"
>

Force every x-axis value to be shown. This can truncate labels if there are too many.

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

Which chart renderer type (canvas or SVG) to use. See ECharts' [documentation on renderers](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/).

</PropListing>

### Custom Echarts Options

<PropListing
    name="echartsOptions"
    options="{`{{exampleOption:'exampleValue'}}`}"
>

Custom Echarts options to override the default options. See [reference page](/components/echarts-options/) for available options.

</PropListing>
<PropListing
    name="seriesOptions"
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
>

Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions`. See [reference page](/components/echarts-options/) for available options.

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
    name=connectGroup
>

Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected

</PropListing>


## Annotations

Box plots can include [annotations](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    confidenceInterval=confidence
>
    <ReferenceLine y=0.04 label='Target'/>
</BoxPlot>
```