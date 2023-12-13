---
title: Dropdown
sidebar_position: 31
---

Creates a dropdown menu with a list of options that can be selected. The selected option can be used to filter queries or in markdown.

To see how to filter a query using a dropdown, see [Filters](/core-concepts/filters).

<img src="/img/dropdown-title.png" alt="dropdown" width="400"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
/>
````

## Examples

### Dropdown using Options from a Query

<img src="/img/dropdown-notitle.png" alt="dropdown using a query" width="400"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
/>
````

### With a Title

<img src="/img/dropdown-title.png" alt="dropdown with title" width="400"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
    title="Select a Category"
/>
````

### With a Default Value

<img src="/img/dropdown-default.png" alt="dropdown with a default" width="400"/>

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

Note that "%" is a wildcard character in SQL that can be used with `where column_name like '${input.name_of_dropdown}'` to return all values.


### With Hardcoded Options

<img src="/img/dropdown-custom-options.png" alt="dropdown with hardcoded values" width="400"/>

````markdown
<Dropdown name=name_of_dropdown>
    <DropdownOption valueLabel="Option One" value="1" />
    <DropdownOption valueLabel="Option Two" value="2" />
    <DropdownOption valueLabel="Option Three" value="3" />
</Dropdown>
````

### Alternative Labels

<img src="/img/dropdown-alternative-label.png" alt="dropdown with alternative labels" width="400"/>


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
from table
where column_name like '${input.name_of_dropdown}'
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
        <td>Name of the dropdown, used to reference the selected value elsewhere as {'{'}inputs.name{'}'}</td>	
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
        <td>value</td>	
        <td>Column name from the query containing values to pick from</td>	
        <td class='tcenter'>No</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>label</td>	
        <td>Column name from the query containing labels to display instead of the values (e.g., you may want to have the drop-down use `customer_id` as the value, but show `customer_name` to your users)</td>	
        <td class='tcenter'>No</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>Uses the column in value</td>
    </tr>
    <tr>	
        <td>title</td>	
        <td>Title to display above the dropdown</td>	
        <td class='tcenter'>No</td>	
        <td class='tcenter'>string</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>order</td>
        <td>Column to sort options by</td>
        <td class='tcenter'>No</td>
        <td class='tcenter'>column name</td>
        <td class='tcenter'>Uses the same order as the query in `data`</td>
    </tr>
    <tr>	
        <td>where</td>
        <td>SQL where fragment to filter options by (e.g., where sales > 40000)</td>
        <td class='tcenter'>No</td>
        <td class='tcenter'>SQL where clause</td>
        <td class='tcenter'>-</td>
    </tr>
</table>

<!-- TODO: @archiewood confirm prop name for value_label-->

## DropdownOption

The DropdownOption component can be used to manually add options to a dropdown. This is useful if you want to add a default option, or if you want to add options that are not in a query.

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


