---
title: Funnel Chart
sidebar_position: 1
---

<img src="/img/funnel-default.png" width="700"/>

```markdown
<FunnelChart 
    data={query_name} 
    nameCol=column_name
    valueCol=column_value
/>
```

## Examples

### Ascending

<img src="/img/funnel-asc.png" width="700"/>

```markdown
<FunnelChart 
    data={query_name} 
    nameCol=column_name
    valueCol=column_value
    funnelSort=ascending
/>
```

### Alignment

<img src="/img/funnel-align.png" width="700"/>

```markdown
<FunnelChart 
    data={query_name} 
    nameCol=column_name
    valueCol=column_value
    funnelAlign=left
/>
```

### Show Percent Label

<img src="/img/funnel-showpct.png" alt="funnel-show-percent" width="700"/>

```markdown
<FunnelChart 
    data={query_name} 
    nameCol=column_name
    valueCol=column_value
    showPercent=true
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
    name="nameCol"
    required
    options="column name"
>

Column to use for the name of the chart

</PropListing>
<PropListing 
    name="valueCol"
    required
    options="column name"
>

Column to use for the value of the chart

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
<PropListing 
    name="valueFmt"
    options="Excel-style format | built-in format | custom format"
>

Format to use for `valueCol` ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing 
    name="outlineColor"
    options="CSS name | hexademical | RGB | HSL"
    defaultValue="transparent"
>

Border color. Only accepts a single color.

</PropListing>
<PropListing 
    name="outlineWidth"
    options="number"
    defaultValue="1"
>

Border Width. It should be a natural number.

</PropListing>
<PropListing 
    name="labelPosition"
    options={['left', 'right', 'inside']}
    defaultValue="inside"
>

Position of funnel item's label.

</PropListing>
<PropListing 
    name="showPercent"
    options={['true', 'false']}
    defaultValue="false"
>

Show percentage in data labels

</PropListing>
<PropListing 
    name="funnelSort"
    options={['none', 'ascending', 'descending']}
    defaultValue="none"
>

Data sorting of the chart.

</PropListing>
<PropListing 
    name="funnelAlign"
    options={['left', 'right', 'center']}
    defaultValue="center"
>

Alignment of funnel.

</PropListing>
<PropListing 
    name="colorPalette"
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
>

Array of custom colours to use for the chart. E.g., `{['#cf0d06','#eb5752','#e88a87']}`

</PropListing>
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
    defaultValue="true"
>

Turns legend on or off. Legend appears at top center of chart.

</PropListing>
<PropListing 
    name="renderer"
    options={['canvas', 'svg']}
    defaultValue="canvas"
>

Which chart renderer type (canvas or SVG) to use. See ECharts' [documentation on renderers](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/).

</PropListing>
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

Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions` See [reference page](/components/echarts-options/) for available options.

</PropListing>
<PropListing 
    name="printEchartsConfig"
    options={['true', 'false']}
    defaultValue="false"
>

Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options

</PropListing>
<PropListing 
    name="connectGroup"
>

Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected

</PropListing>
