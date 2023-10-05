select 
    category,
    item
from orders
group by item, category
order by category, item
