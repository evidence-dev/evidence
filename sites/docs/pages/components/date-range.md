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

## Options

<PropListing 
    name="name"
    description="Name of the DateRange, used to reference the selected values elsewhere as {`{inputs.name.start`} or {`inputs.name.end`}"
    required=true
    options="string"
/>
<PropListing 
    name="data"
    description="Query name, wrapped in curly braces"
    options="query name"
/>
<PropListing 
    name="dates"
    description="Column name from the query containing date range to span"
    options="column name"
/>
<PropListing 
    name="start"
    description="A manually specified start date to use for the range"
    options="string formatted YYYY-MM-DD"
/>
<PropListing 
    name="end"
    description="A manually specified end date to use for the range"
    options="string formatted YYYY-MM-DD"
/>
<PropListing 
    name="title"
    description="Title to display in the Date Range component"
    options="string"
/>
<PropListing 
    name="hideDuringPrint"
    description="Hide the component when the report is printed"
    options={["true", "false"]}
    default="true"
/>


