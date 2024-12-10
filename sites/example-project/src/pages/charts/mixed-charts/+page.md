---
title: Mixed Type Charts
queries:
  - orders_by_category: orders_by_category.sql
---

## Bar and Line Chart

<Chart
data={orders_by_category.filter(d => d.category === "Sinister Toys")}
x=month>
<Bar y=sales_usd0k/>
<Line y=num_orders_num0/>
<ReferenceLine x='2020-01-01' label=date lineColor=base-content-muted/>
</Chart>

## Bar and Line Chart with Custom Height

<Chart
data={orders_by_category.filter(d => d.category === "Sinister Toys")}
x=month
chartAreaHeight=380>
<Bar y=sales_usd0k/>
<Line y=num_orders_num0/>
</Chart>


## Bar and Line with Log Scale

<Chart
data={orders_by_category.filter(d => d.category === "Sinister Toys")}
x=month
yLog=true>
<Bar y=sales_usd0k/>
<Line y=num_orders_num0/>
<ReferenceLine x='2020-01-01' label=date lineColor=base-content-muted/>
</Chart>
