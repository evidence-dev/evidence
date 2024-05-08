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

```sql items
select
    DISTINCT(item) as item,
from needful_things.orders
where category = '${inputs.category.value}'
```

{JSON.stringify(Array.from(items))}

<Dropdown 
    data={items}
    value=item
    name=item
    multiple
    defaultValue="Boxing Gloves"
>
    <DropdownOption value="Made Up"/>
</Dropdown>

```sql item
SELECT * FROM needful_things.orders
WHERE category = '${inputs.category.value}'
AND item in ${inputs.item.value}
```

<DataTable data={item} />
