---
title: Filters
sidebar_position: 9
description: Filters dynamically change what data is returned by a query. Filters take the input that a user provides via a component, and use it to change the query.
---

Filters dynamically change what data is returned by a query. Filters take the input that a user provides via a component, and use it to change the query.

The below example uses the Evidence [`<Dropdown/>`](/components/inputs/dropdown) component. 

## Examples

### Filtering a query with a dropdown

![Filtering a Query](/img/filters-queries.png)

````markdown
```sql unique_items
select 
    item
from needful_things.orders
group by 1
```

<Dropdown
    name=selected_item
    data={unique_items}
    value=item
/>

```sql orders_by_month
select
    date_trunc('month', order_date) as month,
    sum(sales) as sales_usd
from needful_things.orders
where item = '${inputs.selected_item.value}'
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

The `%` character can be used as a wildcard in SQL. It will return all items when the user selects "All Items" from this dropdown.

Note also the use of the `like` operator in the `where` clause.

````markdown
```sql items
select 
    item
from needful_things.orders
group by 1
```

<Dropdown
    name=selected_item
    data={unique_items}
    value=item
>
    <DropdownOption value="%" valueLabel="All Items"/>
</Dropdown>

```sql orders_by_month
select
    date_trunc('month', order_date) as month,
    sum(sales) as sales_usd
from needful_things.orders
where item like '${inputs.selected_item.value}'
group by 1
```

<BarChart
    data={orders_by_month}
    x=month
    y=sales_usd
/>
````