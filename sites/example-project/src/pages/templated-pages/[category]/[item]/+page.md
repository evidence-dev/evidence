---
sources:
  - orders_by_item: orders_by_item.sql
---

# {$page.params.item}


The most recent monthly sales of {$page.params.item}s was {fmt(orders_by_item.filter(d => d.item === $page.params.item)[35].sales_usd0k,"$#,###.00")}


<LineChart data={orders_by_item.filter(d => d.item === $page.params.item)} x=month y=sales_usd0k/>

