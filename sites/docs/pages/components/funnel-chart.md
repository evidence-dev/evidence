---
title: Funnel Chart
sidebar_position: 1
---

```sql funnel_data
select * from (
    select 150 as customers, 'Show' as stage, 1 as stage_id
    union all
    select 102 as customers, 'Click' as stage, 2 as stage_id
    union all
    select 49 as customers, 'Visit' as stage, 3 as stage_id
    union all
    select 40 as customers, 'Inquiry' as stage, 4 as stage_id
    union all
    select 14 as customers, 'Order' as stage, 5 as stage_id
) order by stage_id asc
```

<FunnelChart 
    data={funnel_data} 
    nameCol=stage
    valueCol=customers
/>

```markdown
<FunnelChart 
    data={funnel_data} 
    nameCol=stage
    valueCol=customers
/>
```

## Examples

### Ascending

<FunnelChart 
    data={funnel_data} 
    nameCol=stage
    valueCol=customers
    funnelSort=ascending
/>

```markdown
<FunnelChart 
    data={funnel_data} 
    nameCol=stage
    valueCol=customers
    funnelSort=ascending
/>
```

### Alignment

<FunnelChart 
    data={funnel_data} 
    nameCol=stage
    valueCol=customers
    funnelAlign=left
/>

```markdown
<FunnelChart 
    data={funnel_data} 
    nameCol=stage
    valueCol=customers
    funnelAlign=left
/>
```

### Show Percent Label

<FunnelChart 
    data={funnel_data} 
    nameCol=stage
    valueCol=customers
    showPercent=true
/>

```markdown
<FunnelChart 
    data={funnel_data} 
    nameCol=stage
    valueCol=customers
    showPercent=true
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
    name=nameCol
    description="Column to use for the name of the chart"
    required=true
    options="column name"
/>
<PropListing
    name=valueCol
    description="Column to use for the value of the chart"
    required=true
    options="column name"
/>
<PropListing
    name=emptySet
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    options={['error', 'warn', 'pass']}
    defaultValue="error"
/>
<PropListing
    name=emptyMessage
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    options="string"
    defaultValue="No records"
/>

### Formatting & Styling

<PropListing
    name=valueFmt
    description="Format to use for `valueCol` (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=outlineColor
    description="Border color. Only accepts a single color."
    options="CSS name | hexademical | RGB | HSL"
    defaultValue="transparent"
/>
<PropListing
    name=outlineWidth
    description="Border Width. It should be a natural number."
    options="number"
    defaultValue="1"
/>
<PropListing
    name=labelPosition
    description="Position of funnel item's label."
    options={['left', 'right', 'inside']}
    defaultValue="inside"
/>
<PropListing
    name=showPercent
    description="Show percentage in data labels"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=funnelSort
    description="Data sorting of the chart."
    options={['none', 'ascending', 'descending']}
    defaultValue="none"
/>
<PropListing
    name=funnelAlign
    description="Alignment of funnel."
    options={['left', 'right', 'center']}
    defaultValue="center"
/>
<PropListing
    name=colorPalette
    description="Array of custom colours to use for the chart. E.g., <code class=markdown>{`{['#cf0d06','#eb5752','#e88a87']}`}</code>"
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
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
    defaultValue="true"
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

<PropListing
    name=connectGroup
    description="Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected"
/>
