---
queries:
- orders_by_month.sql
---

```sql orders_by_month_filtered
select * from ${orders_by_month} where month between '${inputs.range.start}' and '${inputs.range.end}'
```

# Date Picker

<DateRange data={orders_by_month} dates=month name=range/>

<BarChart data={orders_by_month_filtered} x="month" y="sales_usd0k" />

# Date Picker - Input Data is filtered by the Date Range

```sql sales_per_week
select 
  date_trunc('week', order_datetime) as week,
  sum(sales) as total_sales
from needful_things.orders
where week between '${inputs.week_range.start}' and '${inputs.week_range.end}'
group by 1
order by 1
```

<DateRange data={sales_per_week} dates=week name=week_range/>

<BarChart data={sales_per_week} x="week" y="total_sales" />
```