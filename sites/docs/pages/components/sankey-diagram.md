---
title: Sankey Diagram
sidebar_position: 1
---

The SankeyDiagram component accepts a query and displays a flow from one set of values to another.

To display a flow with multiple levels, like these examples, see [Mutli-level](#multi-level) below.

```sql simple_sankey
select 'products' as source, 'profits' as target, 100 as amount, 0.67 as percent
union all
select 'products' as source, 'expenses' as target, 50 as amount, 0.33 as percent
union all
select 'services' as source, 'profits' as target, 25 as amount, 0.50 as percent
union all
select 'services' as source, 'expenses' as target, 25 as amount, 0.50 as percent
```

```sql traffic_data
select 'google' as source, 'all_traffic' as target, 100 as count
union all
select 'direct' as source, 'all_traffic' as target, 50 as count
union all
select 'facebook' as source, 'all_traffic' as target, 25 as count
union all
select 'bing' as source, 'all_traffic' as target, 25 as count
union all
select 'tiktok' as source, 'all_traffic' as target, 25 as count
union all
select 'twitter' as source, 'all_traffic' as target, 25 as count
union all
select 'linkedin' as source, 'all_traffic' as target, 25 as count
union all
select 'pinterest' as source, 'all_traffic' as target, 25 as count
union all
select 'all_traffic' as source, '/' as target, 50 as count
union all
select 'all_traffic' as source, '/docs' as target, 150 as count
union all
select 'all_traffic' as source, '/blog' as target, 25 as count
union all
select 'all_traffic' as source, '/about' as target, 75 as count
```

<SankeyDiagram data={traffic_data} title="Sankey" subtitle="A simple sankey chart" sourceCol=source targetCol=target valueCol=count />


```svelte
<SankeyDiagram 
    data={query_name} 
    sourceCol= sourceCol
    targetCol = targetCol
    valueCol= valueCol
/>
```

## Vertical

<SankeyDiagram data={traffic_data} title="Sankey" subtitle="A simple sankey chart" sourceCol=source targetCol=target valueCol=count orient=vertical/>

```svelte
<SankeyDiagram 
    data={query_name} 
    sourceCol=sourceCol
    targetCol=targetCol
    valueCol=valueCol
    orient=vertical
/>
```

# Echarts Options String 

```svelte
<SankeyDiagram 
    data={traffic_data} 
    title="Sankey" 
    subtitle="A simple sankey chart" 
    sourceCol=source 
    targetCol=target 
    valueCol=count 
    echartsOptions={{
        title: {
            text: "Custom Echarts Option",
            textStyle: {
              color: '#476fff'
            }
        }
    }}
/>

```

<SankeyDiagram data={traffic_data} title="Sankey" subtitle="A simple sankey chart" sourceCol=source targetCol=target valueCol=count 
    echartsOptions={{
        title: {
            text: "Custom Echarts Option",
            textStyle: {
              color: '#476fff'
            }
        }
    }}
/>

# Node Depth Override


```sql apple_income_statement
select 'iphone' as source, 'product revenue' as target, 51 as amount_usd
union all
select 'mac' as source, 'product revenue' as target, 10 as amount_usd
union all
select 'ipad' as source, 'product revenue' as target, 8 as amount_usd
union all
select 'wearables and home' as source, 'product revenue' as target, 9 as amount_usd
union all
select 'services revenue' as source, 'revenue' as target, 20 as amount_usd
union all
select 'product revenue' as source, 'revenue' as target, 78 as amount_usd
union all
select 'revenue' as source, 'gross profit' as target, 43 as amount_usd
union all
select 'gross profit' as source, 'operating profit' as target, 30 as amount_usd
union all
select 'gross profit' as source, 'operating expenses' as target, 13 as amount_usd
union all
select 'revenue' as source, 'cost of revenue' as target, 55 as amount_usd
```

```svelte
<SankeyDiagram 
    data={apple_income_statement} 
    title="Apple Income Statement" 
    subtitle="USD Billions" 
    sourceCol=source 
    targetCol=target 
    valueCol=amount_usd 
    depthOverride={{'services revenue': 1}}
    nodeAlign=left
/>
```

<SankeyDiagram 
    data={apple_income_statement} 
    title="Apple Income Statement" 
    subtitle="USD Billions" 
    sourceCol=source 
    targetCol=target 
    valueCol=amount_usd 
    depthOverride={{'services revenue': 1}}
    nodeAlign=left
/>

# Labels

## Node Labels

### `nodeLabels=name` (default)
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  nodeLabels=name
/>
```

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  nodeLabels=name
/>

### `nodeLabels=value`
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  nodeLabels=value
/>
```

The value labels can be formatted using the `valueFmt` option.

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  nodeLabels=value
/>

### `nodeLabels=full`
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  nodeLabels=full
  valueFmt=usd
/>
```

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  nodeLabels=full
  valueFmt=usd
/>

## Link Labels

### `linkLabels=full` (default)
Requires `percentCol` to show percentage beside value
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  valueFmt=usd
  linkLabels=full
/>
```

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  valueFmt=usd
  linkLabels=full
/>

### `linkLabels=value`
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  valueFmt=usd
  linkLabels=value
/>
```

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  valueFmt=usd
  linkLabels=value
/>

### `linkLabels=percent`
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  valueFmt=usd
  linkLabels=percent
/>
```

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  valueFmt=usd
  linkLabels=percent
/>

## Custom Color Palette
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  linkColor=grey
  colorPalette={['#ad4940', '#3d8cc4', '#1b5218', '#ebb154']}
/>
```

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  linkColor=grey
  colorPalette={['#ad4940', '#3d8cc4', '#1b5218', '#ebb154']}
/>

## Link Colors

### `linkColor=grey` (default)
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  linkColor=grey
  colorPalette={['#ad4940', '#3d8cc4', '#1b5218', '#ebb154']}
/>
```

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  linkColor=grey
  colorPalette={['#ad4940', '#3d8cc4', '#1b5218', '#ebb154']}
/>

### `linkColor=source` 
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  linkColor=source
  colorPalette={['#ad4940', '#3d8cc4', '#1b5218', '#ebb154']}
/>
```

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  linkColor=source
  colorPalette={['#ad4940', '#3d8cc4', '#1b5218', '#ebb154']}
/>

### `linkColor=target` 
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  linkColor=target
  colorPalette={['#ad4940', '#3d8cc4', '#1b5218', '#ebb154']}
/>
```

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  linkColor=target
  colorPalette={['#ad4940', '#3d8cc4', '#1b5218', '#ebb154']}
/>

### `linkColor=gradient` 
```svelte
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  linkColor=gradient
  colorPalette={['#6e0e08', '#3d8cc4', '#1b5218', '#ebb154']}
/>
```

<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  linkColor=gradient
  colorPalette={['#6e0e08', '#3d8cc4', '#1b5218', '#ebb154']}
/>

## Multi-level

The syntax for multi-level sankey diagrams is the same, but the 
underlying query must represent all the levels using the same 
`sourceCol` and `targetCol`, so it is necessary to `union`
 each level together.  `sourceCol` nodes on the next level will be linked to `targetCol` nodes in the previous level with the same name.  

For example, here is the source for the visuals above.

```svelte
```sql traffic_source
select 
    channel as source,
    'all_traffic' as target,
    count(user_id) as count
from events.web_events
group by 1,2

union all

select 
    'all_traffic' as source,
    page_route as target,
    count(user_id) as count
from events.web_events
group by 1, 2
‍```

<SankeyDiagram
    data={traffic_data}
    title="Sankey"
    subtitle="A simple sankey chart"
    sourceCol=source
    targetCol=target
    valueCol=count
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
    name="sourceCol"
    required
    options="column name"
>

Column to use for the source of the diagram

</PropListing>
<PropListing
    name="targetCol"
    required
    options="column name"
>

Column to use for the target of the diagram

</PropListing>
<PropListing
    name="valueCol"
    required
    options="column name"
>

Column to use for the value of the diagram

</PropListing>
<PropListing
    name="percentCol"
    options="column name"
>

Column to use for the percent labels of the diagram

</PropListing>
<PropListing
    name="depthOverride"
    options="object containing node name and depth level (0 is first level)"
>

Manual adjustment to location of each node `{{'services revenue': 2}}`

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
    name="printEchartsConfig"
    options={['true', 'false']}
    defaultValue="false"
>

Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options

</PropListing>

### Formatting & Styling

<PropListing
    name="valueFmt"
    options="Excel-style format | built-in format | custom format"
>

Format to use for `valueCol` ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name="orient"
    options={['horizontal', 'vertical']}
    defaultValue="horizontal"
>

Layout direction of the nodes in the diagram.

</PropListing>
<PropListing
    name="sort"
    options={['true', 'false']}
    defaultValue="false"
>

Whether the nodes are sorted by size in the diagram

</PropListing>
<PropListing
    name="nodeAlign"
    options={['justify', 'left', 'right']}
    defaultValue="justify"
>

Controls the horizontal alignment of nodes in the diagram. When orient is vertical, nodeAlign controls vertical alignment.

</PropListing>
<PropListing
    name="nodeGap"
    options="number"
    defaultValue="8"
>

The gap between any two rectangles in each column of the the diagram.

</PropListing>
<PropListing
    name="nodeWidth"
    options="number"
    defaultValue="20"
>

The node width of rectangle in the diagram.

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
    name="colorPalette"
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
>

Array of custom colours to use for the chart. E.g., `{['#cf0d06','#eb5752','#e88a87']}`

</PropListing>
<PropListing
    name="linkColor"
    options={['grey', 'source', 'target', 'gradient']}
    defaultValue="grey"
>

Color to use for the links between nodes in the diagram

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
    name="nodeLabels"
    options={['name', 'value', 'full']}
    defaultValue="name"
>

Adds labels to the nodes of the diagram

</PropListing>
<PropListing
    name="linkLabels"
    options={['full', 'value', 'percent']}
    defaultValue="full (requires percentCol)"
>

Adds labels to the links between nodes

</PropListing>
<PropListing
    name="chartAreaHeight"
    options="number"
    defaultValue="180"
>

Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX.

</PropListing>

### Custom Echarts Options

<PropListing
    name="echartsOptions"
    options="{`{{exampleOption:'exampleValue'}}`}"
>

Custom Echarts options to override the default options. See [reference page](/components/echarts-options/) for available options.

</PropListing>
<PropListing
    name="printEchartsConfig"
    options={['true', 'false']}
    defaultValue="false"
>

Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options

</PropListing>