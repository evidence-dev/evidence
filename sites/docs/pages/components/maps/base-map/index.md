---
title: Base Map
sidebar_position: 2
---

<DocTab>
    <div slot='preview'>
        <BaseMap>
        <Areas data={la_zip_sales} geoId=ZCTA5CE10 areaCol=zip_code value=sales valueFmt=usd/>
        <Points data={la_locations} lat=lat long=long color=#179917/>
        </BaseMap>
    </div>

```html
<BaseMap>
  <Areas data={la_zip_sales} geoId=ZCTA5CE10 areaCol=zip_code value=sales valueFmt=usd/>
  <Points data={la_locations} lat=lat long=long color=#179917/>
</BaseMap>
```
</DocTab>

```sql la_zip_sales
select *, 'https://www.google.com/search?q=' || zip_code as link_col from la_zip_sales
where zip_code <> 90704
```

```sql la_locations
select *, 'https://www.google.com/search?q=' || point_name as link_col from la_locations
```

## Overview
The BaseMap component provides a flexible and extensible way to create maps with multiple layers. This component serves as the foundation for AreaMap, PointMap, and BubbleMap.

Within BaseMap, you can add layers using the following components:
- `<Areas/>`
- `<Points/>`
- `<Bubbles/>`

## Examples

See the pages for [Area Map](/components/maps/area-map), [Point Map](/components/maps/point-map), and [Bubble Map](/components/maps/bubble-map) for examples specific to those layers. The same options can be applied to the layer components within BaseMap.

### Adding Multiple Layers

<DocTab>
    <div slot='preview'>
        <BaseMap>
        <Areas 
            data={la_zip_sales}
            areaCol=zip_code
            geoJsonUrl="/geo-json/ca_california_zip_codes_geo_1.min.json"
            geoId=ZCTA5CE10
            value=sales
            valueFmt=usd
        />
        <Bubbles 
            data={la_locations}
            lat=lat
            long=long
            size=sales
            sizeFmt=usd
            value=sales
            valueFmt=usd
            pointName=point_name
            opacity=0.5
        />
        </BaseMap>
    </div>

```svelte
<BaseMap>
  <Areas 
    data={la_zip_sales}
    areaCol=zip_code
    geoJsonUrl="path/to/your/geoJSON"
    geoId=ZCTA5CE10
    value=sales
    valueFmt=usd
  />
  <Bubbles 
    data={la_locations}
    lat=lat
    long=long
    size=sales
    sizeFmt=usd
    value=sales
    valueFmt=usd
    pointName=point_name
    colorPalette={['yellow','orange','red','darkred']}
    opacity=0.5
  />
</BaseMap>
```
</DocTab>



### Custom Basemap
You can add a different basemap by passing in a basemap URL. You can find examples here: https://leaflet-extras.github.io/leaflet-providers/preview/

<DocTab>
    <div slot='preview'>
        <BaseMap basemap={`https://tile.openstreetmap.org/{z}/{x}/{y}.png`} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'>
            <Points 
                data={la_locations}
                lat=lat
                long=long
                value=sales
                valueFmt=usd
                pointName=point_name
                color=violet
                borderColor=black
                borderWidth=2
            />
        </BaseMap>
    </div>

```svelte
<BaseMap basemap={`https://tile.openstreetmap.org/{z}/{x}/{y}.png`} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'>
    <Points 
        data={la_locations}
        lat=lat
        long=long
        value=sales
        valueFmt=usd
        pointName=point_name
        color=violet
        borderColor=black
        borderWidth=2
    />
</BaseMap>
```
</DocTab>

### Custom Tooltip

#### `tooltipType=hover`

<DocTab>
    <div slot='preview'>
        <BaseMap>
            <Areas 
                data={la_zip_sales} 
                areaCol=zip_code
                geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
                geoId=ZCTA5CE10
                value=sales
                valueFmt=usd
                height=250
                tooltip={[
                    {id: 'zip_code', fmt: 'id', showColumnName: false, valueClass: 'text-xl font-semibold'},
                    {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
                    {id: 'zip_code', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
                ]}
            />
        </BaseMap>
    </div>

```svelte
<BaseMap>
    <Areas 
        data={la_zip_sales} 
        areaCol=zip_code
        geoJsonUrl='/geo-json/ca_california_zip_codes_geo_1.min.json'
        geoId=ZCTA5CE10
        value=sales
        valueFmt=usd
        height=250
        tooltip={[
            {id: 'zip_code', fmt: 'id', showColumnName: false, valueClass: 'text-xl font-semibold'},
            {id: 'sales', fmt: 'eur', fieldClass: 'text-[grey]', valueClass: 'text-[green]'},
            {id: 'zip_code', showColumnName: false, contentType: 'link', linkLabel: 'Click here', valueClass: 'font-bold mt-1'}
        ]}
    />
