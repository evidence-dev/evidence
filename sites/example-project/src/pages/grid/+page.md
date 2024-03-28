---
title: Grid
sidebar_position: 1
queries:
  - orders_by_category: orders_by_category.sql
  - orders_by_category_2021: orders_by_category_2021.sql
  - orders_by_item: orders_by_item.sql
  - items_all_time: orders_by_item_all_time.sql
  - marketing_spend: marketing_spend.sql
---

## Bar

<Grid cols=3>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
</Grid>

Some text

<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>


<Grid cols=2 gapSize=lg>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
<BarChart
data={orders_by_category}
x=category
y=sales_usd0k
xAxisTitle=Category
/>
  </Grid>

## Establish page width on print
<div style="width: 400px" class="bg-red-400 mb-5">400</div>
<div style="width: 500px" class="bg-red-400 mb-5">500</div>
<div style="width: 600px" class="bg-red-400 mb-5">600</div>
<div style="width: 640px" class="bg-red-400 mb-5">640</div>
<div style="width: 700px" class="bg-red-400 mb-5">700</div>
<div style="width: 800px" class="bg-red-400 mb-5">800</div>