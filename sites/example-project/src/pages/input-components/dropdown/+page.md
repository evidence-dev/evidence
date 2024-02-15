# Dropdown

```sql categories
select category from orders group by all
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

<Dropdown data={years} name=year value=year order=year title="Order Year"/>

{inputs.category.value} {inputs.year.value}

```sql orders
select category, order_datetime, sales from orders
where category = '${inputs.category.value}'
and date_part('year', order_datetime) = '${inputs.year.value}'
```

<DataTable data={orders} />

## Hardcoded

<Dropdown name=hardcoded_option >
    <DropdownOption value=1 valueLabel="Option 1" />
    <DropdownOption value=2 valueLabel="Option 2" />
    <DropdownOption value=3 valueLabel="Option 3" />
</Dropdown>

{inputs.hardcoded_option.value}

## Default Values

<Dropdown name=default_option defaultValue=2>
    <DropdownOption value=1 valueLabel="Option 1" />
    <DropdownOption value=2 valueLabel="Option 2" />
    <DropdownOption value=3 valueLabel="Option 3" />
</Dropdown>

{inputs.default_option.value}


<Dropdown 
    name=default_category 
    data={categories} 
    value=category 
    defaultValue="Cursed Sporting Goods"
/>

{inputs.default_category.value}


<Dropdown 
    name=default_not_an_option 
    data={categories} 
    value=category 
    title="Default not present in query"
    defaultValue="Not an option"
/>

{inputs.default_not_an_option.value}



## Multi Select

<Dropdown name=multi_select data={categories} value=category multiple title=Categories/>

## A huge amount of options

```sql purchases
select "Vendor" as vendor from purchases group by all
```

<Dropdown name=vendor data={purchases} value=vendor multiple title="Multi Vendors"/>

<Dropdown name=vendor data={purchases} value=vendor title="Single Vendor"/>

### Selected values

{inputs.vendor.label}

