---
sidebar_position: 4
hide_title: true
hide_table_of_contents: false
---

# AreaChart
<h1 class="community-header"><span class="gradient">&lt;AreaChart/></span></h1>

![area-chart](/img/area-chart.png)

```markdown
<AreaChart 
    data={data.query_name} 
    x=column_x 
    y=column_y
/>
```

### Required Props
* **data** - query name, referenced as a subset of Evidence's **`data`** object
* **x** - column to use for the x-axis of the chart, name without quotes
* **y** - column to use for the y-axis of the chart, name without quotes

### Labeling Props
* **units** - adds a label to the top of the y-axis, to the right of the top value on the axis
* **xAxisTitle** - adds a title to the x-axis at the bottom right of the chart. This can also serve as a footnote location

### Formatting Props
* **yMin** - value to start the y-axis at. Default is 0
* **xGridlines** - turn x-axis gridlines on or off. Default is off. Turn on with `xGridlines=true`
* **yGridlines** - turn y-axis gridlines on or off. Default is on. Turn off with `yGridlines=false`
* **fillColor** - color of the area. CSS color input (CSS color name, hexadecimal code, RGB code)
* **fillTransparency** - % of color which will be rendered as transparent (value between 0 and 1)

:::note
Evidence's component tags need to be closed using `/>` (same as HTML tags)
:::
