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
<PropListing 
    name="name"
    required
    options="string"
>

Name of the DateRange, used to reference the selected values elsewhere as `{inputs.name.start}` or `{inputs.name.end}`

</PropListing>
<PropListing 
    name="data"
    options="query name"
>

Query name, wrapped in curly braces

</PropListing>
<PropListing 
    name="dates"
    options="column name"
>

Column name from the query containing date range to span

</PropListing>
<PropListing 
    name="start"
    options="string formatted YYYY-MM-DD"
>

A manually specified start date to use for the range

</PropListing>
<PropListing 
    name="end"
    options="string formatted YYYY-MM-DD"
>

A manually specified end date to use for the range

</PropListing>
<PropListing 
    name="title"
    options="string"
>

Title to display in the Date Range component

</PropListing>
<PropListing 
    name="hideDuringPrint"
    options={["true", "false"]}
    default="true"
>

Hide the component when the report is printed

</PropListing>

