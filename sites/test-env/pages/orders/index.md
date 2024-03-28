```months
SELECT strftime(order_month, '%Y-%m-%d') as order_month, count(*) as order_count FROM orders
GROUP BY ALL
```