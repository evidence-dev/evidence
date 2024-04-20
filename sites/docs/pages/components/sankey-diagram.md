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
    name=data
    description="Query name, wrapped in curly braces"
    required
    options="query name"
/>
<PropListing
    name=sourceCol
    description="Column to use for the source of the diagram"
    required
    options="column name"
/>
<PropListing
    name=targetCol
    description="Column to use for the target of the diagram"
    required
    options="column name"
/>
<PropListing
    name=valueCol
    description="Column to use for the value of the diagram"
    required
    options="column name"
/>
<PropListing
    name=percentCol
    description="Column to use for the percent labels of the diagram"
    options="column name"
/>
<PropListing
    name=depthOverride
    description="Manual adjustment to location of each node {`{{'services revenue': 2}}`}"
    options="object containing node name and depth level (0 is first level)"
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
<PropListing
    name=printEchartsConfig
    description="Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options"
    options={['true', 'false']}
    defaultValue="false"
/>

### Formatting & Styling

<PropListing
    name=valueFmt
    description="Format to use for `valueCol` (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=orient
    description="Layout direction of the nodes in the diagram."
    options={['horizontal', 'vertical']}
    defaultValue="horizontal"
/>
<PropListing
    name=sort
    description="Whether the nodes are sorted by size in the diagram"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=nodeAlign
    description="Controls the horizontal alignment of nodes in the diagram. When orient is vertical, nodeAlign controls vertical alignment."
    options={['justify', 'left', 'right']}
    defaultValue="justify"
/>
<PropListing
    name=nodeGap
    description="The gap between any two rectangles in each column of the the diagram."
    options="number"
    defaultValue="8"
/>
<PropListing
    name=nodeWidth
    description="The node width of rectangle in the diagram."
    options="number"
    defaultValue="20"
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
    name=colorPalette
    description="Array of custom colours to use for the chart. E.g., <code class=markdown>{`{['#cf0d06','#eb5752','#e88a87']}`}</code>"
    options="array of color strings (CSS name | hexademical | RGB | HSL)"
    defaultValue="built-in color palette"
/>
<PropListing
    name=linkColor
    description="Color to use for the links between nodes in the diagram"
    options={['grey', 'source', 'target', 'gradient']}
    defaultValue="grey"
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
    name=nodeLabels
    description="Adds labels to the nodes of the diagram"
    options={['name', 'value', 'full']}
    defaultValue="name"
/>
<PropListing
    name=linkLabels
    description="Adds labels to the links between nodes"
    options={['full', 'value', 'percent']}
    defaultValue="full (requires percentCol)"
/>
<PropListing
    name=chartAreaHeight
    description="Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX."
    options="number"
    defaultValue="180"
/>

### Custom Echarts Options

<PropListing
    name=echartsOptions
    description="Custom Echarts options to override the default options. See <a href='/components/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleOption:'exampleValue'}}`}"
/>
<PropListing
    name=printEchartsConfig
    description="Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options"
    options={['true', 'false']}
    defaultValue="false"
/>
