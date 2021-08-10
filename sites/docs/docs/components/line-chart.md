---
sidebar_position: 3
hide_title: true
hide_table_of_contents: false
---

# LineChart
<h1 class="community-header"><span class="gradient">&lt;LineChart/></span></h1>

![line-chart](/img/line-chart.png)

```markdown
<LineChart 
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
* **yMin** - value to start the y-axis at. Default is 0
* **xGridlines** - turn x-axis gridlines on or off. Default is off. Turn on with `xGridlines=true`
* **yGridlines** - turn y-axis gridlines on or off. Default is on. Turn off with `yGridlines=false`
* **lineLabel** - direct label for a single line chart. Label appears just to the right of the last point in the line
* **lineColor** - CSS color input (color name, hexadecimal code, or RGB code)
* **lineWidth** - pixel width of line (number). Default = 1.5
* **lineTransparency** - % of color which will be rendered as transparent (value between 0 and 1)
* **lineDashSize** - determines distance between dashes. Default is 0. Turn dashes on with any value above 0

:::note
Evidence's component tags need to be closed using `/>` (same as HTML tags)
:::
