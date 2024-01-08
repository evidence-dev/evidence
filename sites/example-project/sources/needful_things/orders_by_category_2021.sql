select 
    date_trunc('month', order_datetime) as month, 
    category, 
    sum(sales) as sales_usd0k
from orders
where date_part('year', order_datetime) = 2021
group by month, category
order by month, sales_usd0k desc
