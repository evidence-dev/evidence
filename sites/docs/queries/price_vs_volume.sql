select
    item,
    category,
    sum(sales) as total_sales,
    count(*) as number_of_units,
    avg(sales) as price,
from needful_things.orders
group by all