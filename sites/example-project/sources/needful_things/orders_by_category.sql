select 
    date_trunc('month', order_datetime) as month, 
    category, 
    sum(sales) as sales_usd0k,
    count(sales) as num_orders_num0,
    sales_usd0k / count(sales) as aov_usd2,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Flag_of_Canada.svg/320px-Flag_of_Canada.svg.png' as flag
from orders
group by month, category
order by month, sales_usd0k desc