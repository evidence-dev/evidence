select  
    item, 
    sum(sales) as sales
from orders
group by item
order by sales desc