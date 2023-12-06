---
title: Filters
---

Filters dynamically change what data is returned by a query. Filters take the input that a user provides via a component, and use it to change the query.

The below example uses the prebuilt Evidence `<Dropdown/>` component, but you can also use [any HTML input](https://www.w3schools.com/html/html_form_input_types.asp).

## Examples

### Filtering a Query with a Dropdown

````markdown
```sql items
select 
    item
from orders
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
from orders
where item = '${input.item}'
group by 1
```
````

<!-- TODO: @archiewood insert image -->