---
title: Button Group
sidebar_position: 40
---

Creates a group of single-select buttons for quick filtering

To see how to filter a query using a dropdown, see [Filters](/core-concepts/filters).

````markdown
<ButtonGroup
    data={query_name} 
    name=name_of_button_group
    value=column_name
/>
````

## Examples

### Button Group using Options from a Query

````markdown
<ButtonGroup
    data={query_name} 
    name=name_of_button_group
    value=column_name
/>
````

### With a Title

````markdown
<ButtonGroup
    data={query_name} 
    name=name_of_button_group
    value=column_name
    title="Select a Category"
/>
````

### With a Default Value

````markdown
<ButtonGroup
    data={query_name} 
    name=name_of_button_group
    value=column_name
    title="Select a Category"
>
    <ButtonGroupItem valueLabel="All Categories" value="%" />
</ButtonGroup>
````

Note that "%" is a wildcard character in SQL that can be used with `where column_name like '${inputs.name_of_button_group}'` to return all values.


### With Hardcoded Options

````markdown
<ButtonGroup name=name_of_button_group>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>
````

### Alternative Labels

````markdown
<ButtonGroup
    data={query_name} 
    name=name_of_button_group
    value=column_name
    label=column_name_containg_label
/>
````

### Filtering a Query

````markdown
<ButtonGroup
    data={query_name} 
    name=name_of_button_group
    value=column_name
/>

```sql filtered_query
select *
from source_name.table
where column_name like '${inputs.name_of_button_group}'
```
````

## ButtonGroup

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
        <td>Name of the button group, used to reference the selected value elsewhere as {'{'}inputs.name{'}'}</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>preset</td>	
        <td>Preset values to use</td>	
        <td class='tcenter'>No</td>	
        <td class='tcenter'>"dates"</td>	
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
        <td>Title to display above the button group</td>	
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

## ButtonGroupItem

The ButtonGroupItem component can be used to manually add options to a button group. This is useful if you want to add a default option, or if you want to add options that are not in a query.

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


