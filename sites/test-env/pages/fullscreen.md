<script>
	let open = false;
</script>

```orders
SELECT * FROM orders LIMIT 1000
```

<DataTable data={orders} />

```sql items
select
    item,
    sum(sales) as sales,
from orders
group by item
order by sales desc
```

<input type="checkbox" id="open" bind:checked={open} />

<Fullscreen bind:open>
	<BarChart
		data={items}
		x=item
		y=sales
		yFmt=usd0k
	/>
</Fullscreen>
