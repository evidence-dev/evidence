---
sidebar_position: 15
title: Maps

hide_table_of_contents: false
---

## Examples

### Color Scales

#### `colorScale=blue`

<img src='/img/map-blue2.png' width='500px'/>

#### `colorScale=green`

<img src='/img/map-green2.png' width='500px'/>

#### `colorScale=red`

<img src='/img/map-red2.png' width='500px'/>

#### `colorScale=bluegreen`

<img src='/img/map-bluegreen2.png' width='500px'/>

### Custom Color Scale

```html
<USMap
    data={state_pop}
    state=name
    value=population
    colorPalette={['maroon','white','#1c0d80']}
    legend=true
/>
```

<img src='/img/usmap-custom-color2.png' width='500px'/>

### Legend

#### Default

```html
<USMap
    data={state_pop}
    state=name
    value=population
    legend=true
/>
```

<img src='/img/map-default-legend.png' width='500px'/>



#### With Filter

```html
<USMap
    data={state_pop}
    state=name
    value=population
    colorPalette={['maroon','white','#1c0d80']}
    legend=true
    filter=true
/>
```

<img src='/img/map-filter-legend.gif' width='500px'/>


### Links

```html
<USMap
	data={state_current}
	state=state
	value=value
	abbreviations=true
	link=state_link
	title="Sales by State"
	subtitle="{most_recent_month[0].month}"
/>
```

<img src='/img/map-links.gif' width='500px'/>

### Full State Names

```html
<USMap data={map_data} state=state_name value=sales_usd />
```

<img src='/img/map-fullname.png' width='500px'/>

### State Abbreviations

```html
<USMap data={map_data} state=state_abbrev value=sales_usd abbreviations=true />
```

<img src='/img/map-abbrev.png' width='500px'/>


## USMap

### Options

<table>						 
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>	
        <td>data</td>	
        <td>Query name, wrapped in curly braces</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>query name</td>	
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>state</td>	
        <td>Column to be used as the name for each state</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
        <tr>	
        <td>abbreviations</td>	
        <td>If true, map will look for two letter abbreviations rather than full names</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>false | true</td>	
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>value</td>	
        <td>Column to be used as the value determining the colour of each state</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>colorScale</td>	
        <td>Colour scale to be used. To use a custom color palette, see the `colorPalette` prop</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>blue | green | red | bluegreen</td>	
        <td class='tcenter'>blue</td>
    </tr>
        <tr>	
        <td>colorPalette</td>	
        <td>Custom color palette to use for setting state colors. Overrides `colorScale`</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>array of color codes (can be CSS, hex, RGB, HSL)</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>min</td>	
        <td>Minimum value for the colour scale. Anything below the minimum will be shown in the same colour as the min value</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>number</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>max</td>	
        <td>Maximum value for the colour scale. Anything above the maximum will be shown in the same colour as the max value</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>number</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>title</td>	
        <td>Title appearing above the map. Is included when you click to save the map image</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>string</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>subtitle</td>	
        <td>Subtitle appearing just above the map. Is included when you click to save the map image</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>string</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>link</td>	
        <td>Column containing links. When supplied, allows you to click each state on the map and navigate to the link</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>fmt</td>	
        <td>Format to use for values (<a href='/core-concepts/formatting'>see available formats</a>)</td>	
        <td class='tcenter'>-</td>
        <td class='tcenter'>Excel-style format | built-in format | custom format</td>	
        <td class='tcenter'>-</td>
    </tr>
        <tr>	
        <td>legend</td>	
        <td>Whether to show a legend at the top of the map</td>	
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>false</td>
    </tr>
        <tr>	
        <td>filter</td>	
        <td>Whether to include filter controls on the legend. Can only be used when legend = true</td>	
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>false</td>
    </tr>
    <tr>	<td>emptySet</td>	<td>Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in <code>build:strict</code>. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>error | warn | pass</td>	<td class='tcenter'>error</td>	</tr>
<tr>	<td>emptyMessage</td>	<td>Text to display when an empty dataset is received - only applies when <code>emptySet</code> is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>No records</td>	</tr>
<tr>	<td>renderer</td>	<td>Which chart renderer type (canvas or SVG) to use. See ECharts' documentation on renderers: https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/</td>	<td class='tcenter'>-</td>	<td class='tcenter'>canvas | svg</td>	<td class='tcenter'>canvas</td>	</tr>
</table>


### Custom Echarts Options

<table>
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>echartsOptions</td>	<td>Custom Echarts options to override the default options. <a href='/components/echarts-options'>See reference page</a> for available options.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>{`{{exampleOption:'exampleValue'}}`}</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>seriesOptions</td>	<td>Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using <code>echartsOptions</code> <a href='/components/echarts-options'>See reference page</a> for available options.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>{`{{exampleSeriesOption:'exampleValue'}}`}</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>printEchartsConfig</td>	<td>Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
</table>

### Interactivity

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	
    <td>connectGroup</td>	
    <td>Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same <code>connectGroup</code> name will become connected. Note that for maps, regions/states must have identical names for the connection to work. If one map uses abbreviated states vs. another uses full names, the connection will not be synchronized correctly.</td>	
    <td class='tcenter'>-</td>	
    <td class='tcenter'>string</td>	
    <td class='tcenter'>-</td>	
</tr>
</table>
