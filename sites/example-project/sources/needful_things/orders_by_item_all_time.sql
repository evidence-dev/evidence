select  
    item, 
    sum(sales) as sales_usd0k
from orders
group by item
order by sales_usd0k desc