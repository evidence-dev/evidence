```categories
SELECT DISTINCT(lower(category)) as category FROM orders
```

<ul>
{#each categories as { category }}
	<li>
		<a href="/categories/{category}/">{category}</a>
	</li>
{/each}
</ul>
