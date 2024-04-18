---
title: Date Range
sidebar_position: 1
queries: 
- orders_by_day.sql
---

Creates a date picker that can be used to filter a query.

To see how to filter a query using an input component, see [Filters](/core-concepts/filters).

<DateRange
    name=date_range_name
    data={orders_by_day}
    dates=day
/>

From {inputs.date_range_name.start} to {inputs.date_range_name.end}

````markdown
<DateRange
    name=date_range_name
    data={orders_by_day}
    dates=day
/>

From {inputs.date_range_name.start} to {inputs.date_range_name.end}
````

## Examples

### Range from Query

<DateRange
    name=date_range_from_query
    data={orders_by_day}
    dates=day
/>

From {inputs.date_range_from_query.start} to {inputs.date_range_from_query.end}

````markdown
<DateRange
    name=date_range_from_query
    data={orders_by_day}
    dates=day
/>

From {inputs.date_range_from_query.start} to {inputs.date_range_from_query.end}
````

### Manually Specifying a Range

<DateRange
    name=manual_date_range
    start=2019-01-01
    end=2019-12-31
/>

```markdown
<DateRange
    name=manual_date_range
    start=2019-01-01
    end=2019-12-31
/>
```


### With a Title

<DateRange
    name=date_range_with_title
    data={orders_by_day}
    dates=day
    title="Select a Date Range"
/>

```markdown
<DateRange
    name=date_range_with_title
    data={orders_by_day}
    dates=day
    title="Select a Date Range"
/>
```

### Visible During Print / Export

<DateRange
    name=date_range_visible_during_print
    data={orders_by_day}
    dates=day
    hideDuringPrint={false}
/>

````markdown
<DateRange
    name=date_range_visible_during_print
    data={orders_by_day}
    dates=day
    hideDuringPrint={false}
/>
````

### Filtering a Query

<DateRange
    name=range_filtering_a_query
    data={orders_by_day}
    dates=day
/>

```sql filtered_query
select 
    *
from ${orders_by_day}
where day between '${inputs.range_filtering_a_query.start}' and '${inputs.range_filtering_a_query.end}'
```

<LineChart
    data={filtered_query}
    x=day
    y=sales
/>



````markdown
<DateRange
    name=range_filtering_a_query
    data={orders_by_day}
    dates=day
/>

```sql filtered_query
select 
    *
from ${orders_by_day}
where day between '${inputs.range_filtering_a_query.start}' and '${inputs.range_filtering_a_query.end}'
```

<LineChart
    data={filtered_query}
    x=day
    y=sales
/>
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


