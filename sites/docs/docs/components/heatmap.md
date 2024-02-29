---
sidebar_position: 16
title: Heatmap
hide_table_of_contents: false
---

<img src="/img/heatmap-basic.png" width="700"/>

```markdown
<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    valueFmt=usd 
/>
```

## Examples

### Basic Heatmap

<img src="/img/heatmap-basic.png" width="700"/>

```markdown
<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    valueFmt=usd 
/>
```

### Custom Color Palette

<img src="/img/heatmap-category-day-green.png" width="700"/>

```markdown
<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    colorPalette={['white', 'green']}
    title="Weekday Orders"
    subtitle="By Category"
/>
```

### Rotated Labels

<img src="/img/heatmap-item-state.png" width="700"/>

```markdown
<Heatmap 
    data={item_state} 
    x=item 
    y=state 
    value=orders 
    xLabelRotation=-45
    colorPalette={['white', 'maroon']} 
    title="Item Sales"
    subtitle="By State"
    rightPadding=40
    cellHeight=25
/>
```




## Options

### Data

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>x</td>	<td>Categorical column to use for the x-axis</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>y</td>	<td>Categorical column to use for the y-axis</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>value</td>	<td>Numeric column to use for the y-axis</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>min</td>	<td>Minimum number for the heatmap's color scale</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>min of value column</td>	</tr>
<tr>	<td>max</td>	<td>Maximum number for the heatmap's color scale</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>max of value column</td>	</tr>
<tr>	<td>emptySet</td>	<td>Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in <code>build:strict</code>. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>error | warn | pass</td>	<td class='tcenter'>error</td>	</tr>
<tr>	<td>emptyMessage</td>	<td>Text to display when an empty dataset is received - only applies when <code>emptySet</code> is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>No records</td>	</tr>
</table>

### Formatting & Styling

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>colorPalette</td>	<td>Array of colors to form the gradient for the heatmap. Remember to wrap your array in curly braces.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>array of color codes - e.g., <code>{`colorPalette={['navy', 'white', '#c9c9c9']}`}</code></td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>valueFmt</td>	<td>Format to use for value column (<a href='/core-concepts/formatting'>see available formats</a>)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>Excel-style format | built-in format name | custom format name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>cellHeight</td>	<td>Number representing the height of cells in the heatmap</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>30</td>	</tr>
<tr>	<td>leftPadding</td>	<td>Number representing the padding (whitespace) on the left side of the chart. Useful to avoid labels getting cut off</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>0</td>	</tr>
<tr>	<td>rightPadding</td>	<td>Number representing the padding (whitespace) on the left side of the chart. Useful to avoid labels getting cut off</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>0</td>	</tr>
<tr>	<td>valueLabels</td>	<td>Turn on or off value labels in the heatmap cells</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>mobileValueLabels</td>	<td>Turn on or off value labels in the heatmap cells when app is viewed on a mobile device screen size</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>borders</td>	<td>Turn on or off borders around cells. Default is to show light grey border around each cell. To customize border appearance, use <code>echartsOptions</code></td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
</table>

### Axes
<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>xTickMarks</td>	<td>Turns on/off tick marks for the x-axis labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yTickMarks</td>	<td>Turns on/off tick marks for the y-axis labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>xLabelRotation</td>	<td>Degrees to rotate the labels on the x-axis. Can be negative number to reverse direction. <code>45</code> and <code>-45</code> are common options</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>0</td>	</tr>
<tr>	<td>xAxisPosition</td>	<td>Position of x-axis and labels. Can be top or bottom. top recommended for longer charts</td>	<td class='tcenter'>-</td>	<td class='tcenter'>top | bottom</td>	<td class='tcenter'>top</td>	</tr>

</table>

### Chart

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>title</td>	<td>Chart title. Appears at top left of chart.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>subtitle</td>	<td>Chart subtitle. Appears just under title.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>chartAreaHeight</td>	<td>Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>auto set based on y-axis values</td>	</tr>
<tr>	<td>legend</td>	<td>Turn on or off the legend</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>filter</td>	<td>Allow draggable filtering on the legend. Must be used with <code>legend=true</code></td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>renderer</td>	<td>Which chart renderer type (canvas or SVG) to use. See ECharts' documentation on renderers: https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/</td>	<td class='tcenter'>-</td>	<td class='tcenter'>canvas | svg</td>	<td class='tcenter'>canvas</td>	</tr>
</table>

### Custom Echarts Options

<table>
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>echartsOptions</td>	<td>Custom Echarts options to override the default options. <a href='/components/echarts-options'>See reference page</a> for available options.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>{`{{exampleOption:'exampleValue'}}`}</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>seriesOptions</td>	<td>Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using <code>echartsOptions</code> <a href='/components/echarts-options'>See reference page</a> for available options.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>{`{{exampleSeriesOption:'exampleValue'}}`}</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>printEchartsConfig</td>	<td>Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
</table>

