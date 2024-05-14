---
title: Dimension Grid
sidebar_position: 1
---

Dimension grid produces an interactive grid of one dimension tables, one for each string column in the source table. The dimension grid can can also be used as an input. 

```orders

select state, category, item, channel, sales from needful_things.orders

```

```monthly_sales

select 
order_month, 
sum(sales)filter(${inputs.selected_dimensions}) as sales_usd0 
from needful_things.orders 
group by all 

```

<DimensionGrid data={orders} metric='sum(sales)' name=selected_dimensions /> 

<LineChart data={monthly_sales} handleMissing=zero/> 





## Examples

### Basic Usage 

```html
<DimensionGrid data={my_query} />
```

### As an Input 

Dimension grid produces a condition for all of the selected dimensions which is suitable for referencing directly in a `where` or `filter` clause. For example `airline = 'Air Canada' and plane = '747`. Where no dimensions have been selected, DimensionGrid returns `true`. 

````html
<DimensionGrid 
    data={my_query} 
    name="selected_dimensions"
/>


```sql filtered_query
select *
from source_name.table
where ${inputs.selected_dimensions}
```
````

## Options

<PropListing 
    name="data"
    required
    options="string"
>

Query name, wrapped in curly braces

</PropListing>
<PropListing 
    name="metric"
    options="string"
    default="count(*)"
>

SQL aggregate which could be applied to `data` e.g. 'sum(sales)'

</PropListing>
<PropListing 
    name="name"
    options="string"
>

Name of the dimension grid, used to reference the selected value elsewhere as `{inputs.name}`

</PropListing>
<PropListing 
    name="metricLabel"
    options="string"
>

Label for the metric

</PropListing>
<PropListing 
    name="limit"
    options="number"
    default="10"
>

Maximum number of rows to include in each table

</PropListing>
