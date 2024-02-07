---
title: Date Range
sidebar_position: 40
---

Creates a date picker that can be used to filter a query.

To see how to filter a query using an input component, see [Filters](/core-concepts/filters).

<img src="/img/date-range.png" alt="date-range" width="300"/>

````markdown
<DateRange
    data={query_name} 
    dates=column_name
    name=name_of_date_range
/>
````

## Examples

### Dropdown using Options from a Query

<img src="/img/dropdown-notitle.png" alt="dropdown using a query" width="300"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
/>
````

### With a Title

<img src="/img/dropdown-title.png" alt="dropdown with title" width="300"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
    title="Select a Category"
/>
````

### With a Default Value

<img src="/img/dropdown-default.png" alt="dropdown with a default" width="300"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
    title="Select a Category"
>
    <DropdownOption valueLabel="All Categories" value="%" />
</Dropdown>
````

Note that "%" is a wildcard character in SQL that can be used with `where column_name like '${inputs.name_of_dropdown}'` to return all values.


### With Hardcoded Options

<img src="/img/dropdown-custom-options.png" alt="dropdown with hardcoded values" width="240"/>

````markdown
<Dropdown name=name_of_dropdown>
    <DropdownOption valueLabel="Option One" value="1" />
    <DropdownOption valueLabel="Option Two" value="2" />
    <DropdownOption valueLabel="Option Three" value="3" />
</Dropdown>
````

### Alternative Labels

<img src="/img/dropdown-alternative-label.png" alt="dropdown with alternative labels" width="300"/>


````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
    label=column_name_containg_label
/>
````

### Filtering a Query

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
/>

```sql filtered_query
select *
from source_name.table
where column_name like '${inputs.name_of_dropdown}'
```
````

## Dropdown

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
        <td>Name of the range, used to reference the selected values elsewhere as {'{'}inputs.name.start{'}' or '{'}inputs.name.end{'}'}</td>	
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
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>end</td>	
        <td>A manually specified end date to use for the range</td>
        <td class='tcenter'>No</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>title</td>	
        <td>Title to display in the Date Range component
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

## DropdownOption

The DropdownOption component can be used to manually add options to a dropdown. This is useful to add a default option, or to add options that are not in a query.

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
        <td>value</td>
        <td>Value to use when the option is selected</td>
        <td class='tcenter'>Yes</td>
        <td class='tcenter'>string</td>
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>valueLabel</td>
        <td>Label to display for the option in the dropdown</td>
        <td class='tcenter'>Yes</td>
        <td class='tcenter'>string</td>
        <td class='tcenter'>Uses value</td>
    </tr>
</table>


