---
queries:
- orders_by_category_2021.sql
---


```sql months_since_jan
select
    datediff('month',MIN(month) over (),month) as month_number,
    category,
    sales_usd0k
from ${orders_by_category_2021}
```

```sql pivot_by_month_number
PIVOT ${months_since_jan} ON month_number USING SUM(sales_usd0k) GROUP BY category
```

<DataTable data={pivot_by_month_number} />