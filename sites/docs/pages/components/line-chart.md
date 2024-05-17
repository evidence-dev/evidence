---
title: Line Chart
sidebar_position: 1
---

![line](/img/exg-line-nt.svg)

```markdown
<LineChart 
    data={query_name}  
    x=column_x 
    y=column_y
/>
```

## Examples

### Line

![line](/img/exg-line-nt.svg)

```markdown
<LineChart 
    data={daily_complaints} 
    x=date 
    y=number_of_complaints 
    yAxisTitle="calls to Austin 311 per day"
/>
```

### Multi-Series Line

![multi-series-line](/img/exg-multi-series-line-nt.svg)

```markdown
<LineChart 
    data={daily_volume_yoy} 
    x=day_of_year 
    y=cum_vol 
    series=year 
    yAxisTitle="cumulative calls" 
    xAxisTitle="day of year"
/>
```

### Multi-Series Line with Steps

<img src='/img/exg-multi-series-step-line.png' width='576px'/>

```markdown
<LineChart
    data={simpler_bar}
    x=year
    y=value
    series=country
    step=true
/>
```

### Multiple y Columns

![multiple-y-line](/img/exg-multiple-y-line-nt.svg)

```markdown
<LineChart
data={fda_recalls}  
 x=year
y={["voluntary_recalls", "fda_recalls"]}
/>
```

Because x is the first column in the dataset and we want to plot all the remaining numerical columns in the table, we can simplify our code down to:

```markdown
<LineChart data={fda_recalls}/>
```

Evidence will automatically pick the first column as `x` and use all other numerical columns for `y`.

### Secondary y Axis

<img src="/img/multi-y-axes.png"  width='700px'/>

```markdown
<LineChart 
    data={orders_by_month} 
    x=month 
    y=sales_usd0k 
    y2=num_orders_num0
/>
```

### Secondary Axis with Bar

<img src="/img/line-bar.png"  width='700px'/>

```markdown
<LineChart 
    data={orders_by_month} 
    x=month 
    y=sales_usd0k 
    y2=num_orders_num0
    y2SeriesType=bar
/>
```

### Value Labels

<img src="/img/line-labels.png"  width='700px'/>

```markdown
<LineChart 
    data={orders_by_month} 
    x=month
    y=sales
    yAxisTitle="Sales per Month"
    yFmt=eur0k
    labels=true
/>
```


### Custom Color Palette

<img src="/img/line-colorpalette.png"  width='700px'/>

```markdown
<LineChart 
  data={simpler_bar} 
  x=year 
  y=value 
  series=country
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

Column to use for the x-axis of the chart

</PropListing>
<PropListing
    name="y"
    required
    options="column name | array of column names"
>

Column(s) to use for the y-axis of the chart

</PropListing>
<PropListing
    name="y2"
    options="column name | array of column names"
>

Column(s) to include on a secondary y-axis

</PropListing>
<PropListing
    name="y2SeriesType"
    options={["line", "bar", "scatter"]}
    defaultValue="line"
>

Chart type to apply to the series on the y2 axis

</PropListing>
<PropListing
    name="series"
    options="column name"
>

Column to use as the series (groups) in a multi-series chart

</PropListing>
<PropListing
    name="sort"
    options={["true", "false"]}
    defaultValue="true"
>

Whether to apply default sort to your data. Default is x ascending for number and date x-axes, and y descending for category x-axes

</PropListing>
<PropListing
    name="handleMissing"
    options={["gap", "connect", "zero"]}
    defaultValue="gap"
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
>

Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).

</PropListing>

### Formatting & Styling

<PropListing
    name="xFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for x column

</PropListing>
<PropListing
    name="yFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for y column(s)

</PropListing>
<PropListing
    name="y2Fmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for y2 column(s)

</PropListing>
<PropListing
    name="step"
    options={["true", "false"]}
    defaultValue="false"
>

Specifies whether the chart is displayed as a step line

</PropListing>
<PropListing
    name="stepPosition"
    options={["start", "middle", "end"]}
    defaultValue="end"
>

Configures the position of turn points for a step line chart

</PropListing>
<PropListing
    name="lineColor"
    options="CSS name | hexademical | RGB | HSL"
>

Color to override default series color. Only accepts a single color

</PropListing>
<PropListing
    name="lineOpacity"
    options="number (0 to 1)"
    defaultValue="1"
>

% of the full color that should be rendered, with remainder being transparent

</PropListing>
<PropListing
    name="lineType"
    options={["solid", "dashed", "dotted"]}
    defaultValue="solid"
>

Options to show breaks in a line (dashed or dotted)

</PropListing>
<PropListing
    name="lineWidth"
    options="number"
    defaultValue="2"
>

Thickness of line (in pixels)

</PropListing>
<PropListing
    name="markers"
    options={["true", "false"]}
    defaultValue="false"
>

Turn on/off markers (shapes rendered onto the points of a line)

</PropListing>
<PropListing
    name="markerShape"
    options={["circle", "emptyCircle", "rect", "triangle", "diamond"]}
    defaultValue="circle"
>

Shape to use if markers=true

</PropListing>
<PropListing
    name="markerSize"
    options="number"
    defaultValue="8"
>

Size of each shape (in pixels)

</PropListing>
<PropListing
    name="colorPalette"
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
>

Array of custom colours to use for the chart. E.g., `{['#cf0d06','#eb5752','#e88a87']}`

</PropListing>
<PropListing
    name="seriesColors"
    options="object with series names and assigned colors"
>

Apply a specific color to each series in your chart. Unspecified series will receive colors from the built-in palette as normal. Note the double curly braces required in the syntax `seriesColors={{"Canada": "red", "US": "blue"}}`

</PropListing>
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
>

Font color of value labels

</PropListing>
<PropListing
    name="labelFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for value labels

</PropListing>
<PropListing
    name="yLabelFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for value labels for series on the y axis. Overrides any other formats

</PropListing>
<PropListing
    name="y2LabelFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for value labels for series on the y2 axis. Overrides any other formats

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

Turn legend on or off. Legend appears at top center of chart.

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
    name="connectGroup"
>

Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected

</PropListing>


## Annotations

Line charts can include [annotations](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<LineChart data="{sales_data}" x="date" y="sales">
	<ReferenceLine data="{target_data}" y="target" label="name" />
	<ReferenceArea xMin="2020-03-14" xMax="2020-05-01" />
</LineChart>
```
