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



```sql orders_by_month_filtered_by_default_value
select * from ${orders_by_month} where month between '${inputs.range_default.start}' and '${inputs.range_default.end}'
```

# Date Picker with default value

<DateRange data={orders_by_month} dates=month name=range_default defaultValue="Last 90 days"/>

<BarChart data={orders_by_month_filtered_by_default_value} x="month" y="sales_usd0k" />