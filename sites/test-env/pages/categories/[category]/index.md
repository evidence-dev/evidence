```dates
SELECT DISTINCT(order_month) FROM orders
```

```items
SELECT * FROM orders WHERE category = '${params.category}' AND order_month BETWEEN '${inputs.range.start}'::DATE AND '${inputs.range.end}'::DATE - INTERVAL 7 DAY
limit 1000
```

```total
SELECT SUM(sales) as total FROM ${items}
```

<DateRange name="range" data={dates} dates="order_month" />

Sales from {inputs.range.start} to {inputs.range.end} in the category {params.category} last month were <Value data={total} value="total" fmt="num0" />.

General Overview:

<DataTable data={items} />
