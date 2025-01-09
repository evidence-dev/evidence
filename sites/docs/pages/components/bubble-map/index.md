---
title: Bubble Map
sidebar_position: 1
---

<DocTab>
    <div slot='preview'>
        <BubbleMap 
            data={la_locations} 
            lat=lat 
            long=long 
            size=sales 
            sizeFmt=eur
            value=sales 
            valueFmt=eur
            pointName=point_name 
        />
    </div>

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
/>
```
</DocTab>

```sql la_locations
select *, 'https://www.google.com/search?q=' || point_name as link_col from la_locations
```


## Examples

### Custom Basemap
You can add a different basemap by passing in a basemap URL. You can find examples here: https://leaflet-extras.github.io/leaflet-providers/preview/

<DocTab>
    <div slot='preview'>
        <BubbleMap data={la_locations} lat=lat long=long size=sales sizeFmt=eur pointName=point_name value=sales basemap={`https://tile.openstreetmap.org/{z}/{x}/{y}.png`} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'/>
    </div>

**Note:** you need to wrap the url in curly braces and backticks to avoid the curly braces in the URL being read as variables on your page

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    value=sales 
    valueFmt=usd 
    pointName=point_name 
    height=200 
    basemap={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}`}
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
```
</DocTab>


### Custom Tooltip

#### `tooltipType=hover`

