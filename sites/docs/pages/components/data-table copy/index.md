---
title: Data Table COPY
sidebar_position: 1
---

```orders
select state, category, item, count(1) as orders, sum(sales) as sales, if(random() > 0.3, 1, -1) * 0.1 * random() as growth from needful_things.orders
group by all
limit 25
```

```svelte
<DataTable data={orders} groupBy=state subtotals=true> 
 	<Column id=state/> 
	<Column id=category /> 
	<Column id=item /> 
	<Column id=orders/> 
	<Column id=sales fmt=usd/> 
	<Column id=growth fmt=pct1/> 
</DataTable>
```

<DataTable data={orders} groupBy=state subtotals=true> 
 	<Column id=state/> 
	<Column id=category/> 
	<Column id=item /> 
	<Column id=orders/> 
	<Column id=sales fmt=usd/> 
	<Column id=growth fmt=pct1/> 
</DataTable>