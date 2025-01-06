---
title: 'Area Chart'
sidebar_position: 1
queries:
- orders_by_month.sql
- orders_by_category_2021.sql
---

<DocTab>
    <div slot='preview'>
        <AreaChart 
            data={orders_by_month}
            x=month
            y=sales
        />
    </div>

```markdown
<AreaChart 
    data={orders_by_month}
    x=month
    y=sales
/>
```
</DocTab>

## Examples

### Area

<DocTab>
    <div slot='preview'>
        <AreaChart 
            data={orders_by_month}
            x=month
            y=sales
        />
    </div>

```markdown
<AreaChart 
    data={orders_by_month}
    x=month
    y=sales
/>
```
</DocTab>



### Stacked

<DocTab>
    <div slot='preview'>
        <AreaChart 
            data={orders_by_category_2021}
            x=month
            y=sales
            series=category
        />
    </div>

```markdown
<AreaChart 
    data={orders_by_category_2021}
    x=month
    y=sales
    series=category
/>
```
</DocTab>


### 100% Stacked

<DocTab>
    <div slot='preview'>
        <AreaChart 
            data={orders_by_category_2021}
            x=month
            y=sales
            series=category
            type=stacked100
        />
    </div>

```markdown
<AreaChart 
    data={orders_by_category_2021}
    x=month
    y=sales
    series=category
    type=stacked100
/>
```
</DocTab>


### Stepped Line

<DocTab>
    <div slot='preview'>
        <AreaChart 
            data={orders_by_category_2021}
            x=month
            y=sales
            series=category
            step=true
        />
    </div>

```markdown
<AreaChart 
    data={orders_by_category_2021}
    x=month
    y=sales
    series=category
    step=true
/>
```
</DocTab>


### Y-Axis Formatting

<DocTab>
    <div slot='preview'>
        <AreaChart 
            data={orders_by_month}
            x=month
            y=sales
            yFmt=usd0
        />
    </div>

```markdown
<AreaChart 
    data={orders_by_month}
    x=month
    y=sales
    yFmt=usd0
/>
```
</DocTab>


### Labels

<DocTab>
    <div slot='preview'>
        <AreaChart 
            data={orders_by_month}
            x=month
            y=sales
            labels=true
            labelFmt=usd1k
        />
    </div>

