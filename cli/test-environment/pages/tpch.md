# TPC-H Smoke Test

```sql order_totals
select
  count(*) as order_count,
  sum(o_totalprice) as total_revenue,
  avg(o_totalprice) as avg_order_value
from tpch_sf1.orders
```

{% big_value data="order_totals" value="order_count" fmt="num0" /%}
{% big_value data="order_totals" value="total_revenue" fmt="usd0" /%}
{% big_value data="order_totals" value="avg_order_value" fmt="usd2" /%}

## Revenue by month

```sql monthly_revenue
select
  date_trunc('month', o_orderdate) as month,
  sum(o_totalprice) as revenue
from tpch_sf1.orders
group by 1
order by 1
```

{% line_chart data="monthly_revenue" x="month" y="revenue" /%}

## Orders by region

```sql orders_by_region
select
  r.r_name as region,
  count(*) as orders,
  sum(o.o_totalprice) as revenue
from tpch_sf1.orders o
join tpch_sf1.customer c on c.c_custkey = o.o_custkey
join tpch_sf1.nation n on n.n_nationkey = c.c_nationkey
join tpch_sf1.region r on r.r_regionkey = n.n_regionkey
group by 1
order by revenue desc
```

{% bar_chart data="orders_by_region" x="region" y="revenue" /%}

{% table data="orders_by_region" /%}
