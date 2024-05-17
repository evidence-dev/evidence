---
title: Button Group
sidebar_position: 1
---

Creates a group of single-select buttons for quick filtering

To see how to filter a query using a Button Group, see [Filters](/core-concepts/filters).

<img src="/img/button-group-title.png" alt="Button Group" width="550px"/>


````markdown
<ButtonGroup
    data={query_name} 
    name=name_of_button_group
    value=column_name
/>
````

## Examples

### Button Group using Options from a Query

<img src="/img/button-group-query-selected.png" alt="Button Group" width="550px"/>

````markdown
<ButtonGroup
    data={query_name} 
    name=name_of_button_group
    value=column_name
/>
````

### With a Title

<img src="/img/button-group-title.png" alt="Button Group With Title" width="550px"/>

````markdown
<ButtonGroup
    data={query_name} 
    name=name_of_button_group
    value=column_name
    title="Select a Category"
/>
````

### With a Default Value

<img src="/img/button-group-default.png" alt="Button Group With Default Value" width="675px"/>

````markdown
<ButtonGroup
    data={query_name} 
    name=name_of_button_group
    value=column_name
    title="Select a Category"
>
    <ButtonGroupItem valueLabel="All Categories" value="%" default />
</ButtonGroup>
````

Note that "%" is a wildcard character in SQL that can be used with `where column_name like '${inputs.name_of_button_group}'` to return all values.


### With Hardcoded Options

<img src="/img/button-group-hardcoded.png" alt="Button Group Hardcoded" width="300px"/>


````markdown
<ButtonGroup name=name_of_button_group>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>
````

### Alternative Labels

<img src="/img/button-group-alt-labels.png" alt="Button Group Alternative Labels" width="200px"/>

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

# ButtonGroup

## Options
<PropListing 
    name="name"
    required
>

Name of the button group, used to reference the selected value elsewhere as `{inputs.name}`

</PropListing>
<PropListing 
    name="preset"
    options="dates"
>

Preset values to use

</PropListing>
<PropListing 
    name="data"
    options="query name"
>

Query name, wrapped in curly braces

</PropListing>
<PropListing 
    name="value"
    options="column name"
>

Column name from the query containing values to pick from

</PropListing>
<PropListing 
    name="label"
    options="column name"
    defaultValue="Uses the column in value"
>

Column name from the query containing labels to display instead of the values (e.g., you may want to have the drop-down use `customer_id` as the value, but show `customer_name` to your users)

</PropListing>
<PropListing 
    name="title"
    options="string"
>

Title to display above the button group

</PropListing>
<PropListing 
    name="order"
    options="column name"
    defaultValue="Uses the same order as the query in `data`"
>

Column to sort options by

</PropListing>
<PropListing 
    name="where"
    options="SQL where clause"
>

SQL where fragment to filter options by (e.g., where sales > 40000)

</PropListing>

# ButtonGroupItem

The ButtonGroupItem component can be used to manually add options to a button group. This is useful if you want to add a default option, or if you want to add options that are not in a query.

## Options

<PropListing 
    name="value"
    required
>

Value to use when the option is selected

</PropListing>
<PropListing 
    name="valueLabel"
    options="string"
    defaultValue="Uses value"
>

Label to display for the option in the dropdown

</PropListing>
<PropListing 
    name="hideDuringPrint"
    options={["true", "false"]}
    defaultValue=true
>

Hide the component when the report is printed

</PropListing>

