---
title: Calendar Heatmap
sidebar_position: 1
queries:
- orders_by_day.sql
- orders_by_day_2021.sql
---

<CalendarHeatmap 
    data={orders_by_day_2021}    
    date=day
    value=sales
    title="Calendar Heatmap"
    subtitle="Daily Sales"
/>

```markdown
<CalendarHeatmap 
    data={orders_by_day_2021}
    date=day
    value=sales
    title="Calendar Heatmap"
    subtitle="Daily Sales"
/>
```

## Examples

### Multi-Year

<CalendarHeatmap 
    data={orders_by_day}    
    date=day
    value=sales
/>

```markdown
<CalendarHeatmap 
    data={orders_by_day}
    date=day
    value=sales
/>
```

### Custom Color Palette

<CalendarHeatmap
    data={orders_by_day_2021}
    date=day
    value=sales
    colorPalette={['navy', 'lightyellow', 'purple']}
/>

```markdown
<CalendarHeatmap
    data={orders_by_day_2021}
    date=day
    value=sales
    colorPalette={['navy', 'lightyellow', 'purple']}
/>
```

### Without Year Label

<CalendarHeatmap 
    data={orders_by_day_2021}    
    date=day
    value=sales
    yearLabel=false
/>

```markdown
<CalendarHeatmap 
    data={orders_by_day_2021}
    date=day
    value=sales
    yearLabel=false
/> 
```




## Options

### Data

<PropListing 
    name="data"
    description="Query name, wrapped in curly braces"
    required=true
    options="query name"
/>
<PropListing 
    name="date"
    description="Date column to use for the calendar"
    required=true
    options="column name"
/>
<PropListing 
    name="value"
    description="Numeric column to use for the y-axis"
    required=true
    options="column name"
/>
<PropListing 
    name="min"
    description="Minimum number for the calendar heatmap's color scale"
    options="number"
    defaultValue="min of value column"
/>
<PropListing 
    name="max"
    description="Maximum number for the calendar heatmap's color scale"
    options="number"
    defaultValue="max of value column"
/>
<PropListing 
    name="emptySet"
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    options={['error', 'warn', 'pass']}
    defaultValue="error"
/>
<PropListing 
    name="emptyMessage"
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    options="string"
    defaultValue="No records"
/>

### Formatting & Styling

<PropListing 
    name="colorPalette"
    description="Array of colors to form the gradient for the heatmap. Remember to wrap your array in curly braces."
    options="array of color codes - e.g., {`colorPalette={['navy', 'white', '#c9c9c9']}`}"
/>
<PropListing 
    name="valueFmt"
    description="Format to use for value column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing 
    name="yearLabel"
    description="Turn on or off year label on left of chart"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing 
    name="monthLabel"
    description="Turn on or off month label on top of chart"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing 
    name="dayLabel"
    description="Turn on or off day label on left of chart"
    options={['true', 'false']}
    defaultValue="true"
/>

### Chart

<PropListing 
    name="title"
    description="Chart title. Appears at top left of chart."
    options="string"
/>
<PropListing 
    name="subtitle"
    description="Chart subtitle. Appears just under title."
    options="string"
/>
<PropListing 
    name="chartAreaHeight"
    description="Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX."
    options="number"
    defaultValue="auto set based on y-axis values"
/>
<PropListing 
    name="legend"
    description="Turn on or off the legend"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing 
    name="filter"
    description="Allow draggable filtering on the legend. Must be used with `legend=true`"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing 
    name="renderer"
    description="Which chart renderer type (canvas or SVG) to use. See ECharts' <a href='https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/' class=markdown>documentation on renderers</a>."
    options={['canvas', 'svg']}
    defaultValue="canvas"
/>
<PropListing
    name="downloadableData"
    description="Whether to show the download button to allow users to download the data"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>
<PropListing
    name="downloadableImage"
    description="Whether to show the button to allow users to save the chart as an image"
    required=false
    options={["true", "false"]}
    defaultValue="true"
/>

### Custom Echarts Options

<PropListing 
    name="echartsOptions"
    description="Custom Echarts options to override the default options. See <a href='/components/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleOption:'exampleValue'}}`}"
/>
<PropListing 
    name="seriesOptions"
    description="Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions` See <a href='/components/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
/>
<PropListing 
    name="printEchartsConfig"
    description="Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options"
    options={['true', 'false']}
    defaultValue="false"
/>

### Interactivity

<PropListing
    name=connectGroup
    description="Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected"
/>
