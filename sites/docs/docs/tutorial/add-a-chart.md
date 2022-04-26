---
sidebar_position: 7
hide_table_of_contents: false
---

# Add a Chart

Charts work in the same way as the [<span class="gradient">**&lt;Value/>**</span>](/components/text-components/value) component - you can add them anywhere in your markdown and reference SQL queries on the page.

Add a [<span class="gradient">**&lt;LineChart/>**</span>](/components/charts/line-chart) component to your page to show the number of orders per month.

```markdown title="Add to business-performance.md after the text with the <Value/> component:"
<LineChart 
    data={data.monthly_orders} 
    title='Needful Things Inc. Monthly Orders'
    x=order_month
    y=orders
/>
```



<div style={{textAlign: 'center'}}>

![line-chart](/img/tutorial-img/needful-things-first-chart.png)

</div>

:::info Visualization Components
Check out the [Components](/components/text-components/value) section to see the full list of available components.
:::