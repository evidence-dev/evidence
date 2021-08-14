---
sidebar_position: 6
hide_title: true
hide_table_of_contents: false
---

# BarChart
<h1 class="community-header"><span class="gradient">&lt;BarChart/></span></h1>

![bar-chart](/img/bar-chart.png)

```markdown
<BarChart 
    data={data.query_name} 
    x=column_x 
    y=column_y
/>
```

BarChart is a **reverse axis** chart: the x-axis is vertical and the y-axis is horizontal.

### Required Props
* **data** - query name, referenced as a subset of Evidence's **`data`** object
* **x** - column to use for x-axis (vertical axis) of the chart, name without quotes
* **y** - column to use for y-axis (horizontal axis) of the chart, name without quotes

### Optional Props
* **series** - colunn to use as the series (groups) in a multi-series chart
* **legend** - turn legend off or on. Default is `legend=top`; to turn off, change to `legend=none`
* **sort** - turn sorting off or on. Default is `sort=true`, which applies Evidence's default sorting; to turn off, change to `sort=false`

### Labeling Props
* **units** - adds a label to the top of the y-axis, to the right of the top value on the axis

### Formatting Props
* **yMin** - value to start the y-axis at. Default is 0
* **xGridlines** - turn x-axis gridlines on or off. Default is off. Turn of with `xGridlines=false`
* **yGridlines** - turn y-axis gridlines on or off. Default is on. Turn on with `yGridlines=true`
* **fillColor** - color of the columns. CSS color input (CSS color name, hexadecimal code, RGB code)
* **fillTransparency** - % of color which will be rendered as transparent (value between 0 and 1)

:::note
Evidence's component tags need to be closed using `/>` (same as HTML tags)
:::

### Smart Defaults
If you create a bar chart with many x-axis items (e.g., names of departments), Evidence will extend the height of the chart for you to avoid the bars becoming squished.

![bar-chart-long](/img/bar-chart-long.png)