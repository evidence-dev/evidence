select 
    date_trunc('month', order_datetime) as month, 
    item, 
    sum(sales) as sales_usd0k
from orders
group by month, item
order by month, sales_usd0k desc