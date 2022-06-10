---
sidebar_position: 5
title: Evidence Chart Library
hide_title: true
hide_table_of_contents: false
---

<h1 class="community-header"><span class="gradient">Evidence Chart Library</span></h1>

Our chart library has a flexible, declarative API that lets you build customized, composable charts or choose from a selection of chart templates (Quick Charts). 

While our library offers a lot of customizable features, our defaults let you create beautiful, publication-quality charts with as little as a single line of code.

<div style={{textAlign: 'center'}}>

![intro-chart](/img/exg-intro-chart.svg)

</div>

## Chart Elements

![chart-elements-one](/img/chart-elements-one.png)

#### Horizontal Chart (`swapXY=true`)

![chart-elements-two](/img/chart-elements-two.png)


## Data Structure

**Data**
- All charts require a data prop, which should contain a query result (e.g., `data={query_name}`)

**x and y**
- All charts in our library today are x-y coordinate charts (AKA Cartesian), meaning they require `x` and `y` columns to create the axes and scales for the chart
- `y` can accept multiple columns, but can only plot on a single axis at this time. Support for multiple y-axes will come in a future release
- We have built-in assumptions to make writing the chart code easier:
  - If you don't supply `x`, the first column in the dataset is assumed to be `x` 
  - If you don't supply `y`, any numerical columns that you have not already assigned to the chart are assumed to be `y`

**Multiple Series**
- To plot multiple series (or groups) on your chart, you can do one of the following:
  - Include a `series` column, which contains category or group names (e.g, `series=country`)
  - Include multiple `y` columns - each column will be treated as an individual series (e.g., `y={["y1", "y2"]}`)
  - Both - when both a `series` column and multiple `y` columns are used, Evidence will create a series for each combination of `series` and `y`
- Multiple `y` columns must be passed in as an array. Because arrays are not a native markdown feature, they must be wrapped in curly braces so Evidence knows to evaluate it as an object instead of a string
  - The easiest way to plot multiple `y` columns is to structure your query in a way that leaves all remaining columns as `y`. For example, if your dataset has 3 columns - x, y1, and y2 - you can leave out an explicit `y` assignment. Evidence will take the first column as `x`, then will look for any other numerical columns, including them as `y`


## Ways to Build Charts

### Composable Charts
A composable chart consists of a `<Chart>` component and **primitives**, which are individual elements you can apply to your chart.

#### Available Primitives
- Line
- Area
- Bar
- Scatter
- Bubble
- Hist


This structure lets you build simple charts...
```html
<Chart data={query_name} x=date y=sales>
    <Line/>
</Chart>
```

...or more complex charts with multiple series types:
```html
<Chart data={query_name} x=date>
    <Bar y=sales/>
    <Line y=gross_profit/>
</Chart>
```

Composable charts manage prop conflicts and allow for prop overrides. Props can be defined in both the `<Chart>` component and primitive components, and Evidence will use whichever prop is scoped more specifically. For example, in the code below, the line will plot `gross_profit` instead of `sales`:

```html
<Chart data={financial_results} x=month y=sales>
    <Line y=gross_profit/>
</Chart>
```

In the event of a prop conflict, Evidence will use whichever primitive is listed **last** in the `<Chart>` component.

### Quick Charts
The easiest way to build a chart in Evidence is by using Quick Charts. Quick Charts are template charts that build a composable chart for you behind-the-scenes.

For example, instead of writing this...
```markdown
<Chart data={query_name} x=date y=sales>
    <Line/>
</Chart>
```

...you can write this...
```markdown
<LineChart data={query_name} x=date y=sales/>
```

...and if your query columns are organized as described in the data section above, you can simplify it to this:
```markdown
<LineChart data={query_name}/>
```

#### Available Quick Charts
- LineChart
- AreaChart
- BarChart
- ScatterPlot
- BubbleChart
- Histogram


## Interactive Features

### Tooltips
When you have many series on a chart, tooltips automatically sort to show the largest series
![tooltip-change](/img/tooltip-change.gif)

### Series Focus
![series-focus](/img/series-focus.gif)

### Legend Scroll
![legend-scroll](/img/legend-scroll.gif)
