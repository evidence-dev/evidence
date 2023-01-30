---
sidebar_position: 5
title: Maps
hide_title: true
hide_table_of_contents: false
---

<h1 class="community-header"><span class="gradient">&lt;USMap/></span></h1>

## Examples

### Full State Names
```html
<USMap
    data={map_data}
    state=state_name
    value=sales_usd
/>
```

<img src='/img/map-fullname.png' width='400px'/>

### State Abbreviations
```html
<USMap
    data={map_data}
    state=state_abbrev
    value=sales_usd
    abbreviations=true
/>
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


## USMap

### All Options
* **data** - query name, wrapped in curly braces
* **state** - column to be used as the name for each state
* **value** - column to be used as the value determining the colour of each state
* **abbreviations** - (Optional) false | true - if true, map will look for two letter abbreviations rather than full names. Default is false
* **colorScale** - (Optional) blue | green | red | bluegreen - default is blue
* **min** - (Optional) minimum value for the colour scale. Anything below the minimum will be shown in the same colour as the min value
* **max** - (Optional) maximum value for the colour scale. Anything above the maximum will be shown in the same colour as the max value
* **title** - (Optional) title appearing above the map. Is inclued when you click to save the map image
* **subtitle** - (Optional) subtitle appearing just above the map. Is inclued when you click to save the map image
* **link** - (Optional) column containing links. When supplied, allows you to click each state on the map and navigate to the link