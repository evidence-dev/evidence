---
title: Annotations
sidebar_position: 1
queries: 
- orders_by_month.sql
- orders_by_category_2021.sql
---

Annotations help you add important context directly within a chart - highlight important dates, time periods, or specific points on a chart to make it easier for your audience to pull insights from the information.

## At a glance

Evidence currently offers 4 types of annotations, which can be defined inline or with a dataset:
- [`ReferenceLine`](#reference-line): draw a line on a chart (e.g. sales target, launch dates, linear regression)
- [`ReferenceArea`](#reference-area): highlight an area on a chart (e.g. holiday shopping periods, metric control ranges)
- [`ReferencePoint`](#reference-point): highlight specific points on a chart (e.g. anomalies, points of interest)
- [`Callout`](#callout): draw attention to data (e.g. data trend explanation)

<DocTab>
    <div slot='preview'>
        <LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
            <ReferenceLine y=7500 label="Reference Line" hideValue labelPosition="aboveStart" color=green/>
            <ReferenceArea xMin='2020-03-14' xMax='2020-08-15' label="Reference Area" color=yellow/>
            <ReferencePoint x="2019-07-01" y=6590 label="Reference Point" labelPosition=bottom color=red/>
            <Callout x="2021-05-01" y=11012 labelPosition=bottom labelWidth=fit>
                Callout
                Data trending up here
            </Callout>
        </LineChart>
    </div>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferenceLine y=7500 label="Reference Line" hideValue labelPosition="aboveStart" color=green/>
    <ReferenceArea xMin='2020-03-14' xMax='2020-08-15' label="Reference Area" color=yellow/>
    <ReferencePoint x="2019-07-01" y=6590 label="Reference Point" labelPosition=bottom color=red/>
    <Callout x="2021-05-01" y=11012 labelPosition=bottom labelWidth=fit>
        Callout
        Data trending up here
    </Callout>
</LineChart>
```
</DocTab>

# Reference Line 

Reference lines allow you to add lines to a chart to provide additional context within the visualization. These lines can be produced by providing a specific value (`y=50` or `x='2020-03-14'`) or by providing a dataset (e.g., `date`, `event_name`).

If you provide coordinates for `[x, y]` and `[x2, y2]`, you can create sloped lines between points.

When a dataset is provided, `ReferenceLine` can generate multiple lines - one for each row in the dataset. This can be helpful for plotting things like important milestones, launch dates, or experiment start dates.

## Examples

### Y-axis Defined Inline

<DocTab>
    <div slot='preview'>
        <LineChart data={orders_by_month} x=month y=sales yAxisTitle="Sales per Month" yFmt=usd0>
            <ReferenceLine y=9000 label="Target"/>
        </LineChart>
    </div>

```html
<LineChart data={orders_by_month} x=month y=sales yAxisTitle="Sales per Month" yFmt=usd0>
    <ReferenceLine y=9000 label="Target"/>
</LineChart>
```
</DocTab>

### X-axis Defined Inline

<DocTab>
    <div slot='preview'>
        <LineChart data={orders_by_month} x=month y=sales yAxisTitle="Sales per Month" yFmt=usd0>
            <ReferenceLine x='2019-09-18' label="Launch" hideValue=true/>
        </LineChart>
    </div>

```html
<LineChart data={orders_by_month} x=month y=sales yAxisTitle="Sales per Month" yFmt=usd0>
    <ReferenceLine x='2019-09-18' label="Launch" hideValue=true/>
</LineChart>
```
</DocTab>

### Y-axis Multiple Lines

<DocTab>
    <div slot='preview'>
        <LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
            <ReferenceLine y=9000 label="Target" labelPosition=belowEnd/>
            <ReferenceLine y=10500 label="Forecast"/>
        </LineChart>
    </div>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
    <ReferenceLine y=9000 label="Target" labelPosition=belowEnd/>
    <ReferenceLine y=10500 label="Forecast"/>
</LineChart>
```
</DocTab>

### X-axis from Data

```sql multiple_dates
select '2019-12-05'::date as start_date, '2020-02-05'::date as end_date, 'Campaign 1' as campaign_name union all
select '2020-07-14'::date, '2020-09-14'::date, 'Campaign 2' union all
select '2021-04-14'::date, '2021-06-14'::date, 'Campaign 3'
```

<DocTab>
    <div slot='preview'>
        <LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
            <ReferenceLine data={multiple_dates} x=start_date label=campaign_name hideValue/>
        </LineChart>
    </div>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
    <ReferenceLine data={multiple_dates} x=start_date label=campaign_name hideValue/>
</LineChart>
```
</DocTab>

### Sloped Line Inline

<DocTab>
    <div slot='preview'>
        <LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
            <ReferenceLine x='2019-01-01' y=6500 x2='2021-12-01' y2=12000 label="Growth Trend" labelPosition=belowEnd/>
        </LineChart>
    </div>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
    <ReferenceLine x='2019-01-01' y=6500 x2='2021-12-01' y2=12000 label="Growth Trend" labelPosition=belowEnd/>
</LineChart>
```
</DocTab>

### Linear Regression from Data

```sql orders_by_state
select 
    state,
    sum(sales) as sales,
    count(*) as num_orders
from orders
group by all
```

```sql regression
WITH 
coeffs AS (
    SELECT
        regr_slope(num_orders, sales) AS slope,
        regr_intercept(num_orders, sales) AS intercept,
        regr_r2(num_orders, sales) AS r_squared
    FROM ${orders_by_state}
)

SELECT 
    min(sales) AS x, 
    max(sales) AS x2, 
    min(sales) * slope + intercept AS y, 
    max(sales) * slope + intercept AS y2, 
    'Best Fit (y = ' || ROUND(slope, 2) || 'x + ' || ROUND(intercept, 2) || ', R^2 = ' || ROUND(r_squared, 3) || ')' AS label
FROM coeffs, ${orders_by_state}
GROUP BY slope, intercept, r_squared
```

<DocTab>
    <div slot='preview'>
        <ScatterPlot data={orders_by_state} x=sales y=num_orders xMin=0 yMin=0 xFmt=usd>
            <ReferenceLine data={regression} x=x y=y x2=x2 y2=y2 label=label color=grey lineType=solid/>
        </ScatterPlot>
    </div>


<Tabs>

<Tab label="Markdown">

```html
<ScatterPlot data={orders_by_state} x=sales y=num_orders xMin=0 yMin=0>
    <ReferenceLine data={regression} x=x y=y x2=x2 y2=y2 label=label color=grey lineType=solid/>
</ScatterPlot>
```

</Tab>


<Tab label="SQL Queries">


````markdown
```sql orders_by_state
select 
    state,
    sum(sales) as sales,
    count(*) as num_orders
from orders
group by all
```

```sql regression
WITH 
coeffs AS (
    SELECT
        regr_slope(num_orders, sales) AS slope,
        regr_intercept(num_orders, sales) AS intercept,
        regr_r2(num_orders, sales) AS r_squared
    FROM ${orders_by_state}
)

SELECT 
    min(sales) AS x, 
    max(sales) AS x2, 
    min(sales) * slope + intercept AS y, 
    max(sales) * slope + intercept AS y2, 
    'Best Fit (y = ' || ROUND(slope, 2) || 'x + ' || ROUND(intercept, 2) || ', R^2 = ' || ROUND(r_squared, 3) || ')' AS label
FROM coeffs, ${orders_by_state}
GROUP BY slope, intercept, r_squared
```
````

</Tab>

</Tabs>
</DocTab>


### Custom Styling

<DocTab>
    <div slot='preview'> 
        <LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
            <ReferenceLine y=11000 color=red hideValue=true lineWidth=3 lineType=solid/>
        </LineChart>
    </div>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=110000 color=red hideValue=true lineWidth=3 lineType=solid/>
</LineChart>
```
</DocTab>


### Label Positions

<DocTab>
    <div slot='preview'>
        <LineChart data={orders_by_month} x=month y=sales yFmt=usd0k yAxisTitle="Sales per Month">
            <ReferenceLine y=4000 label=aboveStart labelPosition=aboveStart hideValue/>
            <ReferenceLine y=4000 label=aboveCenter labelPosition=aboveCenter hideValue/>
            <ReferenceLine y=4000 label=aboveEnd labelPosition=aboveEnd hideValue/>
            <ReferenceLine y=4000 label=belowStart labelPosition=belowStart hideValue/>
            <ReferenceLine y=4000 label=belowCenter labelPosition=belowCenter hideValue/>
            <ReferenceLine y=4000 label=belowEnd labelPosition=belowEnd hideValue/>
        </LineChart>
    </div>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=4000 label=aboveStart labelPosition=aboveStart hideValue/>
    <ReferenceLine y=4000 label=aboveCenter labelPosition=aboveCenter hideValue/>
    <ReferenceLine y=4000 label=aboveEnd labelPosition=aboveEnd hideValue/>
    <ReferenceLine y=4000 label=belowStart labelPosition=belowStart hideValue/>
    <ReferenceLine y=4000 label=belowCenter labelPosition=belowCenter hideValue/>
    <ReferenceLine y=4000 label=belowEnd labelPosition=belowEnd hideValue/>
</LineChart>
```
</DocTab>

### Colours

<DocTab>
    <div slot='preview'>
        <LineChart data={orders_by_month} x=month y=sales yFmt=usd0k yAxisTitle="Sales per Month">
            <ReferenceLine y=1500 color=red label=red/>
            <ReferenceLine y=3500 color=yellow label=yellow/>
            <ReferenceLine y=5500 color=green label=green/>
            <ReferenceLine y=7500 color=blue label=blue/>
            <ReferenceLine y=9500 color=grey label=grey/>
            <ReferenceLine y=11500 color=#63178f label=custom/>
        </LineChart>
    </div>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=1500 color=red label=red/>
    <ReferenceLine y=3500 color=yellow label=yellow/>
    <ReferenceLine y=5500 color=green label=green/>
    <ReferenceLine y=7500 color=blue label=blue/>
    <ReferenceLine y=9500 color=grey label=grey/>
    <ReferenceLine y=11500 color=#63178f label=custom/>
</LineChart>
```
</DocTab>

## Options
A reference line can be produced by defining values inline or by supplying a dataset, and the required props are different for each of those cases.

### Defining Values Inline

    <PropListing
        name=x
        description="x-axis value where line will be plotted, or coordinate where line will start if x2 is provided"
        required="false"
        options="number | string | date"
    />
    <PropListing
        name=y
        description="y-axis value where line will be plotted, or coordinate where line will start if y2 is provided"
        required="false"
        options="number"    
    />
    <PropListing
        name=x2
        description="x-axis value for line endpoint"
        required="false"
        options="number | string | date"
    />
    <PropListing
        name=y2
        description="y-axis value for line endpoint"
        required="false"
        options="number"
    />
    <PropListing
        name=label
        description="Text to show as label for the line. If no label is provided, the value will be used."
        required="false"
        options="string"
    />

<LineBreak/>

This table shows how you combine `x`, `y`, `x2`, and `y2` to create different types of lines:

```sql xy_config_table
select 5 as x, null as y, null as x2, null as y2, 'Vertical line at x=5' as Result union all
select null, 100, null, null, 'Horizontal line at y=100' union all
select 5, 100, null, null, 'Vertical line at x=5 (ignores y)' union all
select 5, 100, 10, 200, 'Sloped line from [5, 100] to [10, 200]' union all
select 5, 100, null, 200, 'Vertical line from [5, 100] to [5, 200]' union all
select 5, 100, 10, null, 'Horizontal line from [5, 100] to [10, 100]'
order by 2 nulls first, 1 nulls first, 3 nulls first, 4 nulls first
```

<DataTable data={xy_config_table} formatColumnTitles=false/>

<Alert status=warning>

If you provide `[x, y]` and `[x2, y2]`, coordinates must fall within the chart's boundaries in order for the line to be drawn.

</Alert>

### Supplying a Dataset

    <PropListing
        name=data
        description="Query name, wrapped in curly braces"
        required=true
        options="query name"
    />
    <PropListing
        name=x
        description="Column containing x-axis values for lines (or starting points if x2 is provided)"
        options="column name"
    />
    <PropListing
        name=y
        description="Column containing y-axis values for lines (or starting points if y2 is provided)"
        options="column name"
    />
    <PropListing
        name=x2
        description="Column containing x-axis values for line endpoints."
        options="column name"
    />
    <PropListing
        name=y2
        description="Column containing y-axis values for line endpoints."
        options="column name"
    />
    <PropListing
        name=label
        description="Column containing a label to use for each line"
        required="false"
        options="column name"
    />
    <PropListing
        name=hideValue
        description="Option to remove the value from the label"
        options={["true", "false"]}
        defaultValue=false
    />

```sql xy_data_table
select 'x_col' as x, null as y, null as x2, null as y2, 'Vertical lines at values in x_col' as Result union all
select null, 'y_col', null, null, 'Horizontal lines at values in y_col' union all
select 'x_col', 'y_col', null, null, 'Vertical lines at x_col (ignores y_col)' union all
select 'x_col', 'y_col', 'x2_col', 'y2_col', 'Sloped Lines from [x_col, y_col] to [x2_col, y2_col]'
order by 2 nulls first, 1 nulls first, 3 nulls first, 4 nulls first
```

<DataTable data={xy_data_table} formatColumnTitles=false/>

<Alert status=warning>

If you provide `[x, y]` and `[x2, y2]`, coordinates must fall within the chart's boundaries in order for lines to be drawn.

</Alert>

### Styling

<PropListing
    name=color
    description="Color to override default line and label colors"
    options="CSS name | hexademical | RGB | HSL"
/>

<!-- Line-related props -->
<PropListing
    name=lineColor
    description="Color to override default line color. If used, takes precedence over `color`"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=lineType
    description="Options to show breaks in a line (dashed or dotted)"
    options={["solid", "dashed", "dotted"]}
    defaultValue="dashed"
/>
<PropListing
    name=lineWidth
    description="Thickness of line (in pixels)"
    options="number"
    defaultValue="1.3"
/>

<!-- Symbol related props -->
<PropListing
    name=symbolStart
    description="The type of symbol used to mark the start of the line"
    options={['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none']}
    defaultValue=circle
/>
<PropListing
    name=symbolStartSize
    description="The size of the symbol at the start of the line"
    options=number
    defaultValue=8
/>
<PropListing
    name=symbolEnd
    description="The type of symbol used to mark the end of the line"
    options={['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none']}
    defaultValue=circle
/>
<PropListing
    name=symbolEndSize
    description="The size of the symbol at the end of the line"
    options=number
    defaultValue=8
/>


<!-- Label-related props -->
<PropListing
    name=labelPosition
    description="Where label will appear on the line"
    options={["aboveStart", "aboveCenter", "aboveEnd", "belowStart", "belowCenter", "belowEnd"]}
    defaultValue="aboveEnd"
/>
<PropListing
    name=labelColor
    description="Color to override default label color. If used, takes precedence over `color`"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=labelBackground
    description="Option to show a white semi-transparent background behind the label. Helps when label is shown in front of darker colours."
    options={["true", "false"]}
    defaultValue="true"
/>
<PropListing
    name=labelPadding
    options=number
    description="Padding between the text and the border of the label background"
/>
<PropListing
    name=labelBorderWidth
    description="The thickness of the border around the label (in pixels)"
    options=number
/>
<PropListing
    name=labelBorderRadius
    description="The radius of rounded corners on the label background (in pixels)"
    options=number
/>
<PropListing
    name=labelBorderColor
    description="The color of the border around the label background"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=labelBorderType
    description="The type of border around the label background (dashed or dotted)"
    options={['solid', 'dotted', 'dashed']}
/>

<!-- Font-related props -->
<PropListing
    name=fontSize
    description="The size of the font in the label"
    options=number
/>
<PropListing
    name=align
    description="How to align the label to the symbol, and the text within the label"
    options={['left', 'center', 'right']}
/>
<PropListing
    name=bold
    description="Make the label text bold"
    options={[true, false]}
    defaultValue=false
/>
<PropListing
    name=italic
    description="Make the label text italic"
    options={[true, false]}
    defaultValue=false
/>


# Reference Area

Reference areas allow you to add highlighted ranges to a chart. These ranges can be:
- Along the x-axis (e.g., recession date ranges)
- Along the y-axis (e.g., control threshold for a metric)
- Both (e.g, highlighting a specific series of points in the middle of the chart)

Reference areas can be produced by defining the x and y-axis values inline (e.g., `xMin='2020-03-14' xMax='2020-06-30'`) or by supplying a dataset (e.g., `start_date`, `end_date`, `name`).

When a dataset is provided, `ReferenceArea` can generate multiple areas - one for each row in the dataset. 

## Examples

### X-axis Defined Inline

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
    <ReferenceArea xMin='2020-03-14' xMax='2020-08-15' label=First color=yellow/>
    <ReferenceArea xMin='2021-03-14' xMax='2021-08-15' label=Second/>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
    <ReferenceArea xMin='2020-03-14' xMax='2020-08-15' label=First color=yellow/>
    <ReferenceArea xMin='2021-03-14' xMax='2021-08-15' label=Second/>
</LineChart>
```

### Y-axis Defined Inline

<LineChart data={orders_by_month} x=month y=num_orders yAxisTitle="Orders per Month">
    <ReferenceArea yMin=250 color=green label="Good"/>
    <ReferenceArea yMin=100 yMax=250 color=yellow label="Okay"/>
    <ReferenceArea yMin=0 yMax=100 color=red label="Bad"/>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=num_orders yAxisTitle="Orders per Month">
    <ReferenceArea yMin=250 color=green label="Good"/>
    <ReferenceArea yMin=100 yMax=250 color=yellow label="Okay"/>
    <ReferenceArea yMin=0 yMax=100 color=red label="Bad"/>
</LineChart>
```

### X-axis from Data

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
    <ReferenceArea data={multiple_dates} xMin=start_date xMax=end_date label=campaign_name/>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0 yAxisTitle="Sales per Month">
    <ReferenceArea data={multiple_dates} xMin=start_date xMax=end_date label=campaign_name/>
</LineChart>
```

### Bar Chart

<BarChart data={orders_by_category_2021} x=month y=sales yFmt=usd0 series=category>
    <ReferenceArea xMin='2021-01-01' xMax='2021-04-01'/>
</BarChart> 

```html
<BarChart data={orders_by_category_2021} x=month y=sales yFmt=usd0 series=category>
    <ReferenceArea xMin='2021-01-01' xMax='2021-04-01'/>
</BarChart> 
```

#### Continuous Axis Bar Charts
On a continous x-axis (dates or numbers), the reference area will start and stop at the exact point on the x-axis. This means it will appear in the middle of whichever bar is at that point. If you would prefer to see the area cover the full bar, there are 2 ways to achieve this:
1. Add a buffer on either side of the range you want to highlight (e.g., instead of ending the area at `2020-07-01`, end it at `2020-07-15`)
2. Change your x-axis to categorical data (using `xType=category`). If using a date axis, you may also want to retain the axis label formatting for dates - to achieve this, you can use the `xFmt` prop (e.g., `xFmt=mmm`)

### Reference Area Box
<img src="/img/refarea-box.png"  width='600px'/>

<!-- Need data -->

```html
<ScatterPlot data={countries} x=gdp_usd y=gdp_growth_pct1 tooltipTitle=country series=continent>
    <ReferenceArea xMin=16000 xMax=24000 yMin=-0.03 yMax=0.055 label="Large and stagnant" color=grey border=true/>
</ScatterPlot>
```

### Labels

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=topLeft labelPosition=topLeft/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=top labelPosition=top/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=topRight labelPosition=topRight/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=left labelPosition=left/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=center labelPosition=center/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=right labelPosition=right/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottomLeft labelPosition=bottomLeft/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottom labelPosition=bottom/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottomRight labelPosition=bottomRight/>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=topLeft labelPosition=topLeft/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=top labelPosition=top/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=topRight labelPosition=topRight/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=left labelPosition=left/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=center labelPosition=center/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=right labelPosition=right/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottomLeft labelPosition=bottomLeft/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottom labelPosition=bottom/>
    <ReferenceArea xMin='2019-07-01' xMax='2021-07-31' label=bottomRight labelPosition=bottomRight/>
</LineChart>
```

#### Label Overlaps
Reference areas appear behind chart gridlines, including reference area labels. If you are seeing an overlap between the gridlines and the reference area label, you can avoi this by turning gridlines off (`yGridlines=false`).

### Colours

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0 >
    <ReferenceArea xMax='2019-04-01' label=blue color=blue/>
    <ReferenceArea xMin='2019-04-01' xMax='2019-11-01' label=red color=red/>
    <ReferenceArea xMin='2019-11-01' xMax='2020-07-01' label=yellow color=yellow/>
    <ReferenceArea xMin='2020-07-01' xMax='2021-02-01' label=green color=green/>
    <ReferenceArea xMin='2021-02-01' xMax='2021-09-01' label=grey color=grey/>
    <ReferenceArea xMin='2021-09-01' label=custom color=#f2dbff labelColor=#4d1070/>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0 >
    <ReferenceArea xMax='2019-04-01' label=blue color=blue/>
    <ReferenceArea xMin='2019-04-01' xMax='2019-11-01' label=red color=red/>
    <ReferenceArea xMin='2019-11-01' xMax='2020-07-01' label=yellow color=yellow/>
    <ReferenceArea xMin='2020-07-01' xMax='2021-02-01' label=green color=green/>
    <ReferenceArea xMin='2021-02-01' xMax='2021-09-01' label=grey color=grey/>
    <ReferenceArea xMin='2021-09-01' label=custom color=#f2dbff labelColor=#4d1070/>
</LineChart>
```


## Options
A reference area can be produced by defining values inline or by supplying a dataset, and the required props are different for each of those cases.

### Defining Values Inline

    <PropListing
        name=xMin
        description="x-axis value where area should start. If left out, range will extend to the start of the x-axis."
        options="number | string | date"
    />
    <PropListing
        name=xMax
        description="x-axis value where area should end. If left out, range will extend to the end of the x-axis."
        options="number | string | date"
    />
    <PropListing
        name=yMin
        description="y-axis value where area should start. If left out, range will extend to the start of the y-axis."
        options="number"
    />
    <PropListing
        name=yMax
        description="y-axis value where area should end. If left out, range will extend to the end of the y-axis."
        options="number"
    />
    <PropListing
        name=label
        description="Text to show as label for the area"
        options="string"
    />

- At least 1 of `xMin`, `xMax`, `yMin`, or `yMax` is required to plot an area.

### Supplying a Dataset

    <PropListing
        name=data
        description="Query name, wrapped in curly braces"
        required=true
        options="query name"
    />
    <PropListing
        name=xMin
        description="Column containing x-axis values for area start. If left out, range will extend to the start of the x-axis."
        options="column name"
    />
    <PropListing
        name=xMax
        description="Column containing x-axis values for area end. If left out, range will extend to the end of the x-axis."
        options="column name"
    />
    <PropListing
        name=yMin
        description="Column containing y-axis values for area start. If left out, range will extend to the start of the y-axis."
        options="column name"
    />
    <PropListing
        name=yMax
        description="Column containing y-axis values for area end. If left out, range will extend to the end of the y-axis."
        options="column name"
    />
    <PropListing
        name=label
        description="Column containing a label to use for each area"
        required="false"
        options="column name"
    />

- At least 1 of `xMin`, `xMax`, `yMin`, or `yMax` is required to plot an area.

### Styling

<PropListing
    name=color
    description="Color to override default area and label colors"
    options="CSS name | hexademical | RGB | HSL"
/>

<!-- Area-related props -->
<PropListing
    name=areaColor
    description="Color to override default area color. If used, takes precedence over `color`"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=opacity
    description="Opacity of the highlighted area"
    options="number"
/>
<PropListing
    name=border
    description="Renders a border around the highlighted area"
    option={["true", "false"]}
    defaultValue="false"
/>
<PropListing
    name=borderColor
    description="Color to override default border color"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=borderType
    description="Options to show breaks in a line (dashed or dotted)"
    options={["solid", "dashed", "dotted"]}
    defaultValue="dashed"
/>
<PropListing
    name=borderWidth
    description="Thickness of border (in pixels)"
    options="number"
/>

<!-- Label-related props -->
<PropListing
    name=labelPosition
    description="Where label will appear within the area"
    options={["topLeft", "top", "topRight", "left", "center", "right", "bottomLeft", "bottom", "bottomRight"]}
    defaultValue="topLeft"
/>
<PropListing
    name=labelColor
    description="Color to override default label color. If used, takes precedence over `color`"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=labelColor
    description="Color to override default label color. If used, takes precedence over `color`"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=labelBackgroundColor
    description="The color of the background behind the label"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=labelPadding
    options=number
    description="Padding between the text and the border of the label background"
/>
<PropListing
    name=labelBorderWidth
    description="The thickness of the border around the label (in pixels)"
    options=number
/>
<PropListing
    name=labelBorderRadius
    description="The radius of rounded corners on the label background (in pixels)"
    options=number
/>
<PropListing
    name=labelBorderColor
    description="The color of the border around the label background"
    options="CSS name | hexademical | RGB | HSL"
/>
<PropListing
    name=labelBorderType
    description="The type of border around the label background (dashed or dotted)"
    options={['solid', 'dotted', 'dashed']}
/>

<!-- Font-related props -->
<PropListing
    name=fontSize
    description="The size of the font in the label"
    options=number
/>
<PropListing
    name=align
    description="How to align the label to the symbol, and the text within the label"
    options={['left', 'center', 'right']}
/>
<PropListing
    name=bold
    description="Make the label text bold"
    options={[true, false]}
    defaultValue=false
/>
<PropListing
    name=italic
    description="Make the label text italic"
    options={[true, false]}
    defaultValue=false
/>

# Reference Point

Reference points allow you to add labels on certain points to emphasize them in the chart. They can be produced by providing a specific x/y coordinate (e.g. `x="2021-05-01"` `y=11012`) or by providing a dataset (e.g. `anomalies`, `points`).

When a dataset is provided, `ReferencePoint` will generate multiple points - one for each row in the dataset. This can be helpful for plotting a large number of points with a succinct syntax.

## Examples

### Defined Point

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint x="2019-07-01" y=6590 label="2019-07-01 : Big drop" labelPosition=bottom/>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint x="2019-07-01" y=6590 label="2019-07-01 : Big drop" labelPosition=bottom/>
</LineChart>
```

### Points from Data

```sales_drops
select
    month,
    sales,
    concat('Sales dropped $', round(abs(sales_diff))::int::text) as label
from (
    select
        month,
        sales,
        sales - lag(sales) over (order by month) as sales_diff
    from ${orders_by_month}
)
where sales_diff < -2000
```

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint data={sales_drops} x=month y=sales label=label labelPosition=bottom align=right />
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint data={sales_drops} x=month y=sales label=label labelPosition=bottom align=right />
</LineChart>
```

### Custom Styling

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint
        x="2019-07-01"
        y=6590
        label="2019-07-01 : Big drop"
        labelPosition=right
        color=red
        symbolSize=16
        symbolBorderWidth=1
        symbolBorderColor=red
        symbolOpacity=0.25
    />
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint
        x="2019-07-01"
        y=6590
        label="2019-07-01 : Big drop"
        labelPosition=right
        color=red
        symbolSize=16
        symbolBorderWidth=1
        symbolBorderColor=red
        symbolOpacity=0.25
    />
</LineChart>
```

### Label Positions

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint x="2019-07-01" y=6590 label=top labelPosition=top/>
    <ReferencePoint x="2019-07-01" y=6590 label=right labelPosition=right/>
    <ReferencePoint x="2019-07-01" y=6590 label=bottom labelPosition=bottom/>
    <ReferencePoint x="2019-07-01" y=6590 label=left labelPosition=left/>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint x="2019-07-01" y=6590 label=top labelPosition=top/>
    <ReferencePoint x="2019-07-01" y=6590 label=right labelPosition=right/>
    <ReferencePoint x="2019-07-01" y=6590 label=bottom labelPosition=bottom/>
    <ReferencePoint x="2019-07-01" y=6590 label=left labelPosition=left/>
</LineChart>
```

#### Multiline label

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint x="2019-07-01" y=6590 labelPosition=bottom align=left>
        A label with
        line breaks in it
        to allow longer text
    </ReferencePoint>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint x="2019-07-01" y=6590 labelPosition=bottom align=left>
        A label with
        line breaks in it
        to allow longer text
    </ReferencePoint>
</LineChart>
```

### Colours

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint x="2019-03-01" y=3000 color=blue label=blue />
    <ReferencePoint x="2019-09-01" y=3000 color=red label=red />
    <ReferencePoint x="2020-03-01" y=3000 color=yellow label=yellow />
    <ReferencePoint x="2020-09-01" y=3000 color=green label=green />
    <ReferencePoint x="2021-03-01" y=3000 color=grey label=grey />
    <ReferencePoint x="2021-09-01" y=3000 color=#63178f label=custom />
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <ReferencePoint x="2019-03-01" y=3000 color=blue label=blue />
    <ReferencePoint x="2019-09-01" y=3000 color=red label=red />
    <ReferencePoint x="2020-03-01" y=3000 color=yellow label=yellow />
    <ReferencePoint x="2020-09-01" y=3000 color=green label=green />
    <ReferencePoint x="2021-03-01" y=3000 color=grey label=grey />
    <ReferencePoint x="2021-09-01" y=3000 color=#63178f label=custom />
</LineChart>
```

## Options

### Defining Values Inline

    <PropListing
        name=x
        description="x coordinate value where the point will be plotted"
        options="number | string | date"
    />
    <PropListing
        name=y
        description="y coordinate value where the point will be plotted"
        options="number | string | date"
    />
    <PropListing
        name=label
        description="Text to show as label for the point"
        required=true
        options="string"
    />

### Supplying a Dataset

    <PropListing
        name=data
        description="Query name, wrapped in curly braces"
        required=true
        options="query name"
    />
    <PropListing
        name=x
        description="Column containing x-axis values for points"
        options="column name"
    />
    <PropListing
        name=y
        description="Column containing y-axis values for points"
        options="column name"
    />
    <PropListing
        name=label
        description="Column containing a label to use for each line"
        required=true
        options="column name"
    />

### Styling

    <PropListing
        name=color
        description="Color to override default line and label colors"
        options="CSS name | hexademical | RGB | HSL"
        defaultValue=grey
    />
    <PropListing
        name=labelColor
        description="Color to override default label color. If used, takes precedence over `color`"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=labelWidth
        description="The width available for the label. If text is longer than this width, it will wrap to new lines."
        options="fit | string | number"
        defaultValue=fit
    />
    <PropListing
        name=labelPadding
        options=number
        description="Padding between the text and the border of the label background"
    />
    <PropListing
        name=labelPosition
        description="Where the label will appear relative to the point"
        options={["top", "right", "bottom", "left"]}
        defaultValue=top
    />
    <PropListing
        name=labelBackgroundColor
        description="The color of the background behind the label"
        options="CSS name | hexademical | RGB | HSL"
        defaultValue="hsla(360, 100%, 100%, 0.7)"
    />
    <PropListing
        name=labelBorderWidth
        description="The thickness of the border around the label (in pixels)"
        options=number
    />
    <PropListing
        name=labelBorderRadius
        description="The radius of rounded corners on the label background (in pixels)"
        options=number
    />
    <PropListing
        name=labelBorderColor
        description="The color of the border around the label background"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=labelBorderType
        description="The type of border around the label background (dashed or dotted)"
        options={['solid', 'dotted', 'dashed']}
    />
    <PropListing
        name=fontSize
        description="The size of the font in the label"
        options=number
    />
    <PropListing
        name=align
        description="How to align the label to the symbol, and the text within the label"
        options={['left', 'center', 'right']}
    />
    <PropListing
        name=bold
        description="Make the label text bold"
        options={[true, false]}
        defaultValue=false
    />
    <PropListing
        name=italic
        description="Make the label text italic"
        options={[true, false]}
        defaultValue=false
    />
    <PropListing
        name=symbol
        description="The type of symbol used to mark the x/y coordinate(s)"
        options={['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none']}
        defaultValue=circle
    />
    <PropListing
        name=symbolColor
        description="Color to override default symbol color. If used, takes precedence over `color`"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=symbolSize
        description="The size of the symbol"
        options=number
        defaultValue=8
    />
    <PropListing
        name=symbolOpacity
        description="The opacity of the symbol"
        options=number
    />
    <PropListing
        name=symbolBorderWidth
        description="The width of the border around the symbol"
        options=number
    />
    <PropListing
        name=symbolBorderColor
        description="The color of the border around the symbol"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=preserveWhitespace
        description="When true, stops multiline labels from having whitespace at the start/end of lines trimmed"
        options={[true, false]}
        defaultValue=false
    />

# Callout

Callouts are very similar to reference points, just with different default styling to optimize them for slightly different use cases. Callouts allow you to add a long label somewhere on a chart to describe a trend or provide insight on the data. They can be produced by providing a specific x/y coordinate (e.g. `x="2021-05-01"` `y=11012`) or by providing a dataset (e.g. `anomalies`, `points`).

When a dataset is provided, `Callout` will generate multiple points - one for each row in the dataset. This can be helpful for plotting a large number of points with a succinct syntax.

## Examples

### Defined Point

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout x="2019-07-01" y=6590 label="Sales really dropped here" labelPosition=bottom/>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout x="2019-07-01" y=6590 label="Sales really dropped here" labelPosition=bottom/>
</LineChart>
```

### Points from Data

```sales_drops
select
    month,
    sales,
    concat('Sales dropped $', round(abs(sales_diff))::int::text) as label
from (
    select
        month,
        sales,
        sales - lag(sales) over (order by month) as sales_diff
    from ${orders_by_month}
)
where sales_diff < -2000
```

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout data={sales_drops} x=month y=sales label=label labelPosition=bottom align=right />
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout data={sales_drops} x=month y=sales label=label labelPosition=bottom align=right />
</LineChart>
```

### Custom Styling

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout
        x="2019-07-01"
        y=6590
        label="Sales really dropped here"
        labelPosition=right
        color=red
        symbolSize=16
        symbolBorderWidth=1
        symbolBorderColor=red
        symbolOpacity=0.25
    />
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout
        x="2019-07-01"
        y=6590
        label="Sales really dropped here"
        labelPosition=right
        color=red
        symbolSize=16
        symbolBorderWidth=1
        symbolBorderColor=red
        symbolOpacity=0.25
    />
</LineChart>
```

### Label Positions

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout x="2019-07-01" y=6590 label=top labelPosition=top/>
    <Callout x="2019-07-01" y=6590 label=right labelPosition=right/>
    <Callout x="2019-07-01" y=6590 label=bottom labelPosition=bottom/>
    <Callout x="2019-07-01" y=6590 label=left labelPosition=left/>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout x="2019-07-01" y=6590 label=top labelPosition=top/>
    <Callout x="2019-07-01" y=6590 label=right labelPosition=right/>
    <Callout x="2019-07-01" y=6590 label=bottom labelPosition=bottom/>
    <Callout x="2019-07-01" y=6590 label=left labelPosition=left/>
</LineChart>
```

#### Multiline label

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout x="2019-07-01" y=6590 labelPosition=bottom align=left>
        Callout
        with
        line
        breaks
    </Callout>
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout x="2019-07-01" y=6590 labelPosition=bottom align=left>
        Callout
        with
        line
        breaks
    </Callout>
</LineChart>
```

### Colours

<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout x="2019-03-01" y=3000 color=blue label=blue />
    <Callout x="2019-09-01" y=3000 color=red label=red />
    <Callout x="2020-03-01" y=3000 color=yellow label=yellow />
    <Callout x="2020-09-01" y=3000 color=green label=green />
    <Callout x="2021-03-01" y=3000 color=grey label=grey />
    <Callout x="2021-09-01" y=3000 color=#63178f label=custom />
</LineChart>

```html
<LineChart data={orders_by_month} x=month y=sales yFmt=usd0>
    <Callout x="2019-03-01" y=3000 color=blue label=blue />
    <Callout x="2019-09-01" y=3000 color=red label=red />
    <Callout x="2020-03-01" y=3000 color=yellow label=yellow />
    <Callout x="2020-09-01" y=3000 color=green label=green />
    <Callout x="2021-03-01" y=3000 color=grey label=grey />
    <Callout x="2021-09-01" y=3000 color=#63178f label=custom />
</LineChart>
```

## Options

### Defining Values Inline

    <PropListing
        name=x
        description="x coordinate value where the point will be plotted"
        options="number | string | date"
    />
    <PropListing
        name=y
        description="y coordinate value where the point will be plotted"
        options="number | string | date"
    />
    <PropListing
        name=label
        description="Text to show as label for the point"
        required=true
        options="string"
    />

### Supplying a Dataset

    <PropListing
        name=data
        description="Query name, wrapped in curly braces"
        required=true
        options="query name"
    />
    <PropListing
        name=x
        description="Column containing x-axis values for points"
        options="column name"
    />
    <PropListing
        name=y
        description="Column containing y-axis values for points"
        options="column name"
    />
    <PropListing
        name=label
        description="Column containing a label to use for each line"
        required=true
        options="column name"
    />

### Styling

    <PropListing
        name=color
        description="Color to override default line and label colors"
        options="CSS name | hexademical | RGB | HSL"
        defaultValue=grey
    />
    <PropListing
        name=labelColor
        description="Color to override default label color. If used, takes precedence over `color`"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=labelWidth
        description="The width available for the label. If text is longer than this width, it will wrap to new lines."
        options="fit | string | number"
        defaultValue=fit
    />
    <PropListing
        name=labelPadding
        options=number
        description="Padding between the text and the border of the label background"
    />
    <PropListing
        name=labelPosition
        description="Where the label will appear relative to the point"
        options={["top", "right", "bottom", "left"]}
        defaultValue=top
    />
    <PropListing
        name=labelBackgroundColor
        description="The color of the background behind the label"
        options="CSS name | hexademical | RGB | HSL"
        defaultValue="hsla(360, 100%, 100%, 0.7)"
    />
    <PropListing
        name=labelBorderWidth
        description="The thickness of the border around the label (in pixels)"
        options=number
    />
    <PropListing
        name=labelBorderRadius
        description="The radius of rounded corners on the label background (in pixels)"
        options=number
    />
    <PropListing
        name=labelBorderColor
        description="The color of the border around the label background"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=labelBorderType
        description="The type of border around the label background (dashed or dotted)"
        options={['solid', 'dotted', 'dashed']}
    />
    <PropListing
        name=fontSize
        description="The size of the font in the label"
        options=number
    />
    <PropListing
        name=align
        description="How to align the label to the symbol, and the text within the label"
        options={['left', 'center', 'right']}
    />
    <PropListing
        name=bold
        description="Make the label text bold"
        options={[true, false]}
        defaultValue=false
    />
    <PropListing
        name=italic
        description="Make the label text italic"
        options={[true, false]}
        defaultValue=false
    />
    <PropListing
        name=symbol
        description="The type of symbol used to mark the x/y coordinate(s)"
        options={['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none']}
        defaultValue=circle
    />
    <PropListing
        name=symbolColor
        description="Color to override default symbol color. If used, takes precedence over `color`"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=symbolSize
        description="The size of the symbol"
        options=number
        defaultValue=8
    />
    <PropListing
        name=symbolOpacity
        description="The opacity of the symbol"
        options=number
    />
    <PropListing
        name=symbolBorderWidth
        description="The width of the border around the symbol"
        options=number
    />
    <PropListing
        name=symbolBorderColor
        description="The color of the border around the symbol"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=preserveWhitespace
        description="When true, stops multiline labels from having whitespace at the start/end of lines trimmed"
        options={[true, false]}
        defaultValue=false
    />