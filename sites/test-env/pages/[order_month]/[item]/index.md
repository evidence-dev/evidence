```specific_query
SELECT email, item, order_month FROM orders WHERE item = '${$page.params.item}' and order_month = '${new Date(Number($page.params.order_month)).toISOString()}'::DATE
```

<DataTable data={specific_query} />

```arbitrary_big_query
SELECT * FROM orders LIMIT 1
```

<DataTable data={arbitrary_big_query} />

{$page.params.item} {$page.params.order_month}
