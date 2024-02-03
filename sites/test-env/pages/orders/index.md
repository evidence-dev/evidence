```months
SELECT strftime(order_month, '%Y-%m-%d') as order_month, count(*) as order_count FROM orders
GROUP BY ALL
```

<ul>
{#each months as { order_month, order_count }}
	<li>
		<a href="/orders/{order_month}">{order_month} {order_count}</a>
	</li>
{/each}
</ul>