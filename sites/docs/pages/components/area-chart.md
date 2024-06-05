---
title: 'Area Chart'
sidebar_position: 1
---

![area](/img/exg-area-nt.svg)

```markdown
<AreaChart 
    data={query_name} 
    x=column_x 
    y=column_y
/>
```

## Examples

### Area

![area](/img/exg-area-nt.svg)

```markdown
<AreaChart 
    data={fed_reserve_district_sf} 
    x=established_date 
    y=banks_created
/>
```

### Stacked Area

![stacked-area](/img/exg-stacked-area-nt.svg)

```markdown
<AreaChart 
    data={fed_reserve_district}  
    x=established_date 
    y=banks_created
    series=fed_reserve_district
/>
```

### 100% Stacked Area

![100-stacked-area](/img/100-stacked-area.svg)

```markdown
<AreaChart 
    data={fed_reserve_district}  
    x=established_date 
    y=banks_created
    series=fed_reserve_district
    type=stacked100
/>
```

### Area with Step Line

<img src='/img/exg-multi-series-step-area.png' width='576px'/>

```markdown
<AreaChart
    data={simpler_bar}
    x=year
    y=value
    series=country
    step=true
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
    name="x"
    required
    options="column name"
    defaultValue="First column"
>

Column to use for the x-axis of the chart

</PropListing>
<PropListing
    name="y"
    required
    options="column name | array of column names"
    defaultValue="Any non-assigned numeric columns"
>

Column(s) to use for the y-axis of the chart

</PropListing>
<PropListing
    name="series"
    options="column name"
    defaultValue="-"
>

Column to use as the series (groups) in a multi-series chart

</PropListing>
<PropListing
    name="sort"
    options={["true", "false"]}
    defaultValue="true"
>

Whether to apply default sort to your data. Default sort is x ascending for number and date x-axes, and y descending for category x-axes

</PropListing>
<PropListing
    name="type"
    options={["stacked", "stacked100"]}
    defaultValue="stacked"
>

Grouping method to use for multi-series charts

</PropListing>
<PropListing
    name="handleMissing"
    options={["gap", "connect", "zero"]}
    defaultValue="gap (single series) | zero (multi-series)"
>

Treatment of missing values in the dataset

</PropListing>
<PropListing
    name="emptySet"
    options={["error", "warn", "pass"]}
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
    defaultValue="-"
>

Format to use for x column ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name="yFmt"
    options="Excel-style format | built-in format name | custom format name"
    defaultValue="-"
>

Format to use for y column ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name="step"
    options={["true", "false"]}
    defaultValue="false"
>

Specifies whether the chart is displayed as a step line.

</PropListing>
<PropListing
    name="stepPosition"
    options={["start", "middle", "end"]}
    defaultValue="end"
>

Configures the position of turn points for a step line chart.

</PropListing>
<PropListing
    name="fillColor"
    options="CSS name | hexademical | RGB | HSL"
    defaultValue="-"
>

Color to override default series color. Only accepts a single color.

</PropListing>
<PropListing
    name="lineColor"
    options="CSS name | hexademical | RGB | HSL"
    defaultValue="-"
>

Color to override default line color. Only accepts a single color.

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
    options={["true", "false"]}
    defaultValue="true"
>

Show line on top of the area

</PropListing>
<PropListing
    name="colorPalette"
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
>

Array of custom colours to use for the chart 

E.g. `{['#cf0d06', '#eb5752', '#e88a87']}` 

Note that an array must be surrounded by curly braces.

</PropListing>
<PropListing
    name="seriesColors"
    options="object with series names and assigned colors"
    defaultValue="colors applied by order of series in data"
>

Apply a specific color to each series in your chart. Unspecified series will receive colors from the built-in palette as normal. Note the double curly braces required in the syntax `seriesColors={{"Canada": "red", "US": "blue"}}`

</PropListing>

### Value Labels
<PropListing
    name="labels"
    options={["true", "false"]}
    defaultValue="false"
>

Show value labels

</PropListing>
<PropListing
    name="labelSize"
    options="number"
    defaultValue="11"
>

Font size of value labels

</PropListing>
<PropListing
    name="labelPosition"
    options={["above", "middle", "below"]}
    defaultValue="above"
>

Where label will appear on your series

</PropListing>
<PropListing
    name="labelColor"
    options="CSS name | hexademical | RGB | HSL"
    defaultValue="Automatic based on color contrast of background"
>

Font color of value labels

</PropListing>
<PropListing
    name="labelFmt"
    options="Excel-style format | built-in format name | custom format name"
    defaultValue="same as y column"
>

Format to use for value labels ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name="showAllLabels"
    options={["true", "false"]}
    defaultValue="false"
>

Allow all labels to appear on chart, including overlapping labels

</PropListing>

### Axes

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
    name="yMin"
    options="number"
    defaultValue="-"
>

Starting value for the y-axis

</PropListing>
<PropListing
    name="yMax"
    options="number"
    defaultValue="-"
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

### Chart
<PropListing
    name="title"
    options="string"
    defaultValue="-"
>

Chart title. Appears at top left of chart.

</PropListing>
<PropListing
    name="subtitle"
    options="string"
    defaultValue="-"
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
    name="echartsOptions"
    options="{`{{exampleOption:'exampleValue'}}`}"
    defaultValue="-"
>

Custom Echarts options to override the default options. See [reference page](/components/echarts-options/) for available options.

</PropListing>
<PropListing
    name="seriesOptions"
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
    defaultValue="-"
>

Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions`. See [reference page](/components/echarts-options/) for available options.

</PropListing>
<PropListing
    name="printEchartsConfig"
    options={["true", "false"]}
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

Area charts can include [annotations](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<AreaChart data="{sales_data}" x="date" y="sales">
	<ReferenceLine data="{target_data}" y="target" label="name" />
	<ReferenceArea xMin="2020-03-14" xMax="2020-05-01" />
</AreaChart>
```
