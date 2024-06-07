---
sidebar_position: 98
title: Custom ECharts
---

Our chart library is based on [ECharts](https://echarts.apache.org/examples/en/index.html), a powerful and flexible open source JavaScript chart library. We use many of the features in ECharts, and combine them with custom data transformation, logic, and theming.

## `<ECharts>` Component

If you would like to create a fully custom chart, you can use our built-in `<ECharts>` component. This component accepts a JavaScript object containing a chart configuration. To test this out, you can find an example on the [ECharts example page](https://echarts.apache.org/examples/en/index.html) and paste the option object into the Evidence `<ECharts>` component.

This will let you create a chart that matches Evidence theming, but gives you access to the [full suite](https://echarts.apache.org/en/option.html#title) of ECharts features.

The downside of this approach is that `<ECharts>` requires data to be included in the configuration object, which can be difficult depending on the type of chart you need. If you would like to use specialized ECharts features, but retain the data management you get with Evidence charts, we recommend building a [mixed-type chart](/components/mixed-type-charts) and passing in an `options` object for the specific features you need.

## How to Build the Configuration

To create a JavaScript object in an Evidence markdown page, you need to add a `&lt;script&gt;` tag. Any objects or variables you create in that script tag are then accessible by the rest of your page using curly braces. For example, if you create a variable named `myVar`, you can show the contents of that variable in your markdown using `{myVar}`.

## Examples

### Simple Treemap

[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=treemap-simple)

ECharts requires the data object to have a specific format. For example in the treemap chart show below it expects the columns to be called “name” and “value”. The `test_data` query in the code below renames the fields from the original query so ECharts can use them.

```sql sales_by_country
select 'Canada' as country, 100 as sales
union all
select 'US' as country, 250 as sales
union all
select 'UK' as country, 130 as sales
union all
select 'Australia' as country, 95 as sales
```

```sql test_data
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
          data: [...test_data],
          breadcrumb: {
            show: false
          }
        }
      ]
      }
    }
/>


````markdown
```sql sales_by_country
select 'Canada' as country, 100 as sales
union all
select 'US' as country, 250 as sales
union all
select 'UK' as country, 130 as sales
union all
select 'Australia' as country, 95 as sales
```

```sql test_data
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
          data: [...test_data],
          breadcrumb: {
            show: false
          }
        }
      ]
      }
    }
/>

````

### Funnel Chart

[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=funnel)

ECharts requires the data object to have a specific format. For example in the funnel chart show below it expects the columns to be called “name” and “value”. The `funnel_data` query in the code below renames the fields from the original query so ECharts can use them.

```sql funnel_stages
select 'Emailed' as stage, 129 as count
union all
select 'Meeting' as stage, 86 as count
union all
select 'Proposal' as stage, 65 as count
union all
select 'Signed' as stage, 44 as count
```

```sql funnel_data
select stage as name, count as value
from ${funnel_stages}
```

<ECharts config={
        {
            tooltip: {
                formatter: '{b}: {c}'
            },
            series: [
                {
                type: 'funnel',
                data: [...funnel_data],
                }
            ]
        }
    }
/>

````markdown
```sql funnel_stages
select 'Emailed' as stage, 129 as count
union all
select 'Meeting' as stage, 86 as count
union all
select 'Proposal' as stage, 65 as count
union all
select 'Signed' as stage, 44 as count
```

```sql funnel_data
select stage as name, count as value
from ${funnel_stages}
```

<ECharts config={
        {
            tooltip: {
                formatter: '{b}: {c}'
            },
            series: [
                {
                type: 'funnel',
                data: [...funnel_data],
                }
            ]
        }
    }
/>
````

### Pie Chart

[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=pie-simple)

ECharts requires the data object to have a specific format. For example in the pie chart show below it expects the columns to be called “name” and “value”. The `pie_data` query in the code below renames the fields from the original query so ECharts can use them.

```sql pie_query
select 'Apple' as pie, 60 as count
union all
select 'Blueberry' as pie, 70 as count
union all
select 'Cherry' as pie, 40 as count
union all
select 'Pecan' as pie, 35 as count
```

```sql pie_data
select pie as name, count as value
from ${pie_query}
```

<ECharts config={
    {
        tooltip: {
            formatter: '{b}: {c} ({d}%)'
        },
        series: [
        {
          type: 'pie',
          data: [...pie_data],
        }
      ]
      }
    }
/>


````markdown
```sql pie_query
select 'Apple' as pie, 60 as count
union all
select 'Blueberry' as pie, 70 as count
union all
select 'Cherry' as pie, 40 as count
union all
select 'Pecan' as pie, 35 as count
```

```sql pie_data
select pie as name, count as value
from ${pie_query}
```

<ECharts config={
    {
        tooltip: {
            formatter: '{b}: {c} ({d}%)'
        },
        series: [
        {
          type: 'pie',
          data: [...pie_data],
        }
      ]
      }
    }
/>
````

### Donut Chart

[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=pie-doughnut)

ECharts requires the data object to have a specific format. For example in the donut chart show below it expects the columns to be called “name” and “value”. The `donut_data` query in the code below renames the fields from the original query so ECharts can use them.

```sql donut_query
select 'Glazed' as donut, 213 as count
union all
select 'Cruller' as donut, 442 as count
union all
select 'Jelly-filled' as donut, 321 as count
union all
select 'Cream-filled' as donut, 350 as count
```

```sql donut_data
select donut as name, count as value
from ${donut_query}
```

<ECharts config={
    {
        tooltip: {
            formatter: '{b}: {c} ({d}%)'
        },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data: [...donut_data],
        }
      ]
      }
    }
/>


````markdown
```sql donut_query
select 'Glazed' as donut, 213 as count
union all
select 'Cruller' as donut, 442 as count
union all
select 'Jelly-filled' as donut, 321 as count
union all
select 'Cream-filled' as donut, 350 as count
```

```sql donut_data
select donut as name, count as value
from ${donut_query}
```

<ECharts config={
    {
        tooltip: {
            formatter: '{b}: {c} ({d}%)'
        },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data: [...donut_data],
        }
      ]
      }
    }
/>
````

### Advanced Chart

[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=scatter-anscombe-quartet)

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



```markdown
&lt;script&gt;
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
&lt;/script&gt;

<ECharts config={options}/>
```
