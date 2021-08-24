---
sidebar_position: 7
hide_table_of_contents: false
---

# Add a Chart

Charts work in the same way as the [<span class="gradient">**&lt;Value/>**</span>](/components/value) component - you can add them anywhere in your markdown and reference SQL queries on the page.

Add a [<span class="gradient">**&lt;LineChart/>**</span>](/components/line-chart) component to your page to show the number of complaints by day.

```markdown title="Add to austin-311/index.md after the 'Daily Chart' subheading:"
<LineChart 
    data={data.complaints_by_day} 
    x=date 
    y=complaints
/>
```

This will give you the line chart below, which displays over 2,700 data points:

<div style={{textAlign: 'center'}}>

![line-chart](/img/austin-chart.png)

</div>

:::info Visualization Components
Check out the [Components](/components/value) section to see the full list of available components.
:::