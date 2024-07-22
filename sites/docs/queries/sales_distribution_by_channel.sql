with daily_sales as (
    select
        date_trunc('day', order_datetime) as order_date,
        channel,
        sum(sales) as total_sales
    from orders
    where order_datetime between '2021-01-01' and '2022-01-01'
    group by all
) 

select
    channel,
    min(total_sales) as min,
    approx_quantile(total_sales, 0.25) as first_quartile,
    approx_quantile(total_sales, 0.50) as median,
    approx_quantile(total_sales, 0.75) as third_quartile,
    max(total_sales) as max,
    case 
        when channel ilike '%Google%' then '#923d59' 
        when channel ilike '%Facebook%' then '#488f96'
        when channel ilike '%TikTok%' then '#518eca'
        when channel = 'Referral' then '#ffc857'
        else '#495867' end as color
from daily_sales

group by 1
order by median desc