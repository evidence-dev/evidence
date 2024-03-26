---
title: Date Range
sidebar_position: 1
---

Creates a date picker that can be used to filter a query. The picker expands to show a calendar when clicked, and the user can pick a start and end date.

To see how to filter a query using an input component, see [Filters](/core-concepts/filters).

<img src="/img/date-range.png" alt="date-range" width="400"/>

````markdown
<DateRange
    name=name_of_date_range
    data={query_name} 
    dates=column_name
/>
````

## Examples

### Using Date Range from a Query

<img src="/img/date-range.png" alt="date range using a query" width="400"/>

````markdown
<DateRange
    name=name_of_date_range
    data={query_name} 
    dates=column_name
/>
````

### Manually Specifying a Range

<img src="/img/date-range-manual.png" alt="date range using a query" width="400"/>

```markdown
<DateRange
    name=name_of_date_range
    start=2019-01-01
    end=2019-12-31
/>
```


### With a Title

<img src="/img/date-range-title.png" alt="date range using a query" width="400"/>

````markdown
<DateRange
    name=name_of_date_range
    data={query_name} 
    dates=column_name
    title="Order Date"
/>
````

### Visible During Print / Export

<img src="/img/date-range.png" alt="date range using a query" width="400"/>

````markdown
<DateRange
    name=name_of_date_range
    data={query_name} 
    dates=column_name
    hideDuringPrint=false
/>
````

### Filtering a Query

````markdown
<DateRange
    name=name_of_date_range
    data={query_name} 
    dates=column_name
/>

```sql filtered_query
select *
from source_name.table
where date_column between '${inputs.name_of_date_range.start}' and '${inputs.name_of_date_range.end}'
```
````

## DateRange

### Options

<table>						 
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
        <tr>	
        <td>name</td>	
        <td>Name of the range, used to reference the selected values elsewhere as {'{'}inputs.name.start{'} or {'}inputs.name.end{'}'}</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>data</td>	
        <td>Query name, wrapped in curly braces</td>	
        <td class='tcenter'>No</td>	
        <td class='tcenter'>query name</td>	
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>dates</td>	
        <td>Column name from the query containing date range to span</td>	
        <td class='tcenter'>No</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
        <tr>	
        <td>start</td>	
        <td>A manually specified start date to use for the range</td>
        <td class='tcenter'>No</td>	
        <td class='tcenter'>string formatted YYYY-MM-DD</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>end</td>	
        <td>A manually specified end date to use for the range</td>
        <td class='tcenter'>No</td>	
        <td class='tcenter'>string formatted YYYY-MM-DD</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>title</td>	
        <td>Title to display in the Date Range component</td>
        <td class='tcenter'>No</td>	
        <td class='tcenter'>string</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>hideDuringPrint</td>
        <td>Hide the component when the report is printed</td>
        <td class='tcenter'>No</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>true</td>
    </tr>
</table>