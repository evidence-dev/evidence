select
    date_trunc('day', order_datetime) as day,
    count(*) as num_orders,
    sum(sales) as sales,
    sum(sales) / count(*) as aov
from needful_things.orders
where order_datetime > '2019-01-02' 
  and order_datetime <= '2021-12-20'
group by 1
order by 1