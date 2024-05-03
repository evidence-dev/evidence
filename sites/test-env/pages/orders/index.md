```all_orders
SELECT *, '/orders/' || id as link FROM orders LIMIT 20
```

<DataTable data={all_orders} link="link" />
