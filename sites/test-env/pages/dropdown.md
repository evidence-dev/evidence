# Dropdown Example Page

## Normal Usage

<Dropdown label="Selected Order ID" name="selected_order_id" from=named_reviews value_label="first_name || ' ' || last_name" value=order_id where="nps_score > 7" order=first_name>
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

## Dropdown without a query

<Dropdown label=Queryless name=queryless>
	<DropdownOption value="Option number one" />
	<DropdownOption value="Option number two" />
	<DropdownOption label="Option number three" value="I'm different!" />
</Dropdown>

{inputs.queryless}
