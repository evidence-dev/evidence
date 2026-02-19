---
title: Small Multiple
description: Display a series of similar graphs or charts using the same scale and axes
sidebar_position: 96
---

Use a small multiple to display a series of similar graphs or charts using the same scale and axes.
A small multiple can be created by using the grid, loop and query functions option in combination with a unique list of horizontal and vertical axes.

 1. Define unique lists for axes
 2. Define grid
 3. Define loops for horizontal and/or veritical grid
 4. Filter chart value with query function


# Example


```sql categories
select distinct category as name from needful_things.orders
```

```sql orders_by_category
select category, order_month as month, sum(sales) as sales_usd0k, count(1) as orders from needful_things.orders
group by all
```

<DocTab>

<Grid cols=3 gapSize=lg>
{#each categories as category}

<LineChart 
    data={orders_by_category.where(`category = '${category.name}'`)}
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
    title="Monthly Sales"
    subtitle="{category.name}"
/>
{/each}
</Grid>

```markdown
<Grid cols=3 gapSize=lg>
{#each categories as category}

<LineChart 
    data={orders_by_category.where(`category = '${category.name}'`)}
    x=month
    y=sales_usd0k 
    yAxisTitle="Sales per Month"
    title="Monthly Sales"
    subtitle="{category.name}"
/>
{/each}
</Grid>
```
</DocTab>

