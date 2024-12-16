---
title: Heatmap
sidebar_position: 5
---

```orders
select category, dayname(order_datetime) as day, dayofweek(order_datetime) as day_num, count(*) as order_count from needful_things.orders
group by all
order by category, day_num  
```

<DocTab>
    <div slot='preview'>
        <Heatmap 
            data={orders} 
            x=day 
            y=category 
            value=order_count 
            valueFmt=usd 
        />
    </div>

```markdown
<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    valueFmt=usd 
/>
```
</DocTab>

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

<DocTab>
    <div slot='preview'>
        <Heatmap 
            data={orders} 
            x=day 
            y=category 
            value=order_count 
            valueFmt=usd 
        />
    </div>

```markdown
<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    valueFmt=usd 
/>
```
</DocTab>


### Custom Color Scale


<DocTab>
    <div slot='preview'>
        <Heatmap 
            data={orders} 
            x=day 
            y=category 
            value=order_count 
            valueFmt=usd 
            colorScale={[
                ['rgb(254,234,159)', 'rgb(254,234,159)'],
                ['rgb(218,66,41)', 'rgb(218,66,41)']
            ]}
        />
    </div>

```svelte
<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    valueFmt=usd 
    colorScale={[
        ['rgb(254,234,159)', 'rgb(254,234,159)'],
        ['rgb(218,66,41)', 'rgb(218,66,41)']
    ]}
/>
```
</DocTab>

### Rotated Labels


```item_state
select item, state, count(1) as orders from needful_things.orders
group by all
order by state asc, item asc
```

<DocTab>
    <div slot='preview'>
        <Heatmap 
            data={item_state} 
            x=item 
            y=state 
            value=orders 
            xLabelRotation=-45
            title="Item Sales"
            subtitle="By State"
            rightPadding=40
            cellHeight=25
            nullsZero=false
        />
    </div>

```svelte
<Heatmap 
    data={item_state} 
    x=item 
    y=state 
    value=orders 
    xLabelRotation=-45
    colorScale={['white', 'maroon']} 
    title="Item Sales"
    subtitle="By State"
    rightPadding=40
    cellHeight=25
    nullsZero=false
/>
```
</DocTab>

## Options

### Data

<PropListing
    name=data
    description="Query name, wrapped in curly braces"
    required=true
    options="query name"
/>
<PropListing
    name=x
    description="Categorical column to use for the x-axis. If you want to use dates, cast them to strings in your query first"
    required=true
    options="column name"
/>
<PropListing
    name=y
    description="Categorical column to use for the y-axis. If you want to use dates, cast them to strings in your query first"
    required=true
    options="column name"
/>
<PropListing
    name=value
    description="Numeric column to use for the y-axis"
    required=true
    options="column name"
/>
<PropListing
    name=min
    description="Minimum number for the heatmap's color scale"
    options="number"
    defaultValue="min of value column"
/>
<PropListing
    name=max
    description="Maximum number for the heatmap's color scale"
    options="number"
    defaultValue="max of value column"
/>
<PropListing
    name=emptySet
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    options={['error', 'warn', 'pass']}
    defaultValue="error"
/>
<PropListing
    name=emptyMessage
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    options="string"
    defaultValue="No records"
/>

### Formatting & Styling

<PropListing
    name=nullsZero
    description="Whether to treats nulls or missing values as zero"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=zeroDisplay
    description="String to display in place of zeros"
    options="string"
/>
<PropListing
    name=colorScale
    description="Array of colors to form the gradient for the heatmap."
    options="array of color codes - e.g., {`{['navy', 'white', '#c9c9c9']}`}"
/>
<PropListing
    name=valueFmt
    description="Format to use for value column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format name | custom format name"
/>
<PropListing
    name=cellHeight
    description="Number representing the height of cells in the heatmap"
    options="number"
    defaultValue="30"
/>
<PropListing
    name=leftPadding
    description="Number representing the padding (whitespace) on the left side of the chart. Useful to avoid labels getting cut off"
    options="number"
    defaultValue="0"
/>
<PropListing
    name=rightPadding
    description="Number representing the padding (whitespace) on the left side of the chart. Useful to avoid labels getting cut off"
    options="number"
    defaultValue="2"
/>
<PropListing
    name=valueLabels
    description="Turn on or off value labels in the heatmap cells"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=mobileValueLabels
    description="Turn on or off value labels in the heatmap cells when app is viewed on a mobile device screen size"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=borders
    description="Turn on or off borders around cells. Default is to show light grey border around each cell. To customize border appearance, use `echartsOptions`"
    options={['true', 'false']}
    defaultValue="true"
/>

### Axes

<PropListing
    name=xTickMarks
    description="Turns on/off tick marks for the x-axis labels"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=yTickMarks
    description="Turns on/off tick marks for the y-axis labels"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=xLabelRotation
    description="Degrees to rotate the labels on the x-axis. Can be negative number to reverse direction. `45` and `-45` are common options"
    options="number"
    defaultValue="0"
/>
<PropListing
    name=xAxisPosition
    description="Position of x-axis and labels. Can be top or bottom. top recommended for longer charts"
    options={['top', 'bottom']}
    defaultValue="top"
/>
<PropListing
    name=xSort
    description="Column to sort x values by"
    options="column name"
/>
<PropListing
    name=xSortOrder
    description="Sets direction of sort"
    options={['asc', 'desc']}
    defaultValue="asc"
/>
<PropListing
    name=ySort
    description="Column to sort y values by"
    options="column name"
/>
<PropListing
    name=ySortOrder
    description="Sets direction of sort"
    options={['asc', 'desc']}
    defaultValue="asc"
/>

### Chart

<PropListing
    name=title
    description="Chart title. Appears at top left of chart."
    options="string"
/>
<PropListing
    name=subtitle
    description="Chart subtitle. Appears just under title."
    options="string"
/>
<PropListing
    name=chartAreaHeight
    description="Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX."
    options="number"
    defaultValue="auto set based on y-axis values"
/>
<PropListing
    name=legend
    description="Turn on or off the legend"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=filter
    description="Allow draggable filtering on the legend. Must be used with `legend=true`"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=renderer
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
    name=echartsOptions
    description="Custom Echarts options to override the default options. See <a href='/components/charts/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleOption:'exampleValue'}}`}"
/>
<PropListing
    name=seriesOptions
    description="Custom Echarts options to override the default options for all series in the chart. This loops through the series to apply the settings rather than having to specify every series manually using `echartsOptions` See <a href='/components/charts/echarts-options/' class=markdown>reference page</a> for available options."
    options="{`{{exampleSeriesOption:'exampleValue'}}`}"
/>
<PropListing
    name=printEchartsConfig
    description="Helper prop for custom chart development - inserts a code block with the current echarts config onto the page so you can see the options used and debug your custom options"
    options={['true', 'false']}
    defaultValue="false"
/>

### Interactivity

<PropListing
    name=connectGroup
    description="Group name to connect this chart to other charts for synchronized tooltip hovering. Charts with the same `connectGroup` name will become connected"
/>
