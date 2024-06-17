select
    category,
    channel,
    count(*) as num_orders,
    sum(sales) as sales
from needful_things.orders
group by all
order by 4 desc, 1, 2