---
title: Filters
---

Filters dynamically change what data is returned by a query. Filters take the input that a user provides via a component, and use it to change the query.

The below example uses the prebuilt Evidence `<Dropdown/>` component, but you can also use [any HTML input](https://www.w3schools.com/html/html_form_input_types.asp).

For more detail on how to use filters, see 

## Examples

### Filtering a query with a dropdown

![Filtering a Query](/img/filters-queries.png)

````markdown
```sql items
select 
    item
from needful_things.orders
group by 1
```

<Dropdown
    name=item
    data={items}
    value=item
/>

```sql orders_by_month
select
    date_trunc('month', order_date) as month,
    sum(sales) as sales_usd
from needful_things.orders
where item = '${inputs.item}'
group by 1
```

<BarChart
    data={orders_by_month}
    x=month
    y=sales_usd
/>
````


## Filtering a query with a default value

![Filtering a Query](/img/filters-default.png)

````markdown
```sql items
select 
    item
from needful_things.orders
group by 1
```

<Dropdown
    name=item
    data={items}
    value=item
>
    <DropdownOption value="%" label="All Items"/>
</Dropdown>

```sql orders_by_month
select
    date_trunc('month', order_date) as month,
    sum(sales) as sales_usd
from needful_things.orders
where item like '${inputs.item}'
group by 1
```

<BarChart
    data={orders_by_month}
    x=month
    y=sales_usd
/>
````