---
title: Area Map
description: Compare a metric across different regions on a map using a choropleth map
sidebar_position: 1
---

Compare a metric across different regions on a map using a choropleth map

<DocTab>
    <div slot='preview'>
        <AreaMap 
            data={la_zip_sales} 
            areaCol=zip_code
            geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
            geoId=ZCTA5CE10
            value=sales
            valueFmt=usd
            height=250
        />
    </div>

```svelte
<AreaMap 
    data={la_zip_sales} 
    areaCol=zip_code
    geoJsonUrl='path/to/your/geoJson'
    geoId=ZCTA5CE10
    value=sales
    valueFmt=usd
    height=250
/>
```
</DocTab>

```sql la_zip_sales
select *, 'https://www.google.com/search?q=' || zip_code as link_col from la_zip_sales
where zip_code <> 90704
```


## Examples

### Custom Basemap
You can add a different basemap by passing in a basemap URL. You can find examples here: https://leaflet-extras.github.io/leaflet-providers/preview/

<DocTab>
    <div slot='preview'>
        <AreaMap 
            data={la_zip_sales} 
            areaCol=zip_code
            geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
            geoId=ZCTA5CE10
            value=sales
            valueFmt=usd
            height=250
            borderColor=#303030
            basemap={`https://tile.openstreetmap.org/{z}/{x}/{y}.png`}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
    </div>
<br>

**Note:** you need to wrap the url in curly braces and backticks to avoid the curly braces in the URL being read as variables on your page

```svelte
<AreaMap 
    data={la_zip_sales} 
    areaCol=zip_code
    geoJsonUrl='path/to/your/geoJson'
    geoId=ZCTA5CE10
    value=sales
    valueFmt=usd
    height=250
    basemap={`https://tile.openstreetmap.org/{z}/{x}/{y}.png`}
/>
```
</DocTab>


### Using an Online GeoJSON

```sql orders_by_state
select state, count(*) as orders
from orders
where state != 'Alaska' and state != 'Hawaii'
group by state
```

<DocTab>
    <div slot='preview'>
        <AreaMap 
            data={orders_by_state} 
            areaCol=state
            geoJsonUrl=https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces.geojson
            geoId=name
            value=orders
        />
    </div>

```svelte
<AreaMap 
    data={orders_by_state} 
    areaCol=state
    geoJsonUrl=https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces.geojson
    geoId=name
    value=orders
