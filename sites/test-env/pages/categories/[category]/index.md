<script>
	function toTitleCase(str) {
		return str.replace(
			/\w\S*/g,
			text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
		);
	}
</script>

```dates
SELECT DISTINCT(order_month) FROM orders
```

```items
SELECT * FROM orders WHERE category = '${toTitleCase(params.category)}' AND order_month BETWEEN '${inputs.range.start}'::DATE AND '${inputs.range.end}'::DATE - INTERVAL 7 DAY
limit 1000
```

```total
SELECT SUM(sales) as total FROM ${items}
```

<DateRange name="range" data={dates} dates="order_month" />

Sales from {inputs.range.start} to {inputs.range.end} in the category {params.category} last month were <Value data={total} value="total" fmt="num0" />.

General Overview:

<DataTable data={items} />


```categories
SELECT category FROM needful_things.orders
```

<Dropdown name="category" data={categories} value="category" defaultValue={toTitleCase(params.category)} />

```selected_category
SELECT SUM(sales) as sales, datetrunc('day', order_datetime) as date FROM needful_things.orders WHERE category = '${inputs.category.value}' GROUP BY ALL
```

<BarChart data={selected_category} x="date" y="sales" />

