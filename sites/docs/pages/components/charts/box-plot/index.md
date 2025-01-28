---
title: Box Plot
description: Summarize the distribution and range of a metric around the median value.
sidebar_position: 1
queries: 
- sales_distribution_by_channel.sql
---

Use box plots to summarize the distribution and range of a metric around the median value.

<DocTab>
    <div slot='preview'>
        <BoxPlot 
            data={sales_distribution_by_channel}
            title="Daily Sales Distribution by Channel"
            name=channel
            intervalBottom=first_quartile
            midpoint=median
            intervalTop=third_quartile
            yFmt=usd0
        />
    </div>

```markdown
<BoxPlot 
    data={sales_distribution_by_channel}
    name=channel
    intervalBottom=first_quartile
    midpoint=median
    intervalTop=third_quartile
    yFmt=usd0
/>
```
</DocTab>


## Data Structure
The BoxPlot component requires pre-aggregated data, with one row per box you would like to display. There are 2 ways to pass in the values needed to construct the box:

**1. Explicitly define each value (e.g., `min`, `intervalBottom`, `midpoint`, `intervalTop`, `max`)**

```sql boxplot
select 
    channel as name,
    first_quartile as intervalBottom,
    median as midpoint,
    third_quartile as intervalTop
from ${sales_distribution_by_channel}
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
select 
    channel as name,
    median as midpoint,
    20 as confidence_interval
from ${sales_distribution_by_channel}
```

<DataTable data={boxplot_with_confidence_interval} formatColumnTitles=false>
    <Column id="name" />
    <Column id="midpoint" fmt=num2/>
    <Column id="confidence_interval" fmt=num2/>
</DataTable>

## Examples

### Basic Box Plot

<DocTab>
    <div slot='preview'>
        <BoxPlot 
            data={sales_distribution_by_channel}
            name=channel
            intervalBottom=first_quartile
            midpoint=median
            intervalTop=third_quartile
            yFmt=usd0
        />
    </div>

```markdown
<BoxPlot 
    data={sales_distribution_by_channel}
    name=channel
    intervalBottom=first_quartile
    midpoint=median
    intervalTop=third_quartile
    yFmt=usd0
/>
```
</DocTab>


### Horizontal Box Plot

<DocTab>
    <div slot='preview'>
        <BoxPlot 
            data={sales_distribution_by_channel}
            name=channel
            intervalBottom=first_quartile
            midpoint=median
            intervalTop=third_quartile
            yFmt=usd0
            swapXY=true
        />
    </div>

```markdown
<BoxPlot 
    data={sales_distribution_by_channel}
    name=channel
    intervalBottom=first_quartile
    midpoint=median
    intervalTop=third_quartile
    yFmt=usd0
    swapXY=true
/>
```
</DocTab>


### Box Plot with Whiskers

<DocTab>
    <div slot='preview'>
        <BoxPlot 
            data={sales_distribution_by_channel}
            name=channel
            min=min
            intervalBottom=first_quartile
            midpoint=median
            intervalTop=third_quartile
            max=max
            yFmt=usd0
            yMin=0
        />
    </div>

```markdown
<BoxPlot 
    data={sales_distribution_by_channel}
    name=channel
    min=min
    intervalBottom=first_quartile
    midpoint=median
    intervalTop=third_quartile
    max=max
    yFmt=usd0
/>
```
</DocTab>

### Box Plot with Custom Colors

<DocTab>
    <div slot='preview'>
        <BoxPlot 
            data={sales_distribution_by_channel}
            name=channel
            intervalBottom=first_quartile
            midpoint=median
            intervalTop=third_quartile
            yFmt=usd0
            color=color
        />
    </div>

```markdown
<BoxPlot 
    data={sales_distribution_by_channel}
    name=channel
    intervalBottom=first_quartile
    midpoint=median
    intervalTop=third_quartile
    yFmt=usd0
    color=color
/>
```
</DocTab>

## Options

### Data

