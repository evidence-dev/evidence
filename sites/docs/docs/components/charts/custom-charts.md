---
sidebar_position: 10
hide_title: true
hide_table_of_contents: false
---

# Custom Charts
<h1 class="community-header"><span class="gradient">Custom Charts</span></h1>

Our chart library is based on [ECharts](https://echarts.apache.org/examples/en/index.html), a powerful and flexible open source JavaScript chart library. We use many of the features in ECharts, and combine them with custom data transformation, logic, and theming. 

### `<ECharts>` Component
If you would like to create a fully custom chart, you can use our built-in `<ECharts>` component. This component accepts a JavaScript object containing a chart configuration. To test this out, you can find an example on the [ECharts example page](https://echarts.apache.org/examples/en/index.html) and paste the option object into the Evidence `<ECharts>` component.

This will let you create a chart that matches Evidence theming, but gives you access to the [full suite](https://echarts.apache.org/en/option.html#title) of ECharts features.

The downside of this approach is that `<ECharts>` requires data to be included in the configuration object, which can be difficult depending on the type of chart you need. If you would like to use specialized ECharts features, but retain the data management you get with Evidence charts, we recommend building a [composable chart](/components/charts/composable-charts) and passing in an `options` object for the specific features you need.

### Example
[Link to ECharts example](https://echarts.apache.org/examples/en/editor.html?c=line-smooth)

```markdown
<script>
    let options = {
        xAxis: {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
            data: [820, 932, 901, 934, 1290, 1330, 1320],
            type: 'line',
            smooth: true
            }
        ]
    };
</script>

<ECharts config={options}/>
```
