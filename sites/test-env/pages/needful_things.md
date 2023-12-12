# Needful Things

<Dropdown 
    data={categories}
    value=category
    title="Select a Category"
    name=category
/>

<br>

```sql categories
select
    category,
    upper(left(category, 3)) as abbrev
from needful_things.orders
group by category
```

<Dropdown 
    data={categories}
    value=category
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
    <DropdownOption value="%" label="All Categories" />
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

<Dropdown 
    data={categories}
    value=category
    name=category3
    label=abbrev
    title="Select a Category Abbreviation"
/>

<Dropdown
name=category4
title="Select a Custom Option"
>
    <DropdownOption value="1" label="Option One" />
    <DropdownOption value="2" label="Option Two" />
    <DropdownOption value="3" label="Option Three" />
</Dropdown>
