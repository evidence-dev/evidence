---
sidebar_position: 9
title: Funnel Chart
hide_table_of_contents: false
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

<img src="/img//funnel-asc.png" width="700"/>

```markdown
<FunnelChart 
    data={query_name} 
    nameCol=column_name
    valueCol=column_value
    funnelSort=ascending
/>
```

### Alignment

<img src="/img//funnel-align.png" width="700"/>

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

<table>
<tr> <th class='tleft'>Name</th> <th class='tleft'>Description</th> <th>Required?</th> <th>Options</th> <th>Default</th> </tr>
<tr> <td>data</td> <td>Query name, wrapped in curly braces</td> <td class='tcenter'>Yes</td> <td class='tcenter'>query name</td> <td class='tcenter'>-</td> </tr>
<tr> <td>nameCol</td> <td>Column to use for the name of the chart</td> <td class='tcenter'>Yes</td> <td class='tcenter'>column name</td> <td class='tcenter'>-</td> </tr>
<tr> <td>valueCol</td> <td>Column to use for the value of the chart</td> <td class='tcenter'>Yes</td> <td class='tcenter'>column name</td> <td class='tcenter'>-</td> </tr>
</table>

### Formatting & Styling

<table>
<tr> <th class='tleft'>Name</th> <th class='tleft'>Description</th> <th>Required?</th> <th>Options</th> <th>Default</th> </tr>
<tr> <td>valueFmt</td> <td>Format to use for `valueCol` (<a href='/core-concepts/formatting'>see available formats</a>)</td> <td class='tcenter'>-</td> <td class='tcenter'>Excel-style format | built-in format | custom format</td> <td class='tcenter'>-</td> </tr>
<tr> <td>outlineColor</td> <td>Border color. Only accepts a single color.</td> <td class='tcenter'>-</td> <td class='tcenter'>CSS name | hexademical | RGB | HSL</td> <td class='tcenter'>transparent</td> </tr>
<tr> <td>outlineWidth</td> <td>Border Width. It should be a natural number.</td> <td class='tcenter'>-</td> <td class='tcenter'>number</td> <td class='tcenter'>1</td> </tr>
<tr> <td>labelPosition</td> <td>Position of funnel item's label.</td> <td class='tcenter'>-</td> <td class='tcenter'>left | right | inside</td> <td class='tcenter'>inside</td> </tr>
<tr> <td>showPercent</td> <td>Show percentage in data labels</td> <td class='tcenter'>-</td> <td class='tcenter'>true | false</td> <td class='tcenter'>false</td> </tr>
<tr> <td>funnelSort</td> <td>Data sorting of the chart.</td> <td class='tcenter'>-</td> <td class='tcenter'>none | ascending | descending</td> <td class='tcenter'>none</td> </tr>
<tr> <td>funnelAlign</td> <td>Alignment of funnel.</td> <td class='tcenter'>-</td> <td class='tcenter'>left | right | center</td> <td class='tcenter'>center</td> </tr>
<tr>	<td>colorPalette</td>	<td>Array of custom colours to use for the chart<br/>E.g., ['#cf0d06','#eb5752','#e88a87']<br/> Note that the array must be surrounded by curly braces.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>array of color strings (CSS name | hexademical | RGB | HSL)</td>	<td class='tcenter'>built-in color palette</td>	</tr>
</table>

### Chart

<table>
<tr> <th class='tleft'>Name</th> <th class='tleft'>Description</th> <th>Required?</th> <th>Options</th> <th>Default</th> </tr>
<tr> <td>title</td> <td>Chart title. Appears at top left of chart.</td> <td class='tcenter'>-</td> <td class='tcenter'>string</td> <td class='tcenter'>-</td> </tr>
<tr> <td>subtitle</td> <td>Chart subtitle. Appears just under title.</td> <td class='tcenter'>-</td> <td class='tcenter'>string</td> <td class='tcenter'>-</td> </tr>
<tr> <td>legend</td> <td>Turns legend on or off. Legend appears at top center of chart.</td> <td class='tcenter'>-</td> <td class='tcenter'>true | false</td> <td class='tcenter'>true</td> </tr>
</table>