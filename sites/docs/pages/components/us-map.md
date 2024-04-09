---
title: US Map
sidebar_position: 1
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


## Options

### Data

<PropListing
    name=data
    description='Query name, wrapped in curly braces'
    required
    options='query name'
/>
<PropListing
    name=state
    description='Column to be used as the name for each state'
    required
    options='column name'
/>
<PropListing
    name=abbreviations
    description='If true, map will look for two letter abbreviations rather than full names'
    options={['false','true']}
    defaultValue='false'
/>
<PropListing
    name=value
    description='Column to be used as the value determining the colour of each state'
    required
    options='column name'
/>
<PropListing
    name=colorScale
    description='Colour scale to be used. To use a custom color palette, see the `colorPalette` prop'
    options={['blue','green','red','bluegreen']}
    defaultValue='blue'
/>
<PropListing
    name=colorPalette
    description='Custom color palette to use for setting state colors. Overrides `colorScale`. E.g., <code class=markdown>{`{['#cf0d06','#eb5752','#e88a87']}`}</code>"'
    options='array of color codes (can be CSS, hex, RGB, HSL)'
/>
<PropListing
    name=min
    description='Minimum value for the colour scale. Anything below the minimum will be shown in the same colour as the min value'
    options='number'
/>
<PropListing
    name=max
    description='Maximum value for the colour scale. Anything above the maximum will be shown in the same colour as the max value'
    options='number'
/>
<PropListing
    name=title
    description='Title appearing above the map. Is included when you click to save the map image'
    options='string'
/>
<PropListing
    name=subtitle
    description='Subtitle appearing just above the map. Is included when you click to save the map image'
    options='string'
/>
<PropListing
    name=link
    description='Column containing links. When supplied, allows you to click each state on the map and navigate to the link'
    options='column name'
/>
<PropListing
    name=fmt
    description='Format to use for values (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)'
    options='Excel-style format | built-in format | custom format'
/>
<PropListing
    name=legend
    description='Whether to show a legend at the top of the map'
    options={['true','false']}
    defaultValue='false'
/>
<PropListing
    name=filter
    description='Whether to include filter controls on the legend. Can only be used when legend = true'
    options={['true','false']}
    defaultValue='false'
/>
<PropListing
    name=emptySet
    description='Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to `error`, empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.'
    options={['error','warn','pass']}
    defaultValue='error'
/>
<PropListing
    name=emptyMessage
    description='Text to display when an empty dataset is received - only applies when `emptySet` is `warn` or `pass`, or when the empty dataset is a result of an input component change (dropdowns, etc.).'
    options='string'
    defaultValue='No records'
/>
<PropListing
    name=renderer
    description="Which chart renderer type (canvas or SVG) to use. See ECharts' <a href='https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/' class=markdown>documentation on renderers</a>."
    options={['canvas','svg']}
    defaultValue='canvas'
/>

### Custom Echarts Options

<PropListing
    name=echartsOptions
    description="Custom Echarts options to override the default options. See <a href='/components/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleOption:'exampleValue'}}`}"
/>
<PropListing
    name=seriesOptions
    description="Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions` See <a href='/components/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
/>
<PropListing
    name=printEchartsConfig
    description="Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options"
    options={['true', 'false']}
    defaultValue="false"
/>
