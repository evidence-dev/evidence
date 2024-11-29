---
title: Date Input
sidebar_position: 1
description: A date input component allows the user to select a date or a range of dates. The selected dates can be used as inputs to queries or components.
queries: 
- orders_by_day.sql
---

A date input component allows the user to select a date or a range of dates. The selected dates can be used as inputs to queries or components.

To see how to filter a query using an input component, see [Filters](/core-concepts/filters).

```sql filtered_query
select 
*
from ${orders_by_day}
where day > '${inputs.date_filtering_a_query.value}'
```

<DocTab>
    <div slot='preview'>
            <DateInput
                name=date_filtering_a_query
                data={orders_by_day}
                dates=day
            />

            <BarChart
                data={filtered_query}
                x=day
                y=sales
                y2=num_orders
            />
    </div>

````markdown

```sql filtered_query
select 
    *
from ${orders_by_day}
where day > '${inputs.range_filtering_a_query.value}'
```

<DateInput
    name=range_filtering_a_query
    data={orders_by_day}
    dates=day
/>

<BarChart
    data={filtered_query}
    x=day
    y=sales
    y2=num_orders
/>
````
</DocTab>

## Examples

### Using Date Input from a Query

The Date selected can be accessed through the `inputs.[name].value` 

<DocTab>
    <div slot='preview'>
            <DateInput
                name=date_input_from_query
                data={orders_by_day}
                dates=day
            />

            Date Selected: {inputs.date_input_from_query.value}
    </div>

````markdown
<DateInput
    name=date_range_from_query
    data={orders_by_day}
    dates=day
/>

Date Selected: {inputs.date_input_from_query.value}
````
</DocTab>

### With a Title

<DocTab>
    <div slot='preview'>
            <DateInput
                name=date_range_with_title
                data={orders_by_day}
                dates=day
                title="Select a Date Input"
            />
    </div>

```markdown
<DateInput
    name=date_range_with_title
    data={orders_by_day}
    dates=day
    title="Select a Date Input"/>
```
</DocTab>

## Date Range

Creates a date picker for selecting a date range to filter queries, with selectable preset date options.

### Filtering a Query with Range Calendar

The Date selected can be accessed through the `inputs.[name].start` & `inputs.[name].end`

```sql filtered_query_ranged
select 
    *
from ${orders_by_day}
where day between '${inputs.range_filtering_a_query.start}' and '${inputs.range_filtering_a_query.end}'
```

<DocTab>
    <div slot='preview'>
            <DateInput
                name=range_filtering_a_query
                data={orders_by_day}
                dates=day
                range
            />

        <LineChart
            data={filtered_query_ranged}
            x=day
            y=sales
        />
    </div>

````markdown

```sql filtered_query_ranged
select 
    *
from ${orders_by_day}
where day between '${inputs.range_filtering_a_query.start}' - '${inputs.range_filtering_a_query.end}'
```

<DateInput
    name=range_filtering_a_query
    data={orders_by_day}
    dates=day
    range
/>

<LineChart
    data={filtered_query_ranged}
    x=day
    y=sales
/>
````
</DocTab>

### Default Value for Preset Ranges

<DocTab>
    <div slot='preview'>
            <DateInput defaultValue={'Last 7 Days'} range/>
    </div>

````svelte
<DateInput
    name=name_of_date_range
    defaultValue={'Last 7 Days'}
    range
/>
````
</DocTab>

### Customizing Single Preset Ranges

<DocTab>
    <div slot='preview'>
            <DateInput presetRanges={'Last 7 Days'} range/>
    </div>

```svelte
<DateInput
    name=name_of_date_range
    range
    presetRanges={'Last 7 Days'}
/>
```
</DocTab>

### Customizing Multiple Preset Ranges

<DocTab>
    <div slot='preview'>
            <DateInput presetRanges={['Last 7 Days', 'Last 3 Months', 'Year to Date', 'All Time']} range/>
    </div>

````svelte
<DateInput
    name=name_of_date_range
    range
    presetRanges={['Last 7 Days', 'Last 3 Months', 'Year to Date', 'All Time']}
/>
````
</DocTab>

### Manually Specifying a Range

<DocTab>
    <div slot='preview'>
            <DateInput
                name=manual_date_range
                start=2019-01-01
                end=2019-12-31
                range
            />
    </div>

```markdown
<DateInput
    name=manual_date_range
    start=2019-01-01
    end=2019-12-31
    range
/>
```
</DocTab>

## Options

<PropListing 
    name="name"
    description="Name of the DateInput, used to reference the selected values elsewhere as {`{inputs.name.start`} or {`inputs.name.end`}"
    required=true
    options="string"
/>
<PropListing 
    name="data"
    description="Query name, wrapped in curly braces"
    options="query name"
/>
<PropListing 
    name="range"
    description="toggles between a ranged and single input calendar"
    options={["true", "false"]}
    default=false
/>
<PropListing 
    name="dates"
    description="Column name from the query containing Date Input to span"
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
    options="string"
>

Title to display in the Date Input component

</PropListing>
<PropListing 
    name="presetRanges"
    options= "string | array of values e.g. {`{['Last 7 Days', 'Last 30 Days']}`}"
    default=undefined
>

Customize "Select a Range" drop down, by including present range options. **Range options**: `'Last 7 Days'` `'Last 30 Days'` `'Last 90 Days'` `'Last 3 Months'` `'Last 6 Months'` `'Last 12 Months'` `'Last Month'` `'Last Year'` `'Month to Date'` `'Year to Date'` `'All Time'`

</PropListing>
<PropListing 
    name="defaultValue"
    options= "string e.g. {'Last 7 Days'} or {'Last 6 Months'}"
    default=undefined
>


Accepts preset in string format to apply default value in Date Input picker. **Range options**: `'Last 7 Days'` `'Last 30 Days'` `'Last 90 Days'` `'Last 3 Months'` `'Last 6 Months'` `'Last 12 Months'` `'Last Month'` `'Last Year'` `'Month to Date'` `'Year to Date'` `'All Time'`

</PropListing>
<PropListing 
    name="hideDuringPrint"
    description="Hide the component when the report is printed"
    options={["true", "false"]}
    default="true"
/>