</BaseMap>
```
</DocTab>


#### With clickable link and `tooltipType=click`

<DocTab>
    <div slot='preview'>
        <BaseMap>
            <Areas 
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
        </BaseMap>
    </div>

```svelte
<BaseMap>
    <Areas 
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
</BaseMap>
```
</DocTab>

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


## Base Map Options

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

## Layer Options

### Areas
Use the `<Areas/>` component to add an area layer
<PropListing
name="data"
required
options="query name"
>
Query result, referenced using curly braces.
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
Column that determines the value displayed for each area (used for color scale).
</PropListing>

<PropListing
name="valueFmt"
options="format string"
>
Format string for displaying the value.
</PropListing>

### Points
Use the `<Points/>` component to add an area layer

<PropListing
name="data"
required
options="query name"
>
Query result, referenced using curly braces.
</PropListing>

<PropListing
name="lat"
required
options="column name"
>
Column containing latitude values.
</PropListing>

<PropListing
name="long"
required
options="column name"
>
Column containing longitude values.
</PropListing>

<PropListing
name="value"
options="column name"
>
Column that determines the value displayed at each point.
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


### Bubbles
Use the `<Bubbles/>` component to add an area layer

<PropListing
name="data"
required
options="query name"
>
Query result, referenced using curly braces.
</PropListing>

<PropListing
name="lat"
required
options="column name"
>
Column containing latitude values.
</PropListing>

<PropListing
name="long"
required
options="column name"
>
Column containing longitude values.
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
Maximum size of the bubbles.
</PropListing>

<PropListing
name="value"
options="column name"
>
Column that determines the value displayed at each point (used for color scale).
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

<PropListing
    name="paneType"
    options="text"
>
    Specifies the type of pane where the bubbles will be rendered.
</PropListing>

<PropListing
    name="z"
    options="number"
>
    Represents the z-index value for the pane, controlling its stacking order relative to other panes (higher values are on top, e.g., z=2 is above z=1).
</PropListing>

### Common Layer Options

#### Color Scale

<PropListing
name="colorPalette"
options="array of colors"
>
Array of colors used for theming the points or areas based on data.
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

#### Interactivity

<PropListing
name="link"
options="URL"
>
URL to navigate to when a point or area is clicked.
</PropListing>

<PropListing
name="name"
options="string"
>
Input name. Can be referenced on your page with {inputs.my_input_name}.
</PropListing>

#### Styling
<PropListing
name="color"
options="CSS color value"
>
Color for the points or areas. Use when you want all points or areas to be the same color.
</PropListing>

<PropListing
name="borderWidth"
options="pixel value"
>
Width of the border around each point or area.
</PropListing>

<PropListing
name="borderColor"
options="CSS color value"
>
Color of the border around each point or area.
</PropListing>

<PropListing
name="opacity"
options="number between 0 and 1"
>
Opacity of the points or areas.
</PropListing>

#### Selected State
<PropListing
name="selectedColor"
options="CSS color value"
>
When point or area is selected: Color for the points or areas.
</PropListing>

<PropListing
name="selectedBorderWidth"
options="pixel value"
>
When point or area is selected: Width of the border around each point or area.
</PropListing>

<PropListing
name="selectedBorderColor"
options="CSS color value"
>
When point or area is selected: Color of the border around each point or area.
</PropListing>

<PropListing
name="selectedOpacity"
options="number between 0 and 1"
>
When point or area is selected: Opacity of the points or areas.
</PropListing>

#### Tooltips
<PropListing
name="showTooltip"
options="{['true','false']}"
defaultValue=true
>
Whether to show tooltips.
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
CSS class applied to the tooltip content. You can pass Tailwind classes into this prop to custom-style the tooltip.
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

