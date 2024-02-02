# Heatmap

```orders
select category, dayofweek(order_datetime) as day, count(*) as order_count from orders
group by all
order by category, day
```

<Heatmap data={orders} x=day y=category value=order_count valueFmt=usd/>

<!-- 
```test_data
select 'Mon' as day, 'ABC' as category, 100 as value
union all
select 'Tue' as day, 'ABC' as category, 120 as value
union all
select 'Wed' as day, 'ABC' as category, 130 as value
union all
select 'Mon' as day, 'DEF' as category, 160 as value
union all
select 'Tue' as day, 'DEF' as category, 180 as value
union all
select 'Wed' as day, 'DEF' as category, 190 as value
```

<Heatmap data={test_data} x=day y=category value=value/> -->