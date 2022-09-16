---
sidebar_position: 9
title: Custom Charts
hide_title: true
hide_table_of_contents: false
---

<h1 class="community-header"><span class="gradient">Custom Charts</span></h1>

Our chart library is based on [ECharts](https://echarts.apache.org/examples/en/index.html), a powerful and flexible open source JavaScript chart library. We use many of the features in ECharts, and combine them with custom data transformation, logic, and theming. 

## `<ECharts>` Component
If you would like to create a fully custom chart, you can use our built-in `<ECharts>` component. This component accepts a JavaScript object containing a chart configuration. To test this out, you can find an example on the [ECharts example page](https://echarts.apache.org/examples/en/index.html) and paste the option object into the Evidence `<ECharts>` component.

This will let you create a chart that matches Evidence theming, but gives you access to the [full suite](https://echarts.apache.org/en/option.html#title) of ECharts features.

The downside of this approach is that `<ECharts>` requires data to be included in the configuration object, which can be difficult depending on the type of chart you need. If you would like to use specialized ECharts features, but retain the data management you get with Evidence charts, we recommend building a [mixed-type chart](/features/charts/mixed-type-charts) and passing in an `options` object for the specific features you need.

## How to Build the Configuration
To create a JavaScript object in an Evidence markdown page, you need to add a `<script>` tag. Any objects or variables you create in that script tag are then accessible by the rest of your page using curly braces. For example, if you create a variable named `myVar`, you can show the contents of that variable in your markdown using `{myVar}`.

## Examples

### Simple Treemap

[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=treemap-simple)

![custom-treemap](/img/custom-treemap.png)


``````
```sales_by_country
select "Canada" as country, 100 as sales
union all
select "US" as country, 250 as sales
union all
select "UK" as country, 130 as sales
union all
select "Australia" as country, 95 as sales
```

```test_data
select country as name, sales as value
from ${sales_by_country}
```

<ECharts config={
    {
      title: {
        text: 'Treemap Example',
        left: 'center'
      },
        tooltip: {
            formatter: '{b}: {c}'
        },
      series: [
        {
          type: 'treemap',
          visibleMin: 300,
          label: {
            show: true,
            formatter: '{b}'
          },
          itemStyle: {
            borderColor: '#fff'
          },
          roam: false,
          nodeClick: false,
          data: test_data,
          breadcrumb: {
            show: false
          }
        }
      ]
      }
    }
/>

``````


### Advanced Chart
[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=scatter-anscombe-quartet)

![custom-chart](/img/exg-custom-echarts-anscombe.svg)

```
<script>
const dataAll = [
  [
    [10.0, 8.04],
    [8.0, 6.95],
    [13.0, 7.58],
    [9.0, 8.81],
    [11.0, 8.33],
    [14.0, 9.96],
    [6.0, 7.24],
    [4.0, 4.26],
    [12.0, 10.84],
    [7.0, 4.82],
    [5.0, 5.68]
  ],
  [
    [10.0, 9.14],
    [8.0, 8.14],
    [13.0, 8.74],
    [9.0, 8.77],
    [11.0, 9.26],
    [14.0, 8.1],
    [6.0, 6.13],
    [4.0, 3.1],
    [12.0, 9.13],
    [7.0, 7.26],
    [5.0, 4.74]
  ],
  [
    [10.0, 7.46],
    [8.0, 6.77],
    [13.0, 12.74],
    [9.0, 7.11],
    [11.0, 7.81],
    [14.0, 8.84],
    [6.0, 6.08],
    [4.0, 5.39],
    [12.0, 8.15],
    [7.0, 6.42],
    [5.0, 5.73]
  ],
  [
    [8.0, 6.58],
    [8.0, 5.76],
    [8.0, 7.71],
    [8.0, 8.84],
    [8.0, 8.47],
    [8.0, 7.04],
    [8.0, 5.25],
    [19.0, 12.5],
    [8.0, 5.56],
    [8.0, 7.91],
    [8.0, 6.89]
  ]
];
const markLineOpt = {
  animation: false,
  label: {
    formatter: 'y = 0.5 * x + 3',
    align: 'right'
  },
  lineStyle: {
    type: 'solid'
  },
  tooltip: {
    formatter: 'y = 0.5 * x + 3'
  },
  data: [
    [
      {
        coord: [0, 3],
        symbol: 'none'
      },
      {
        coord: [20, 13],
        symbol: 'none'
      }
    ]
  ]
};
let options = {
  title: {
    text: "Anscombe's quartet",
    left: 'center',
    top: 0
  },
  grid: [
    { left: '7%', top: '7%', width: '38%', height: '38%' },
    { right: '7%', top: '7%', width: '38%', height: '38%' },
    { left: '7%', bottom: '7%', width: '38%', height: '38%' },
    { right: '7%', bottom: '7%', width: '38%', height: '38%' }
  ],
  tooltip: {
    formatter: 'Group {a}: ({c})'
  },
  xAxis: [
    { gridIndex: 0, min: 0, max: 20 },
    { gridIndex: 1, min: 0, max: 20 },
    { gridIndex: 2, min: 0, max: 20 },
    { gridIndex: 3, min: 0, max: 20 }
  ],
  yAxis: [
    { gridIndex: 0, min: 0, max: 15 },
    { gridIndex: 1, min: 0, max: 15 },
    { gridIndex: 2, min: 0, max: 15 },
    { gridIndex: 3, min: 0, max: 15 }
  ],
  toolbox: {
      show: true,
      feature: {
          saveAsImage: {
              show: true
          }
      }
  },
  series: [
    {
      name: 'I',
      type: 'scatter',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: dataAll[0],
      markLine: markLineOpt
    },
    {
      name: 'II',
      type: 'scatter',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: dataAll[1],
      markLine: markLineOpt
    },
    {
      name: 'III',
      type: 'scatter',
      xAxisIndex: 2,
      yAxisIndex: 2,
      data: dataAll[2],
      markLine: markLineOpt
    },
    {
      name: 'IV',
      type: 'scatter',
      xAxisIndex: 3,
      yAxisIndex: 3,
      data: dataAll[3],
      markLine: markLineOpt
    }
  ]
};
</script>

<ECharts config={options}/>
```