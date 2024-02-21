```sql categories
select
    category,
    upper(left(category, 3)) as abbrev
from needful_things.orders
group by category
```

```sql items
select
    item,
    sum(sales) as sales,
from needful_things.orders
where category = '${inputs.category}'
group by item
order by sales desc
```

<BarChart
    data={items}
    x=item
    y=sales
    yFmt=usd0k
/>

```sql noninterpolated_items
select
    item,
    sum(sales) as sales,
from needful_things.orders
group by item
order by sales desc
```

<BarChart
    data={noninterpolated_items}
    x=item
    y=sales
    yFmt=usd0k
/>

<Dropdown 
    data={categories}
    value=category
    name=category
/>
