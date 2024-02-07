```specific_query
SELECT email, item, order_month FROM orders WHERE item = '${$page.params.item}' and order_month = DATE_TRUNC('month', '${$page.params.order_month}'::DATE)
```

<DataTable data={specific_query} />

```arbitrary_big_query
SELECT * FROM orders LIMIT 1
```

<DataTable data={arbitrary_big_query} />

{$page.params.item} {$page.params.order_month}