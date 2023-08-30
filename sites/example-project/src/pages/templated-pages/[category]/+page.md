---
sources:
  - orders_by_category: orders_by_category.sql
  - item_by_category: item_by_category.sql
---

# {$page.params.category}

<DataTable
	data={orders_by_category.filter(d => d.category?.toLowerCase() === $page.params.category?.toLowerCase())}
/>

## Area

<AreaChart 
	data={orders_by_category.filter(d => d.category?.toLowerCase() === $page.params.category?.toLowerCase())}
	x=month
	y=sales_usd0k
/>


## Items

<DataTable 
	data={item_by_category.filter(d => d.category?.toLowerCase() === $page.params.category?.toLowerCase())}
	link=item 
	rows=1
>
    <Column id="item" />
</DataTable>