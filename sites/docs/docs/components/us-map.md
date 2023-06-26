---
sidebar_position: 15
title: Maps

hide_table_of_contents: false
---

## Examples

### Full State Names

```html
<USMap data="{map_data}" state="state_name" value="sales_usd" />
```

<img src='/img/map-fullname.png' width='400px'/>

### State Abbreviations

```html
<USMap data="{map_data}" state="state_abbrev" value="sales_usd" abbreviations="true" />
```

<img src='/img/map-abbrev.png' width='400px'/>

### Color Scales

#### `colorScale=blue`

<img src='/img/map-blue.png' width='400px'/>

#### `colorScale=green`

<img src='/img/map-green.png' width='400px'/>

#### `colorScale=red`

<img src='/img/map-red.png' width='400px'/>

#### `colorScale=bluegreen`

<img src='/img/map-bluegreen.png' width='400px'/>

### Links

```html
<USMap
	data="{state_current}"
	state="state"
	value="value"
	abbreviations="true"
	link="state_link"
	title="Sales by State"
	subtitle="{most_recent_month[0].month}"
/>
```

<img src='/img/map-links.gif' width='500px'/>

## USMap

### All Options

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
        <td>value</td>	
        <td>Column to be used as the value determining the colour of each state</td>	
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
        <td>colorScale</td>	
        <td>Colour scale to be used</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>blue | green | red | bluegreen</td>	
        <td class='tcenter'>blue</td>
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
        <td class='tcenter'>Excel-style format | built-in format | custom format</td>	
        <td class='tcenter'>-</td>
    </tr>
</table>
