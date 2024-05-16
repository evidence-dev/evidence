---
title: Bubble Map
sidebar_position: 1
---

<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=eur
    value=sales 
    valueFmt=eur
    pointName=point_name 
    height=300
/>

```html
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=eur
    value=sales 
    valueFmt=eur
    pointName=point_name 
    height=300
/>
```


```sql la_locations
select *, 'https://www.google.com/search?q=' || point_name as link_col from la_locations
```


## Examples

### Custom Basemap
You can add a different basemap by passing in a basemap URL. You can find examples here: https://leaflet-extras.github.io/leaflet-providers/preview/

<BubbleMap data={la_locations} lat=lat long=long size=sales sizeFmt=eur pointName=point_name height=300 basemap={`https://tile.openstreetmap.org/{z}/{x}/{y}.png`}/>

**Note:** you need to wrap the url in curly braces and backticks to avoid the curly braces in the URL being read as variables on your page

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat long=long 
    value=sales 
    valueFmt=usd 
    pointName=point_name 
    height=200 
    basemap={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}`}
/>
```

### Custom Tooltip

#### `tooltipType=hover`
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd 
    value=sales 
    valueFmt=usd
    pointName=point_name 
    height=300
    tooltipType=hover
    tooltip={[
        {id: 'point_name', showColumnName: false, valueClass: 'text-xl font-semibold'},
        {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
        {id: 'point_name', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
    ]}
/>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    value=sales 
    valueFmt=usd 
    size=sales 
    sizeFmt=usd 
    pointName=point_name 
    height=300
    tooltipType=hover
    tooltip={[
        {id: 'point_name', showColumnName: false, valueClass: 'text-xl font-semibold'},
        {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
        {id: 'point_name', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
    ]}
/>
```

#### With clickable link and `tooltipType=click`
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    value=sales 
    valueFmt=usd 
    size=sales 
    sizeFmt=usd 
    pointName=point_name 
    height=300
    tooltipType=click
    tooltip={[
        {id: 'point_name', showColumnName: false, valueClass: 'text-xl font-semibold'},
        {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
        {id: 'point_name', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
    ]}
/>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    value=sales 
    valueFmt=usd 
    size=sales 
    sizeFmt=usd 
    pointName=point_name 
    height=300
    tooltipType=click
    tooltip={[
        {id: 'point_name', showColumnName: false, valueClass: 'text-xl font-semibold'},
        {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
        {id: 'point_name', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
    ]}
/>
```

### Custom Color Palette

<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    value=sales 
    valueFmt=usd 
    size=sales 
    sizeFmt=usd 
    pointName=point_name 
    height=300
    colorPalette={['yellow','orange','red','darkred']}
/>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    value=sales 
    valueFmt=usd 
    pointName=point_name 
    height=300
    colorPalette={['yellow','orange','red','darkred']}
/>
```

### Custom Styling

<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    pointName=point_name 
    height=300
    color=#128c2b
    opacity=1
    borderWidth=1
    borderColor=black
/>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    pointName=point_name 
    height=300
    color=#128c2b
    opacity=1
    borderWidth=1
    borderColor=black
/>
```

### Max Bubble Size

<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    pointName=point_name 
    height=300
    maxSize=10
/>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    pointName=point_name 
    height=300
    maxSize=10
/>
```

### Link Drilldown
Pass in a `link` column to enable navigation on click of the point. These can be absolute or relative URLs

<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    link=link_col 
    height=300
/>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    link=link_col 
    height=300
/>
```

### Use Map as Input
Use the `name` prop to set an input name for the map - when a point is clicked, it will set the input value to that row of data

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    name=my_point_map 
    height=300
/>
```

<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    name=my_point_map 
    height=300
/>

*Click a point on the map to see the input value get updated:*

#### Selected value for `{inputs.my_point_map}`: 
  
{inputs.my_point_map}

#### Selected value for `{inputs.my_point_map.point_name}`: 
  
{inputs.my_point_map.point_name}


```filtered_locations
select * from ${la_locations}
where point_name = '${inputs.my_point_map.point_name}'
```

#### Filtered Data
<DataTable data={filtered_locations}/>

## Options

### Bubbles
<PropListing
name="data"
required
options="query name"
>
Query result, referenced using curly braces
</PropListing>

<PropListing
name="lat"
required
options="column name"
>
Column containing latitude values
</PropListing>

<PropListing
name="long"
required
options="column name"
>
Column containing longitude values
</PropListing>

<PropListing
name="size"
required
options="column name"
>
Column that determines the size displayed for each point.
</PropListing>

<PropListing
name="sizeFmt"
options="format string"
>
Format string for displaying the size value in tooltips.
</PropListing>

<PropListing
name="maxSize"
options="number"
defaultValue=20
>
Maximum size of the bubbles
</PropListing>

<PropListing
name="value"
options="column name"
>
Column that determines the value displayed at each point (used for color scale)
</PropListing>

<PropListing
name="valueFmt"
options="format string"
>
Format string for displaying the value.
</PropListing>

### Color Scale

<PropListing
name="colorPalette"
options="array of colors"
>
Array of colors used for theming the points based on data <code></code>
</PropListing>

<PropListing
name="min"
options="number"
defaultValue="min of value column"
>
Minimum value to use for the color scale.
</PropListing>

<PropListing
name="max"
options="number"
defaultValue="max of value column"
>
Maximum value to use for the color scale.
</PropListing>

### Interactivity

<PropListing
name="link"
options="URL"
>
URL to navigate to when a point is clicked.
</PropListing>

<PropListing
name="name"
options="string"
>
Input name. Can be referenced on your page with `{inputs.my_input_name}`
</PropListing>

<PropListing
name="onclick"
options="function"
>
Function to execute when a point is clicked.
</PropListing>

### Styling
<PropListing
name="color"
options="CSS color value"
>
Color for the points. Use when you want all points to be the same color.
</PropListing>

<PropListing
name="borderWidth"
options="pixel value"
defaultValue=0.75
>
Width of the border around each point.
</PropListing>

<PropListing
name="borderColor"
options="CSS color value"
defaultVallue="white"
>
Color of the border around each point.
</PropListing>

<PropListing
name="opacity"
options="number between 0 and 1"
defaultValue=0.8
>
Opacity of the points.
</PropListing>

### Tooltips
<PropListing
name="showTooltip"
options={['true', 'false']}
defaultValue=true
>
Whether to show tooltips
</PropListing>

<PropListing
name="tooltipType"
options={['hover', 'click']}
defaultValue='hover'
>
Determines whether tooltips are activated by hover or click.
</PropListing>

<PropListing
name="tooltip"
options="array of objects"
>
Configuration for tooltips associated with each point. See Custom Tooltip example above for format
</PropListing>

<PropListing
name="tooltipClass"
options="CSS class"
>
CSS class applied to the tooltip content. You can pass Tailwind classes into this prop to custom-style the tooltip
</PropListing>

### Base Map

<PropListing
name="basemap"
options="URL"
>
URL template for the basemap tiles.
</PropListing>

<PropListing
name="title"
options="text"
>
Optional title displayed above the map.
</PropListing>

<PropListing
name="startingLat"
options="latitude coordinate"
>
Starting latitude for the map center.
</PropListing>

<PropListing
name="startingLong"
options="longitude coordinate"
>
Starting longitude for the map center.
</PropListing>

<PropListing
name="startingZoom"
options="number (1 to 18)"
>
Initial zoom level of the map.
</PropListing>

<PropListing
name="height"
options="pixel value"
defaultValue="400"
>
Height of the map in pixels.
</PropListing>