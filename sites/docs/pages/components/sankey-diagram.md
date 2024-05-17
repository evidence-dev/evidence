---
title: Sankey Diagram
sidebar_position: 1
---

The SankeyDiagram component accepts a query and displays a flow from one set of values to another.

To display a flow with multiple levels, like these examples, see [Mutli-level](#multi-level) below.

![sankey](/img/exg-sankey.svg)

```markdown

<SankeyDiagram 
    data={query_name} 
    sourceCol= sourceCol
    targetCol = targetCol
    valueCol= valueCol
/>
```

## Vertical

![sankey](/img/exg-sankey-vertical.svg)

```markdown
<SankeyDiagram 
    data={query_name} 
    sourceCol= sourceCol
    targetCol = targetCol
    valueCol= valueCol
    orient = vertical
/>
```

# Echarts Options String 

```html
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

![sankey](/img/sankey_echarts_options.png)

# Node Depth Override

```html
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

![sankey](/img/sankey_depth_override.png)

# Labels

## Node Labels

### `nodeLabels=name` (default)
```html
<SankeyDiagram 
  data={simple_sankey} 
  sourceCol=source 
  targetCol=target 
  valueCol=amount 
  percentCol=percent 
  nodeLabels=name
/>
```

![sankey](/img/sankey_nodelabel_name.png)

### `nodeLabels=value`
```html
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

![sankey](/img/sankey_nodelabel_value.png)

### `nodeLabels=full`
```html
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

![sankey](/img/sankey_nodelabel_full.png)

## Link Labels

### `linkLabels=full` (default)
Requires `percentCol` to show percentage beside value
```html
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

![sankey](/img/sankey_linklabel_full.png)

### `linkLabels=value`
```html
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

![sankey](/img/sankey_linklabel_value.png)

### `linkLabels=percent`
```html
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

![sankey](/img/sankey_linklabel_percent.png)


## Custom Color Palette
```html
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

![sankey](/img/sankey_color_palette.png)

## Link Colors

### `linkColor=grey` (default)
```html
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

![sankey](/img/sankey_color_palette.png)

### `linkColor=source` 
```html
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

![sankey](/img/sankey_color_source.png)

### `linkColor=target` 
```html
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

![sankey](/img/sankey_color_target.png)

### `linkColor=gradient` 
```html
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

![sankey](/img/sankey_color_gradient.png)

## Multi-level

The syntax for multi-level sankey diagrams is the same, but the 
underlying query must represent all the levels using the same 
`sourceCol` and `targetCol`, so it is necessary to `union`
 each level together.  `sourceCol` nodes on the next level will be linked to `targetCol` nodes in the previous level with the same name.  

For example, here is the source for the visuals above.

```markdown
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