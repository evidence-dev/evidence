---
sidebar_position: 18
title: Sparkline
hide_table_of_contents: false
---

<img src="/img/sparkline-basic.png" width="150"/>

```markdown
<Sparkline 
    data={sales_by_date} 
    dateCol=date 
    valueCol=sales 
/>
```

## Examples

### Connected Sparkline

<img src="/img/sparkline-connected.gif" width="400"/>

```html
<Sparkline data={sales_by_date} dateCol=date valueCol=sales type=bar  valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
<Sparkline data={sales_by_date} dateCol=date valueCol=sales type=area color=maroon valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
<Sparkline data={sales_by_date} dateCol=date valueCol=sales type=line color=purple valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
```

## Options

### Data

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>dateCol</td>	<td>Categorical column to use for the x-axis</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>valueCol</td>	<td>Numeric column to use for the y-axis</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>type</td>	<td>Chart type for sparkline</td>	<td class='tcenter'>-</td>	<td class='tcenter'>line | area | bar</td>	<td class='tcenter'>line</td>	</tr>
<tr>	<td>emptySet</td>	<td>Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in <code>build:strict</code>. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>error | warn | pass</td>	<td class='tcenter'>error</td>	</tr>
<tr>	<td>emptyMessage</td>	<td>Text to display when an empty dataset is received - only applies when <code>emptySet</code> is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>No records</td>	</tr>
</table>

### Formatting & Styling

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>color</td>	<td>Color to use for the visualization. For area sparklines, choose the color for the line and the area color will be automatically appplied in a lighter shade.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>valueFmt</td>	<td>Format to use for value column (<a href='/core-concepts/formatting'>see available formats</a>)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>Excel-style format | built-in format name | custom format name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>dateFmt</td>	<td>Format to use for date column (<a href='/core-concepts/formatting'>see available formats</a>)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>Excel-style format | built-in format name | custom format name</td>	<td class='tcenter'>-</td>	</tr>

</table>

### Axes
<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>yScale</td>	<td>Whether to truncate the y-axis to enhance visibility</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
</table>

### Sizing

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
    <tr>
        <td>height</td>
        <td>Height of sparkline in pixels</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>
        <td class='tcenter'>15</td>
    </tr>
    <tr>
        <td>width</td>
        <td>Width of sparkline in pixels</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>
        <td class='tcenter'>50</td>
    </tr>
</table>

### Interactivity

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>interactive</td>	<td>Turn on or off tooltip behaviour on hover. If off, chart will be a staticly rendered SVG (better for page performance). If on, you will be able to see dates/values when hovering over the sparkline</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
    <tr>	
        <td>connectGroup</td>	
        <td>Group name to connect this sparkline to other charts for synchronized tooltip hovering. Charts with the same <code>connectGroup</code> name will become connected</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>string</td>	
        <td class='tcenter'>-</td>	
    </tr>
</table>