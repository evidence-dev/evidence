select 
    category,
    item,
    count(*) as num_orders,
    sum(sales) as sales
from orders
group by all
order by 3 desc, 1, 2