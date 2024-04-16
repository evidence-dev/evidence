---
title: Heatmap
sidebar_position: 1
---

<img src="/img/heatmap-basic.png" width="700"/>

```markdown
<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    valueFmt=usd 
/>
```

## Data Structure

Heatmap requires your data to contain 2 categorical columns (1 for the x-axis and 1 for the y-axis) and 1 numeric column.

#### Example

```sql example
SELECT 'West' as region, 'A' as product, 120 as sales
UNION ALL
SELECT 'West', 'B', 200
UNION ALL
SELECT 'West', 'C', 150
UNION ALL
SELECT 'East', 'A', 110
UNION ALL
SELECT 'East', 'B', 315
UNION ALL
SELECT 'East', 'C', 450
```

<DataTable data={example} />


### Unpivoting your Data
If you have data spread across columns, you can use the `UNPIVOT` feature in your SQL query to prepare the data for the heatmap.

#### Example
If you have a query result called `region_sales`:

```sql region_sales
SELECT 'West' as region, 120 as "A", 200 as "B", 150 as "C"
UNION ALL
SELECT 'East', 110, 315, 450
```

<DataTable data={region_sales} formatColumnTitles=false/>

You can use `UNPIVOT` like so:

```sql
UNPIVOT ${region_sales}
on COLUMNS(* EXCLUDE(region))
INTO
    NAME product
    VALUE sales
```

Which will return this table, which can be passed into the Heatmap:

```sql region_sales_unpivoted
SELECT 'West' as region, 'A' as product, 120 as sales
UNION ALL
SELECT 'West', 'B', 200
UNION ALL
SELECT 'West', 'C', 150
UNION ALL
SELECT 'East', 'A', 110
UNION ALL
SELECT 'East', 'B', 315
UNION ALL
SELECT 'East', 'C', 450
order by region desc, product
```

<DataTable data={region_sales_unpivoted} formatColumnTitles=false />


<Alert status=info>

**Note on Date Columns**

Heatmap currently only works with string columns. If you would like to use a date column, cast it to a string in your SQL query before passing it into the Heatmap

</Alert>


## Examples

### Basic Heatmap

<img src="/img/heatmap-basic.png" width="700"/>

```markdown
<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    valueFmt=usd 
/>
```

### Custom Color Palette

<img src="/img/heatmap-category-day-green.png" width="700"/>

```markdown
<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    colorPalette={['white', 'green']}
    title="Weekday Orders"
    subtitle="By Category"
/>
```

### Rotated Labels

<img src="/img/heatmap-item-state.png" width="700"/>

```markdown
<Heatmap 
    data={item_state} 
    x=item 
    y=state 
    value=orders 
    xLabelRotation=-45
    colorPalette={['white', 'maroon']} 
    title="Item Sales"
    subtitle="By State"
    rightPadding=40
    cellHeight=25
/>
```




## Options

### Data

<PropListing 
    name="data"
    required
    options="query name"
>

Query name, wrapped in curly braces

</PropListing>
<PropListing 
    name="x"
    required
    options="column name"
>

Categorical column to use for the x-axis. If you want to use dates, cast them to strings in your query first

</PropListing>
<PropListing 
    name="y"
    required
    options="column name"
>

Categorical column to use for the y-axis. If you want to use dates, cast them to strings in your query first

</PropListing>
<PropListing 
    name="value"
    required
    options="column name"
>

Numeric column to use for the y-axis

</PropListing>
<PropListing 
    name="min"
    options="number"
    defaultValue="min of value column"
>

Minimum number for the heatmap's color scale

</PropListing>
<PropListing 
    name="max"
    options="number"
    defaultValue="max of value column"
>

Maximum number for the heatmap's color scale

</PropListing>
<PropListing 
    name="emptySet"
    options={['error', 'warn', 'pass']}
    defaultValue="error"
>

Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.

</PropListing>
<PropListing 
    name="emptyMessage"
    options="string"
    defaultValue="No records"
>

Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).

</PropListing>
<PropListing 
    name="nullsZero"
    options={['true', 'false']}
    defaultValue="true"
>

Whether to treats nulls or missing values as zero

</PropListing>
<PropListing 
    name="zeroDisplay"
    options="string"
>

String to display in place of zeros

