---
sidebar_position: 10
title: Dimension Grid
hide_table_of_contents: false
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

```html
<DimensionGrid 
    data={my_query} 
    name="selected_dimensions"
/>
```

```sql filtered_query
select *
from source_name.table
where ${inputs.selected_dimensions}
```


<table>						 
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>	
        <td>data</td>	
        <td>Query name, wrapped in curly braces</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>query name</td>	
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>metric</td>	
        <td>SQL aggregate which could be applied to `data` e.g. "sum(sales)"</td>
        <td class='tcenter'>No</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>count(*)</td>
    </tr>
    <tr>	
        <td>name</td>	
        <td>Name of the dimension grid, used to reference the selected value elsewhere as {'{'}inputs.name{'}'}</td>	
        <td class='tcenter'>No</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>metricLabel</td>	
        <td>Label for the metric</td>
        <td class='tcenter'>No</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>-</td>
    </tr>
        <tr>	
        <td>limit</td>	
        <td>Maximum number of rows to include in each table</td>
        <td class='tcenter'>No</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>10</td>
    </tr>
</table>


