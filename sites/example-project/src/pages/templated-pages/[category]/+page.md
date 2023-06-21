---
sources:
  - orders_by_category: orders_by_category.sql
  - item_by_category: item_by_category.sql
---

# {$page.params.category}

<DataTable data={orders_by_category.filter(d => d.category === $page.params.category)} />

## Area

<AreaChart data={orders_by_category.filter(d => d.category === $page.params.category)} x=month y=sales_usd0k/>


## Items

<DataTable 
  data={item_by_category.filter(d => d.category === $page.params.category)}
  link=item>
    <Column id="item" />
</DataTable>