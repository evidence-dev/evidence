---
sidebar_position: 9
title: Sankey Diagram
hide_table_of_contents: false
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

<table>
<tr> <th class='tleft'>Name</th> <th class='tleft'>Description</th> <th>Required?</th> <th>Options</th> <th>Default</th> </tr>
<tr> <td>data</td> <td>Query name, wrapped in curly braces</td> <td class='tcenter'>Yes</td> <td class='tcenter'>query name</td> <td class='tcenter'>-</td> </tr>
<tr> <td>sourceCol</td> <td>Column to use for the source of the diagram</td> <td class='tcenter'>Yes</td> <td class='tcenter'>column name</td> <td class='tcenter'>-</td> </tr>
<tr> <td>targetCol</td> <td>Column to use for the target of the diagram</td> <td class='tcenter'>Yes</td> <td class='tcenter'>column name</td> <td class='tcenter'>-</td> </tr>
<tr> <td>valueCol</td> <td>Column to use for the value of the diagram</td> <td class='tcenter'>Yes</td> <td class='tcenter'>column name</td> <td class='tcenter'>-</td> </tr>
<tr> <td>percentCol</td> <td>Column to use for the percent labels of the diagram</td> <td class='tcenter'>-</td> <td class='tcenter'>column name</td> <td class='tcenter'>-</td> </tr>
<tr> <td>depthOverride</td> <td>Manual adjustment to location of each node</td> <td class='tcenter'>-</td> <td class='tcenter'>object containing node name and depth level (0 is first level)<br/>{`{{'services revenue': 2}}`}</td> <td class='tcenter'>-</td> </tr>
<tr>	<td>emptySet</td>	<td>Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in <code>build:strict</code>. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>error | warn | pass</td>	<td class='tcenter'>error</td>	</tr>
<tr>	<td>emptyMessage</td>	<td>Text to display when an empty dataset is received - only applies when <code>emptySet</code> is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>No records</td>	</tr>
</table>

### Formatting & Styling

<table>
<tr> <th class='tleft'>Name</th> <th class='tleft'>Description</th> <th>Required?</th> <th>Options</th> <th>Default</th> </tr>
<tr> <td>valueFmt</td> <td>Format to use for `valueCol` (<a href='/core-concepts/formatting'>see available formats</a>)</td> <td class='tcenter'>-</td> <td class='tcenter'>Excel-style format | built-in format | custom format</td> <td class='tcenter'>-</td> </tr>
<tr> <td>orient</td> <td>Layout direction of the nodes in the diagram.</td> <td class='tcenter'>-</td> <td class='tcenter'>horizontal | vertical</td> <td class='tcenter'>horizontal</td> </tr>
<tr> <td>sort</td> <td>Whether the nodes are sorted by size in the diagram</td> <td class='tcenter'>-</td> <td class='tcenter'>true | false</td> <td class='tcenter'>false</td> </tr>
<tr> <td>nodeAlign</td> <td>Controls the horizontal alignment of nodes in the diagram. When orient is vertical, nodeAlign controls vertical alignment.</td> <td class='tcenter'>-</td> <td class='tcenter'>justify | left | right</td> <td class='tcenter'>justify</td> </tr>
<tr> <td>nodeGap</td> <td>The gap between any two rectangles in each column of the the diagram.</td> <td class='tcenter'>-</td> <td class='tcenter'>number</td> <td class='tcenter'>8</td> </tr>
<tr> <td>nodeWidth</td> <td>The node width of rectangle in the diagram.</td> <td class='tcenter'>-</td> <td class='tcenter'>number</td> <td class='tcenter'>20</td> </tr>
<tr> <td>outlineColor</td> <td>Border color. Only accepts a single color.</td> <td class='tcenter'>-</td> <td class='tcenter'>CSS name | hexademical | RGB | HSL</td> <td class='tcenter'>transparent</td> </tr>
<tr> <td>outlineWidth</td> <td>Border Width. It should be a natural number.</td> <td class='tcenter'>-</td> <td class='tcenter'>number</td> <td class='tcenter'>1</td> </tr>
<tr>	<td>colorPalette</td>	<td>Array of custom colours to use for the chart<br/>E.g., ['#cf0d06','#eb5752','#e88a87']<br/> Note that the array must be surrounded by curly braces.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>array of color strings (CSS name | hexademical | RGB | HSL)</td>	<td class='tcenter'>built-in color palette</td>	</tr>
<tr>	<td>linkColor</td>	<td>Color to use for the links between nodes in the diagram</td>	<td class='tcenter'>-</td>	<td class='tcenter'>grey | source | target | gradient </td>	<td class='tcenter'>grey</td>	</tr>
</table>

### Chart

<table>
<tr> <th class='tleft'>Name</th> <th class='tleft'>Description</th> <th>Required?</th> <th>Options</th> <th>Default</th> </tr>
<tr> <td>title</td> <td>Chart title. Appears at top left of chart.</td> <td class='tcenter'>-</td> <td class='tcenter'>string</td> <td class='tcenter'>-</td> </tr>
<tr> <td>subtitle</td> <td>Chart subtitle. Appears just under title.</td> <td class='tcenter'>-</td> <td class='tcenter'>string</td> <td class='tcenter'>-</td> </tr>
<tr> <td>nodeLabels</td> <td>Adds labels to the nodes of the diagram</td> <td class='tcenter'>-</td> <td class='tcenter'> name | value | full </td> <td class='tcenter'>name</td> </tr>
<tr> <td>linkLabels</td> <td>Adds labels to the links between nodes</td> <td class='tcenter'>-</td> <td class='tcenter'> full | value | percent </td> <td class='tcenter'>full (requires percentCol)</td> </tr>
<tr>	<td>chartAreaHeight</td>	<td>Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>180</td>	</tr>
</table>

### Custom Echarts Options

<table>
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>echartsOptions</td>	<td>Custom Echarts options to override the default options. <a href='/components/echarts-options'>See reference page</a> for available options.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>{`{{exampleOption:'exampleValue'}}`}</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>printEchartsConfig</td>	<td>Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
</table>
