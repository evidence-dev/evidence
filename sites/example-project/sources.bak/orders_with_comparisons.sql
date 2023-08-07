select 
    date_trunc('month', order_datetime) as month, 
    category, 
    sum(sales) as sales_usd0k,
    count(sales) as num_orders_num0,
    sales_usd0k / count(sales) as aov_usd2,
    --- prev month
    lag(sales_usd0k) over (partition by category order by month) as prev_sales_usd0k,
    lag(num_orders_num0) over (partition by category order by month) as prev_num_orders_num0,
    lag(aov_usd2) over (partition by category order by month) as prev_aov_usd2,
    --- pct change
    sales_usd0k / prev_sales_usd0k - 1 as sales_change_pct0,
    1.0* num_orders_num0 / prev_num_orders_num0 - 1 as num_orders_change_pct0,
    1.0* aov_usd2 / prev_aov_usd2 - 1 as aov_change_pct0
from orders
group by month, category
order by month desc, sales_usd0k desc