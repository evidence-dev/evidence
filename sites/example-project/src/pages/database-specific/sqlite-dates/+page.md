# SQLite Dates

```sql table_list
SELECT name FROM sqlite_schema WHERE type ='table'
```

```sql orders
select * from orders
limit 100
```

```sql orders_by_month
select
  substr(order_datetime,1,7) as date,
  count(*) as number_of_orders,
  sum(sales) as sales_usd0k,
  sum(sales)/count(*) as average_order_value_usd2
from orders

group by date order by 1 desc
```

```sql order_summary
select order_month, count(*) as orders
from ${orders}
group by 1
order by 1 asc
```

```sql reviews
select * from reviews
limit 100
```

```sql marketing_spend
select * from marketing_spend
limit 100
```

<LineChart
    data={orders_by_month}
    x=date
    y=number_of_orders
    sort=false
/>

<LineChart
    data={order_summary}
    x=order_month
    y=orders
/>
