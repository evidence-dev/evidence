---
sidebar_position: 1
hide_title: true
hide_table_of_contents: false
---

# Evidence Chart Library

<h1 class="community-header"><span class="gradient">Evidence Chart Library</span></h1>

Our chart library has a flexible, declarative API that lets you build customized, composable charts or choose from a selection of chart templates (Quick Charts). 

While the library offers a lot of customizable features, our defaults let you create beautiful, publication-quality charts with as little as a single line of code.

## Composable Charts
A composable chart consists of a `<Chart>` component and **primitives**, which are individual elements you can apply to your chart.

### Available Primitives
- Line
- Area
- Bar
- Scatter
- Bubble
- Hist


This structure lets you build simple charts...
```html
<Chart data={data.query_name} x=date y=sales>
    <Line/>
</Chart>
```

...or more complex charts with multiple series types:
```html
<Chart data={data.query_name} x=date>
    <Bar y=sales/>
    <Line y=gross_profit/>
</Chart>
```

## Quick Charts
Quick Charts are template charts that build a composable chart for you behind-the-scenes.

For example, this code...
```markdown
<LineChart data={data.query_name} x=date y=sales/>
```

...produces the same output as this code:
```markdown
<Chart data={data.query_name} x=date y=sales>
    <Line/>
</Chart>
```

### Available Quick Charts
- LineChart
- AreaChart
- BarChart
- ScatterPlot
- BubbleChart
- Histogram

## Chart Elements