<PropListing 
    name="data"
    description="Query name, wrapped in curly braces"
    required=true
    options="query name"
/>
<PropListing 
    name="name"
    description="Column to use for the names of each box in your plot"
    required=true
    options="column name"
/>
<PropListing 
    name="min"
    description="Column containing minimum values, appearing as whisker"
    options="column name"
/>
<PropListing 
    name="intervalBottom"
    description="Column containing values for bottom of box"
    options="column name"
/>
<PropListing 
    name="midpoint"
    description="Column containing values for midpoint of box"
    required=true
    options="column name"
/>
<PropListing 
    name="intervalTop"
    description="Column containing values for top of box"
    options="column name"
/>
<PropListing 
    name="max"
    description="Column containing maximum values, appearing as whisker"
    options="column name"
/>
<PropListing 
    name="confidenceInterval"
    description="Column containing value to use in place of intervalBottom and intervalTop. Is subtracted from midpoint to get the bottom and added to midpoint to get the top"
    options="column name"
/>
<PropListing 
    name="emptySet"
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    options={['error', 'warn', 'pass']}
    defaultValue="error"
/>
<PropListing 
    name="emptyMessage"
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    options="string"
    defaultValue="No records"
/>

### Formatting & Styling

<PropListing 
    name="color"
    description="Column containing color strings"
    options="column name"
/>
<PropListing 
    name="yFmt"
    description="Format to use for y column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing 
    name="seriesColors"
    description="Apply a specific color to each series in your chart. Unspecified series will receive colors from the built-in palette as normal."
    options="object with series names and assigned colors"
    defaultValue="colors applied by order of series in data"
/>
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
    name="swapXY"
    description="Swap the x and y axes to create a horizontal chart"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing 
    name="xAxisTitle"
    description="Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false"
    options={['true', 'string', 'false']}
    defaultValue="false"
/>
<PropListing 
    name="yAxisTitle"
    description="Name to show beside y-axis. If 'true', formatted column name is used."
    options={['true', 'string', 'false']}
    defaultValue="false"
/>
<PropListing 
    name="xGridlines"
    description="Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing 
    name="yGridlines"
    description="Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing 
    name="xAxisLabels"
    description="Turns on/off value labels on the x-axis"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing 
    name="yAxisLabels"
    description="Turns on/off value labels on the y-axis"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing 
    name="xBaseline"
    description="Turns on/off thick axis line (line appears at y=0)"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing 
    name="yBaseline"
    description="Turns on/off thick axis line (line appears directly alongside the y-axis labels)"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing 
    name="xTickMarks"
    description="Turns on/off tick marks for each of the x-axis labels"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing 
    name="yTickMarks"
    description="Turns on/off tick marks for each of the y-axis labels"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing 
    name="yMin"
    description="Starting value for the y-axis"
    options="number"
/>
<PropListing 
    name="yMax"
    description="Maximum value for the y-axis"
    options="number"
/>

### Chart

<PropListing 
    name="title"
    description="Chart title. Appears at top left of chart."
    options="string"
/>
<PropListing 
    name="subtitle"
    description="Chart subtitle. Appears just under title."
    options="string"
/>
<PropListing 
    name="chartAreaHeight"
    description="Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX."
    options="number"
    defaultValue="180"
/>
<PropListing 
    name="renderer"
    description="Which chart renderer type (canvas or SVG) to use. See ECharts' <a href='https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/' class=markdown>documentation on renderers</a>."
    options={['canvas', 'svg']}
    defaultValue="canvas"
/>
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

### Custom Echarts Options

<PropListing 
    name="echartsOptions"
    description="Custom Echarts options to override the default options. See <a href='/components/charts/echarts-options' class=markdown>reference page</a> for available options."
    options="{`{{exampleOption:'exampleValue'}}`}"
/>
<PropListing 
    name="seriesOptions"
    description="Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions` See <a href='/components/charts/echarts-options' class=markdown>reference page</a> for available options."
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


## Annotations

Box plots can include [annotations](/components/charts/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

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