</PropListing>
<PropListing 
    name="colorPalette"
    options="array of color codes - e.g., {`{['navy', 'white', '#c9c9c9']}`}"
>

Array of colors to form the gradient for the heatmap.

</PropListing>
<PropListing 
    name="valueFmt"
    options="Excel-style format | built-in format name | custom format name"
>

Format to use for value column ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing 
    name="cellHeight"
    options="number"
    defaultValue="30"
>

Number representing the height of cells in the heatmap

</PropListing>
<PropListing 
    name="leftPadding"
    options="number"
    defaultValue="0"
>

Number representing the padding (whitespace) on the left side of the chart. Useful to avoid labels getting cut off

</PropListing>
<PropListing 
    name="rightPadding"
    options="number"
    defaultValue="2"
>

Number representing the padding (whitespace) on the left side of the chart. Useful to avoid labels getting cut off

</PropListing>
<PropListing 
    name="valueLabels"
    options={['true', 'false']}
    defaultValue="true"
>

Turn on or off value labels in the heatmap cells

</PropListing>
<PropListing 
    name="mobileValueLabels"
    options={['true', 'false']}
    defaultValue="false"
>

Turn on or off value labels in the heatmap cells when app is viewed on a mobile device screen size

</PropListing>
<PropListing 
    name="borders"
    options={['true', 'false']}
    defaultValue="true"
>

Turn on or off borders around cells. Default is to show light grey border around each cell. To customize border appearance, use `echartsOptions`

</PropListing>
<PropListing 
    name="xTickMarks"
    options={['true', 'false']}
    defaultValue="false"
>

Turns on/off tick marks for the x-axis labels

</PropListing>
<PropListing 
    name="yTickMarks"
    options={['true', 'false']}
    defaultValue="false"
>

Turns on/off tick marks for the y-axis labels

</PropListing>
<PropListing 
    name="xLabelRotation"
    options="number"
    defaultValue="0"
>

Degrees to rotate the labels on the x-axis. Can be negative number to reverse direction. `45` and `-45` are common options

</PropListing>
<PropListing 
    name="xAxisPosition"
    options={['top', 'bottom']}
    defaultValue="top"
>

Position of x-axis and labels. Can be top or bottom. top recommended for longer charts

</PropListing>
<PropListing 
    name="xSort"
    options="column name"
>

Column to sort x values by

</PropListing>
<PropListing 
    name="xSortOrder"
    options={['asc', 'desc']}
    defaultValue="asc"
>

Sets direction of sort

</PropListing>
<PropListing 
    name="ySort"
    options="column name"
>

Column to sort y values by

</PropListing>
<PropListing 
    name="ySortOrder"
    options={['asc', 'desc']}
    defaultValue="asc"
>

Sets direction of sort

</PropListing>
<PropListing 
    name="title"
    options="string"
>

Chart title. Appears at top left of chart.

</PropListing>
<PropListing 
    name="subtitle"
    options="string"
>

Chart subtitle. Appears just under title.

</PropListing>
<PropListing 
    name="chartAreaHeight"
    options="number"
    defaultValue="auto set based on y-axis values"
>

Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX.

</PropListing>
<PropListing 
    name="legend"
    options={['true', 'false']}
    defaultValue="true"
>

Turn on or off the legend

</PropListing>
<PropListing 
    name="filter"
    options={['true', 'false']}
    defaultValue="false"
>

Allow draggable filtering on the legend. Must be used with `legend=true`

</PropListing>
<PropListing 
    name="renderer"
    options={['canvas', 'svg']}
    defaultValue="canvas"
>

Which chart renderer type (canvas or SVG) to use. See ECharts' [documentation on renderers](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/).

</PropListing>
<PropListing 
    name="echartsOptions"
    options="{`{{exampleOption:'exampleValue'}}`}"
>

Custom Echarts options to override the default options. See [reference page](/components/echarts-options/) for available options.

</PropListing>
<PropListing 
    name="seriesOptions"
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
>

Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions` See [reference page](/components/echarts-options/) for available options.

</PropListing>
<PropListing 
    name="printEchartsConfig"
    options={['true', 'false']}
    defaultValue="false"
>

Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options

</PropListing>
<PropListing 
    name="connectGroup"
>

Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected

</PropListing>
