select 
    category,
    upper(left(category,3)) as short_category
from orders
group by category