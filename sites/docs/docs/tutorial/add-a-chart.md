---
sidebar_position: 6
hide_table_of_contents: false
title: Add a Chart
---

Charts work in the same way as the [<span class="gradient">**&lt;Value/>**</span>](/features/markdown//value) component - you can add them anywhere in your markdown and reference SQL queries on the page.

So let's try to answer the question the Needful Things owner had about sales.

To do this, add an [<span class="gradient">**&lt;AreaChart/>**</span>](/features/charts/area-chart), a [<span class="gradient">**&lt;LineChart/>**</span>](/features/charts/line-chart), and a [<span class="gradient">**&lt;BarChart/>**</span>](/features/charts/bar-chart) component to your page.

```markdown title="Add to the bottom of business-performance.md:"
## Monthly Sales
<AreaChart 
    data={data.monthly_orders} 
    x=order_month
    y=sales_usd
/>

## Monthly Orders
<LineChart 
    data={data.monthly_orders} 
    x=order_month
    y=orders
/>

## Basket Size
<BarChart 
    data={data.monthly_orders} 
    x=order_month
    y=basket_size_usd
/>
```

<div style={{textAlign: 'center'}}>

![line-chart](/img/tutorial-img/needful-things-first-chart-v2.png)

</div>

The first chart shows sales have overall been increasing across the three year period (though not every month).

The second and third charts show this is mainly due to an increasing number of orders - the average basket size has been relatively consistent over the period.

:::info Visualization Components
Check out the [Components](/features/markdown//value) section to see the full list of available components.
:::