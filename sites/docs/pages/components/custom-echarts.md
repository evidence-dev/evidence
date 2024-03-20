---
sidebar_position: 14
title: Custom ECharts
hide_table_of_contents: false
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

![custom-treemap](/img/custom-treemap.png)

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
          data: test_data,
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

![custom-funnel](/img/custom-funnel.png)

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
                data: funnel_data,
                }
            ]
        }
    }
/>
````

### Pie Chart

[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=pie-simple)

ECharts requires the data object to have a specific format. For example in the pie chart show below it expects the columns to be called “name” and “value”. The `pie_data` query in the code below renames the fields from the original query so ECharts can use them.

![custom-pie](/img/custom-pie.png)

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
          data: pie_data,
        }
      ]
      }
    }
/>
````

### Donut Chart

[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=pie-doughnut)

ECharts requires the data object to have a specific format. For example in the donut chart show below it expects the columns to be called “name” and “value”. The `donut_data` query in the code below renames the fields from the original query so ECharts can use them.

![custom-donut](/img/custom-donut.png)

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
          data: donut_data,
        }
      ]
      }
    }
/>
````

### Advanced Chart

[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=scatter-anscombe-quartet)

![custom-chart](/img/exg-custom-echarts-anscombe.svg)

