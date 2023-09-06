---
sources:
  - orders_by_item: orders_by_item.sql
---

# {$page.params.item}


The most recent monthly sales of {$page.params.item}s was {fmt(orders_by_item.filter(d => d.item?.toLowerCase() === $page.params.item?.toLowerCase())[35].sales_usd0k,"$#,###.00")}


<LineChart data={orders_by_item.filter(d => d.item?.toLowerCase() === $page.params.item?.toLowerCase())} x=month y=sales_usd0k/>

