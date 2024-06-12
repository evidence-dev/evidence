---
title: Calendar Heatmap
sidebar_position: 1
---

<img src="/img/calendar-heatmap-noyear.png" width="700"/>

```markdown
<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    title="Calendar Heatmap"
    subtitle="Daily Orders"
    yearLabel=false
/>
```

## Examples

### Multi-year Calendar Heatmap

<img src="/img/calendar-heatmap-multiyear.png" width="700"/>

```markdown
<CalendarHeatmap 
    data={orders_by_day} 
    date=date 
    value=orders 
    title="Calendar Heatmap"
    subtitle="Daily Sales"
/>
```

### Custom Color Palette

<img src="/img/calendar-heatmap-customcolor.png" width="700"/>

```markdown
<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    title="Calendar Heatmap"
    subtitle="Daily Orders"
    colorPalette={['navy', 'lightyellow', 'purple']}
/>
```

### Without Year Label

<img src="/img/calendar-heatmap-noyear.png" width="700"/>

```markdown
<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    title="Calendar Heatmap"
    subtitle="Daily Orders"
    yearLabel=false
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
    name="date"
    required
    options="column name"
>

Date column to use for the calendar

</PropListing>
<PropListing 
    name="value"
    required
    options="column name"
>

Numeric column to use for the y-axis

</PropListing>
<PropListing 
    name="min"
    options="number"
    defaultValue="min of value column"
>

Minimum number for the calendar heatmap's color scale

</PropListing>
<PropListing 
    name="max"
    options="number"
    defaultValue="max of value column"
>

Maximum number for the calendar heatmap's color scale

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
    name="colorPalette"
    options="array of color codes - e.g., {`colorPalette={['navy', 'white', '#c9c9c9']}`}"
>

Array of colors to form the gradient for the heatmap. Remember to wrap your array in curly braces.

</PropListing>
<PropListing 
    name="valueFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for value column ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing 
    name="yearLabel"
    options={['true', 'false']}
    defaultValue="true"
>

Turn on or off year label on left of chart

</PropListing>
<PropListing 
    name="monthLabel"
    options={['true', 'false']}
    defaultValue="true"
>

Turn on or off month label on top of chart

</PropListing>
<PropListing 
    name="dayLabel"
    options={['true', 'false']}
    defaultValue="true"
>

Turn on or off day label on left of chart

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
    defaultValue="auto set based on y-axis values"
>

Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX.

</PropListing>
<PropListing 
    name="legend"
    options={['true', 'false']}
    defaultValue="true"
>

Turn on or off the legend

</PropListing>
<PropListing 
    name="filter"
    options={['true', 'false']}
    defaultValue="false"
>

Allow draggable filtering on the legend. Must be used with `legend=true`

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