```markdown
<AreaChart 
    data={orders_by_month}
    x=month
    y=sales
    labels=true
    labelFmt=usd0k
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
    defaultValue="-"
/>
<PropListing
    name="sort"
    description="Whether to apply default sort to your data. Default sort is x ascending for number and date x-axes, and y descending for category x-axes"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>
<PropListing
    name="type"
    description="Grouping method to use for multi-series charts"
    required=false
    options={["stacked", "stacked100"]}
    defaultValue="stacked"
/>
<PropListing
    name="handleMissing"
    description="Treatment of missing values in the dataset"
    required=false
    options={["gap", "connect", "zero"]}
    defaultValue="gap (single series) | zero (multi-series)"
/>
<PropListing
    name="emptySet"
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    required=false
    options={["error", "warn", "pass"]}
    defaultValue="error"
/>
<PropListing
    name="emptyMessage"
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    required=false
    options="string"
    defaultValue="No records"
/>

### Formatting & Styling

<PropListing
    name="xFmt"
    description="Format to use for x column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    required=false
    options="Excel-style format | built-in format name | custom format name"
    defaultValue="-"
/>
<PropListing
    name="yFmt"
    description="Format to use for y column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    required=false
    options="Excel-style format | built-in format name | custom format name"
    defaultValue="-"
/>
<PropListing
    name="seriesLabelFmt"
    description="Format to use for series label (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    required=false
    options="Excel-style format | built-in format name | custom format name"
    defaultValue="-"
/>
<PropListing
    name="step"
    description="Specifies whether the chart is displayed as a step line."
    required=false
    options={["true", "false"]}
    defaultValue="false"
/>
<PropListing
    name="stepPosition"
    description="Configures the position of turn points for a step line chart."
    required=false
    options={["start", "middle", "end"]}
    defaultValue="end"
/>
<PropListing
    name="fillColor"
    description="Color to override default series color. Only accepts a single color."
    required=false
    options="CSS name | hexademical | RGB | HSL"
    defaultValue="-"
/>
<PropListing
    name="lineColor"
    description="Color to override default line color. Only accepts a single color."
    required=false
    options="CSS name | hexademical | RGB | HSL"
    defaultValue="-"
/>
<PropListing
    name="fillOpacity"
    description="% of the full color that should be rendered, with remainder being transparent"
    required=false
    options="number (0 to 1)"
    defaultValue="0.7"
/>
<PropListing
    name="line"
    description="Show line on top of the area"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>
<PropListing
    name="colorPalette"
    description="Array of custom colours to use for the chart E.g., ['#cf0d06','#eb5752','#e88a87'] Note that the array must be surrounded by curly braces."
    required=false
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
/>
<PropListing
    name="seriesColors"
    description="Apply a specific color to each series in your chart. Unspecified series will receive colors from the built-in palette as normal. Note the double curly braces required in the syntax"
    required=false
    options="object with series names and assigned colors seriesColors={`{{'Canada': 'red', 'US': 'blue'}}`}"
    defaultValue="colors applied by order of series in data"
/>
<PropListing
    name="seriesOrder"
    description="Apply a specific order to the series in a multi-series chart."
    required=false
    options="Array of series names in the order they should be used in the chart seriesOrder={`{['series one', 'series two']}`}"
    defaultValue="default order implied by the data"
/>

### Value Labels

<PropListing
    name="labels"
    description="Show value labels"
    required=false
    options={["true", "false"]}
    defaultValue="false"
/>
<PropListing
    name="labelSize"
    description="Font size of value labels"
    required=false
    options="number"
    defaultValue="11"
/>
<PropListing
    name="labelPosition"
    description="Where label will appear on your series"
    required=false
    options={["above", "middle", "below"]}
    defaultValue="above"
/>
<PropListing
    name="labelColor"
    description="Font color of value labels"
    required=false
    options="CSS name | hexademical | RGB | HSL"
    defaultValue="Automatic based on color contrast of background"
/>
<PropListing
    name="labelFmt"
    description="Format to use for value labels (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    required=false
    options="Excel-style format | built-in format name | custom format name"
    defaultValue="same as y column"
/>
<PropListing
    name="showAllLabels"
    description="Allow all labels to appear on chart, including overlapping labels"
    required=false
    options={["true", "false"]}
    defaultValue="false"
/>


### Axes

<PropListing
    name="yLog"
    description="Whether to use a log scale for the y-axis"
    options={["true", "false"]}
    defaultValue="false"
/>
<PropListing
    name="yLogBase"
    description="Base to use when log scale is enabled"
    options="number"
    defaultValue="10"
/>
<PropListing
    name="xAxisTitle"
    description="Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false"
    options={["true", "string", "false"]}
    defaultValue="false"
/>
<PropListing
    name="yAxisTitle"
    description="Name to show beside y-axis. If 'true', formatted column name is used."
    required=false
    options={["true", "string", "false"]}
    defaultValue="false"
/>
<PropListing
    name="xGridlines"
    description="Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)"
    required=false
    options={["true", "false"]}
    defaultValue="false"
/>
<PropListing
    name="yGridlines"
    description="Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>
<PropListing
    name="xAxisLabels"
    description="Turns on/off value labels on the x-axis"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>
<PropListing
    name="yAxisLabels"
    description="Turns on/off value labels on the y-axis"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>
<PropListing
    name="xBaseline"
    description="Turns on/off thick axis line (line appears at y=0)"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>
<PropListing
    name="yBaseline"
    description="Turns on/off thick axis line (line appears directly alongside the y-axis labels)"
    required=false
    options={["true", "false"]}
    defaultValue="false"
/>
<PropListing
    name="xTickMarks"
    description="Turns on/off tick marks for each of the x-axis labels"
    required=false
    options={["true", "false"]}
    defaultValue="false"
/>
<PropListing
    name="yTickMarks"
    description="Turns on/off tick marks for each of the y-axis labels"
    required=false
    options={["true", "false"]}
    defaultValue="false"
/>
<PropListing
    name="yMin"
    description="Starting value for the y-axis"
    required=false
    options="number"
    defaultValue="-"
/>
<PropListing
    name="yMax"
    description="Maximum value for the y-axis"
    required=false
    options="number"
    defaultValue="-"
/>
<PropListing
    name="yScale"
    description="Whether to scale the y-axis to fit your data. `yMin` and `yMax` take precedence over `yScale`"
    required=false
    options={["true", "false"]}
    defaultValue="false"
/>

### Chart

<PropListing
    name="title"
    description="Chart title. Appears at top left of chart."
    required=false
    options="string"
    defaultValue="-"
/>
<PropListing
    name="subtitle"
    description="Chart subtitle. Appears just under title."
    required=false
    options="string"
    defaultValue="-"
/>
<PropListing
    name="legend"
    description="Turns legend on or off. Legend appears at top center of chart."
    required=false
    options={["true", "false"]}
    defaultValue="true for multiple series"
/>
<PropListing
    name="chartAreaHeight"
    description="Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX."
    required=false
    options="number"
    defaultValue="180"
/>
<PropListing
    name="renderer"
    description="Which chart renderer type (canvas or SVG) to use. See ECharts' <a href='https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/' class=markdown>documentation on renderers</a>."
    required=false
    options={["canvas", "svg"]}
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
    required=false
    options="{`{{exampleOption:'exampleValue'}}`}"
    defaultValue="-"
/>
<PropListing
    name="seriesOptions"
    description="Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions` See <a href='/components/charts/echarts-options' class=markdown>reference page</a> for available options."
    required=false
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
    defaultValue="-"
/>
<PropListing
    name="printEchartsConfig"
    description="Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options"
    required=false
    options={["true", "false"]}
    defaultValue="false"
/>


### Interactivity

<PropListing
    name=connectGroup
    description="Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected"
/>

## Annotations

Area charts can include [annotations](/components/charts/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<AreaChart data={sales_data} x=date y=sales>
	<ReferenceLine data={target_data} y=target label=name />
	<ReferenceArea xMin='2020-03-14' xMax='2020-05-01' />
</AreaChart>
```
