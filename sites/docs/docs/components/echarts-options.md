---
sidebar_position: 98
title: ECharts Options
hide_table_of_contents: false
---

:::warning 
`echartsOptions` allow you to customize your chart with any combination of eCharts config options. Many config combinations can result in "broken" looking charts. Proceed with caution, and test your charts, particularly at different screen widths.
:::

ECharts settings are specified in config object. Evidence generates this config for you through the props you pass to your chart. 

If you can't get your chart to look "just right" with standard chart , you can use `echartsOptions` to customize your chart by adding or overriding the eCharts config directly.

## ECharts Options Object

The options object is passed as follows. **Note the double curly braces.**

```markdown
<BarChart
    data={query_name}
    x=column_x
    y=column_y
    echartsOptions={{exampleOption: 'exampleValue'}}
/>
```

See the [eCharts docs](https://echarts.apache.org/en/option.html) for a full reference of config options.

Note that LLMs such as ChatGPT and GitHub Copilot are reasonably good at generating eCharts options if you explain what you are trying to achieve.


## Print ECharts Config

You can print the current eCharts config for a chart by adding `printEchartsConfig=true` to the chart. This will print the full config just below the chart. 

This includes both any default Evidence config and any `echartsOptions` you have specified, and so can be useful for debugging.

```markdown
<BarChart
    data={query_name}
    x=column_x
    y=column_y
    echartsOptions={{exampleOption: 'exampleValue'}}
    printEchartsConfig=true
/>
```


## Example Configs

### Customize the Legend Position


```markdown
echartsOptions={{
    legend: {
        right: 'right',
        top: 'middle',
        align: 'auto',
        orient: 'vertical',
        padding: 7,
        borderColor: '#ccc',
        borderWidth: 1,
    },
    grid: {
        right: '120px'
    }
}}
```

### Add Data Zoom

```markdown
echartsOptions={{
    dataZoom: [
        {
            start: 0,
            end: 100,
        },
    ],
    grid: {
        bottom: '50px',
    },
}}
```

### Add Series Labels Next to Chart

```markdown
echartsOptions={{
    series: [
    {
        endLabel: {
            show: true,
            formatter: (params) => params.seriesName,
            offset: [0, -5], // [x, y] offset from the end of the line
        }
    },
    ,
    {
        endLabel: {
            show: true,
            formatter: () => "AOV",
            offset: [0, 70], // [x, y] offset from the end of the line
        }
    }
    ],
    grid: {
        right: '50px',
        top: '10px'
    }
}}
```

### Add Axis Pointer to Tooltip

```markdown
echartsOptions={{
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross',
            label: {
                backgroundColor: '#6a7985'
            }
        }
    },
}}
```
