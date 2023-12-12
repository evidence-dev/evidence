# Needful Things

<br>

```sql categories
select 
    category 
from needful_things.orders
group by category
```

<Dropdown 
    data={categories}
    value=category
    title="Select a Category"
    name=category
/>

<br><br><br>

```sql items
select 
    item,
    sum(sales) as sales,
from needful_things.orders
where category = '${inputs.category}'
group by item
order by sales desc
```

# Sales by Item, {inputs.category}

<DataTable data={items}>
    <Column id=item />
    <Column id=sales fmt=usd0k />
</DataTable>

<BarChart
    data={items}
    x=item
    y=sales
    yFmt=usd0k
/>


<Dropdown 
    data={categories}
    value=category
    title="Select a Category"
    name=category2
>
    <DropdownOption value="%" label="All" />
</Dropdown>

```sql items2
select 
    item,
    sum(sales) as sales,
from needful_things.orders
where category like '${inputs.category2}'
group by item
order by sales desc
```