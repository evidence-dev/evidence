```items
SELECT DISTINCT(item) FROM orders WHERE order_month = DATE_TRUNC('month', '${$page.params.order_month}'::DATE)
```

<ul>
{#each items as { item }}
	<li>
		<a href="/orders/{$page.params.order_month}/{item}/">{item}</a>
	</li>
{/each}
</ul>