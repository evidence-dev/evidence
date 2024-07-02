# Dropdown Example Page

## Dropdown with a query that has an error

<Dropdown title="Dropdown with an Error" value="order_id" data="named_reviews" where="nps_score > 7 and their name is Bob" name="broken_selected_order_id">
    <DropdownOption value="All" />
    <DropdownOption value="Top 100" />
</Dropdown>

---

## Normal Usage

```full_selected_order
select * from orders where id = '${inputs.selected_order_id.value}'
```

```top_100_orders
select * from orders limit 100
```

```orders
select * from orders limit 1000
```

<Dropdown title="Selected Order ID" label="first_name || ' ' || last_name" value="order_id" data="named_reviews" where="nps_score > 7" order="first_name" name="selected_order_id">
    <DropdownOption value="All" />
    <DropdownOption value="Top 100" />
</Dropdown>


<br/>

{#if inputs.selected_order_id.value === 'All'}
	Displaying all orders

	<DataTable data={orders} />
{:else if inputs.selected_order_id.value === 'Top 100'}
	Displaying the top 100 orders

	<DataTable data={top_100_orders} />
{:else}
	The currently selected order ID is {inputs.selected_order_id.value}, which belongs to {inputs.selected_order_id.label}

	<DataTable data={full_selected_order} emptySet=pass />
{/if}

---

## Multi Dropdown

```selected_orders
select * from orders where id in ${inputs.multiple_selected_order_ids.value}
```

<Dropdown multiple title="Selected Order ID" label="first_name || ' ' || last_name" value="order_id" data="named_reviews" where="nps_score > 7" order="first_name" name="multiple_selected_order_ids" defaultValue={[2772, 271]} disableSelectAll />

Orders of {inputs.multiple_selected_order_ids.label}
<DataTable data={selected_orders} />

---

## Dropdown without a query

<Dropdown title=Queryless name=queryless>
	<DropdownOption value="Option number one" />
	<DropdownOption value="Option number two" />
	<DropdownOption valueLabel="Option number three" value="I'm different!" />
</Dropdown>

{inputs.queryless.value}

---

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
