---
title: Dimension Grid
sidebar_position: 1
---

Dimension grid produces an interactive grid of one dimension tables, one for each string column in the source table. The dimension grid can can also be used as an input. 

<img src="/img/dimension-grid.gif" width='600px'/> 

## Examples

### Basic Usage 


```html
<DimensionGrid data={my_query} />
```

<img src="/img/dimension-grid.png" width='600px'/> 



### Custom Metric 

```html
<DimensionGrid 
    data={my_query} 
    metric="sum(fare)"
/>
```

### As an Input 

Dimension grid produces a condition for all of the selected dimensions which is suitable for referencing directly in a `where` clause. For example `airline = 'Air Canada' and plane = '747`. Where no dimensions have been selected, DimensionGrid returns `true`. 

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
    description="Query name, wrapped in curly braces"
    required=true
    options="string"
/>
<PropListing 
    name="metric"
    description="SQL aggregate which could be applied to `data` e.g. 'sum(sales)'"
    options="string"
    default="count(*)"
/>
<PropListing 
    name="name"
    description="Name of the dimension grid, used to reference the selected value elsewhere as {`{inputs.name}`}"
    options="string"
/>
<PropListing 
    name="metricLabel"
    description="Label for the metric"
    options="string"
/>
<PropListing 
    name="limit"
    description="Maximum number of rows to include in each table"
    options="number"
    default="10"
/>