/>
```
</DocTab>


### Custom Tooltip

#### `tooltipType=hover`

<DocTab>
    <div slot='preview'>
        <AreaMap 
            data={la_zip_sales} 
            areaCol=zip_code
            geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
            geoId=ZCTA5CE10
            value=sales
            valueFmt=usd
            height=250
            tooltip={[
                {id: 'zip_code', fmt: 'id', showColumnName: false, valueClass: 'text-xl font-semibold'},
                {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'}
            ]}
        />
    </div>

```svelte
<AreaMap 
    data={la_zip_sales} 
    areaCol=zip_code
    geoJsonUrl='path/to/your/geoJson'
    geoId=ZCTA5CE10
    value=sales
    valueFmt=usd
    height=250
    tooltip={[
        {id: 'zip_code', fmt: 'id', showColumnName: false, valueClass: 'text-xl font-semibold'},
        {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'}
    ]}
/>
```
</DocTab>


#### With clickable link and `tooltipType=click`

<DocTab>
    <div slot='preview'>
        <AreaMap 
            data={la_zip_sales} 
            areaCol=zip_code
            geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
            geoId=ZCTA5CE10
            value=sales
            valueFmt=usd
            height=250
            tooltipType=click
            tooltip={[
                {id: 'zip_code', fmt: 'id', showColumnName: false, valueClass: 'text-xl font-semibold'},
                {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
                {id: 'link_col', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
            ]}
        />
    </div>

```svelte
<AreaMap 
    data={la_zip_sales} 
    areaCol=zip_code
    geoJsonUrl='path/to/your/geoJson'
    geoId=ZCTA5CE10
    value=sales
    valueFmt=usd
    height=250
    tooltipType=click
    tooltip={[
        {id: 'zip_code', fmt: 'id', showColumnName: false, valueClass: 'text-xl font-semibold'},
        {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
        {id: 'link_col', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
    ]}
/>
```
</DocTab>



### Custom Styling


<DocTab>
    <div slot='preview'>
        <AreaMap 
            data={la_zip_sales} 
            areaCol=zip_code
            geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
            geoId=ZCTA5CE10
            value=sales
            valueFmt=usd
            height=250
            color=#fff5d9
            borderColor=#737373
            borderWidth=0.5
        />
    </div>

```svelte
<AreaMap 
    data={la_zip_sales} 
    areaCol=zip_code
    geoJsonUrl='path/to/your/geoJson'
    geoId=ZCTA5CE10
    value=sales
    valueFmt=usd
    height=250
    color=#fff5d9
    borderColor=#737373
    borderWidth=0.5
/>
```
</DocTab>


### Custom Color Palette

<DocTab>
    <div slot='preview'>
        <AreaMap 
            data={la_zip_sales} 
            areaCol=zip_code
            geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
            geoId=ZCTA5CE10
            value=sales
            valueFmt=usd
            height=250
            colorPalette={[
                ['yellow', 'yellow'],
                ['orange', 'orange'],
                ['red', 'red'],
                ['darkred', 'darkred'],
            ]}
        />
    </div>

```svelte
<AreaMap 
    data={la_zip_sales} 
    areaCol=zip_code
    geoJsonUrl='path/to/your/geoJson'
    geoId=ZCTA5CE10
    value=sales
    valueFmt=usd
    height=250
    colorPalette={[
        ['yellow', 'yellow'],
        ['orange', 'orange'],
        ['red', 'red'],
        ['darkred', 'darkred'],
    ]}
/>
```
</DocTab>



### Link Drilldown
Pass in a `link` column to enable navigation on click of the point. These can be absolute or relative URLs


<DocTab>
    <div slot='preview'>
        <AreaMap 
            data={la_zip_sales} 
            areaCol=zip_code
            geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
            geoId=ZCTA5CE10
            value=sales
            valueFmt=usd
            height=250
            link=link_col
        />
    </div>

```svelte
<AreaMap 
    data={la_zip_sales} 
    areaCol=zip_code
    geoJsonUrl='path/to/your/geoJson'
    geoId=ZCTA5CE10
    value=sales
    valueFmt=usd
    height=250
    link=link_col
/>
```
</DocTab>



### Use Map as Input
Use the `name` prop to set an input name for the map - when a point is clicked, it will set the input value to that row of data

<DocTab>
    <div slot='preview'>
        <AreaMap 
            data={la_zip_sales} 
            areaCol=zip_code
            geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
            geoId=ZCTA5CE10
            value=sales
            valueFmt=usd
            height=250
            name=my_area_map
        />
    </div>

```svelte
<AreaMap 
    data={la_zip_sales} 
    areaCol=zip_code
    geoJsonUrl='path/to/your/geoJson'
    geoId=ZCTA5CE10
    value=sales
    valueFmt=usd
    height=250
    name=my_area_map
/>
```
</DocTab>



*Click an area on the map to see the input value get updated:*

#### Selected value for `{inputs.my_area_map}`: 

<pre class="text-sm">{JSON.stringify(inputs.my_area_map, null, 2)}</pre>

#### Selected value for `{inputs.my_area_map.zip_code}`: 
  
{inputs.my_area_map.zip_code}


```filtered_areas
select * from ${la_zip_sales}
where zip_code = ${inputs.my_area_map.zip_code} OR ${inputs.my_area_map.zip_code} = true
```

#### Filtered Data
<DataTable data={filtered_areas}>  	
    <Column id=id/> 	
    <Column id=zip_code fmt=id/> 	
    <Column id=sales fmt=usd/> 	
</DataTable>

### Legends


```sql grouped_locations
SELECT 
    *, 
    CASE 
        WHEN id BETWEEN 0 AND 500 THEN 'Hotels'
        WHEN id BETWEEN 501 AND 1000 THEN 'Restaurants'
        WHEN id BETWEEN 1001 AND 1500 THEN 'Golf Courses'
        WHEN id BETWEEN 1501 AND 2000 THEN 'Shops'
        WHEN id BETWEEN 2001 AND 2500 THEN 'Bars'
        WHEN id BETWEEN 2501 AND 3000 THEN 'Entertainment'
        WHEN id BETWEEN 3001 AND 4000 THEN 'Banks'
    END AS Category
FROM la_zip_sales
WHERE zip_code <> 90704
ORDER BY 1;
```
#### Categorical Legend

<DocTab>
    <div slot='preview'>
        <AreaMap
            data={grouped_locations}
            lat=lat
            long=long
            value=Category
            geoId=ZCTA5CE10
            areaCol=zip_code
        />
    </div>

 ```svelte
<AreaMap
    data={grouped_locations}
    lat=lat
    long=long
    value=Category
    geoId=ZCTA5CE10
    areaCol=zip_code
/>
```
</DocTab>


#### Custom Colors
Set custom legend colors using the `colorPalette` prop to match the number of categories; excess categorical options will default to standard colors.

<DocTab>
    <div slot='preview'>
        <AreaMap
            data={grouped_locations}
            lat=lat
            long=long
            value=Category
            geoId=ZCTA5CE10
            areaCol=zip_code
            colorPalette={['#C65D47', '#5BAF7A', '#4A8EBA', '#D35B85', '#E1C16D', '#6F5B9A', '#4E8D8D']}
        />
    </div>

 ```svelte
<AreaMap
    data={grouped_locations}
    lat=lat
    long=long
    value=Category
    geoId=ZCTA5CE10
    areaCol=zip_code
    colorPalette={['#C65D47', '#5BAF7A', '#4A8EBA', '#D35B85', '#E1C16D', '#6F5B9A', '#4E8D8D']}
/>
```
</DocTab>


#### Scalar Legend

<DocTab>
    <div slot='preview'>
        <AreaMap
            data={grouped_locations}
            lat=lat
            long=long
            value=sales
            geoId=ZCTA5CE10
            areaCol=zip_code
            valueFmt=usd
        />
    </div>

```svelte
<AreaMap
    data={grouped_locations}
    lat=lat
    long=long
    value=sales
    geoId=ZCTA5CE10
    areaCol=zip_code
    valueFmt=usd
/>
```
</DocTab>


#### Custom Colors
Define scalar legend colors using the `colorPalette` prop, allowing specified colors to create a gradient based on the range of values.

<DocTab>
    <div slot='preview'>
        <AreaMap
            data={grouped_locations}
            lat=lat
            long=long
            value=sales
            geoId=ZCTA5CE10
            areaCol=zip_code
            colorPalette={['#C65D47', '#4A8EBA']}
            valueFmt=usd
        />
    </div>

```svelte
<AreaMap
    data={grouped_locations}
    lat=lat
    long=long
    value=sales
    geoId=ZCTA5CE10
    areaCol=zip_code
    colorPalette={['#C65D47', '#4A8EBA']}
    valueFmt=usd
/>
```
</DocTab>


## Required GeoJSON Data Structure
The GeoJSON data you pass to the map must be a feature collection. [See here for an example](https://gist.github.com/sgillies/1233327#file-geojson-spec-1-0-L50)


## Map Resources

```sql all_geojson_urls
select * exclude(properties)
from geojson_urls
order by scale, category, file
```

```sql useful_geojson_urls
select * 
from ${all_geojson_urls}
where category in ('political_countries', 'political_states')
or file ilike 'populated_places%'
order by scale desc, category, file
```

Below are a selection of publically available GeoJSON files that may be useful for mapping. These are from the [Natural Earth Data](https://www.naturalearthdata.com) project, and hosted by [GeoJSON.xyz](https://geojson.xyz).

### Country, State, and City Locations

<DataTable data={useful_geojson_urls} rows=100>
    <Column id=file/>
    <Column id=category/>
    <Column id=scale/>
    <Column id=summary/>
    <Column id=size fmt='0.0,," MB"'/>
    <Column id=url contentType=link title=URL/>
</DataTable>

<Details title="All GeoJSON Files">

<DataTable data={all_geojson_urls} rows=all compact>
    <Column id=file/>
    <Column id=category/>
    <Column id=scale/>
    <Column id=summary/>
    <Column id=size fmt='0.0,," MB"'/>
    <Column id=url contentType=link title=URL/>
</DataTable>

</Details>

## Options

### Areas
<PropListing
name="data"
required    
options="query name"
>
Query result, referenced using curly braces
</PropListing>

<PropListing
name="geoJsonUrl"
required
options="URL"
>

Path to source geoJSON data from - can be a URL (see [Map Resources](#map-resources)) or a file in your project. 

If the file is in your `static` directory in the root of your project, reference it as `geoJsonUrl="/your_file.geojson"`

</PropListing>

<PropListing
name="areaCol"
required
options="column name"
>
Column in the data that specifies the area each row belongs to.
</PropListing>

<PropListing
name="geoId"
required
options="geoJSON property name"
>
Property in the GeoJSON that uniquely identifies each feature.
</PropListing>

<PropListing
name="value"
options="column name"
>
Column that determines the value displayed for each area (used for color scale)
</PropListing>

<PropListing
name="valueFmt"
options="format string"
>
Format string for displaying the value.
</PropListing>
<PropListing
    name=title
    options="string"
>

Title for the map

</PropListing>
<PropListing
    name=subtitle
    options="string"
>

Subtitle - appears under the title

</PropListing>

### Color Scale

<PropListing
name="colorPalette"
options="array of colors"
>
Array of colors used for theming the areas based on data <code></code>
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
URL to navigate to when a area is clicked.
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
Color for the areas. Use when you want all areas to be the same color.
</PropListing>

<PropListing
name="borderWidth"
options="pixel value"
defaultValue=0.75
>
Width of the border around each area.
</PropListing>

<PropListing
name="borderColor"
options="CSS color value"
defaultVallue="white"
>
Color of the border around each area.
</PropListing>

<PropListing
name="opacity"
options="number between 0 and 1"
defaultValue=0.8
>
Opacity of the areas.
</PropListing>

### Selected State

<PropListing
name="selectedColor"
options="CSS color value"
>
When area is selected: Color for the areas. Use when you want all areas to be the same color.
</PropListing>

<PropListing
name="selectedBorderWidth"
options="pixel value"
defaultValue=0.75
>
When area is selected: Width of the border around each area.
</PropListing>

<PropListing
name="selectedBorderColor"
options="CSS color value"
defaultVallue="white"
>
When area is selected: Color of the border around each area.
</PropListing>

<PropListing
name="selectedOpacity"
options="number between 0 and 1"
defaultValue=0.8
>
When area is selected: Opacity of the areas.
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