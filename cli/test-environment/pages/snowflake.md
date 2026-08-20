Page 1 — Daily Orders Dashboard

# Daily Orders

```sql totals
select
  sum(transactions) as transactions,
  sum(total_sales) as revenue,
  avg(avg_transaction_value) as aov,
  min(date) as first_day,
  max(date) as last_day
from demo.daily_orders
```

{% big_value data="totals" value="revenue" fmt="usd0" /%}
{% big_value data="totals" value="transactions" fmt="num0" /%}
{% big_value data="totals" value="aov" fmt="usd2" /%}
{% big_value data="totals" value="first_day" /%}
{% big_value data="totals" value="last_day" /%}

```sql daily_summary
select
  date,
  category,
  sum(transactions) as transactions,
  sum(total_sales) as total_sales,
  avg(avg_transaction_value) as aov
from demo.daily_orders
group by date, category
order by date, category
```

## Sales over time

{% line_chart data="daily_summary" x="date" y="total_sales" series="category" /%}

## Transactions by category

```sql by_category
select
  category,
  sum(transactions) as transactions,
  sum(total_sales) as revenue
from demo.daily_orders
group by category
order by revenue desc
```

{% bar_chart data="by_category" x="category" y="revenue" /%}

## Daily detail

{% table data="daily_summary" /%}

Page 2 — Order Details Explorer

# Order Details

```sql hourly
select
  date,
  hour,
  count(distinct order_id) as orders,
  sum(quantity) as units,
  sum(unit_price * quantity) as gross
from demo.order_details
group by date, hour
order by date, hour
```

```sql top_items
select
  i.category,
  i.item_name,
  i.base_price,
  count(d.order_id) as times_ordered,
  sum(d.quantity) as units_sold,
  sum(d.unit_price * d.quantity) as revenue
from demo.items i
join demo.order_details d on i.item_name = d.item_name
group by i.category, i.item_name, i.base_price
order by revenue desc
limit 25
```

```sql category_revenue
select
  i.category,
  sum(d.unit_price * d.quantity) as revenue,
  sum(d.quantity) as units
from demo.items i
join demo.order_details d on i.item_name = d.item_name
group by i.category
order by revenue desc
```

## Hourly volume

{% bar_chart data="hourly" x="hour" y="orders" /%}

## Revenue by category

{% bar_chart data="category_revenue" x="category" y="revenue" /%}

## Top 25 items

{% table data="top_items" search=true /%}
