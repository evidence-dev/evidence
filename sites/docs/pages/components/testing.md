```sql needful_things
select * from needful_things.orders
```

<DataTable data={needful_things}/>

```sql all_state_category_sales
select state, category, sales as stateSales from needful_things.orders
```

<Dropdown name=state_name data={needful_things} value=state/>
<Dropdown name=category_name data={needful_things} value=category/>

``` sql filterState_category_sales
SELECT category, SUM(sales) AS totalSales
FROM needful_things.orders
WHERE state = '${inputs.state_name.value}'
GROUP BY category;
```
``` sql filterState_filterCategory_sales
SELECT category, SUM(sales) AS totalSales
FROM needful_things.orders
WHERE state = '${inputs.state_name.value}' AND category = '${inputs.category_name.value}'
GROUP BY category;
``` 

