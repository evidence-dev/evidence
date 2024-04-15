select
    date_trunc('month', order_datetime) as month,
    category,
    sum(sales) as sales,
    count(*) as num_orders,
    sum(sales) / count(*) as aov
from needful_things.orders
WHERE order_datetime >= '2021-01-01'
group by 1, 2
order by 1, 3 desc