<Dropdown from=reviews label="select first_name || ' ' || last_name from orders where id = order_id" value=order_id name=selected_order_id where="nps_score > 7">
	<DropdownOption value="All" />
	<DropdownOption value="Top 100" />
</Dropdown>

```full_selected_order
select * from orders where id = '${inputs.selected_order_id}'
```

```top_100_orders
select * from orders limit 100
```

```orders
select * from orders
```

<BigValue data={inputs} value=selected_order_id />

{#if inputs.selected_order_id === 'All'}
<DataTable data={orders} />
{:else if inputs.selected_order_id === 'Top 100'}
<DataTable data={top_100_orders} />
{:else}
<DataTable data={full_selected_order} />
{/if}