<DocTab>
    <div slot='preview'>
        <BubbleMap 
            data={la_locations} 
            lat=lat 
            long=long 
            size=sales 
            sizeFmt=usd 
            value=sales 
            valueFmt=usd
            pointName=point_name 
            tooltipType=hover
            tooltip={[
                {id: 'point_name', showColumnName: false, valueClass: 'text-xl font-semibold'},
                {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'}
            ]}
        />
    </div>

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
    tooltipType=hover
    tooltip={[
        {id: 'point_name', showColumnName: false, valueClass: 'text-xl font-semibold'},
        {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'}
    ]}
/>
```
</DocTab>


#### With clickable link and `tooltipType=click`

<DocTab>
    <div slot='preview'>
        <BubbleMap 
            data={la_locations} 
            lat=lat 
            long=long 
            value=sales 
            valueFmt=usd 
            size=sales 
            sizeFmt=usd 
            pointName=point_name 
            tooltipType=click
            tooltip={[
                {id: 'point_name', showColumnName: false, valueClass: 'text-xl font-semibold'},
                {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
                {id: 'link_col', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
            ]}
        />
    </div>

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
    tooltipType=click
    tooltip={[
        {id: 'point_name', showColumnName: false, valueClass: 'text-xl font-semibold'},
        {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
        {id: 'link_col', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
    ]}
/>
```
</DocTab>


### Custom Color Palette

<DocTab>
    <div slot='preview'>
        <BubbleMap 
            data={la_locations} 
            lat=lat 
            long=long 
            value=sales 
            valueFmt=usd 
            size=sales 
            sizeFmt=usd 
            pointName=point_name 
            colorPalette={['yellow','orange','red','darkred']}
        />
    </div>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    value=sales 
    valueFmt=usd 
    pointName=point_name 
    colorPalette={['yellow','orange','red','darkred']}
/>
```
</DocTab>


### Custom Styling

<DocTab>
    <div slot='preview'>
        <BubbleMap 
            data={la_locations} 
            lat=lat 
            long=long 
            size=sales 
            sizeFmt=usd
            pointName=point_name 
            color=#128c2b
            opacity=1
            borderWidth=1
            borderColor=black
        />
    </div>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    pointName=point_name 
    color=#128c2b
    opacity=1
    borderWidth=1
    borderColor=black
/>
```
</DocTab>

### Max Bubble Size

<DocTab>
    <div slot='preview'>
        <BubbleMap 
            data={la_locations} 
            lat=lat 
            long=long 
            size=sales 
            sizeFmt=usd
            pointName=point_name 
            maxSize=10
        />
    </div>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    pointName=point_name 
    maxSize=10
/>
```
</DocTab>


### Link Drilldown
Pass in a `link` column to enable navigation on click of the point. These can be absolute or relative URLs

<DocTab>
    <div slot='preview'>
        <BubbleMap 
            data={la_locations} 
            lat=lat 
            long=long 
            size=sales 
            sizeFmt=usd
            link=link_col 
        />
    </div>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    link=link_col 
/>
```
</DocTab>


### Use Map as Input
Use the `name` prop to set an input name for the map - when a point is clicked, it will set the input value to that row of data

<DocTab>
    <div slot='preview'>
        <BubbleMap 
            data={la_locations} 
            lat=lat 
            long=long 
            size=sales 
            sizeFmt=usd
            name=my_point_map 
        />
    </div>

```svelte
<BubbleMap 
    data={la_locations} 
    lat=lat 
    long=long 
    size=sales 
    sizeFmt=usd
    name=my_point_map 
/>
```
</DocTab>

*Click a point on the map to see the input value get updated:*

#### Selected value for `{inputs.my_point_map}`: 
  
<pre class="text-sm">{JSON.stringify(inputs.my_point_map, null, 2)}</pre>

#### Selected value for `{inputs.my_point_map.point_name}`: 
  
{inputs.my_point_map.point_name}


```filtered_locations
select * from ${la_locations}
where point_name = '${inputs.my_point_map.point_name}' OR '${inputs.my_point_map.point_name}' = 'true'
```

#### Filtered Data
<DataTable data={filtered_locations}>  	
    <Column id=id/> 	
    <Column id=point_name/> 	
    <Column id=lat/> 	
    <Column id=long/> 	
    <Column id=sales fmt=usd/> 	
</DataTable>

### Legends

```grouped_locations
SELECT 
  *, 
  CASE 
    WHEN id BETWEEN 0 AND 4 THEN 'Hotels'
    WHEN id BETWEEN 5 AND 9 THEN 'Restaurants'
    WHEN id BETWEEN 10 AND 14 THEN 'Golf Courses'
    WHEN id BETWEEN 15 AND 19 THEN 'Shops'
    WHEN id BETWEEN 20 AND 24 THEN 'Bars'
    WHEN id BETWEEN 25 AND 29 THEN 'Entertainment'
    WHEN id BETWEEN 30 AND 34 THEN 'Banks'
  END AS Category
FROM la_locations
```	
#### Categorical Legend

<DocTab>
    <div slot='preview'>
        <BubbleMap
            data={grouped_locations}
            lat=lat
            long=long
            value=Category
            size=sales
        />
    </div>

```svelte
<BubbleMap
    data={grouped_locations}
    lat=lat
    long=long
    value=Category
    size=sales
/>
```
</DocTab>

#### Custom Colors
Set custom legend colors using the `colorPalette` prop to match the number of categories; excess categorical options will default to standard colors.

<DocTab>
    <div slot='preview'>
        <BubbleMap
            data={grouped_locations}
            lat=lat
            long=long
            value=Category
            size=sales
            colorPalette={['#C65D47', '#5BAF7A', '#4A8EBA', '#D35B85', '#E1C16D', '#6F5B9A', '#4E8D8D']}
        />
    </div>

```svelte
<BubbleMap
    data={grouped_locations}
    lat=lat
    long=long
    value=Category
    size=sales
    colorPalette={['#C65D47', '#5BAF7A', '#4A8EBA', '#D35B85', '#E1C16D', '#6F5B9A', '#4E8D8D']}
/>
```
</DocTab>

#### Scalar Legend

<DocTab>
    <div slot='preview'>
        <BubbleMap
            data={grouped_locations}
            lat=lat
            long=long
            value=sales
            size=sales
            valueFmt=usd
        />
    </div>

```svelte
<BubbleMap
    data={grouped_locations}
    lat=lat
    long=long
    value=sales
    size=sales
    valueFmt=usd
/>
```
</DocTab>

#### Custom Colors
Define scalar legend colors using the `colorPalette` prop, allowing specified colors to create a gradient based on the range of values.

<DocTab>
    <div slot='preview'>
        <BubbleMap
            data={grouped_locations}
            lat=lat
            long=long
            value=sales
            size=sales
            colorPalette={['#C65D47', '#4A8EBA']}
            valueFmt=usd
        />
    </div>

```svelte
<BubbleMap
    data={grouped_locations}
    lat=lat
    long=long
    value=sales
    size=sales
    colorPalette={['#C65D47', '#4A8EBA']}
    valueFmt=usd
/>
```
</DocTab>

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

<PropListing
name="pointName"
options="column name"
>
Column containing the names/labels of the points - by default, this is shown as the title of the tooltip.
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

### Legend

<PropListing
    name="legend"
    description="Turns legend on or off"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>
<PropListing
name="legendType"
options={['categorical', 'scalar']}
>
Appends a categorical or scalar legend to the map
</PropListing>

<PropListing
name="legendPosition"
options={['bottomLeft', 'topLeft','bottomRight', 'topRight']}
defaultValue='bottomLeft'
>
Determines the legend's position on the map, with options provided
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


### Selected State

<PropListing
name="selectedColor"
options="CSS color value"
>
When point is selected: Color for the points. Use when you want all points to be the same color.
</PropListing>

<PropListing
name="selectedBorderWidth"
options="pixel value"
defaultValue=0.75
>
When point is selected: Width of the border around each point.
</PropListing>

<PropListing
name="selectedBorderColor"
options="CSS color value"
defaultVallue="white"
>
When point is selected: Color of the border around each point.
</PropListing>

<PropListing
name="selectedOpacity"
options="number between 0 and 1"
defaultValue=0.8
>
When point is selected: Opacity of the points.
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
name="tooltipClass"
options="CSS class"
>
CSS class applied to the tooltip content. You can pass Tailwind classes into this prop to custom-style the tooltip
</PropListing>


<PropListing
name="tooltip"
options="array of objects"
>
Configuration for tooltips associated with each area. See below example for format
</PropListing>

<LineBreak/>

#### `tooltip` example:

```javascript
tooltip={[
    {id: 'zip_code', fmt: 'id', showColumnName: false, valueClass: 'text-xl font-semibold'},
    {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
    {id: 'zip_code', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
]}
```

#### All options available in `tooltip`:
- `id`: column ID
- `title`: custom string to use as title of field
- `fmt`: format to use for value
- `showColumnName`: whether to show the column name. If `false`, only the value will be shown
- `contentType`: currently can only be "link"
- `linkLabel`: text to show for a link when contentType="link"
- `formatColumnTitle`: whether to automatically uppercase the first letter of the title. Only applies when `title` not passed explicitly
- `valueClass`: custom Tailwind classes to style the values
- `fieldClass`: custom Tailwind classes to style the column names


### Base Map

<PropListing
name="basemap"
options="URL"
>
URL template for the basemap tiles.
</PropListing>

<PropListing
name="attribution"
options="text"
>
Attribution text to display on the map (e.g., "© OpenStreetMap contributors").
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
defaultValue="300"
>
Height of the map in pixels.
</PropListing>