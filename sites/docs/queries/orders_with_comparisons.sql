select
    date_trunc('month', order_datetime) as month,
    count(*) as num_orders,
    sum(sales) as sales,
    sum(sales) / count(*) as aov,
    lag(sum(sales)) over (order by month) as prev_month_sales,
    lag(count(*)) over (order by month) as prev_month_orders,
    lag(sum(sales) / count(*)) over (order by month) as prev_month_aov,
    sum(sales) / prev_month_sales - 1 as sales_growth,
    num_orders / prev_month_orders - 1 as order_growth,
    aov / prev_month_aov - 1 as aov_growth
from needful_things.orders
where order_datetime between '2020-01-01' and '2021-01-01'
group by 1
order by 1 desc