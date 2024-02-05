---
sidebar_position: 17
title: Calendar Heatmap
hide_table_of_contents: false
---

<img src="/img/calendar-heatmap-noyear.png" width="700"/>

```markdown
<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    title="Calendar Heatmap"
    subtitle="Daily Orders"
    yearLabel=false
/>
```

## Examples

### Multi-year Calendar Heatmap

<img src="/img/calendar-heatmap-multiyear.png" width="700"/>

```markdown
<CalendarHeatmap 
    data={orders_by_day} 
    date=date 
    value=orders 
    title="Calendar Heatmap"
    subtitle="Daily Sales"
/>
```

### Custom Color Palette

<img src="/img/calendar-heatmap-customcolor.png" width="700"/>

```markdown
<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    title="Calendar Heatmap"
    subtitle="Daily Orders"
    colorPalette={['navy', 'lightyellow', 'purple']}
/>
```

### Without Year Label

<img src="/img/calendar-heatmap-noyear.png" width="700"/>

```markdown
<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    title="Calendar Heatmap"
    subtitle="Daily Orders"
    yearLabel=false
/>
```




## Options

### Data

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>date</td>	<td>Date column to use for the calendar</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>value</td>	<td>Numeric column to use for the y-axis</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>min</td>	<td>Minimum number for the calendar heatmap's color scale</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>min of value column</td>	</tr>
<tr>	<td>max</td>	<td>Maximum number for the calendar heatmap's color scale</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>max of value column</td>	</tr>
</table>

### Formatting & Styling

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>colorPalette</td>	<td>Array of colors to form the gradient for the heatmap. Remember to wrap your array in curly braces.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>array of color codes - e.g., <code>{`colorPalette={['navy', 'white', '#c9c9c9']}`}</code></td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>valueFmt</td>	<td>Format to use for value column (<a href='/core-concepts/formatting'>see available formats</a>)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>Excel-style format | built-in format name | custom format name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yearLabel</td>	<td>Turn on or off year label on left of chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>monthLabel</td>	<td>Turn on or off month label on top of chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>dayLabel</td>	<td>Turn on or off day label on left of chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
</table>

### Chart

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>title</td>	<td>Chart title. Appears at top left of chart.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>subtitle</td>	<td>Chart subtitle. Appears just under title.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>chartAreaHeight</td>	<td>Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>auto set based on y-axis values</td>	</tr>
<tr>	<td>legend</td>	<td>Turn on or off the legend</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>filter</td>	<td>Allow draggable filtering on the legend. Must be used with <code>legend=true</code></td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>

</table>

### Custom Echarts Options

<table>
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>echartsOptions</td>	<td>Custom Echarts options to override the default options. <a href='/components/echarts-options'>See reference page</a> for available options.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>{`{{exampleOption:'exampleValue'}}`}</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>printEchartsConfig</td>	<td>Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
</table>

