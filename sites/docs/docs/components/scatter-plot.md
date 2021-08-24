---
sidebar_position: 8
hide_title: true
hide_table_of_contents: false
---

# ScatterPlot
<h1 class="community-header"><span class="gradient">&lt;ScatterPlot/></span></h1>

![scatter-plot](/img/scatter-plot.png)

```markdown
<ScatterPlot 
    data={data.query_name} 
    x=column_x 
    y=column_y
/>
```

### Required Props
* **data** - query name, referenced as a subset of Evidence's **`data`** object
* **x** - column to use for the x-axis of the chart, name without quotes
* **y** - column to use for the y-axis of the chart, name without quotes

### Optional Props
* **series** - colunn to use as the series (groups) in a multi-series chart
* **legend** - turn legend off or on. Default is `legend=top`; to turn off, change to `legend=none`

### Labeling Props
* **units** - adds a label to the top of the y-axis, to the right of the top value on the axis
* **xAxisTitle** - adds a title to the x-axis at the bottom right of the chart. This can also serve as a footnote location

### Formatting Props
* **yMin** - value to start the y-axis at. Default is minimum value in your `y` column
* **xGridlines** - turn x-axis gridlines on or off. Default is off. Turn on with `xGridlines=true`
* **yGridlines** - turn y-axis gridlines on or off. Default is on. Turn off with `yGridlines=false`
* **fillColor** - color of the points (CSS color input)
* **fillTransparency** - % of color which will be rendered as transparent (value between 0 and 1). Default is 0.25
* **outlineColor** - color of the line surrounding the point
* **outlineWidth** - px width of the line surrounding the point
* **outlineTransparency** - % of outline color which will be rendered as transparent (value between 0 and 1)
* **pointSize** - size of each point (number)

:::note
Evidence's component tags need to be closed using `/>` (same as HTML tags)
:::


### Checking Values
You can hover over each point on your chart to see the value and (if applicable) the series it belongs to:

![scatter-hovertags](/img/scatter-hovertag-close.png)

Direct labeling and interactive charts (tooltips, etc.) are on our roadmap.

