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

## Multi-level

The syntax for multi-level sankey diagrams is the same, but the 
underlying query must represent all the levels using the same 
`sourceCol` and `targetCol`, so it is necessary to `union`
 each level together.  `sourceCal` nodes on the next level will be linked to `targetCol` nodes in the previous level with the same name.  

For example, here is the source for the visuals above.

```markdown
```sql traffic_source
select 
    channel as source,
    'all_traffic' as target,
    count(user_id) as count
from web_events
group by 1,2

union all

select 
    'all_traffic' as source,
    page_route as target,
    count(user_id) as count
from web_events
group by 1, 2
‍```

<SankeyChart
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
<tr> <td>tagretCol</td> <td>Column to use for the target of the diagram</td> <td class='tcenter'>Yes</td> <td class='tcenter'>column name</td> <td class='tcenter'>-</td> </tr>
<tr> <td>valueCol</td> <td>Column to use for the value of the diagram</td> <td class='tcenter'>Yes</td> <td class='tcenter'>column name</td> <td class='tcenter'>-</td> </tr>
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
</table>

### Chart

<table>
<tr> <th class='tleft'>Name</th> <th class='tleft'>Description</th> <th>Required?</th> <th>Options</th> <th>Default</th> </tr>
<tr> <td>title</td> <td>Chart title. Appears at top left of chart.</td> <td class='tcenter'>-</td> <td class='tcenter'>string</td> <td class='tcenter'>-</td> </tr>
<tr> <td>subtitle</td> <td>Chart subtitle. Appears just under title.</td> <td class='tcenter'>-</td> <td class='tcenter'>string</td> <td class='tcenter'>-</td> </tr>
<tr> <td>label</td> <td>Turns label on or off. Label appears at top or right of the diagram.</td> <td class='tcenter'>-</td> <td class='tcenter'>true | false </td> <td class='tcenter'>true</td> </tr>
</table>
