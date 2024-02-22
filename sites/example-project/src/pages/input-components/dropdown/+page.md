# Dropdown

```sql categories
select category from needful_things.orders group by all
```

```sql years
select 2019 as year 
union all 
select 2020 as year
union all
select 2021 as year
```

## From a query

<Dropdown data={categories} name=category value=category/>

<Dropdown data={years} name=year value=year order=year/>

{inputs.category} {inputs.year}

```sql orders
select category, order_datetime, sales from orders
where category = '${inputs.category}'
and date_part('year', order_datetime) = '${inputs.year}'
```

<DataTable data={orders} />

## Hardcoded

<Dropdown name=hardcoded_option >
    <DropdownOption value=1 valueLabel="Option 1" />
    <DropdownOption value=2 valueLabel="Option 2" />
    <DropdownOption value=3 valueLabel="Option 3" />
</Dropdown>

{inputs.hardcoded_option}

## Default Values

<Dropdown name=default_option defaultValue=2>
    <DropdownOption value=1 valueLabel="Option 1" />
    <DropdownOption value=2 valueLabel="Option 2" />
    <DropdownOption value=3 valueLabel="Option 3" />
</Dropdown>

{inputs.default_option}


<Dropdown 
    name=default_category 
    data={categories} 
    value=category 
    defaultValue="Cursed Sporting Goods"
/>

{inputs.default_category}


<Dropdown 
    name=default_not_an_option 
    data={categories} 
    value=category 
    title="Default not present in"
    defaultValue="Not an option"
/>

{inputs.default_not_an_option}



