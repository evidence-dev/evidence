select
    date_trunc('month', order_datetime) as month,
    count(*) as num_orders,
    sum(sales) as sales,
    sum(sales) / count(*) as aov
from needful_things.orders
group by 1
order by 1