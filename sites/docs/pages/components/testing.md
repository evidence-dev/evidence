
```sql sales_per_week
select
  date_trunc('week', order_datetime) AS week,
  sum(sales) AS total_sales
from needful_things.orders
where week between '${inputs.date_range.start}' and '${inputs.date_range.end}'
group by 1
order by 1
```

<DateRange name=date_range data={sales_per_week} dates=week/>
<!--  -->
<LineChart
    data={sales_per_week}
    x=week
    y=total_sales
/>


<DateRange
    name=range_filtering_a_query
    data={orders_by_day}
    dates=day
/>

```sql filtered_query
select 
    *
from ${orders_by_day}
where day between '${inputs.range_filtering_a_query.start}' and '${inputs.range_filtering_a_query.end}'
```

<LineChart
    data={filtered_query}
    x=day
    y=sales
/>

### Customizing Singluar Preset Ranges

<DateRange presetRanges={'Last 7 Days'}/>

````markdown
<DateRange
    name=name_of_date_range
    presetRanges={'Last 7 Days'}
/>