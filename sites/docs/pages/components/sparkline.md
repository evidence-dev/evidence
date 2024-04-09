---
title: Sparkline
sidebar_position: 1
---

<img src="/img/sparkline-basic.png" width="150"/>

```markdown
<Sparkline 
    data={sales_by_date} 
    dateCol=date 
    valueCol=sales 
/>
```

## Examples

### Connected Sparkline

<img src="/img/sparkline-connected.gif" width="400"/>

```html
<Sparkline data={sales_by_date} dateCol=date valueCol=sales type=bar  valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
<Sparkline data={sales_by_date} dateCol=date valueCol=sales type=area color=maroon valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
<Sparkline data={sales_by_date} dateCol=date valueCol=sales type=line color=purple valueFmt=eur dateFmt=mmm connectGroup=mysparkline/>
```

## Options

### Data

<PropListing
    name="data"
    description="Query name, wrapped in curly braces"
    required
    options="query name"
/>
<PropListing
    name="dateCol"
    description="Categorical column to use for the x-axis"
    required
    options="column name"
/>
<PropListing
    name="valueCol"
    description="Numeric column to use for the y-axis"
    required
    options="column name"
/>
<PropListing
    name="type"
    description="Chart type for sparkline"
    options={['line', 'area', 'bar']}
    defaultValue="line"
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
    name="color"
    description="Color to use for the visualization. For area sparklines, choose the color for the line and the area color will be automatically appplied in a lighter shade."
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name="valueFmt"
    description="Format to use for value column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing
    name="dateFmt"
    description="Format to use for date column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
/>

### Axes

<PropListing
    name="yScale"
    description="Whether to truncate the y-axis to enhance visibility"
    options={['true', 'false']}
    defaultValue="false"
/>

### Sizing

<PropListing
    name="height"
    description="Height of sparkline in pixels"
    options="number"
    defaultValue="15"
/>
<PropListing
    name="width"
    description="Width of sparkline in pixels"
    options="number"
    defaultValue="50"
/>

### Interactivity

<PropListing
    name="interactive"
    description="Turn on or off tooltip behaviour on hover. If off, chart will be a staticly rendered SVG (better for page performance). If on, you will be able to see dates/values when hovering over the sparkline"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name="connectGroup"
    description="Group name to connect this sparkline to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected"
    options="string"
/>

