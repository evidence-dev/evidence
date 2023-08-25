```order_months
SELECT DISTINCT(order_month) FROM orders;
```

<ul>
{#each order_months as { order_month }}
	<li>
		<a href="/{order_month.getTime()}/">{order_month.getTime()}</a>
	</li>
{/each}
</ul>
