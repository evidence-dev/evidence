---
sidebar_position: 9
title: Funnel Charts
hide_title: true
hide_table_of_contents: false
---

<h1 class="community-header"><span class="gradient">&lt;Funnel Chart/></span></h1>

![funnel](/img/exg-funnel-nt.svg)

```markdown
<FunnelChart 
    data={query_name} 
    nameCol=column_name
    valueCol=column_value
/>
```

## Examples

### Ascending

![ascending-funnel](/img/exg-funnel-ascending-nt.svg)

```markdown
<FunnelChart 
    data={query_name} 
    nameCol=column_name
    valueCol=column_value
    funnelSort=ascending
/>
```

### Alignment

#### Left

![left-aligned-funnel](/img/exg-funnel-left-aligned-nt.svg)

```markdown
<FunnelChart 
    data={query_name} 
    nameCol=column_name
    valueCol=column_value
    funnelAlign=left
/>
```

#### Right

![right-aligned-funnel](/img/exg-funnel-right-aligned-nt.svg)

```markdown
<FunnelChart
    data={query_name}
    nameCol=column_name
    valueCol=column_value
    funnelAlign=right
/>
```

## Props

### Data

<table>
<tr> <th class='tleft'>Name</th> <th class='tleft'>Description</th> <th>Required?</th> <th>Options</th> <th>Default</th> </tr>
<tr> <td>data</td> <td>Query name, wrapped in curly braces</td> <td class='tcenter'>Yes</td> <td class='tcenter'>query name</td> <td class='tcenter'>-</td> </tr>
<tr> <td>nameCol</td> <td>Column to use for the name of the chart</td> <td class='tcenter'>Yes</td> <td class='tcenter'>column name</td> <td class='tcenter'>-</td> </tr>
<tr> <td>valueCol</td> <td>Column to use for the value of the chart</td> <td class='tcenter'>Yes</td> <td class='tcenter'>column name</td> <td class='tcenter'>-</td> </tr>

</table>

### Series

<table>
<tr> <th class='tleft'>Name</th> <th class='tleft'>Description</th> <th>Required?</th> <th>Options</th> <th>Default</th> </tr>
<tr> <td>outlineColor</td> <td>Border color. Only accepts a single color.</td> <td class='tcenter'>-</td> <td class='tcenter'>CSS name | hexademical | RGB | HSL</td> <td class='tcenter'>transparent</td> </tr>
<tr> <td>outlineWidth</td> <td>Border Width. It should be a natural number.</td> <td class='tcenter'>-</td> <td class='tcenter'>number</td> <td class='tcenter'>1</td> </tr>
<tr> <td>labelPosition</td> <td>Position of funnel item's label.</td> <td class='tcenter'>-</td> <td class='tcenter'>left | right | inside</td> <td class='tcenter'>right</td> </tr>
<tr> <td>funnelSort</td> <td>Data sorting of the chart.</td> <td class='tcenter'>-</td> <td class='tcenter'>ascending | descending</td> <td class='tcenter'>descending</td> </tr>
<tr> <td>funnelAlign</td> <td>Alignment of funnel.</td> <td class='tcenter'>-</td> <td class='tcenter'>left | right | center</td> <td class='tcenter'>center</td> </tr>
</table>

### Chart

<table>
<tr> <th class='tleft'>Name</th> <th class='tleft'>Description</th> <th>Required?</th> <th>Options</th> <th>Default</th> </tr>
<tr> <td>title</td> <td>Chart title. Appears at top left of chart.</td> <td class='tcenter'>-</td> <td class='tcenter'>string</td> <td class='tcenter'>-</td> </tr>
<tr> <td>subtitle</td> <td>Chart subtitle. Appears just under title.</td> <td class='tcenter'>-</td> <td class='tcenter'>string</td> <td class='tcenter'>-</td> </tr>
<tr> <td>legend</td> <td>Turns legend on or off. Legend appears at top center of chart.</td> <td class='tcenter'>-</td> <td class='tcenter'>true | false</td> <td class='tcenter'>false</td> </tr>
</table>
