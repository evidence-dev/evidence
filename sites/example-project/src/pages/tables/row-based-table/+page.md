---
title: Row Based Data Table
queries:
  - orders_by_month: orders_by_month.sql
---


```sql last_5_months
select * 
from orders_by_month
order by month desc
limit 2
```

```sql yearly_sales
select 
    date_part('year', order_datetime) +  as year,
    sum(sales) as sales,
    count(*) as num_orders,
    sum(sales) / count(*) as aov
from orders
where order_datetime < '2021-01-01'
group by 1
order by 1
```


<DataTable data={yearly_sales} rows=all columnTitles=year comparisonType=pct>
    <Row id=sales title="Total Revenue" description="Sales, Net of Returns ($)" fmt=usd2m/>
    <Row id=aov title="AOV" description="Average Order Value ($)" fmt=usd2 deltaThreshold=0.005/>
    <Row id=num_orders title="Orders" description="Number of Orders" fmt=num0/>
</DataTable>

<DataTable data={yearly_sales} rows=all columnTitles=year comparisonType=delta>
    <Row id=sales title="Total Revenue" description="Sales, Net of Returns ($)" fmt=usd2m/>
    <Row id=aov title="AOV" description="Average Order Value ($)" fmt=usd2/>
    <Row id=num_orders title="Orders" description="Number of Orders" fmt=num0/>
</DataTable>


