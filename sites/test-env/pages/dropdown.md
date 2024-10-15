<script>
	const userQ = buildQuery(() => `
SELECT * FROM orders 
WHERE 	item in ${inputs.item.value} 
	AND order_datetime BETWEEN '${inputs.range.start}' 
	AND '${inputs.range.end}' 
limit 100
	`)

	const measure = (lambda, rootStore) => {
		rootStore.track();
		const str = lambda();
		const usedPaths = rootStore.fetch()
		// ... do dag things
		return {
			text, invokedDagNodes
		}
	}

	const q = Query.withDag(...)

	q.update`SELECT * FROM orders 
WHERE 	item in ${inputs.item.value}
	AND order_datetime BETWEEN '${inputs.range.start}' 
	AND '${inputs.range.end}' 
limit 100`

	q.update(() => `SELECT * FROM orders 
WHERE 	item in ${inputs.item.value} 
	AND order_datetime BETWEEN '${inputs.range.start}' 
	AND '${inputs.range.end}' 
limit 100`)
</script>


## Small Demo

<Dropdown multiple title="Item" name="item" value="item" data="orders" noDefault />
<DateRange name="range" dates="order_datetime" data="orders" />

```selected_items
SELECT * FROM orders 
WHERE 	item in ${inputs.item.value} 
	AND order_datetime BETWEEN '${inputs.range.start}' 
	AND '${inputs.range.end}' 
limit 100
```

<DataTable data={selected_items} />
