---
title: Annotations
sidebar_position: 1
---

Annotations help you add important context directly within a chart - highlight important dates, time periods, or specific points on a chart to make it easier for your audience to pull insights from the information.

Evidence currently offers 2 types of annotations, which can be defined inline or with a dataset:
- [`ReferenceLine`](#reference-line): draw a horizontal or vertical line on a chart (e.g., annual sales target line, launch dates)
- [`ReferenceArea`](#reference-area): highlight an area on a chart (e.g., holiday shopping periods, metric control ranges)

<img src="/img/annotations-example.png"  width='600px'/>

# Reference Line 

Reference lines allow you to add horizontal or vertical lines to a chart to provide additional context within the visualization. These lines can be produced by providing a specific value (`y=50` or `x='2020-03-14'`) or by providing a dataset (e.g., `date`, `event_name`).

When a dataset is provided, `ReferenceLine` can generate multiple lines - one for each row in the dataset. This can be helpful for plotting things like important milestones, launch dates, or experiment start dates.

## Examples

### Y-axis Defined Inline

<img src="/img/refline-y-basic.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=90000 label="Target"/>
</LineChart>
```

### X-axis Defined Inline

<img src="/img/refline-x-basic.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine x='2019-09-18' label="Launch" hideValue=true/>
</LineChart>
```

### Y-axis Multiple Lines
<img src="/img/refline-y-multi.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=90000 label="Target" labelPosition=belowEnd/>
    <ReferenceLine y=105000 label="Forecast"/>
</LineChart>
```

### X-axis from Data

<img src="/img/refline-x-multi.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine data={multiple_dates} x=start_date/>
</LineChart>
```

### Custom Styling
<img src="/img/refline-y-custom.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=110000 color=red hideValue=true lineWidth=3 lineType=solid/>
</LineChart>
```

### Label Positions
<img src="/img/refline-label-positions.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=40000 label=aboveStart labelPosition=aboveStart hideValue=true/>
    <ReferenceLine y=40000 label=aboveCenter labelPosition=aboveCenter hideValue=true/>
    <ReferenceLine y=40000 label=aboveEnd labelPosition=aboveEnd hideValue=true/>
    <ReferenceLine y=40000 label=belowStart labelPosition=belowStart hideValue=true/>
    <ReferenceLine y=40000 label=belowCenter labelPosition=belowCenter hideValue=true/>
    <ReferenceLine y=40000 label=belowEnd labelPosition=belowEnd hideValue=true/>
</LineChart>
```

### Colours
<img src="/img/refline-colors.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceLine y=15000 color=red label=red/>
    <ReferenceLine y=35000 color=yellow label=yellow/>
    <ReferenceLine y=55000 color=green label=green/>
    <ReferenceLine y=75000 color=blue label=blue/>
    <ReferenceLine y=95000 color=grey label=grey/>
    <ReferenceLine y=115000 color=#63178f label=custom/>
</LineChart>
```

## Options
A reference line can be produced by defining values inline or by supplying a dataset, and the required props are different for each of those cases.

### Defining Values Inline

    <PropListing
        name=x
        description="x-axis value where line will be plotted"
        
        options="number | string | date"
    />
    <PropListing
        name=y
        description="y-axis value where line will be plotted"
        
        options="number"    
    />
    <PropListing
        name=label
        description="Text to show as label for the line. If no label is provided, the value will be used."
        
        options="string"
    />


- One of `x` or `y` is required to plot a line.
- If both `x` and `y` are provided, `x` will be used and `y` will be ignored.

### Supplying a Dataset

    <PropListing
        name=data
        description="Query name, wrapped in curly braces"
        required
        options="query name"
    />
    <PropListing
        name=x
        description="Column containing x-axis values"
        options="column name"
    />
    <PropListing
        name=y
        description="Column containing y-axis values"
        options="column name"
    />
    <PropListing
        name=label
        description="Column containing a label to use for each line"
        
        options="column name"
    />
    <PropListing
        name=hideValue
        description="Option to remove the value from the label"
        options={["true", "false"]}
        defaultValue=false
    />

- If both `x` and `y` are provided, `x` will be used and `y` will be ignored.

### Styling

    <PropListing
        name=labelPosition
        description="Where label will appear on the line"
        options={["aboveStart", "aboveCenter", "aboveEnd", "belowStart", "belowCenter", "belowEnd"]}
        defaultValue="aboveEnd"
    />
    <PropListing
        name=color
        description="Color to override default line and label colors"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=lineColor
        description="Color to override default line color. If used, takes precedence over `color`"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=labelColor
        description="Color to override default label color. If used, takes precedence over `color`"
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
    <PropListing
        name=labelBackground
        description="Option to show a white semi-transparent background behind the label. Helps when label is shown in front of darker colours."
        options={["true", "false"]}
        defaultValue="true"
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
<img src="/img/refarea-x-multi.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k yAxisTitle="Sales per Month">
    <ReferenceArea xMin='2020-03-14' xMax='2020-08-15' label=First color=yellow/>
    <ReferenceArea xMin='2021-03-14' xMax='2021-08-15' label=Second/>
</LineChart>
```

### Y-axis Defined Inline
<img src="/img/refarea-y-ranges.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=num_orders_num0 yAxisTitle="Orders per Month">
    <ReferenceArea yMin=2500 color=green label="Good"/>
    <ReferenceArea yMin=1000 yMax=2500 color=yellow label="Okay"/>
    <ReferenceArea yMin=0 yMax=1000 color=red label="Bad"/>
</LineChart>
```

### X-axis from Data
<img src="/img/refarea-x-multi-data.png"  width='600px'/>

```html
<LineChart data={query_name} x=column_x y=column_y>
    <ReferenceArea data={campaigns} xMin=start_date xMax=end_date label=campaign_name/>
</LineChart>
```

### Bar Chart
<img src="/img/refarea-bar.png"  width='600px'/>

```html
<BarChart data={orders_by_category_2021} x=month y=sales_usd0k series=category>
    <ReferenceArea xMin='2021-01-01' xMax='2021-04-01'/>
</BarChart> 
```

#### Continuous Axis Bar Charts
On a continous x-axis (dates or numbers), the reference area will start and stop at the exact point on the x-axis. This means it will appear in the middle of whichever bar is at that point. If you would prefer to see the area cover the full bar, there are 2 ways to achieve this:
1. Add a buffer on either side of the range you want to highlight (e.g., instead of ending the area at `2020-07-01`, end it at `2020-07-15`)
2. Change your x-axis to categorical data (using `xType=category`). If using a date axis, you may also want to retain the axis label formatting for dates - to achieve this, you can use the `xFmt` prop (e.g., `xFmt=mmm`)

### Reference Area Box
<img src="/img/refarea-box.png"  width='600px'/>

```html
<ScatterPlot data={countries} x=gdp_usd y=gdp_growth_pct1 tooltipTitle=country series=continent>
    <ReferenceArea xMin=16000 xMax=24000 yMin=-0.03 yMax=0.055 label="Large and stagnant" color=grey border=true/>
</ScatterPlot>
```

### Labels
<img src="/img/refarea-label-positions.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k>
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
<img src="/img/refarea-colors.png"  width='600px'/>

```html
<LineChart data={orders_by_month} x=month y=sales_usd0k >
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
        required
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
        
        options="column name"
    />

- At least 1 of `xMin`, `xMax`, `yMin`, or `yMax` is required to plot an area.

### Styling

    <PropListing
        name=labelPosition
        description="Where label will appear within the area"
        options={["topLeft", "top", "topRight", "left", "center", "right", "bottomLeft", "bottom", "bottomRight"]}
        defaultValue="topLeft"
    />
    <PropListing
        name=color
        description="Color to override default area and label colors"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=labelColor
        description="Color to override default label color. If used, takes precedence over `color`"
        options="CSS name | hexademical | RGB | HSL"
    />
    <PropListing
        name=border
        description="Whether border should be shown"
        options={["true", "false"]}
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
        description="Thickness of line (in pixels)"
        options="number"
        defaultValue="1"
    />