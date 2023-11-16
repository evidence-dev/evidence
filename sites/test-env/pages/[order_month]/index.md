```items
SELECT DISTINCT(item) FROM orders
```

<ul>
{#each items as { item }}
	<li>
		<a href="/{$page.params.order_month}/{item}/">{item}</a>
	</li>
{/each}
</ul>
